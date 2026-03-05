// src/middlewares/requestLogger.js
// ============================================================
// HTTP Request Logger Middleware
// Logs every request with: method, path, status, duration, userId
// requestId is attached to req so all child logs can reference it
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  // Attach unique ID to every request for tracing
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);

  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      orgId: req.user?.orgId,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };

    // Log level based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};
