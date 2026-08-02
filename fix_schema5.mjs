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
  CREATE TABLE IF NOT EXISTS ai_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    feature VARCHAR(50) NOT NULL,
    query_text TEXT,
    response_text TEXT,
    tokens_used INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_ai_query_logs_org_id ON ai_query_logs(org_id);
  CREATE INDEX IF NOT EXISTS idx_ai_query_logs_user_id ON ai_query_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_query_logs_created_at ON ai_query_logs(created_at);
`);

console.log('✅ ai_query_logs table created!');
pool.end();
