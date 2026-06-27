import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { avgResponseMinutesSubquery } from '../utils/responseTime.js';
import { sendStaffInviteEmail } from '../services/emailService.js';

export async function registerSchool(req, res, next) {
  try {
    const { name, address } = req.body;
    if (!name?.trim()) throw new ApiError(400, 'School name is required');

    const { rows } = await pool.query(
      'INSERT INTO schools (name, address, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), address || null, req.userId || null]
    );

    if (req.userId) {
      await pool.query('UPDATE users SET school_id = $1, role = $2 WHERE id = $3', [rows[0].id, 'ADMIN', req.userId]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function searchSchools(req, res, next) {
  try {
    const { query: q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const { rows } = await pool.query(
      `SELECT id, name, address FROM schools
       WHERE name ILIKE $1
       ORDER BY name ASC LIMIT 10`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getSchool(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);
    if (rows.length === 0) throw new ApiError(404, 'School not found');

    const { rows: teachers } = await pool.query(
      `SELECT id, full_name AS "fullName", email, bio, status, avatar_url AS "avatarUrl"
       FROM users WHERE school_id = $1 AND role = 'TEACHER' ORDER BY full_name`,
      [id]
    );

    res.json({ ...rows[0], teachers });
  } catch (err) {
    next(err);
  }
}

export async function updateSchoolSettings(req, res, next) {
  try {
    const { id } = req.params;
    const { name, address, logoUrl } = req.body;
    const { rows } = await pool.query(
      `UPDATE schools SET name = COALESCE($1, name), address = COALESCE($2, address), logo_url = COALESCE($3, logo_url)
       WHERE id = $4 RETURNING *`,
      [name, address, logoUrl, id]
    );
    if (rows.length === 0) throw new ApiError(404, 'School not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function inviteStaff(req, res, next) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email?.trim()) throw new ApiError(400, 'Email is required');

    const { rows: schoolRows } = await pool.query('SELECT name FROM schools WHERE id = $1', [id]);
    if (schoolRows.length === 0) throw new ApiError(404, 'School not found');

    const existing = await pool.query('SELECT id, school_id FROM users WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0 && existing.rows[0].school_id === id) {
      throw new ApiError(409, 'This person is already part of your school');
    }

    const inviteLink = `${process.env.FRONTEND_URL}/register?school=${id}`;
    const result = await sendStaffInviteEmail(email.trim(), schoolRows[0].name, inviteLink);

    if (result?.skipped) {
      return res.json({
        message: `Email sending isn't configured yet, so no email actually went out. Share this link with ${email} directly: ${inviteLink}`,
        emailSent: false,
        inviteLink,
      });
    }

    res.json({ message: `Invitation sent to ${email}`, emailSent: true });
  } catch (err) {
    next(err);
  }
}

export async function getSchoolDashboardStats(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.userId; // person-specific metrics (active chats, unread, response time) are scoped to whoever is asking

    const [
      teacherCount, parentCount, studentCount, weeklyMessages, onlineCount, pendingApprovals,
      activeChatsThisWeek, activeChatsLastWeek, unreadMessages, myResponseTime, recentChats,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'TEACHER'`, [id]),
      pool.query(`SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'PARENT'`, [id]),
      pool.query(`SELECT COUNT(*) FROM students WHERE school_id = $1`, [id]),
      pool.query(
        `SELECT COUNT(*) FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE u.school_id = $1 AND m.created_at > now() - interval '7 days'`,
        [id]
      ),
      pool.query(`SELECT COUNT(*) FROM users WHERE school_id = $1 AND status = 'ONLINE'`, [id]),
      pool.query(`SELECT COUNT(*) FROM appointments a JOIN users u ON a.teacher_id = u.id WHERE u.school_id = $1 AND a.status = 'PENDING'`, [id]),

      // Distinct conversation partners this user has exchanged messages with, this week vs last week
      pool.query(
        `SELECT COUNT(DISTINCT CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END) AS count
         FROM messages
         WHERE (sender_id = $1 OR recipient_id = $1) AND created_at > now() - interval '7 days'`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END) AS count
         FROM messages
         WHERE (sender_id = $1 OR recipient_id = $1)
           AND created_at > now() - interval '14 days' AND created_at <= now() - interval '7 days'`,
        [userId]
      ),

      // Messages sent TO this user that they haven't read yet
      pool.query(`SELECT COUNT(*) AS count FROM messages WHERE recipient_id = $1 AND read_at IS NULL`, [userId]),

      // This user's actual average response time, computed live from real
      // message timestamps via the shared helper (see utils/responseTime.js)
      pool.query(`SELECT (${avgResponseMinutesSubquery('$1')}) AS avg_minutes`, [userId]),

      // This user's 5 most recent conversation threads, for the dashboard preview list
      pool.query(
        `WITH thread AS (
          SELECT
            CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_user_id,
            content, created_at,
            ROW_NUMBER() OVER (
              PARTITION BY CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END
              ORDER BY created_at DESC
            ) AS rn
          FROM messages
          WHERE sender_id = $1 OR recipient_id = $1
        )
        SELECT u.id, u.full_name AS name, u.status,
               t.content AS "lastMessage",
               (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND recipient_id = $1 AND read_at IS NULL) AS unread
        FROM thread t JOIN users u ON u.id = t.other_user_id
        WHERE t.rn = 1
        ORDER BY t.created_at DESC LIMIT 5`,
        [userId]
      ),
    ]);

    const thisWeekChats = Number(activeChatsThisWeek.rows[0].count);
    const lastWeekChats = Number(activeChatsLastWeek.rows[0].count);
    // Percentage change vs last week. When last week was zero, there's no
    // meaningful percentage to compute — report null rather than a
    // divide-by-zero artifact (e.g. a fake "+100%").
    const activeChatsTrend = lastWeekChats > 0
      ? Math.round(((thisWeekChats - lastWeekChats) / lastWeekChats) * 100)
      : null;

    res.json({
      teacherCount: Number(teacherCount.rows[0].count),
      parentCount: Number(parentCount.rows[0].count),
      studentCount: Number(studentCount.rows[0].count),
      weeklyMessages: Number(weeklyMessages.rows[0].count),
      onlineCount: Number(onlineCount.rows[0].count),
      pendingApprovals: Number(pendingApprovals.rows[0].count),
      activeChats: thisWeekChats,
      activeChatsTrend,
      unreadMessages: Number(unreadMessages.rows[0].count),
      avgResponseMinutes: myResponseTime.rows[0]?.avg_minutes != null ? Math.round(myResponseTime.rows[0].avg_minutes) : null,
      recentChats: recentChats.rows.map((r) => ({ id: r.id, name: r.name, status: r.status, lastMessage: r.lastMessage, unread: Number(r.unread) })),
    });
  } catch (err) {
    next(err);
  }
}
