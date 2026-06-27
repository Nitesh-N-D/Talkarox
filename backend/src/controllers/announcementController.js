import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { sendEmergencyBroadcastEmail } from '../services/emailService.js';
import { sendPushToSchool } from '../services/pushService.js';

export async function createAnnouncement(req, res, next) {
  try {
    const authorId = req.userId;
    const { schoolId, title, content, type = 'INFO', target = 'SCHOOL_WIDE', pinned = false } = req.body;
    if (!schoolId || !title || !content) throw new ApiError(400, 'schoolId, title, and content are required');

    const { rows } = await pool.query(
      `INSERT INTO announcements (school_id, author_id, title, content, type, target, pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [schoolId, authorId, title, content, type, target, pinned]
    );

    sendPushToSchool(schoolId, {
      title: `📢 ${title}`,
      body: content.length > 100 ? `${content.slice(0, 100)}…` : content,
      data: { type: 'announcement', announcementId: rows[0].id },
    }).catch(() => {});

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncementFeed(req, res, next) {
  try {
    const { schoolId } = req.query;
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.content, a.type, a.target, a.pinned, a.created_at AS "createdAt",
              (SELECT COUNT(*) FROM announcement_reads ar JOIN users u ON u.id = ar.user_id WHERE ar.announcement_id = a.id AND u.role = 'PARENT') AS "readByParents",
              (SELECT COUNT(*) FROM announcement_reads ar JOIN users u ON u.id = ar.user_id WHERE ar.announcement_id = a.id AND u.role = 'STUDENT') AS "readByStudents"
       FROM announcements a
       WHERE a.school_id = $1 AND a.archived = false
       ORDER BY a.pinned DESC, a.created_at DESC
       LIMIT 50`,
      [schoolId]
    );
    res.json(rows.map((r) => ({ ...r, readByParents: Number(r.readByParents), readByStudents: Number(r.readByStudents) })));
  } catch (err) {
    next(err);
  }
}

export async function archiveAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE announcements SET archived = true WHERE id = $1', [id]);
    res.json({ message: 'Archived' });
  } catch (err) {
    next(err);
  }
}

export async function triggerEmergencyBroadcast(req, res, next) {
  try {
    const authorId = req.userId;
    const { schoolId, title, message } = req.body;
    if (!schoolId || !title || !message) throw new ApiError(400, 'schoolId, title, and message are required');

    const { rows } = await pool.query(
      `INSERT INTO announcements (school_id, author_id, title, content, type, target, pinned, is_emergency)
       VALUES ($1, $2, $3, $4, 'URGENT', 'SCHOOL_WIDE', true, true) RETURNING *`,
      [schoolId, authorId, title, message]
    );

    // Fire-and-forget email + push fanout to every user in the school
    const { rows: recipients } = await pool.query('SELECT email FROM users WHERE school_id = $1', [schoolId]);
    Promise.all(recipients.map((r) => sendEmergencyBroadcastEmail(r.email, title, message).catch(() => {})));
    sendPushToSchool(schoolId, {
      title: `🚨 ${title}`,
      body: message,
      data: { type: 'emergency', announcementId: rows[0].id },
    }).catch(() => {});

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function resolveEmergencyBroadcast(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE announcements SET resolved_at = now() WHERE id = $1', [id]);
    res.json({ message: 'Resolved' });
  } catch (err) {
    next(err);
  }
}
