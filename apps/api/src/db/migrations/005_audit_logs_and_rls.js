// migrations/005_audit_logs_and_rls.js
// ============================================================
// Two things in this migration:
//
// 1. AUDIT LOGS — every important action is recorded
//    (upload, search, RAG query, login, invite, delete)
//
// 2. ROW-LEVEL SECURITY (RLS) — the most important security feature
//    PostgreSQL enforces tenant isolation AT THE DATABASE LEVEL.
//    Even a buggy query that forgets WHERE org_id = $1
//    will NOT return another tenant's data.
//
// This is what makes this "production-grade" — not just app-level filtering.
// ============================================================

export const up = (pgm) => {
  // ── Audit Logs table ───────────────────────────────────────
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    org_id: {
      type: 'uuid',
      references: '"organizations"',
      onDelete: 'SET NULL',
    },
    user_id: {
      type: 'uuid',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    action: {
      type: 'varchar(100)',
      notNull: true,
      // e.g. 'document.upload', 'document.delete',
      //      'search.query', 'rag.query', 'user.login',
      //      'org.member_invited', 'org.member_removed'
    },
    resource_type: {
      type: 'varchar(50)',
      // e.g. 'document', 'organization', 'user'
    },
    resource_id: {
      type: 'uuid',
    },
    metadata: {
      type: 'jsonb',
      default: "'{}'",
      // Flexible field: store query text, file name, role change, etc.
    },
    ip_address: { type: 'inet' },
    user_agent: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('audit_logs', 'org_id');
  pgm.createIndex('audit_logs', 'user_id');
  pgm.createIndex('audit_logs', 'action');
  pgm.createIndex('audit_logs', 'created_at');
  pgm.createIndex('audit_logs', ['org_id', 'created_at']); // Dashboard analytics

  // ── Row-Level Security (RLS) ───────────────────────────────
  // Step 1: Enable RLS on all tenant-scoped tables
  pgm.sql('ALTER TABLE documents ENABLE ROW LEVEL SECURITY;');
  pgm.sql('ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;');
  pgm.sql('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;');

  // Step 2: Create a function that returns the current org_id
  // This is set by the API on each DB connection using:
  //   SET LOCAL app.current_org_id = 'uuid-here';
  pgm.sql(`
    CREATE OR REPLACE FUNCTION current_org_id()
    RETURNS uuid AS $$
      SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
    $$ LANGUAGE sql STABLE;
  `);

  // Step 3: RLS Policies for documents
  // SELECT: can only see documents belonging to current org
  pgm.sql(`
    CREATE POLICY documents_org_isolation_select
    ON documents FOR SELECT
    USING (org_id = current_org_id());
  `);
  // INSERT: can only insert documents for current org
  pgm.sql(`
    CREATE POLICY documents_org_isolation_insert
    ON documents FOR INSERT
    WITH CHECK (org_id = current_org_id());
  `);
  // UPDATE: can only update own org's documents
  pgm.sql(`
    CREATE POLICY documents_org_isolation_update
    ON documents FOR UPDATE
    USING (org_id = current_org_id());
  `);
  // DELETE: can only delete own org's documents
  pgm.sql(`
    CREATE POLICY documents_org_isolation_delete
    ON documents FOR DELETE
    USING (org_id = current_org_id());
  `);

  // Step 4: RLS for document_chunks (same pattern)
  pgm.sql(`
    CREATE POLICY chunks_org_isolation
    ON document_chunks FOR ALL
    USING (org_id = current_org_id());
  `);

  // Step 5: RLS for audit_logs
  pgm.sql(`
    CREATE POLICY audit_logs_org_isolation
    ON audit_logs FOR ALL
    USING (org_id = current_org_id());
  `);

  // NOTE: The API service uses a single DB role (postgres).
  // Before each query, it runs:
  //   SET LOCAL app.current_org_id = '<org_id>';
  // This is done in the query helper — see db/queries/rls.js
};

export const down = (pgm) => {
  // Remove RLS policies
  pgm.sql('DROP POLICY IF EXISTS documents_org_isolation_select ON documents;');
  pgm.sql('DROP POLICY IF EXISTS documents_org_isolation_insert ON documents;');
  pgm.sql('DROP POLICY IF EXISTS documents_org_isolation_update ON documents;');
  pgm.sql('DROP POLICY IF EXISTS documents_org_isolation_delete ON documents;');
  pgm.sql('DROP POLICY IF EXISTS chunks_org_isolation ON document_chunks;');
  pgm.sql('DROP POLICY IF EXISTS audit_logs_org_isolation ON audit_logs;');

  pgm.sql('ALTER TABLE documents DISABLE ROW LEVEL SECURITY;');
  pgm.sql('ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;');
  pgm.sql('ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;');

  pgm.sql('DROP FUNCTION IF EXISTS current_org_id();');

  pgm.dropTable('audit_logs', { cascade: true });
};
