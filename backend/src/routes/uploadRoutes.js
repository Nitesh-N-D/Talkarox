import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import {
  uploadAvatar, uploadAttachment, uploadWhiteboardImage, getStorageStatus,
} from '../controllers/uploadController.js';

const router = Router();

router.get('/status', getStorageStatus);
router.post('/avatar', verifyToken, uploadMiddleware.single('file'), uploadAvatar);
router.post('/attachment', verifyToken, uploadMiddleware.single('file'), uploadAttachment);
router.post('/whiteboard-image', verifyToken, uploadWhiteboardImage);

export default router;
