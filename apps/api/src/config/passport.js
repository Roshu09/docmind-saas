import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from './database.js';
import crypto from 'crypto';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const fullName = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value;

    // Check if user exists
    const existing = await query(
      `SELECT u.*, o.name as org_name, o.plan as org_plan
       FROM users u JOIN organizations o ON o.id = u.org_id
       WHERE u.email = $1`, [email]
    );

    if (existing.rowCount > 0) {
      // Update last login + avatar
      await query(
        `UPDATE users SET last_login_at = now(), avatar_url = $1 WHERE email = $2`,
        [avatarUrl, email]
      );
      return done(null, existing.rows[0]);
    }

    // New user — create org + user
    const orgSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + crypto.randomBytes(3).toString('hex');
    const orgResult = await query(
      `INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, 'free') RETURNING *`,
      [fullName + "'s Workspace", orgSlug]
    );
    const org = orgResult.rows[0];

    const userResult = await query(
      `INSERT INTO users (org_id, email, full_name, password_hash, role, avatar_url, email_verified)
       VALUES ($1, $2, $3, $4, 'owner', $5, true) RETURNING *`,
      [org.id, email, fullName, crypto.randomBytes(32).toString('hex'), avatarUrl]
    );
    const user = userResult.rows[0];

    await query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [org.id, user.id]
    );

    return done(null, { ...user, org_name: org.name, org_plan: org.plan });
  } catch (err) {
    return done(err, null);
  }
}));

export default passport;
