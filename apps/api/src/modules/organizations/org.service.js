// src/modules/organizations/org.service.js
// ============================================================
// Organization Service
// Handles: get org details, invite members, change roles, remove members
// All operations are tenant-scoped (can only manage your own org)
// ============================================================

import { querySystem, queryWithOrg, transactionWithOrg } from '../../db/queries/rls.js';
import { logger } from '../../utils/logger.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../middlewares/errorHandler.js';

/**
 * Get organization details with member list
 */
export const getOrg = async (orgId) => {
  const orgResult = await querySystem(
    `SELECT o.*,
      COUNT(om.id) as member_count,
      COUNT(d.id) as document_count
     FROM organizations o
     LEFT JOIN org_members om ON om.org_id = o.id
     LEFT JOIN documents d ON d.org_id = o.id AND d.deleted_at IS NULL
     WHERE o.id = $1
     GROUP BY o.id`,
    [orgId]
  );

  if (orgResult.rowCount === 0) throw new NotFoundError('Organization');

  return orgResult.rows[0];
};

/**
 * Get all members of an organization
 */
export const getMembers = async (orgId) => {
  const result = await querySystem(
    `SELECT u.id, u.email, u.full_name, u.avatar_url,
            u.last_login_at, om.role, om.joined_at,
            inv.full_name as invited_by_name
     FROM org_members om
     JOIN users u ON u.id = om.user_id
     LEFT JOIN users inv ON inv.id = om.invited_by
     WHERE om.org_id = $1
     ORDER BY om.joined_at ASC`,
    [orgId]
  );

  return result.rows;
};

/**
 * Invite an existing user to the organization (by email)
 * In a real system this would send an email — we add direct invite for now
 */
export const inviteMember = async (orgId, invitedByUserId, { email, role = 'member' }) => {
  if (!['admin', 'member'].includes(role)) {
    throw new ValidationError('Role must be admin or member');
  }

  // Find the user to invite
  const userResult = await querySystem(
    'SELECT id, email, full_name FROM users WHERE email = $1 AND is_active = true',
    [email.toLowerCase()]
  );

  if (userResult.rowCount === 0) {
    throw new NotFoundError('User with that email');
  }

  const invitedUser = userResult.rows[0];

  // Check org member limit
  const org = await getOrg(orgId);
  if (parseInt(org.member_count) >= org.max_members) {
    throw new ForbiddenError(
      `Organization has reached the maximum of ${org.max_members} members for the ${org.plan} plan`
    );
  }

  // Check if already a member
  const existingMember = await querySystem(
    'SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2',
    [orgId, invitedUser.id]
  );

  if (existingMember.rowCount > 0) {
    throw new ConflictError('User is already a member of this organization');
  }

  // Add to org
  await querySystem(
    `INSERT INTO org_members (org_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)`,
    [orgId, invitedUser.id, role, invitedByUserId]
  );

  logger.info('Member invited to org', {
    orgId, invitedUserId: invitedUser.id, role,
  });

  return {
    id: invitedUser.id,
    email: invitedUser.email,
    fullName: invitedUser.full_name,
    role,
  };
};

/**
 * Update a member's role (only owner can promote to admin)
 */
export const updateMemberRole = async (orgId, requestingUserId, requestingRole, targetUserId, newRole) => {
  if (!['admin', 'member'].includes(newRole)) {
    throw new ValidationError('Role must be admin or member (cannot assign owner via API)');
  }

  // Only owners can change roles
  if (requestingRole !== 'owner') {
    throw new ForbiddenError('Only org owners can change member roles');
  }

  // Can't change your own role
  if (requestingUserId === targetUserId) {
    throw new ForbiddenError('You cannot change your own role');
  }

  const result = await querySystem(
    `UPDATE org_members SET role = $1
     WHERE org_id = $2 AND user_id = $3
     RETURNING id`,
    [newRole, orgId, targetUserId]
  );

  if (result.rowCount === 0) throw new NotFoundError('Member');

  return { updated: true };
};

/**
 * Remove a member from the organization
 */
export const removeMember = async (orgId, requestingUserId, requestingRole, targetUserId) => {
  // Can remove yourself (leave org) or admins/owners can remove others
  const isSelf = requestingUserId === targetUserId;
  const canRemoveOthers = ['admin', 'owner'].includes(requestingRole);

  if (!isSelf && !canRemoveOthers) {
    throw new ForbiddenError('Insufficient permissions to remove members');
  }

  // Check target isn't the owner
  const targetMember = await querySystem(
    'SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2',
    [orgId, targetUserId]
  );

  if (targetMember.rowCount === 0) throw new NotFoundError('Member');
  if (targetMember.rows[0].role === 'owner') {
    throw new ForbiddenError('Cannot remove the organization owner');
  }

  await querySystem(
    'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
    [orgId, targetUserId]
  );

  logger.info('Member removed from org', { orgId, targetUserId });
  return { removed: true };
};
