import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function saveWhiteboard(req, res, next) {
  try {
    const createdBy = req.userId;
    const { messageId, imageData } = req.body;
    if (!imageData) throw new ApiError(400, 'imageData is required');

    const { rows } = await pool.query(
      'INSERT INTO whiteboards (message_id, created_by, image_data) VALUES ($1, $2, $3) RETURNING id, created_at',
      [messageId || null, createdBy, imageData]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getWhiteboard(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM whiteboards WHERE id = $1', [id]);
    if (rows.length === 0) throw new ApiError(404, 'Whiteboard not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}
