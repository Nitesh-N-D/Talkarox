import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  categorizeMessageHandler, translateMessageHandler, homeworkHelpHandler, weeklyDigestHandler,
} from '../controllers/aiController.js';

const router = Router();

router.post('/categorize-message', verifyToken, categorizeMessageHandler);
router.post('/translate-message', verifyToken, translateMessageHandler);
router.post('/homework-help', verifyToken, homeworkHelpHandler);
router.get('/weekly-digest/:userId', verifyToken, weeklyDigestHandler);

export default router;
