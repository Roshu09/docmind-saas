// src/config/env.js
// ============================================================
// Environment Variable Validation using Zod
// The app will CRASH on startup with a clear error message
// if any required env var is missing or has wrong type.
// This is production-engineering discipline.
// ============================================================

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (4 levels up from src/config/)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Define the shape and types of ALL environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  API_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('10').transform(Number),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT secret must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // AWS
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  S3_UPLOAD_URL_EXPIRES: z.string().default('900').transform(Number),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o'),
  OPENAI_EMBEDDING_DIMENSIONS: z.string().default('1536').transform(Number),

  // File upload
  MAX_FILE_SIZE_MB: z.string().default('20').transform(Number),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Worker
  QUEUE_EMBED_CONCURRENCY: z.string().default('3').transform(Number),
  QUEUE_RETRY_ATTEMPTS: z.string().default('3').transform(Number),

  // Chunking
  CHUNK_SIZE_TOKENS: z.string().default('512').transform(Number),
  CHUNK_OVERLAP_TOKENS: z.string().default('50').transform(Number),
});

// Parse and validate — throws detailed error if anything is wrong
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('');
  console.error('❌ ENVIRONMENT VARIABLE VALIDATION FAILED');
  console.error('=========================================');
  parseResult.error.issues.forEach((issue) => {
    console.error(`  ✗ ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('');
  console.error('📋 Copy .env.example to .env and fill in your values');
  console.error('');
  process.exit(1); // Hard crash — never run with bad config
}

export const env = parseResult.data;
export default env;
