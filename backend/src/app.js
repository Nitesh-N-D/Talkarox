import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import whiteboardRoutes from './routes/whiteboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import pushRoutes from './routes/pushRoutes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authLimiter, generalLimiter, aiLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' })); // generous limit to allow base64 whiteboard images
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/schools', generalLimiter, schoolRoutes);
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/messages', generalLimiter, messageRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/appointments', generalLimiter, appointmentRoutes);
app.use('/api/announcements', generalLimiter, announcementRoutes);
app.use('/api/whiteboard', generalLimiter, whiteboardRoutes);
app.use('/api/uploads', generalLimiter, uploadRoutes);
app.use('/api/push', generalLimiter, pushRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
