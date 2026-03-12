// src/modules/auth/auth.routes.js
import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  getMeController,
  getProfileController,
  sendOTPController,
  verifyOTPController,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import passport from '../../config/passport.js';
import { googleCallbackController } from './google.controller.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// Public routes (no auth required)
router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

// Protected route (requires valid access token)
router.get('/me', authenticate, getMeController);
router.get('/profile', authenticate, getProfileController);
router.post('/send-otp', authenticate, sendOTPController);
router.post('/verify-otp', authenticate, verifyOTPController);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: process.env.FRONTEND_URL + '/login?error=google_failed' }), googleCallbackController);

export default router;
