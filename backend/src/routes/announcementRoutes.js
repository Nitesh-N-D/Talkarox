import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  createAnnouncement, getAnnouncementFeed, archiveAnnouncement,
  triggerEmergencyBroadcast, resolveEmergencyBroadcast,
} from '../controllers/announcementController.js';

const router = Router();

router.get('/feed', verifyToken, getAnnouncementFeed);
router.post('/create', verifyToken, requireRole('ADMIN', 'TEACHER'), createAnnouncement);
router.put('/:id/archive', verifyToken, requireRole('ADMIN', 'TEACHER'), archiveAnnouncement);
router.post('/emergency', verifyToken, requireRole('ADMIN'), triggerEmergencyBroadcast);
router.put('/:id/resolve', verifyToken, requireRole('ADMIN'), resolveEmergencyBroadcast);

export default router;
