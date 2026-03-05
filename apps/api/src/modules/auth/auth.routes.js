// src/modules/auth/auth.routes.js
import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  getMeController,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// Public routes (no auth required)
router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

// Protected route (requires valid access token)
router.get('/me', authenticate, getMeController);

export default router;
