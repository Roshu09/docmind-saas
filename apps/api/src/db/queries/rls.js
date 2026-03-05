// src/db/queries/rls.js
// ============================================================
// Row-Level Security helper
//
// How RLS works in this system:
// 1. PostgreSQL RLS policies check current_org_id() function
// 2. That function reads the session variable app.current_org_id
// 3. We set that variable at the START of each transaction
// 4. All subsequent queries in that transaction are auto-filtered
//
// Usage:
//   const result = await queryWithOrg(orgId, 'SELECT * FROM documents', [])
//   // Automatically scoped to orgId — no WHERE clause needed
// ============================================================

import { getClient, query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Execute a query scoped to a specific organization.
 * Sets RLS context variable before running the query.
 * For simple single queries (no transaction needed).
 *
 * @param {string} orgId - The organization UUID
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
export const queryWithOrg = async (orgId, text, params = []) => {
  const client = await getClient();
  try {
    // Set the org context for RLS — this is LOCAL to this transaction
    await client.query(`SET LOCAL app.current_org_id = '${orgId}'`);
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    logger.error('RLS query error', {
      orgId,
      query: text.substring(0, 100),
      error: error.message,
    });
    throw error;
  } finally {
    client.release(); // Always release back to pool
  }
};

/**
 * Execute multiple queries in a transaction, scoped to an org.
 * Use this when you need atomicity across multiple operations.
 *
 * @param {string} orgId
 * @param {Function} callback - async (client) => { ... your queries ... }
 *
 * @example
 * await transactionWithOrg(orgId, async (client) => {
 *   await client.query('INSERT INTO documents ...', [...])
 *   await client.query('INSERT INTO audit_logs ...', [...])
 * })
 */
export const transactionWithOrg = async (orgId, callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    // Set RLS context — LOCAL means it's scoped to this transaction
    await client.query(`SET LOCAL app.current_org_id = '${orgId}'`);

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error, rolled back', {
      orgId,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Execute a query WITHOUT org scoping (for admin/system queries).
 * Use sparingly — only for queries that legitimately span all orgs.
 * Examples: finding user by email on login, health checks
 *
 * @param {string} text
 * @param {Array} params
 */
export const querySystem = async (text, params = []) => {
  return query(text, params);
};
