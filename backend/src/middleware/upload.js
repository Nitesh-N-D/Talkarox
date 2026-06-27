import multer from 'multer';

// Memory storage: we forward the buffer straight to Supabase Storage rather
// than writing to local disk, since the server filesystem isn't persistent
// across deploys on free hosting tiers like Render.
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB hard ceiling; controllers enforce tighter per-type limits
});
