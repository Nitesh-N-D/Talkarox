import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ---- Emit helpers ----
export const emitUserOnline = (userId, status) =>
  socket?.emit('user_online', { userId, status });

export const emitTyping = (recipientId, typing) =>
  socket?.emit('typing', { recipientId, typing });

export const emitMessageRead = (messageId, senderId) =>
  socket?.emit('message_read', { messageId, senderId });

export const emitSendMessage = (payload) => socket?.emit('send_message', payload);

export const emitJoinAppointment = (appointmentId) =>
  socket?.emit('join_appointment', { appointmentId });

export const emitWhiteboardDraw = (roomId, strokeData) =>
  socket?.emit('whiteboard_draw', { roomId, strokeData });

export const emitEmergencyBroadcast = (schoolId, payload) =>
  socket?.emit('emergency_broadcast', { schoolId, ...payload });
