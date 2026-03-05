// src/middlewares/rateLimiter.js
// ============================================================
// Per-Tenant Rate Limiting using Redis
// Limits requests per org, not per IP — fairer for multi-tenant.
// Falls back to IP-based limiting for unauthenticated requests.
// ============================================================

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// ── General API rate limiter ─────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,   // 1 minute
  max: env.RATE_LIMIT_MAX_REQUESTS,     // 100 requests per minute
  standardHeaders: true,                // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by org (authenticated) or IP (unauthenticated)
    return req.user?.orgId || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// ── Stricter limiter for auth endpoints ──────────────────────
// Prevents brute-force login attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 login attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please wait 15 minutes.',
    });
  },
});

// ── Upload limiter ───────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,              // 20 uploads per minute per org
  keyGenerator: (req) => req.user?.orgId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Upload limit reached. Max 20 files per minute.',
    });
  },
});
