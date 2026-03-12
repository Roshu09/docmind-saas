import crypto from 'crypto';
import { query } from '../../config/database.js';

// Generate API key: aifi_live_xxxxxxxxxxxx
const generateApiKey = () => {
  const random = crypto.randomBytes(24).toString('base64url');
  return `aifi_live_${random}`;
};

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

export const createApiKey = async (orgId, userId, name, scopes, expiresAt) => {
  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 16) + '...';

  await query(
    `INSERT INTO api_keys (org_id, user_id, name, key_hash, key_prefix, scopes, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [orgId, userId, name, keyHash, keyPrefix, scopes, expiresAt || null]
  );

  return { rawKey, keyPrefix, name };
};

export const listApiKeys = async (orgId) => {
  const result = await query(
    `SELECT k.id, k.name, k.key_prefix, k.scopes, k.is_active,
            k.last_used_at, k.expires_at, k.request_count, k.created_at,
            u.full_name as created_by
     FROM api_keys k
     JOIN users u ON u.id = k.user_id
     WHERE k.org_id = $1
     ORDER BY k.created_at DESC`,
    [orgId]
  );
  return result.rows;
};

export const revokeApiKey = async (keyId, orgId) => {
  const result = await query(
    `UPDATE api_keys SET is_active = false WHERE id = $1 AND org_id = $2 RETURNING id`,
    [keyId, orgId]
  );
  return result.rowCount > 0;
};

export const deleteApiKey = async (keyId, orgId) => {
  const result = await query(
    `DELETE FROM api_keys WHERE id = $1 AND org_id = $2 RETURNING id`,
    [keyId, orgId]
  );
  return result.rowCount > 0;
};

export const validateApiKey = async (rawKey) => {
  const keyHash = hashKey(rawKey);
  const result = await query(
    `SELECT k.*, o.name as org_name
     FROM api_keys k
     JOIN organizations o ON o.id = k.org_id
     WHERE k.key_hash = $1 AND k.is_active = true
     AND (k.expires_at IS NULL OR k.expires_at > now())`,
    [keyHash]
  );
  if (result.rowCount === 0) return null;
  // Update last used + request count
  await query(
    `UPDATE api_keys SET last_used_at = now(), request_count = request_count + 1 WHERE key_hash = $1`,
    [keyHash]
  );
  return result.rows[0];
};
