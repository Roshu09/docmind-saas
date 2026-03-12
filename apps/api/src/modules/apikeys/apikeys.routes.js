import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { createApiKeyController, listApiKeysController, revokeApiKeyController, deleteApiKeyController } from './apikeys.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', listApiKeysController);
router.post('/', createApiKeyController);
router.patch('/:id/revoke', revokeApiKeyController);
router.delete('/:id', deleteApiKeyController);
export default router;
