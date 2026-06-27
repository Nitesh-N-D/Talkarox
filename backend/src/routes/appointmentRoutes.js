import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAvailableSlots, requestAppointment, confirmAppointment, cancelAppointment, getMyAppointments,
} from '../controllers/appointmentController.js';

const router = Router();

router.get('/available-slots', verifyToken, getAvailableSlots);
router.get('/mine', verifyToken, getMyAppointments);
router.post('/request', verifyToken, requestAppointment);
router.put('/:id/confirm', verifyToken, confirmAppointment);
router.put('/:id/cancel', verifyToken, cancelAppointment);

export default router;
