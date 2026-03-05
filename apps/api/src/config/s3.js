// src/config/s3.js
// ============================================================
// AWS S3 Client Configuration
// Used by: File Service (pre-signed URLs, delete)
//          Worker Service (download file for processing)
// ============================================================

import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

// Test S3 connection on startup
export const testS3Connection = async () => {
  try {
    const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
    const result = await s3Client.send(new ListBucketsCommand({}));
    const bucketExists = result.Buckets?.some(b => b.Name === env.AWS_S3_BUCKET_NAME);
    logger.info('✅ S3 connected', {
      bucket: env.AWS_S3_BUCKET_NAME,
      exists: bucketExists ? '✅ found' : '❌ NOT found',
    });
    return true;
  } catch (error) {
    logger.error('❌ S3 connection failed', { error: error.message });
    return false;
  }
};

export default s3Client;
