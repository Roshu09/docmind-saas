// src/processors/embedProcessor.js
// ============================================================
// BullMQ Worker — processes embed:queue jobs
// Flow: Download S3 → Extract Text → Chunk → Embed → Save pgvector
// ============================================================
import { Worker } from 'bullmq';
import { query } from '../config/database.js';
import { extractText } from '../extractors/textExtractor.js';
import { chunkText } from '../chunking/textChunker.js';
import { generateEmbeddings } from '../embedding/embeddingGenerator.js';
import { logger } from '../utils/logger.js';

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE_TOKENS) || 512;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP_TOKENS) || 50;

const bullMQConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const updateDocStatus = async (fileId, status, message) => {
  await query(
    'UPDATE documents SET status = $1, error_message = $2 WHERE id = $3',
    [status, message, fileId]
  );
};

const saveChunks = async (documentId, orgId, chunks) => {
  logger.info('Saving chunks to pgvector', { documentId, count: chunks.length });
  await query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);

  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let p = 1;

    batch.forEach(chunk => {
      values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(documentId, orgId, chunk.content, chunk.chunkIndex, JSON.stringify(chunk.embedding));
    });

    await query(
      `INSERT INTO document_chunks (document_id, org_id, content, chunk_index, embedding)
       VALUES ${values.join(', ')}
       ON CONFLICT DO NOTHING`,
      params
    );
  }
  logger.info('Chunks saved', { count: chunks.length });
};

const processDocument = async (job) => {
  const { fileId, orgId, s3Key, s3Bucket, mimeType, originalName } = job.data;
  logger.info('Processing document', { fileId, originalName, mimeType });

  try {
    // 1. Extract text from S3
    await updateDocStatus(fileId, 'processing', 'Extracting text...');
    const { text, pageCount, wordCount } = await extractText(s3Bucket, s3Key, mimeType);
    if (!text || text.length < 10) throw new Error('Document appears empty or unreadable');

    // 2. Chunk text
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    if (chunks.length === 0) throw new Error('No chunks generated from document');

    // 3. Generate embeddings
    await updateDocStatus(fileId, 'processing', 'Generating embeddings...');
    const chunksWithEmbeddings = await generateEmbeddings(chunks);

    // 4. Save to pgvector
    await saveChunks(fileId, orgId, chunksWithEmbeddings);

    // 5. Mark ready
    await query(
      `UPDATE documents
       SET status = $1, processing_completed_at = NOW(),
           page_count = $2, word_count = $3, chunk_count = $4, error_message = NULL
       WHERE id = $5`,
      ['ready', pageCount, wordCount, chunks.length, fileId]
    );

    logger.info('Document ready', { fileId, chunks: chunks.length, wordCount, pageCount });
  } catch (error) {
    logger.error('Processing failed', { fileId, error: error.message });
    await query(
      'UPDATE documents SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, fileId]
    );
    throw error;
  }
};

export const startEmbedWorker = () => {
const worker = new Worker('embed-queue', processDocument, {
        connection: bullMQConnection,
    concurrency: parseInt(process.env.QUEUE_EMBED_CONCURRENCY) || 3,
  });

  worker.on('completed', (job) =>
    logger.info('Job completed', { jobId: job.id, fileId: job.data.fileId })
  );
  worker.on('failed', (job, err) =>
    logger.error('Job failed', { jobId: job?.id, error: err.message })
  );
  worker.on('error', (err) =>
    logger.error('Worker error', { error: err.message })
  );

  logger.info('Embed worker started', {
    concurrency: parseInt(process.env.QUEUE_EMBED_CONCURRENCY) || 3,
  });
  return worker;
};
