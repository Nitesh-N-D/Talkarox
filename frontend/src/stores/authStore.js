import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  loginUser,
  registerUser,
  googleAuth,
  logoutUser,
  getProfile,
  updateUserStatus,
} from '../services/api';
import { connectSocket, disconnectSocket, emitUserOnline } from '../services/socket';
import { requestPushPermissionAndToken } from '../services/push';
import { registerPushToken } from '../services/api';

function setupPushNotifications() {
  // Fire-and-forget: push setup should never block or fail the login flow.
  requestPushPermissionAndToken()
    .then((token) => {
      if (token) return registerPushToken(token);
    })
    .catch(() => {});
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await loginUser(credentials);
          localStorage.setItem('talkarox_token', data.accessToken);
          localStorage.setItem('talkarox_refresh_token', data.refreshToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          connectSocket(data.accessToken);
          emitUserOnline(data.user.id, 'ONLINE');
          setupPushNotifications();
          return { success: true, user: data.user };
        } catch (err) {
          const message = err.response?.data?.error || 'Unable to sign in. Check your details and try again.';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      loginWithGoogle: async (idToken, role) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await googleAuth(idToken, role);
          localStorage.setItem('talkarox_token', data.accessToken);
          localStorage.setItem('talkarox_refresh_token', data.refreshToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          connectSocket(data.accessToken);
          emitUserOnline(data.user.id, 'ONLINE');
          setupPushNotifications();
          return { success: true, user: data.user, isNewUser: data.isNewUser };
        } catch (err) {
          const message = err.response?.data?.error || 'Google sign-in failed. Please try again.';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await registerUser(payload);
          set({ isLoading: false });
          return { success: true, data };
        } catch (err) {
          const message = err.response?.data?.error || 'Registration failed. Please try again.';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        const userId = get().user?.id;
        try {
          if (userId) await updateUserStatus(userId, 'OFFLINE');
          await logoutUser();
        } catch {
          // proceed with local logout regardless
        }
        disconnectSocket();
        localStorage.removeItem('talkarox_token');
        localStorage.removeItem('talkarox_refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      hydrateSession: async () => {
        const token = localStorage.getItem('talkarox_token');
        if (!token) return;
        set({ isLoading: true });
        try {
          const { data } = await getProfile();
          set({ user: data, accessToken: token, isAuthenticated: true, isLoading: false });
          connectSocket(token);
          emitUserOnline(data.id, 'ONLINE');
          setupPushNotifications();
        } catch {
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'talkarox-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);