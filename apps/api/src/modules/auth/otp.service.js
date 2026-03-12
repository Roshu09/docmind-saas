import { query } from '../../config/database.js';
import { sendOTPEmail, sendWelcomeEmail } from '../../config/email.js';

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendVerificationOTP = async (userId, email, name) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate old OTPs
  await query(`UPDATE email_otps SET used_at = now() WHERE email = $1 AND used_at IS NULL`, [email]);

  // Insert new OTP
  await query(
    `INSERT INTO email_otps (user_id, email, otp, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, email, otp, expiresAt]
  );

  await sendOTPEmail(email, name, otp);
  return true;
};

export const verifyOTP = async (email, otp) => {
  const result = await query(
    `SELECT * FROM email_otps 
     WHERE email = $1 AND otp = $2 
     AND used_at IS NULL 
     AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email, otp]
  );

  if (result.rowCount === 0) return { success: false, message: 'Invalid or expired OTP' };

  // Mark OTP as used
  await query(`UPDATE email_otps SET used_at = now() WHERE id = $1`, [result.rows[0].id]);

  // Mark user as verified
  const userResult = await query(
    `UPDATE users SET email_verified = true WHERE email = $1 RETURNING id, full_name, email`,
    [email]
  );

  const user = userResult.rows[0];
  // Send welcome email
  await sendWelcomeEmail(email, user.full_name).catch(() => {});

  return { success: true, user };
};
