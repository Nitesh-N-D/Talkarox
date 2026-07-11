import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const userSockets = new Map(); // userId -> Set of socket ids

export function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    },
  });

  // Auth middleware — verify JWT on every socket connection
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

    // Track all sockets for this user (supports multiple tabs/devices)
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Join personal room and school room
    socket.join(`user:${userId}`);
    if (schoolId) socket.join(`school:${schoolId}`);

    // ── Presence ──
    socket.on('user_online', async ({ status = 'ONLINE' } = {}) => {
      await pool.query(
        'UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2',
        [status, userId]
      ).catch(() => {});
      // Broadcast presence change to everyone
      io.emit('user_status_changed', { userId, status });
    });

    // ── Typing indicator ──
    socket.on('typing', ({ recipientId, typing }) => {
      io.to(`user:${recipientId}`).emit('typing_indicator', {
        recipientId: userId,
        typing,
      });
    });

    // ── New message (real-time relay) ──
    socket.on('send_message', (message) => {
      io.to(`user:${message.recipientId}`).emit('new_message', message);
    });

    // ── Read receipt ──
    // The RECIPIENT calls this when they open a thread / a message arrives.
    // We forward it to the SENDER so their bubble updates from ✓ → ✓✓ (blue).
    socket.on('message_read', ({ messageId, senderId }) => {
      if (!messageId || !senderId) return;
      // Emit to the sender's personal room — works even if they have multiple tabs open
      io.to(`user:${senderId}`).emit('message_read_receipt', { messageId });
    });

    // ── Whiteboard (collaborative drawing in appointment room) ──
    socket.on('join_appointment', ({ appointmentId }) => {
      socket.join(`appointment:${appointmentId}`);
    });

    socket.on('whiteboard_draw', ({ roomId, strokeData }) => {
      socket.to(`appointment:${roomId}`).emit('whiteboard_draw', strokeData);
    });

    // ── Emergency broadcast (admin only — relay to whole school) ──
    socket.on('emergency_broadcast', (payload) => {
      io.to(`school:${payload.schoolId}`).emit('emergency_broadcast', payload);
    });

    // ── Disconnect ──
    socket.on('disconnect', async () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          // Last tab/device closed — mark offline
          userSockets.delete(userId);
          await pool.query(
            'UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2',
            ['OFFLINE', userId]
          ).catch(() => {});
          io.emit('user_status_changed', { userId, status: 'OFFLINE' });
        }
      }
    });
  });

  return io;
}