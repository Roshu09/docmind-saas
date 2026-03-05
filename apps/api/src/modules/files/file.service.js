// src/modules/files/file.service.js
// ============================================================
// File Service — complete upload lifecycle
//
// Upload flow:
// 1. POST /api/files/upload-url  → validate + create DB record + return pre-signed URL
// 2. Client uploads directly to S3 (API never touches file bytes)
// 3. POST /api/files/:id/confirm → update status + push to embed queue
// 4. Worker processes async → status becomes 'ready'
// ============================================================

import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client } from '../../config/s3.js';
import { querySystem } from '../../db/queries/rls.js';
import { getEmbedQueue } from '../../config/queues.js';
import { cacheDelPattern } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../middlewares/errorHandler.js';

const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
};

export const getUploadUrl = async (orgId, userId, { fileName, mimeType, fileSize }) => {
  // Validate MIME type
  if (!ALLOWED_TYPES[mimeType]) {
    throw new ValidationError(`File type not allowed. Supported: PDF, DOCX, TXT`);
  }

  // Validate file size
  const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
  if (fileSize > maxBytes) {
    throw new ValidationError(`File too large. Max ${env.MAX_FILE_SIZE_MB}MB`);
  }

  // Check org document quota
  const quotaCheck = await querySystem(
    `SELECT COUNT(d.id) as count, o.max_documents
     FROM organizations o
     LEFT JOIN documents d ON d.org_id = o.id AND d.deleted_at IS NULL
     WHERE o.id = $1
     GROUP BY o.max_documents`,
    [orgId]
  );

  if (quotaCheck.rowCount > 0) {
    const { count, max_documents } = quotaCheck.rows[0];
    if (parseInt(count) >= parseInt(max_documents)) {
      throw new ForbiddenError(`Document limit reached (${max_documents}). Upgrade your plan.`);
    }
  }

  // Generate unique file ID and S3 key
  const fileId = uuidv4();
  const ext = ALLOWED_TYPES[mimeType];
  const s3Key = `org-${orgId}/raw/${fileId}${ext}`;

  // Create pending document record
  await querySystem(
    `INSERT INTO documents (id, org_id, uploaded_by, original_name, s3_key, s3_bucket, mime_type, file_size_bytes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
    [fileId, orgId, userId, fileName, s3Key, env.AWS_S3_BUCKET_NAME, mimeType, fileSize]
  );

  // Generate pre-signed PUT URL
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: mimeType,
    Metadata: {
      'org-id': orgId,
      'uploaded-by': userId,
      'original-name': encodeURIComponent(fileName),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: env.S3_UPLOAD_URL_EXPIRES,
  });

  logger.info('Pre-signed upload URL generated', {
    fileId, orgId, userId, fileName, mimeType,
    fileSizeMB: (fileSize / 1024 / 1024).toFixed(2),
  });

  return { fileId, uploadUrl, s3Key, expiresIn: env.S3_UPLOAD_URL_EXPIRES };
};

export const confirmUpload = async (orgId, fileId) => {
  const docResult = await querySystem(
    `SELECT * FROM documents WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL`,
    [fileId, orgId]
  );

  if (docResult.rowCount === 0) throw new NotFoundError('Document');
  const doc = docResult.rows[0];

  if (doc.status !== 'pending') {
    throw new ValidationError(`Document is already ${doc.status}`);
  }

  // Update to processing
  await querySystem(
    `UPDATE documents SET status = 'processing', processing_started_at = NOW() WHERE id = $1`,
    [fileId]
  );

  // Push to embed queue
  const embedQueue = getEmbedQueue();
  await embedQueue.add('embed-document', {
    fileId, orgId,
    s3Key: doc.s3_key,
    s3Bucket: doc.s3_bucket,
    mimeType: doc.mime_type,
    originalName: doc.original_name,
  });

  logger.info('Document queued for processing', { fileId, orgId });
  return { fileId, status: 'processing', message: 'File queued for AI processing' };
};

export const getDocuments = async (orgId, { page = 1, limit = 20, status = null } = {}) => {
  const offset = (page - 1) * limit;
  const params = [orgId];
  let statusClause = '';

  if (status) {
    params.push(status);
    statusClause = `AND d.status = $${params.length}`;
  }

  const result = await querySystem(
    `SELECT d.*, u.full_name as uploaded_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.org_id = $1 AND d.deleted_at IS NULL ${statusClause}
     ORDER BY d.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await querySystem(
    `SELECT COUNT(*) FROM documents d WHERE d.org_id = $1 AND d.deleted_at IS NULL ${statusClause}`,
    params
  );

  return {
    documents: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      page, limit,
      pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  };
};

export const getDocument = async (orgId, fileId) => {
  const result = await querySystem(
    `SELECT d.*, u.full_name as uploaded_by_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.id = $1 AND d.org_id = $2 AND d.deleted_at IS NULL`,
    [fileId, orgId]
  );
  if (result.rowCount === 0) throw new NotFoundError('Document');
  return result.rows[0];
};

export const deleteDocument = async (orgId, userId, fileId, userRole) => {
  const doc = await getDocument(orgId, fileId);
  const canDelete = ['owner', 'admin'].includes(userRole) || doc.uploaded_by === userId;
  if (!canDelete) throw new ForbiddenError('You can only delete your own documents');

  await querySystem(`UPDATE documents SET deleted_at = NOW() WHERE id = $1`, [fileId]);

  // Delete from S3 async (non-blocking)
  s3Client.send(new DeleteObjectCommand({ Bucket: doc.s3_bucket, Key: doc.s3_key }))
    .catch(err => logger.warn('S3 delete failed', { fileId, error: err.message }));

  // Delete embeddings async
  querySystem('DELETE FROM document_chunks WHERE document_id = $1', [fileId])
    .catch(err => logger.warn('Chunk delete failed', { fileId, error: err.message }));

  await cacheDelPattern(`search:${orgId}:*`);

  logger.info('Document deleted', { fileId, orgId, userId });
  return { deleted: true };
};

export const getDownloadUrl = async (orgId, fileId) => {
  const doc = await getDocument(orgId, fileId);
  const command = new GetObjectCommand({
    Bucket: doc.s3_bucket,
    Key: doc.s3_key,
    ResponseContentDisposition: `attachment; filename="${doc.original_name}"`,
  });
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return { downloadUrl, expiresIn: 300 };
};
