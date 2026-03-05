// src/modules/auth/auth.controller.js
// ============================================================
// Auth Controller — HTTP layer only
// Responsibilities:
//   1. Validate request input (Zod schemas)
//   2. Call auth service
//   3. Set/clear HTTP-only cookies
//   4. Return consistent response shape
//
// NO business logic here — that's in auth.service.js
// ============================================================

import { z } from 'zod';
import * as authService from './auth.service.js';
import { ValidationError } from '../../middlewares/errorHandler.js';

// ── Validation schemas ────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Cookie config ────────────────────────────────────────────
// Refresh token stored in HTTP-only cookie (not accessible by JS)
// This prevents XSS attacks from stealing the refresh token
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,           // JS cannot access this cookie
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth',        // Only sent to auth endpoints
};

// ── Controllers ───────────────────────────────────────────────

export const registerController = async (req, res) => {
  // Validate input
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid registration data', parsed.error.errors);
  }

  const result = await authService.register(parsed.data);

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: result.user,
      org: result.org,
      accessToken: result.accessToken,
      // refreshToken intentionally NOT in body — it's in the cookie
    },
  });
};

export const loginController = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid login data', parsed.error.errors);
  }

  const result = await authService.login(parsed.data);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: result.user,
      org: result.org,
      accessToken: result.accessToken,
    },
  });
};

export const refreshController = async (req, res) => {
  // Refresh token comes from HTTP-only cookie
  const refreshToken = req.cookies?.refreshToken;

  const result = await authService.refresh(refreshToken);

  // Rotate cookie too
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
    },
  });
};

export const logoutController = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  await authService.logout(refreshToken);

  // Clear the cookie
  res.clearCookie('refreshToken', { path: '/api/auth' });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMeController = async (req, res) => {
  // req.user is attached by the auth middleware
  const user = await authService.getMe(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
};
