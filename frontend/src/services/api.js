import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('talkarox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('talkarox_refresh_token');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/refresh-token`,
          { refreshToken }
        );
        localStorage.setItem('talkarox_token', data.accessToken);
        refreshQueue.forEach((p) => p.resolve(data.accessToken));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(refreshError));
        refreshQueue = [];
        localStorage.removeItem('talkarox_token');
        localStorage.removeItem('talkarox_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;

// ---- Auth ----
export const registerUser = (payload) => API.post('/auth/register', payload);
export const loginUser = (payload) => API.post('/auth/login', payload);
export const googleAuth = (idToken) => API.post('/auth/google', { idToken });
export const logoutUser = () => API.post('/auth/logout');
export const verifyEmail = (token) => API.post('/auth/verify-email', { token });
export const requestPasswordReset = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => API.post('/auth/reset-password', { token, password });

// ---- Schools ----
export const registerSchool = (payload) => API.post('/schools/register', payload);
export const searchSchools = (query) => API.get('/schools/search', { params: { query } });
export const getSchool = (id) => API.get(`/schools/${id}`);
export const updateSchoolSettings = (id, payload) => API.put(`/schools/${id}/settings`, payload);
export const getSchoolDashboardStats = (id) => API.get(`/schools/${id}/stats`);
export const inviteStaff = (schoolId, email) => API.post(`/schools/${schoolId}/invite`, { email });

// ---- Users ----
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (payload) => API.put('/users/profile', payload);
export const searchTeachers = (query, schoolId) =>
  API.get('/users/teachers', { params: { query, schoolId } });
export const updateUserStatus = (userId, status, presenceLabel) =>
  API.put(`/users/${userId}/status`, { status, presenceLabel });
export const getUserAvailability = (userId) => API.get(`/users/${userId}/availability`);
export const setOfficeHours = (userId, slots) => API.put(`/users/${userId}/office-hours`, { slots });
export const getLeaderboard = (schoolId) => API.get('/users/leaderboard', { params: { schoolId } });

// ---- Messages ----
export const getChats = () => API.get('/messages/chats');
export const getContactContext = (contactId) => API.get(`/messages/contact/${contactId}`);
export const getMessageThread = (recipientId, studentId) =>
  API.get(`/messages/thread/${recipientId}`, { params: { studentId } });
export const sendMessage = (payload) => API.post('/messages/send', payload);
export const searchMessages = (query) => API.get('/messages/search', { params: { query } });
export const markMessageRead = (messageId) => API.put(`/messages/${messageId}/read`);

// ---- AI ----
export const categorizeMessage = (content) => API.post('/ai/categorize-message', { content });
export const translateMessage = (text, targetLanguage) =>
  API.post('/ai/translate-message', { text, targetLanguage });
export const getHomeworkHelp = (question, imageBase64) =>
  API.post('/ai/homework-help', { question, imageBase64 });
export const getWeeklyDigest = (userId) => API.get(`/ai/weekly-digest/${userId}`);

// ---- Appointments ----
export const requestAppointment = (payload) => API.post('/appointments/request', payload);
export const getAvailableSlots = (teacherId, date) =>
  API.get('/appointments/available-slots', { params: { teacherId, date } });
export const confirmAppointment = (id) => API.put(`/appointments/${id}/confirm`);
export const cancelAppointment = (id) => API.put(`/appointments/${id}/cancel`);
export const getMyAppointments = () => API.get('/appointments/mine');

// ---- Announcements ----
export const createAnnouncement = (payload) => API.post('/announcements/create', payload);
export const getAnnouncementFeed = (schoolId) =>
  API.get('/announcements/feed', { params: { schoolId } });
export const archiveAnnouncement = (id) => API.put(`/announcements/${id}/archive`);
export const triggerEmergencyBroadcast = (payload) => API.post('/announcements/emergency', payload);
export const resolveEmergencyBroadcast = (id) => API.put(`/announcements/${id}/resolve`);

// ---- Whiteboard ----
export const saveWhiteboard = (payload) => API.post('/whiteboard/save', payload);
export const getWhiteboard = (id) => API.get(`/whiteboard/${id}`);

// ---- Uploads ----
export const getStorageStatus = () => API.get('/uploads/status');
export const uploadAvatar = (formData) =>
  API.post('/uploads/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadAttachment = (formData, onUploadProgress) =>
  API.post('/uploads/attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
export const uploadWhiteboardImage = (imageData) => API.post('/uploads/whiteboard-image', { imageData });

// ---- Push notifications ----
export const getPushStatus = () => API.get('/push/status');
export const registerPushToken = (token, platform = 'web') =>
  API.post('/push/register-token', { token, platform });
export const unregisterPushToken = (token) => API.post('/push/unregister-token', { token });
