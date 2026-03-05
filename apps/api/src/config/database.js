// src/config/database.js
// ============================================================
// PostgreSQL Connection Pool
// Uses 'pg' Pool for connection pooling.
// All queries go through this pool - never create raw clients.
// ============================================================

import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Create the connection pool
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  min: env.DB_POOL_MIN,       // Keep at least 2 connections alive
  max: env.DB_POOL_MAX,       // Never exceed 10 connections
  idleTimeoutMillis: 30000,   // Remove idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5s
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Log pool events for observability
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

// ── Helper: run a query ──────────────────────────────────────
// Usage: const result = await query('SELECT * FROM users WHERE id = $1', [userId])
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 1 second) for performance monitoring
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        query: text.substring(0, 100), // Don't log full query (may have PII)
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: text.substring(0, 100),
    });
    throw error;
  }
};

// ── Helper: get a client for transactions ────────────────────
// Usage:
//   const client = await getClient()
//   try {
//     await client.query('BEGIN')
//     await client.query('INSERT ...')
//     await client.query('COMMIT')
//   } catch (e) {
//     await client.query('ROLLBACK')
//     throw e
//   } finally {
//     client.release()
//   }
export const getClient = () => pool.connect();

// ── Test the connection ──────────────────────────────────────
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    const { current_time, pg_version } = result.rows[0];

    // Check pgvector extension is installed
    const vectorCheck = await query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );
    const hasVector = vectorCheck.rowCount > 0;

    logger.info('✅ Database connected', {
      time: current_time,
      postgres: pg_version.split(' ')[1],
      pgvector: hasVector ? '✅ installed' : '❌ NOT installed - run docker-compose up',
    });

    return true;
  } catch (error) {
    logger.error('❌ Database connection failed', { error: error.message });
    return false;
  }
};

export default pool;
