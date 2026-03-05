import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { logger } from './utils/logger.js';
import { getPool } from './config/database.js';
import { startEmbedWorker } from './processors/embedProcessor.js';

const bootstrap = async () => {
  logger.info('Starting AI File Intelligence Worker...');
  try {
    await getPool().query('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  }

  const worker = startEmbedWorker();

  logger.info('========================================');
  logger.info('Worker running on embed-queue');
  logger.info('========================================');

  const shutdown = async (signal) => {
    logger.info(signal + ' received, shutting down...');
    await worker.close();
    await getPool().end();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

bootstrap().catch(err => {
  console.error('Worker failed:', err.message);
  process.exit(1);
});
