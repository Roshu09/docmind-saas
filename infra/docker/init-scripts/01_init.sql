-- ============================================================
-- PostgreSQL Initialization Script
-- Runs automatically on first docker-compose up
-- ============================================================

-- Enable the pgvector extension (required for embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions loaded
DO $$
BEGIN
  RAISE NOTICE 'Extensions loaded: vector, uuid-ossp, pg_trgm';
END $$;
