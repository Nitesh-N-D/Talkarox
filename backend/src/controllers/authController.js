import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/db.js';
import {
  generateAccessToken, generateRefreshToken, getRefreshTokenExpiry,
  generateRandomToken, verifyAccessToken,
} from '../utils/tokens.js';
import {
  sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured,
} from '../services/emailService.js';
import { ApiError } from '../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return {
    id: rest.id,
    fullName: rest.full_name,
    email: rest.email,
    role: rest.role,
    schoolId: rest.school_id,
    bio: rest.bio,
    avatarUrl: rest.avatar_url,
    status: rest.status,
    preferredLanguage: rest.preferred_language,
    onboardingComplete: rest.onboarding_complete,
  };
}

async function issueTokens(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry();
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );
  return { accessToken, refreshToken };
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName?.trim() || !email?.trim() || !password || !role) {
      throw new ApiError(400, 'All fields are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Enter a valid email address');
    }
    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }
    if (!['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'].includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [fullName, email, passwordHash, role]
    );
    const user = rows[0];

    const verifyToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, verifyToken, 'EMAIL_VERIFY', expiresAt]
    );
    const emailResult = await sendVerificationEmail(email, fullName, verifyToken).catch((e) => {
      console.error('Email send failed:', e.message);
      return { skipped: true };
    });

    res.status(201).json({
      message: 'Account created',
      userId: user.id,
      verificationEmailSent: !emailResult?.skipped,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user || !user.password_hash) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    await pool.query('UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2', ['ONLINE', user.id]);
    const { accessToken, refreshToken } = await issueTokens(user);

    res.json({ accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
    let user = rows[0];
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const insertResult = await pool.query(
        `INSERT INTO users (full_name, email, google_id, role, avatar_url, email_verified)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
        [name, email, googleId, 'PARENT', picture] // default role; updated during onboarding
      );
      user = insertResult.rows[0];
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1, email_verified = true WHERE id = $2', [googleId, user.id]);
    }

    await pool.query('UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2', ['ONLINE', user.id]);
    const { accessToken, refreshToken } = await issueTokens(user);

    res.json({ accessToken, refreshToken, user: sanitizeUser(user), isNewUser });
  } catch (err) {
    next(new ApiError(401, 'Google sign-in failed. Please try again.'));
  }
}

export async function refreshTokenHandler(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(401, 'Refresh token required');

    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > now()',
      [refreshToken]
    );
    if (rows.length === 0) throw new ApiError(401, 'Refresh token invalid or expired');

    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id = $1', [rows[0].user_id]);
    const user = userRows[0];
    if (!user) throw new ApiError(401, 'User not found');

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );
    }

    res.json({
      success: true,
      message: 'Logged out',
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    const { rows } = await pool.query(
      `SELECT * FROM auth_tokens WHERE token = $1 AND type = 'EMAIL_VERIFY' AND expires_at > now() AND used_at IS NULL`,
      [token]
    );
    if (rows.length === 0) throw new ApiError(400, 'Verification link is invalid or expired');

    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [rows[0].user_id]);
    await pool.query('UPDATE auth_tokens SET used_at = now() WHERE id = $1', [rows[0].id]);

    res.json({ message: 'Email verified' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Always respond success to avoid leaking which emails exist
    if (rows.length > 0) {
      const user = rows[0];
      const token = generateRandomToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
        [user.id, token, 'PASSWORD_RESET', expiresAt]
      );
      sendPasswordResetEmail(email, token).catch((e) => console.error('Reset email failed:', e.message));
    }

    res.json({
      message: 'If that email exists, a reset link has been sent.',
      emailServiceConfigured: isEmailConfigured(),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const { rows } = await pool.query(
      `SELECT * FROM auth_tokens WHERE token = $1 AND type = 'PASSWORD_RESET' AND expires_at > now() AND used_at IS NULL`,
      [token]
    );
    if (rows.length === 0) throw new ApiError(400, 'Reset link is invalid or expired');

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, rows[0].user_id]);
    await pool.query('UPDATE auth_tokens SET used_at = now() WHERE id = $1', [rows[0].id]);

    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

export { sanitizeUser };
