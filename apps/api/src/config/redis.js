// src/config/redis.js
// ============================================================
// Redis Client Configuration
// Two separate clients:
//   1. redisClient  - for caching, rate limiting, pub/sub
//   2. bullMQConnection - for BullMQ job queues (separate instance required by BullMQ)
// ============================================================

import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// ── Main Redis client (caching, sessions, pub/sub) ───────────
const redisClient = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: too many reconnect attempts, giving up');
        return new Error('Redis connection refused');
      }
      const delay = Math.min(retries * 100, 3000); // max 3s between retries
      logger.warn(`Redis reconnecting... attempt ${retries}, delay: ${delay}ms`);
      return delay;
    },
  },
  password: env.REDIS_PASSWORD || undefined,
});

redisClient.on('connect', () => logger.info('✅ Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error', { error: err.message }));
redisClient.on('reconnecting', () => logger.warn('Redis client reconnecting...'));

// ── BullMQ connection config (IORedis-compatible format) ─────
// BullMQ needs its own connection - do NOT share with redisClient
export const bullMQConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
};

// ── Connect to Redis ──────────────────────────────────────────
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    const pong = await redisClient.ping();
    logger.info('✅ Redis ready', { response: pong });
    return true;
  } catch (error) {
    logger.error('❌ Redis connection failed', { error: error.message });
    return false;
  }
};

// ── Cache helpers ────────────────────────────────────────────

/**
 * Get a cached value. Returns parsed JSON or null if not found.
 * @param {string} key
 */
export const cacheGet = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn('Cache GET error', { key, error: error.message });
    return null; // Cache failures should never break the app
  }
};

/**
 * Set a cached value with optional TTL in seconds.
 * @param {string} key
 * @param {any} value - Will be JSON.stringify'd
 * @param {number} ttlSeconds - Default: 300 (5 minutes)
 */
export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.warn('Cache SET error', { key, error: error.message });
    // Never throw - cache is non-critical
  }
};

/**
 * Delete cached value(s). Supports patterns like 'search:orgId:*'
 * @param {string} key
 */
export const cacheDel = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.warn('Cache DEL error', { key, error: error.message });
  }
};

/**
 * Delete all keys matching a pattern (for cache invalidation)
 * @param {string} pattern - e.g. 'search:org123:*'
 */
export const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Cache invalidated ${keys.length} keys matching: ${pattern}`);
    }
  } catch (error) {
    logger.warn('Cache DEL pattern error', { pattern, error: error.message });
  }
};

export default redisClient;
