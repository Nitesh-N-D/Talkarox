import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { uploadFile, BUCKETS, isStorageConfigured } from '../services/storageService.js';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      throw new ApiError(400, 'Avatar must be a JPEG, PNG, WebP, or GIF image');
    }
    if (req.file.size > MAX_AVATAR_SIZE) {
      throw new ApiError(400, 'Avatar image must be under 5MB');
    }
    if (!isStorageConfigured()) {
      throw new ApiError(503, 'File storage isn\u2019t set up on this server yet. See SETUP_GUIDE.md (section 5) to enable photo uploads.');
    }

    const ext = req.file.mimetype.split('/')[1];
    const path = `user-${req.userId}/avatar-${Date.now()}.${ext}`;

    const publicUrl = await uploadFile({
      bucket: BUCKETS.AVATARS,
      path,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [publicUrl, req.userId]);

    res.json({ avatarUrl: publicUrl });
  } catch (err) {
    next(err);
  }
}

export async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    if (req.file.size > MAX_ATTACHMENT_SIZE) {
      throw new ApiError(400, 'File must be under 15MB');
    }
    if (!isStorageConfigured()) {
      throw new ApiError(503, 'File storage isn\u2019t set up on this server yet. See SETUP_GUIDE.md (section 5) to enable file attachments.');
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `user-${req.userId}/${Date.now()}-${safeName}`;

    const publicUrl = await uploadFile({
      bucket: BUCKETS.ATTACHMENTS,
      path,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    res.json({
      fileUrl: publicUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadWhiteboardImage(req, res, next) {
  try {
    const { imageData } = req.body; // base64 data URL from the canvas
    if (!imageData) throw new ApiError(400, 'imageData is required');
    if (!isStorageConfigured()) {
      throw new ApiError(503, 'File storage isn\u2019t set up on this server yet. See SETUP_GUIDE.md (section 5) to enable saving sketches.');
    }

    const matches = imageData.match(/^data:image\/(png|jpeg);base64,(.+)$/);
    if (!matches) throw new ApiError(400, 'Invalid image data format');

    const buffer = Buffer.from(matches[2], 'base64');
    const path = `user-${req.userId}/${uuidv4()}.png`;

    const publicUrl = await uploadFile({
      bucket: BUCKETS.WHITEBOARDS,
      path,
      buffer,
      contentType: `image/${matches[1]}`,
    });

    res.json({ imageUrl: publicUrl });
  } catch (err) {
    next(err);
  }
}

export function getStorageStatus(req, res) {
  res.json({ configured: isStorageConfigured() });
}
