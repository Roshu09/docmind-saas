// src/modules/organizations/org.controller.js
import { z } from 'zod';
import * as orgService from './org.service.js';
import { ValidationError } from '../../middlewares/errorHandler.js';

export const getOrgController = async (req, res) => {
  const org = await orgService.getOrg(req.user.orgId);
  res.json({ success: true, data: { org } });
};

export const getMembersController = async (req, res) => {
  const members = await orgService.getMembers(req.user.orgId);
  res.json({ success: true, data: { members } });
};

export const inviteMemberController = async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member']).default('member'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid invite data', parsed.error.errors);

  const member = await orgService.inviteMember(req.user.orgId, req.user.id, parsed.data);
  res.status(201).json({ success: true, data: { member } });
};

export const updateMemberRoleController = async (req, res) => {
  const schema = z.object({ role: z.enum(['admin', 'member']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid role', parsed.error.errors);

  await orgService.updateMemberRole(req.user.orgId, req.user.id, req.user.role, req.params.userId, parsed.data.role);
  res.json({ success: true, message: 'Role updated' });
};

export const removeMemberController = async (req, res) => {
  await orgService.removeMember(req.user.orgId, req.user.id, req.user.role, req.params.userId);
  res.json({ success: true, message: 'Member removed' });
};
