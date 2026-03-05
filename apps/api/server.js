// server.js
// ============================================================
// HTTP Server Entry Point
// - Connects to DB and Redis before starting
// - Handles graceful shutdown (SIGTERM, SIGINT)
// - Graceful shutdown ensures in-flight requests complete
//   before the process exits (critical for zero-downtime deploys)
// ============================================================

import { createServer } from 'http';
import app from './app.js';
import { env } from './src/config/env.js';
import { testConnection } from './src/config/database.js';
import { connectRedis } from './src/config/redis.js';
import { testS3Connection } from './src/config/s3.js';
import { logger } from './src/utils/logger.js';

const httpServer = createServer(app);

// ── Graceful shutdown logic ───────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received - starting graceful shutdown`);

  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed - no new connections accepted');

    // Close database pool
    try {
      const pool = (await import('./src/config/database.js')).default;
      await pool.end();
      logger.info('Database pool closed');
    } catch (err) {
      logger.error('Error closing database pool', { error: err.message });
    }

    // Close Redis connection
    try {
      const redisClient = (await import('./src/config/redis.js')).default;
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error closing Redis', { error: err.message });
    }

    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force exit after 30s if shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop, k8s pod termination
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C in terminal

// ── Unhandled error safety nets ───────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  // Don't crash on unhandled rejections - log and continue
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception - shutting down', {
    error: error.message,
    stack: error.stack,
  });
  // Uncaught exceptions leave app in undefined state — must restart
  process.exit(1);
});

// ── Bootstrap: connect services then start server ────────────
const bootstrap = async () => {
  logger.info('🚀 Starting AI File Intelligence API...');
  logger.info(`Environment: ${env.NODE_ENV}`);

  // 1. Connect to PostgreSQL
  const dbReady = await testConnection();
  if (!dbReady) {
    logger.error('Cannot connect to database. Is docker-compose running?');
    logger.error('Run: npm run docker:up (from project root)');
    process.exit(1);
  }

  // 2. Connect to Redis
  const redisReady = await connectRedis();
  if (!redisReady) {
    logger.error('Cannot connect to Redis. Is docker-compose running?');
    process.exit(1);
  }

  // 3. Connect to S3
  await testS3Connection();

  // 4. Start HTTP server
  httpServer.listen(env.PORT, () => {
    logger.info('');
    logger.info('========================================');
    logger.info(`✅ API Server running on port ${env.PORT}`);
    logger.info(`📍 Health: http://localhost:${env.PORT}/health`);
    logger.info(`🌐 API:    http://localhost:${env.PORT}/api`);
    logger.info('========================================');
    logger.info('');
  });
};

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default httpServer;
