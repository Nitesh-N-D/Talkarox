import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { categorizeMessage } from '../services/aiService.js';
import { sendPushToUser } from '../services/pushService.js';
import { avgResponseMinutesSubquery } from '../utils/responseTime.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getChats(req, res, next) {
  try {
    const userId = req.userId;
    // Distinct conversation partners ordered by most recent message
    const { rows } = await pool.query(
      `WITH thread AS (
        SELECT
          CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_user_id,
          content, category, created_at, sender_id,
          ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END
            ORDER BY created_at DESC
          ) AS rn
        FROM messages
        WHERE sender_id = $1 OR recipient_id = $1
      )
      SELECT
        u.id AS "userId", u.full_name AS "name", u.status, u.avatar_url AS "avatarUrl",
        t.content AS "lastMessage", t.category AS "lastCategory", t.created_at AS "lastMessageTime",
        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND recipient_id = $1 AND read_at IS NULL) AS "unreadCount"
      FROM thread t
      JOIN users u ON u.id = t.other_user_id
      WHERE t.rn = 1
      ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json(rows.map((r) => ({ ...r, unreadCount: Number(r.unreadCount) })));
  } catch (err) {
    next(err);
  }
}

export async function getMessageThread(req, res, next) {
  try {
    const userId = req.userId;
    const { recipientId } = req.params;
    const { studentId } = req.query;

    let sql = `
      SELECT id, sender_id AS "senderId", recipient_id AS "recipientId", content,
             message_type AS "messageType", file_url AS "fileUrl", category,
             read_at AS "readAt", created_at AS "createdAt"
      FROM messages
      WHERE ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))`;
    const params = [userId, recipientId];

    if (studentId) {
      sql += ' AND student_id = $3';
      params.push(studentId);
    }
    sql += ' ORDER BY created_at ASC LIMIT 200';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getContactContext(req, res, next) {
  try {
    const userId = req.userId;
    const { contactId } = req.params;

    const [contactRows, officeHoursRows, responseTimeRows, sharedFilesRows] = await Promise.all([
      pool.query(
        `SELECT id, full_name AS "fullName", role, bio, status, avatar_url AS "avatarUrl"
         FROM users WHERE id = $1`,
        [contactId]
      ),
      pool.query(
        `SELECT day_of_week AS "dayOfWeek", start_time AS "startTime", end_time AS "endTime", available_for AS "availableFor"
         FROM office_hours WHERE teacher_id = $1 ORDER BY day_of_week`,
        [contactId]
      ),
      pool.query(`SELECT (${avgResponseMinutesSubquery('$1')}) AS avg_minutes`, [contactId]),
      // Real shared files: any message in this specific thread that carries a file_url
      pool.query(
        `SELECT file_url AS url, content AS name, created_at AS "createdAt"
         FROM messages
         WHERE file_url IS NOT NULL
           AND ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))
         ORDER BY created_at DESC LIMIT 20`,
        [userId, contactId]
      ),
    ]);

    if (contactRows.length === 0) throw new ApiError(404, 'Contact not found');
    const contact = contactRows[0];

    res.json({
      ...contact,
      officeHours: officeHoursRows.rows.map((slot) => ({ ...slot, day: DAY_NAMES[slot.dayOfWeek] })),
      avgResponseMinutes: responseTimeRows.rows[0]?.avg_minutes != null ? Math.round(responseTimeRows.rows[0].avg_minutes) : null,
      sharedFiles: sharedFilesRows.rows,
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const senderId = req.userId;
    const { recipientId, content, studentId, messageType = 'TEXT', fileUrl } = req.body;

    if (!recipientId || !content) throw new ApiError(400, 'recipientId and content are required');

    const { category, confidence } = await categorizeMessage(content);

    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, student_id, content, message_type, file_url, category, category_confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, sender_id AS "senderId", recipient_id AS "recipientId", content,
                 message_type AS "messageType", file_url AS "fileUrl", category, read_at AS "readAt", created_at AS "createdAt"`,
      [senderId, recipientId, studentId || null, content, messageType, fileUrl || null, category, confidence]
    );

    // Push notification is fire-and-forget — a slow or unconfigured push
    // provider should never delay or break message sending.
    pool.query('SELECT full_name FROM users WHERE id = $1', [senderId])
      .then(({ rows: senderRows }) => {
        sendPushToUser(recipientId, {
          title: senderRows[0]?.full_name || 'New message',
          body: content.length > 80 ? `${content.slice(0, 80)}…` : content,
          data: { type: 'message', senderId },
        }).catch(() => {});
      })
      .catch(() => {});

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function searchMessages(req, res, next) {
  try {
    const userId = req.userId;
    const { query: q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const { rows } = await pool.query(
      `SELECT m.id, m.content, m.created_at AS "createdAt", u.full_name AS "senderName"
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 OR m.recipient_id = $1)
         AND to_tsvector('english', m.content) @@ to_tsquery('english', $2)
       ORDER BY m.created_at DESC LIMIT 30`,
      [userId, q.trim().split(/\s+/).join(' & ')]
    );
    res.json(rows);
  } catch (err) {
    // Fall back to simple ILIKE if tsquery syntax fails on punctuation etc.
    try {
      const { rows } = await pool.query(
        `SELECT m.id, m.content, m.created_at AS "createdAt", u.full_name AS "senderName"
         FROM messages m JOIN users u ON u.id = m.sender_id
         WHERE (m.sender_id = $1 OR m.recipient_id = $1) AND m.content ILIKE $2
         ORDER BY m.created_at DESC LIMIT 30`,
        [req.userId, `%${req.query.query}%`]
      );
      res.json(rows);
    } catch (fallbackErr) {
      next(fallbackErr);
    }
  }
}

export async function markMessageRead(req, res, next) {
  try {
    const { messageId } = req.params;
    await pool.query('UPDATE messages SET read_at = now() WHERE id = $1 AND read_at IS NULL', [messageId]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}
