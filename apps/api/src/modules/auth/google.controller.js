import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';

export const googleCallbackController = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);

    // Get org info
    const orgResult = await query(
      `SELECT o.*, om.role FROM organizations o
       JOIN org_members om ON om.org_id = o.id
       WHERE om.user_id = $1`, [user.id]
    );
    const org = orgResult.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, orgId: org.id, role: org.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    // Save refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '7 days')`,
      [user.id, refreshToken]
    );

    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      orgId: org.id,
      orgName: org.name,
      role: org.role,
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};
