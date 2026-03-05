// src/modules/rag/rag.routes.js
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { ragController } from './rag.controller.js';

const router = Router();
router.use(authenticate);

router.post('/query', ragController);

export default router;
