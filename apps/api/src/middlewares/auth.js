// src/middlewares/auth.js
// ============================================================
// Authentication & Authorization Middleware
//
// authenticate: verifies JWT, attaches req.user
// requireRole:  checks if user has sufficient role in their org
//
// Role hierarchy (highest to lowest):
//   owner > admin > member
//
// Usage:
//   router.get('/files', authenticate, getFiles)
//   router.delete('/org', authenticate, requireRole('owner'), deleteOrg)
//   router.post('/invite', authenticate, requireRole('admin'), inviteMember)
// ============================================================

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

// Role hierarchy — higher index = more permissions
const ROLE_HIERARCHY = ['member', 'admin', 'owner'];

/**
 * Check if a role meets the minimum required role
 * @param {string} userRole - The user's actual role
 * @param {string} requiredRole - Minimum role needed
 */
const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
};

/**
 * authenticate middleware
 * Extracts and verifies JWT from Authorization header.
 * Attaches user info to req.user for downstream use.
 *
 * Expects: Authorization: Bearer <access_token>
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // Attach user context to request — available in all downstream handlers
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      orgId: decoded.orgId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Let the global error handler format the response
    throw error; // Will be caught as JsonWebTokenError or TokenExpiredError
  }
};

/**
 * requireRole middleware factory
 * Creates a middleware that checks the user has at least the required role.
 * Must be used AFTER authenticate.
 *
 * @param {string} minimumRole - 'member' | 'admin' | 'owner'
 *
 * @example
 * router.delete('/org', authenticate, requireRole('owner'), deleteOrg)
 */
export const requireRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!hasMinimumRole(req.user.role, minimumRole)) {
      throw new ForbiddenError(
        `This action requires ${minimumRole} role or higher. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

// Convenience shortcuts
export const requireAdmin = requireRole('admin');
export const requireOwner = requireRole('owner');
