// src/modules/files/file.controller.js
import { z } from 'zod';
import * as fileService from './file.service.js';
import { ValidationError } from '../../middlewares/errorHandler.js';

const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(500),
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
  fileSize: z.number().int().positive().max(50 * 1024 * 1024),
});

export const getUploadUrlController = async (req, res) => {
  const parsed = uploadUrlSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid upload request', parsed.error.errors);
  const result = await fileService.getUploadUrl(req.user.orgId, req.user.id, parsed.data);
  res.status(201).json({ success: true, message: 'Upload URL generated. PUT file to uploadUrl, then call /confirm.', data: result });
};

export const confirmUploadController = async (req, res) => {
  const result = await fileService.confirmUpload(req.user.orgId, req.params.fileId);
  res.json({ success: true, data: result });
};

export const getDocumentsController = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const status = req.query.status || null;
  const result = await fileService.getDocuments(req.user.orgId, { page, limit, status });
  res.json({ success: true, data: result });
};

export const getDocumentController = async (req, res) => {
  const doc = await fileService.getDocument(req.user.orgId, req.params.fileId);
  res.json({ success: true, data: { document: doc } });
};

export const deleteDocumentController = async (req, res) => {
  await fileService.deleteDocument(req.user.orgId, req.user.id, req.params.fileId, req.user.role);
  res.json({ success: true, message: 'Document deleted' });
};

export const getDownloadUrlController = async (req, res) => {
  const result = await fileService.getDownloadUrl(req.user.orgId, req.params.fileId);
  res.json({ success: true, data: result });
};
