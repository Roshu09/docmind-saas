import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/aifi/.env' });

console.log('Connecting to:', process.env.DB_HOST);

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.query('CREATE EXTENSION IF NOT EXISTS vector;')
  .then(() => { console.log('✅ pgvector enabled!'); pool.end(); })
  .catch(e => { console.log('❌', e.message); pool.end(); });
