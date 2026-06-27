import admin from 'firebase-admin';
import pool from '../config/db.js';

let firebaseApp = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  return firebaseApp;
}

export function isPushConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

/**
 * Registers (or refreshes) a device's FCM token for a user. Called by the
 * frontend right after the browser grants notification permission.
 */
export async function registerPushToken(userId, token, platform = 'web') {
  await pool.query(
    `INSERT INTO push_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = $1, updated_at = now()`,
    [userId, token, platform]
  );
}

export async function unregisterPushToken(token) {
  await pool.query('DELETE FROM push_tokens WHERE token = $1', [token]);
}

/**
 * Sends a push notification to every registered device for a user.
 * Silently no-ops if Firebase isn't configured, and prunes tokens that
 * Firebase reports as no-longer-valid (uninstalled app, revoked permission).
 */
export async function sendPushToUser(userId, { title, body, data = {} }) {
  const app = getFirebaseApp();
  if (!app) {
    console.warn('[push] Firebase not configured — skipping push to user', userId);
    return { skipped: true };
  }

  const { rows } = await pool.query('SELECT token FROM push_tokens WHERE user_id = $1', [userId]);
  if (rows.length === 0) return { sent: 0 };

  const tokens = rows.map((r) => r.token);
  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    const deadTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
        deadTokens.push(tokens[i]);
      }
    });
    if (deadTokens.length > 0) {
      await pool.query('DELETE FROM push_tokens WHERE token = ANY($1)', [deadTokens]);
    }

    return { sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    console.error('[push] Send failed:', err.message);
    return { error: err.message };
  }
}

export async function sendPushToSchool(schoolId, { title, body, data = {} }) {
  const app = getFirebaseApp();
  if (!app) {
    console.warn('[push] Firebase not configured — skipping school-wide push');
    return { skipped: true };
  }

  const { rows } = await pool.query(
    `SELECT pt.token FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.school_id = $1`,
    [schoolId]
  );
  if (rows.length === 0) return { sent: 0 };

  const tokens = rows.map((r) => r.token);
  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    return { sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    console.error('[push] School broadcast failed:', err.message);
    return { error: err.message };
  }
}
