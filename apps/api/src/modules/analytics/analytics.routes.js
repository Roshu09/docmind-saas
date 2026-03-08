import express from 'express';
import { getAnalytics } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';
const router = express.Router();
router.get('/', authenticate, getAnalytics);
export default router;