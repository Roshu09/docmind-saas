// src/modules/files/file.routes.js
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { uploadLimiter } from '../../middlewares/rateLimiter.js';
import {
  getUploadUrlController,
  confirmUploadController,
  getDocumentsController,
  getDocumentController,
  deleteDocumentController,
  getDownloadUrlController,
} from './file.controller.js';

const router = Router();
router.use(authenticate);

router.post('/upload-url', uploadLimiter, getUploadUrlController);
router.post('/:fileId/confirm', confirmUploadController);
router.get('/', getDocumentsController);
router.get('/:fileId', getDocumentController);
router.get('/:fileId/download-url', getDownloadUrlController);
router.delete('/:fileId', deleteDocumentController);

export default router;
