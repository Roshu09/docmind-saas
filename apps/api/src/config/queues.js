// src/config/queues.js
// ============================================================
// BullMQ Queue Definitions
// Queues are lazy-initialized (created on first use)
// ============================================================

import { Queue } from 'bullmq';
import { bullMQConnection } from './redis.js';
import { logger } from '../utils/logger.js';

let embedQueue = null;

export const getEmbedQueue = () => {
  if (!embedQueue) {
embedQueue = new Queue('embed-queue', {
        connection: bullMQConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    logger.info('BullMQ embed:queue initialized');
  }
  return embedQueue;
};
