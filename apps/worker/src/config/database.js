import pg from 'pg';
import { logger } from '../utils/logger.js';
const { Pool } = pg;
let pool = null;
export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 5,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    pool.on('error', (err) => logger.error('DB pool error', { error: err.message }));
  }
  return pool;
};
export const querySystem = async (text, params) => {
  const pool = getPool();
  return pool.query(text, params);
};
export const query = async (text, params) => {
  const pool = getPool();
  return pool.query(text, params);
};
