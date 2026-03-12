import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth routes
  app.post('/api/auth/register', (req, res) => {
    const { email, password, fullName, orgName } = req.body;
    if (!email || !password || !fullName || !orgName) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be 8+ characters' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    res.status(201).json({ success: true, data: { user: { id: 'test-id', email, fullName }, accessToken: 'mock-token' } });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    if (email === 'test@test.com' && password === 'Password123') {
      return res.status(200).json({ success: true, data: { accessToken: 'mock-access-token', user: { email } } });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
};

describe('Auth API Routes', () => {
  let app;

  beforeAll(() => { app = createTestApp(); });

  // ── Health Check ──────────────────────────────────────────
  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  // ── Register ──────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register successfully with valid data', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@test.com', password: 'Password123',
        fullName: 'Test User', orgName: 'Test Org'
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', password: '123', fullName: 'Test', orgName: 'Org'
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'notanemail', password: 'Password123', fullName: 'Test', orgName: 'Org'
      });
      expect(res.status).toBe(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com', password: 'Password123'
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com', password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('should reject unknown email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unknown@test.com', password: 'Password123'
      });
      expect(res.status).toBe(401);
    });
  });

  // ── Logout ────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
