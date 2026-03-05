// migrations/001_create_organizations.js
// ============================================================
// Organizations table — the top-level tenant container.
// Every user, document, and resource belongs to an organization.
// ============================================================

export const up = (pgm) => {
  // Create organizations table
  pgm.createTable('organizations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    slug: {
      type: 'varchar(100)',
      notNull: true,
      unique: true, // Used in URLs: /org/acme-corp
    },
    plan: {
      type: 'varchar(50)',
      notNull: true,
      default: "'free'", // free | pro | enterprise
    },
    // Soft limits per plan
    max_file_size_mb: {
      type: 'integer',
      notNull: true,
      default: 20,
    },
    max_documents: {
      type: 'integer',
      notNull: true,
      default: 100,
    },
    max_members: {
      type: 'integer',
      notNull: true,
      default: 5,
    },
    // Metadata
    logo_url: { type: 'text' },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
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

  // Index for slug lookups (used on every request)
  pgm.createIndex('organizations', 'slug');
  pgm.createIndex('organizations', 'is_active');

  // Auto-update updated_at on any row change
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('organizations', 'update_organizations_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

export const down = (pgm) => {
  pgm.dropTable('organizations', { cascade: true });
};
