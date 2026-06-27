import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let messaging = null;

function getMessagingInstance() {
  if (!isFirebaseConfigured) return null;
  if (!app) app = initializeApp(firebaseConfig);
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch {
      return null; // unsupported browser (e.g. no service worker support)
    }
  }
  return messaging;
}

/**
 * Requests notification permission and returns an FCM device token, or null
 * if Firebase isn't configured, the browser doesn't support push, or the
 * user declines permission. Callers should treat null as "push unavailable"
 * and continue without it — never block the rest of the app on this.
 */
export async function requestPushPermissionAndToken() {
  if (!isFirebaseConfigured) {
    console.info('[push] Firebase not configured on the frontend — skipping push setup.');
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messagingInstance, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.warn('[push] Could not obtain push token:', err.message);
    return null;
  }
}

/**
 * Listens for push messages that arrive while the app tab is in the
 * foreground (background messages are handled by the service worker).
 */
export function onForegroundPush(callback) {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return () => {};
  return onMessage(messagingInstance, callback);
}

export { isFirebaseConfigured };
