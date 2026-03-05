// src/middlewares/errorHandler.js
// ============================================================
// Global Error Handler
// This is the LAST middleware registered in app.js
// Catches ALL errors thrown anywhere in the app.
// Never leaks stack traces to clients in production.
// ============================================================

import { logger } from '../utils/logger.js';

// Custom error class for known, expected errors
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // vs programming errors (bugs)
  }
}

// Specific error types - use these throughout the app
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

// ── The actual error handler middleware ──────────────────────
export const errorHandler = (err, req, res, next) => {
  // Log the error
  const logContext = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    errorCode: err.code,
    userId: req.user?.id,
    orgId: req.user?.orgId,
  };

  if (err.isOperational) {
    // Known errors (validation, not found, etc.) — info level
    logger.warn('Operational error', { ...logContext, message: err.message });
  } else {
    // Unknown errors (bugs) — error level with stack trace
    logger.error('Unexpected error', { ...logContext, error: err.message, stack: err.stack });
  }

  // ── Zod validation errors ────────────────────────────────
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // ── JWT errors ───────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
    });
  }

  // ── PostgreSQL errors ────────────────────────────────────
  if (err.code === '23505') { // unique_violation
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_ENTRY',
      message: 'A record with this data already exists',
    });
  }

  // ── Operational (known) errors ───────────────────────────
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details && { errors: err.details }),
    });
  }

  // ── Unknown errors — NEVER leak internals in production ──
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: isProd ? 'Something went wrong. Please try again.' : err.message,
    ...(isProd ? {} : { stack: err.stack }), // Only show stack in dev
  });
};
