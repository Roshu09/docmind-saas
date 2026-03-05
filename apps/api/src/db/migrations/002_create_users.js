// migrations/002_create_users.js
// ============================================================
// Users table + org_members join table for RBAC.
// A user CAN belong to multiple organizations with different roles.
// Roles: owner > admin > member
// ============================================================

export const up = (pgm) => {
  // ── Users table ────────────────────────────────────────────
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true, // bcrypt hash, never plaintext
    },
    full_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    avatar_url: { type: 'text' },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    last_login_at: { type: 'timestamptz' },
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

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'is_active');

  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });

  // ── org_members table (User ↔ Org with role) ───────────────
  // This is the RBAC join table.
  // One user can be: owner of OrgA, member of OrgB
  pgm.createTable('org_members', {
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
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: "'member'", // owner | admin | member
    },
    invited_by: {
      type: 'uuid',
      references: '"users"',
    },
    joined_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // A user can only have ONE role per org
  pgm.addConstraint('org_members', 'unique_org_user', 'UNIQUE (org_id, user_id)');

  pgm.createIndex('org_members', 'org_id');
  pgm.createIndex('org_members', 'user_id');
  pgm.createIndex('org_members', ['org_id', 'user_id']);

  // ── refresh_tokens table ───────────────────────────────────
  // Stores refresh tokens for rotation + revocation.
  // Access tokens are stateless (JWT), refresh tokens are stateful.
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: 'varchar(255)',
      notNull: true,
      unique: true, // SHA-256 hash of the actual token
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },
    is_revoked: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    device_info: { type: 'text' }, // Browser/device for UX
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('refresh_tokens', 'user_id');
  pgm.createIndex('refresh_tokens', 'token_hash');
  pgm.createIndex('refresh_tokens', 'expires_at');
};

export const down = (pgm) => {
  pgm.dropTable('refresh_tokens', { cascade: true });
  pgm.dropTable('org_members', { cascade: true });
  pgm.dropTable('users', { cascade: true });
};
