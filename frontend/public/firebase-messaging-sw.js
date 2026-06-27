// Firebase Cloud Messaging service worker.
// This file MUST be served from the site root (not bundled by Vite) because
// browsers only allow service workers to control pages at or below their own
// path — that's why it lives in /public rather than /src.
//
// Note: service workers can't read import.meta.env, so the Firebase config
// values are injected as plain literals below. Replace these with your real
// values from the Firebase Console (the same ones used in your frontend
// .env file) before deploying. These values are not secret — they're
// designed to be public, client-side identifiers.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDQ-3U0mKOYL8NQt2bVjJl4UK5Q5pgMUPI',
  projectId: 'talkarox-45959',
  messagingSenderId: '812521077241',
  appId: '1:812521077241:web:041fc586262aa75a416528',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Talkarox', {
    body: body || 'You have a new notification.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.type === 'emergency' ? '/announcements' : '/chat';
  event.waitUntil(clients.openWindow(targetUrl));
});
