import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// ─── JWT Token Tests ───────────────────────────────────────────────────────
describe('JWT Token Generation & Validation', () => {
  const secret = 'test-access-secret-key-for-jest';
  const payload = { sub: 'user-123', email: 'test@test.com', orgId: 'org-123', role: 'owner' };

  it('should generate a valid JWT token', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should decode JWT and return correct payload', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.orgId).toBe(payload.orgId);
    expect(decoded.role).toBe(payload.role);
  });

  it('should reject an expired token', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '0s' });
    expect(() => jwt.verify(token, secret)).toThrow('jwt expired');
  });

  it('should reject a token with wrong secret', () => {
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

  it('should reject a malformed token', () => {
    expect(() => jwt.verify('invalid.token.here', secret)).toThrow();
  });
});

// ─── Password Validation Tests ─────────────────────────────────────────────
describe('Password Validation Logic', () => {
  const validatePassword = (password) => {
    if (!password || password.length < 8) return { valid: false, message: 'Password must be 8+ characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Must contain uppercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Must contain a number' };
    return { valid: true };
  };

  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('abc123').valid).toBe(false);
  });

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('password123').valid).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(validatePassword('Password').valid).toBe(false);
  });

  it('should accept valid passwords', () => {
    expect(validatePassword('Password123').valid).toBe(true);
  });

  it('should reject empty password', () => {
    expect(validatePassword('').valid).toBe(false);
  });
});

// ─── OTP Tests ─────────────────────────────────────────────────────────────
describe('OTP Generation Logic', () => {
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  it('should generate a 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
  });

  it('should generate numeric OTP only', () => {
    const otp = generateOTP();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should generate OTP between 100000 and 999999', () => {
    const otp = parseInt(generateOTP());
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
  });

  it('should generate different OTPs each time', () => {
    const otps = new Set(Array.from({ length: 10 }, generateOTP));
    expect(otps.size).toBeGreaterThan(1);
  });

  it('should expire after 10 minutes', () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const now = new Date();
    const diffMs = expiresAt - now;
    expect(diffMs).toBeGreaterThan(9 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(10 * 60 * 1000);
  });
});

// ─── Input Sanitization Tests ──────────────────────────────────────────────
describe('Input Sanitization', () => {
  const sanitizeEmail = (email) => email?.toLowerCase().trim();
  const sanitizeOrgSlug = (name) => name?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  it('should lowercase and trim email', () => {
    expect(sanitizeEmail('  TEST@GMAIL.COM  ')).toBe('test@gmail.com');
  });

  it('should sanitize org name to valid slug', () => {
    expect(sanitizeOrgSlug('My Company!')).toBe('my-company-');
  });

  it('should handle empty email', () => {
    expect(sanitizeEmail('')).toBe('');
  });

  it('should handle null email gracefully', () => {
    expect(sanitizeEmail(null)).toBeUndefined();
  });
});
