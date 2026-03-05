// migrations/003_create_documents.js
// ============================================================
// Documents table — tracks every uploaded file.
// Status flow: pending → processing → ready | failed
// All queries MUST include org_id (enforced by RLS in migration 005)
// ============================================================

export const up = (pgm) => {
  pgm.createTable('documents', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    org_id: {
      type: 'uuid',
      notNull: true,
      references: '"organizations"',
      onDelete: 'CASCADE',
    },
    uploaded_by: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'SET NULL', // Keep doc if user is deleted
    },
    // File info
    original_name: {
      type: 'varchar(500)',
      notNull: true,
    },
    s3_key: {
      type: 'varchar(1000)',
      notNull: true, // e.g. org-uuid/raw/file-uuid.pdf
    },
    s3_bucket: {
      type: 'varchar(255)',
      notNull: true,
    },
    mime_type: {
      type: 'varchar(100)',
      notNull: true, // application/pdf | application/vnd... | text/plain
    },
    file_size_bytes: {
      type: 'bigint',
      notNull: true,
    },
    checksum: {
      type: 'varchar(64)', // SHA-256 hex string
    },
    // Processing status
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: "'pending'",
      // pending | processing | ready | failed
    },
    error_message: {
      type: 'text', // Populated if status = failed
    },
    // Extraction stats (populated after processing)
    page_count: { type: 'integer' },
    word_count: { type: 'integer' },
    chunk_count: { type: 'integer' },
    // Processing timestamps
    processing_started_at: { type: 'timestamptz' },
    processing_completed_at: { type: 'timestamptz' },
    // Soft delete
    deleted_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Critical indexes for query performance
  pgm.createIndex('documents', 'org_id');               // Every query filters by org
  pgm.createIndex('documents', 'uploaded_by');
  pgm.createIndex('documents', 'status');               // Queue worker polls by status
  pgm.createIndex('documents', ['org_id', 'status']);   // Most common query pattern
  pgm.createIndex('documents', 'deleted_at');           // Soft delete filter
  pgm.createIndex('documents', 'created_at');           // Sorting

  pgm.createTrigger('documents', 'update_documents_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

export const down = (pgm) => {
  pgm.dropTable('documents', { cascade: true });
};
