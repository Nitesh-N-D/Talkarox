import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  registerSchool, searchSchools, getSchool, updateSchoolSettings, getSchoolDashboardStats, inviteStaff,
} from '../controllers/schoolController.js';

const router = Router();

router.post('/register', verifyToken, registerSchool);
router.get('/search', searchSchools);
router.get('/:id', getSchool);
router.put('/:id/settings', verifyToken, updateSchoolSettings);
router.get('/:id/stats', verifyToken, getSchoolDashboardStats);
router.post('/:id/invite', verifyToken, requireRole('ADMIN'), inviteStaff);

export default router;
