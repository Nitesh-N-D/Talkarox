import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getChats, getMessageThread, getContactContext, sendMessage, searchMessages, markMessageRead,
} from '../controllers/messageController.js';

const router = Router();

router.get('/chats', verifyToken, getChats);
router.get('/search', verifyToken, searchMessages);
router.get('/contact/:contactId', verifyToken, getContactContext);
router.get('/thread/:recipientId', verifyToken, getMessageThread);
router.post('/send', verifyToken, sendMessage);
router.put('/:messageId/read', verifyToken, markMessageRead);

export default router;
