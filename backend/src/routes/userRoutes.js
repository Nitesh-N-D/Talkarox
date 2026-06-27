import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getProfile, updateProfile, searchTeachers, updateUserStatus,
  getUserAvailability, setOfficeHours, getLeaderboard,
} from '../controllers/userController.js';

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/teachers', verifyToken, searchTeachers);
router.get('/leaderboard', verifyToken, getLeaderboard);
router.put('/:userId/status', verifyToken, updateUserStatus);
router.get('/:userId/availability', verifyToken, getUserAvailability);
router.put('/:userId/office-hours', verifyToken, setOfficeHours);

export default router;
