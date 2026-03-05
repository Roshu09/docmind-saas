// app.js
// ============================================================
// Express Application Factory
// Creates and configures the Express app.
// Kept separate from server.js so it's testable without starting HTTP server.
// ============================================================

import 'express-async-errors'; // Patch Express to handle async errors automatically
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './src/config/env.js';
import { requestLogger } from './src/middlewares/requestLogger.js';
import { apiLimiter } from './src/middlewares/rateLimiter.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { logger } from './src/utils/logger.js';
// Routes
import authRoutes from './src/modules/auth/auth.routes.js';
import orgRoutes from './src/modules/organizations/org.routes.js';
import fileRoutes from './src/modules/files/file.routes.js';
import searchRoutes from './src/modules/search/search.routes.js';
import ragRoutes from './src/modules/rag/rag.routes.js';

const app = express();

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Needed for some browser features
}));

// ── CORS Configuration ───────────────────────────────────────
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,              // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
}));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookie Parser (needed for refresh token cookie) ──────────
app.use(cookieParser());

// ── Response Compression ─────────────────────────────────────
app.use(compression());

// ── Request Logging ──────────────────────────────────────────
app.use(requestLogger);

// ── Rate Limiting ────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Trust proxy (for correct IP behind load balancer) ────────
app.set('trust proxy', 1);

// ── Health Check (no auth required) ─────────────────────────
app.get('/health', async (req, res) => {
  // Check DB and Redis status
  let dbStatus = 'unknown';
  let redisStatus = 'unknown';

  try {
    const { query } = await import('./src/config/database.js');
    await query('SELECT 1');
    dbStatus = 'healthy';
  } catch {
    dbStatus = 'unhealthy';
  }

  try {
    const redisClient = (await import('./src/config/redis.js')).default;
    await redisClient.ping();
    redisStatus = 'healthy';
  } catch {
    redisStatus = 'unhealthy';
  }

  const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);  // Phase 5 ✅
app.use('/api/rag', ragRoutes);        // Phase 5 ✅

// Phase 5: Search + RAG routes (coming soon)
// app.use('/api/search', searchRoutes);
// app.use('/api/rag', ragRoutes);

// ── 404 Handler ──────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler (must be LAST) ──────────────────────
app.use(errorHandler);

logger.info(`Express app configured for ${env.NODE_ENV} environment`);

export default app;
