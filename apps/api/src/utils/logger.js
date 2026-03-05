// src/utils/logger.js
// ============================================================
// Structured JSON Logger using Winston
// Every log has: timestamp, level, message, requestId (if set),
// plus any additional metadata you pass.
//
// In development: colorized, readable output
// In production:  JSON format → shipped to CloudWatch
// ============================================================

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

// Custom format: adds timestamp, colorizes in dev
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Production: pure JSON for CloudWatch/log aggregators
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Include stack traces
  winston.format.json()
);

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,

  transports: [
    // Always log to console
    new winston.transports.Console(),

    // In production, also write to files
    ...(isDev ? [] : [
      new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      }),
    ]),
  ],
});

// ── Request logger factory ────────────────────────────────────
// Creates a child logger with request context attached to every log
// Usage: const reqLogger = createRequestLogger(req)
//        reqLogger.info('File uploaded') → includes requestId, userId, orgId
export const createRequestLogger = (req) => {
  return logger.child({
    requestId: req.id,
    userId: req.user?.id,
    orgId: req.user?.orgId,
    ip: req.ip,
  });
};

export default logger;
