// src/modules/auth/auth.service.js
// ============================================================
// Auth Service — all authentication business logic
//
// Security decisions made here:
// - bcrypt with 12 rounds (slow enough to prevent brute force)
// - Access token: 15 min (short-lived, stateless JWT)
// - Refresh token: 7 days (stateful, stored hashed in DB)
// - Refresh token rotation: every refresh issues a NEW token
//   and revokes the old one (detects token theft)
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { querySystem } from '../../db/queries/rls.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../middlewares/errorHandler.js';

// ── Token generation helpers ─────────────────────────────────

/**
 * Generate a JWT access token (short-lived, stateless)
 * Payload includes user id, org id, and role for RBAC
 */
const generateAccessToken = (user, orgId, role) => {
  return jwt.sign(
    {
      sub: user.id,          // Subject (user id)
      email: user.email,
      orgId,                 // Current org context
      role,                  // Role in this org: owner|admin|member
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Generate a refresh token (long-lived, stored in DB)
 * The actual token is random bytes — we store a HASH in DB
 */
const generateRefreshToken = () => {
  // 64 random bytes → URL-safe base64 string
  return crypto.randomBytes(64).toString('base64url');
};

/**
 * Hash a refresh token for secure DB storage
 * We store the HASH, never the raw token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ── Auth Service methods ──────────────────────────────────────

/**
 * Register a new user AND create their first organization.
 * Every user starts as 'owner' of their own org.
 */
export const register = async ({ email, password, fullName, orgName }) => {
  // 1. Check if email already exists
  const existingUser = await querySystem(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rowCount > 0) {
    throw new ConflictError('An account with this email already exists');
  }

  // 2. Hash password with bcrypt (12 rounds = ~300ms, prevents brute force)
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Generate org slug from name (e.g. "Acme Corp" → "acme-corp-a3f2")
  const baseSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

  // 4. Create user + org + membership in a single transaction
  const client = await (await import('../../config/database.js')).getClient();

  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [email.toLowerCase(), passwordHash, fullName]
    );
    const user = userResult.rows[0];

    // Create organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2)
       RETURNING id, name, slug, plan`,
      [orgName, slug]
    );
    const org = orgResult.rows[0];

    // Make user the owner of their org
    await client.query(
      `INSERT INTO org_members (org_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [org.id, user.id]
    );

    await client.query('COMMIT');

    logger.info('New user registered', {
      userId: user.id,
      orgId: org.id,
      email: user.email,
    });

    // 5. Generate tokens for immediate login after registration
    const accessToken = generateAccessToken(user, org.id, 'owner');
    const refreshToken = generateRefreshToken();

    // Store hashed refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await querySystem(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashToken(refreshToken), expiresAt]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        role: 'owner',
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Login with email + password.
 * Returns tokens scoped to the user's primary org.
 */
export const login = async ({ email, password, orgId = null }) => {
  // 1. Find user by email
  const userResult = await querySystem(
    `SELECT u.*, om.org_id, om.role, o.name as org_name, o.slug as org_slug, o.plan
     FROM users u
     JOIN org_members om ON om.user_id = u.id
     JOIN organizations o ON o.id = om.org_id
     WHERE u.email = $1 AND u.is_active = true
     ORDER BY om.joined_at ASC
     LIMIT 1`,
    [email.toLowerCase()]
  );

  if (userResult.rowCount === 0) {
    // Don't reveal whether email exists (security)
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = userResult.rows[0];

  // 2. Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // 3. Update last_login_at
  await querySystem(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // 4. Generate tokens
  const accessToken = generateAccessToken(user, user.org_id, user.role);
  const refreshToken = generateRefreshToken();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await querySystem(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashToken(refreshToken), expiresAt]
  );

  logger.info('User logged in', { userId: user.id, orgId: user.org_id });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    },
    org: {
      id: user.org_id,
      name: user.org_name,
      slug: user.org_slug,
      plan: user.plan,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using a valid refresh token.
 * Implements token rotation: old token revoked, new one issued.
 * This detects token theft — if stolen token is used after rotation,
 * both tokens become invalid.
 */
export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const tokenHash = hashToken(refreshToken);

  // Find the token in DB
  const tokenResult = await querySystem(
    `SELECT rt.*, u.id as user_id, u.email, u.full_name, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  if (tokenResult.rowCount === 0) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const tokenRecord = tokenResult.rows[0];

  // Check if revoked (possible token theft indicator)
  if (tokenRecord.is_revoked) {
    // Revoke ALL tokens for this user (security response to potential theft)
    await querySystem(
      'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
      [tokenRecord.user_id]
    );
    logger.warn('Revoked refresh token used — possible token theft', {
      userId: tokenRecord.user_id,
    });
    throw new UnauthorizedError('Token has been revoked. Please log in again.');
  }

  // Check expiry
  if (new Date(tokenRecord.expires_at) < new Date()) {
    throw new UnauthorizedError('Refresh token has expired. Please log in again.');
  }

  if (!tokenRecord.is_active) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Get user's org memberships
  const memberResult = await querySystem(
    `SELECT om.org_id, om.role, o.name, o.slug, o.plan
     FROM org_members om
     JOIN organizations o ON o.id = om.org_id
     WHERE om.user_id = $1
     ORDER BY om.joined_at ASC LIMIT 1`,
    [tokenRecord.user_id]
  );

  const member = memberResult.rows[0];

  // TOKEN ROTATION: revoke old, issue new
  await querySystem(
    'UPDATE refresh_tokens SET is_revoked = true WHERE id = $1',
    [tokenRecord.id]
  );

  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await querySystem(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenRecord.user_id, hashToken(newRefreshToken), expiresAt]
  );

  const user = {
    id: tokenRecord.user_id,
    email: tokenRecord.email,
  };

  const accessToken = generateAccessToken(user, member.org_id, member.role);

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — revoke the refresh token
 */
export const logout = async (refreshToken) => {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await querySystem(
    'UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1',
    [tokenHash]
  );
};

/**
 * Get current user profile with all org memberships
 */
export const getMe = async (userId) => {
  const userResult = await querySystem(
    `SELECT u.id, u.email, u.full_name, u.avatar_url, u.created_at,
            json_agg(json_build_object(
              'id', o.id,
              'name', o.name,
              'slug', o.slug,
              'plan', o.plan,
              'role', om.role
            )) as organizations
     FROM users u
     JOIN org_members om ON om.user_id = u.id
     JOIN organizations o ON o.id = om.org_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );

  if (userResult.rowCount === 0) {
    throw new NotFoundError('User');
  }

  return userResult.rows[0];
};
