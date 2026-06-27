import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { saveWhiteboard, getWhiteboard } from '../controllers/whiteboardController.js';

const router = Router();

router.post('/save', verifyToken, saveWhiteboard);
router.get('/:id', verifyToken, getWhiteboard);

export default router;
