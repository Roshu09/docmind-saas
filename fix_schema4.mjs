import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/aifi/.env' });
const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

await pool.query(`
  ALTER TABLE refresh_tokens ALTER COLUMN is_revoked SET DEFAULT false;
  ALTER TABLE email_otps ALTER COLUMN created_at SET DEFAULT NOW();
  ALTER TABLE api_keys ALTER COLUMN is_active SET DEFAULT true;
  ALTER TABLE api_keys ALTER COLUMN request_count SET DEFAULT 0;
  ALTER TABLE api_keys ALTER COLUMN scopes SET DEFAULT '{}';
`);

console.log('✅ Fixed!');
pool.end();
