// src/modules/organizations/org.routes.js
import { Router } from 'express';
import { authenticate, requireAdmin, requireOwner } from '../../middlewares/auth.js';
import {
  getOrgController,
  getMembersController,
  inviteMemberController,
  updateMemberRoleController,
  removeMemberController,
} from './org.controller.js';

const router = Router();

// All org routes require authentication
router.use(authenticate);

router.get('/', getOrgController);
router.get('/members', getMembersController);
router.post('/members/invite', requireAdmin, inviteMemberController);
router.patch('/members/:userId/role', requireOwner, updateMemberRoleController);
router.delete('/members/:userId', requireAdmin, removeMemberController);

export default router;
