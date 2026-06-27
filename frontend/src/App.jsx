import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useEffect, Suspense, lazy } from 'react';
import { onForegroundPush } from './services/push';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SchoolSetupPage = lazy(() => import('./pages/SchoolSetupPage'));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'));
const TourPage = lazy(() => import('./pages/TourPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const SchoolAdminPage = lazy(() => import('./pages/SchoolAdminPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

import AppLayout from './components/common/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    const unsubscribe = onForegroundPush((payload) => {
      const { title, body } = payload.notification || {};
      if (title) toast(body ? `${title} — ${body}` : title, { icon: '🔔' });
    });
    return unsubscribe;
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 12px 24px rgba(15,23,42,0.10)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
          }}
        />
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Onboarding (authenticated but pre-app-shell) */}
            <Route path="/onboarding/school" element={<SchoolSetupPage />} />
            <Route path="/onboarding/profile" element={<ProfileSetupPage />} />
            <Route path="/onboarding/tour" element={<TourPage />} />

            {/* App shell (protected) */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/school"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SchoolAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="h-10 w-10 rounded-full border-[3px] border-brand/20 border-t-brand animate-spin" />
    </div>
  );
}
