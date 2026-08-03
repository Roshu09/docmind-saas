import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { getSessionsController, getMessagesController, createSessionController, saveMessageController, deleteSessionController } from './chat.controller.js';

const router = Router();
router.use(authenticate);

router.get('/sessions', getSessionsController);
router.post('/sessions', createSessionController);
router.get('/sessions/:sessionId/messages', getMessagesController);
router.post('/sessions/:sessionId/messages', saveMessageController);
router.delete('/sessions/:sessionId', deleteSessionController);

export default router;
