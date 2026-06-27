import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const userSockets = new Map(); // userId -> Set of socket ids (supports multiple tabs/devices)

export function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.schoolId = decoded.schoolId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, schoolId } = socket;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    if (schoolId) socket.join(`school:${schoolId}`);
    socket.join(`user:${userId}`);

    socket.on('user_online', async ({ status = 'ONLINE' }) => {
      await pool.query('UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2', [status, userId]).catch(() => {});
      broadcastPresence(io, userId, status);
    });

    socket.on('typing', ({ recipientId, typing }) => {
      io.to(`user:${recipientId}`).emit('typing_indicator', { recipientId: userId, typing });
    });

    socket.on('send_message', (message) => {
      io.to(`user:${message.recipientId}`).emit('new_message', message);
    });

    socket.on('message_read', ({ messageId, senderId }) => {
      io.to(`user:${senderId}`).emit('message_read_receipt', { messageId });
    });

    socket.on('join_appointment', ({ appointmentId }) => {
      socket.join(`appointment:${appointmentId}`);
    });

    socket.on('whiteboard_draw', ({ roomId, strokeData }) => {
      socket.to(`appointment:${roomId}`).emit('whiteboard_draw', strokeData);
    });

    socket.on('emergency_broadcast', (payload) => {
      io.to(`school:${payload.schoolId}`).emit('emergency_broadcast', payload);
    });

    socket.on('disconnect', async () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          await pool.query('UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2', ['OFFLINE', userId]).catch(() => {});
          broadcastPresence(io, userId, 'OFFLINE');
        }
      }
    });
  });

  return io;
}

function broadcastPresence(io, userId, status) {
  io.emit('user_status_changed', { userId, status });
}
