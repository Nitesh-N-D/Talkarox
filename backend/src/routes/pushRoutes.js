import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { registerToken, unregisterToken, getPushStatus } from '../controllers/pushController.js';

const router = Router();

router.get('/status', getPushStatus);
router.post('/register-token', verifyToken, registerToken);
router.post('/unregister-token', verifyToken, unregisterToken);

export default router;
