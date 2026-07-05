import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { sanitizeUser } from './authController.js';
import { avgResponseMinutesSubquery } from '../utils/responseTime.js';

export async function getProfile(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (rows.length === 0) throw new ApiError(404, 'User not found');

    const officeHours = await pool.query(
      `SELECT day_of_week AS "dayOfWeek", start_time AS "startTime", end_time AS "endTime", available_for AS "availableFor"
       FROM office_hours WHERE teacher_id = $1 ORDER BY day_of_week`,
      [req.userId]
    );

    res.json({ ...sanitizeUser(rows[0]), officeHours: officeHours.rows });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { fullName, bio, schoolId, onboardingComplete, preferredLanguage, avatarUrl, role } = req.body;

    // Validate role if provided
    const validRoles = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
    const safeRole = role && validRoles.includes(role) ? role : null;

    const { rows } = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        bio = COALESCE($2, bio),
        school_id = COALESCE($3, school_id),
        onboarding_complete = COALESCE($4, onboarding_complete),
        preferred_language = COALESCE($5, preferred_language),
        avatar_url = COALESCE($6, avatar_url),
        role = COALESCE($7, role)
       WHERE id = $8 RETURNING *`,
      [fullName, bio, schoolId, onboardingComplete, preferredLanguage, avatarUrl, safeRole, req.userId]
    );
    if (rows.length === 0) throw new ApiError(404, 'User not found');
    res.json(sanitizeUser(rows[0]));
  } catch (err) {
    next(err);
  }
}

export async function searchTeachers(req, res, next) {
  try {
    const { query: q, schoolId: querySchoolId } = req.query;
    // Use schoolId from query param, fall back to the requesting user's own schoolId
    // (decoded from JWT by the auth middleware and set on req.schoolId)
    const effectiveSchoolId = querySchoolId || req.schoolId;

    if (!effectiveSchoolId) {
      return res.json([]); // user hasn't joined a school yet
    }

    const params = [effectiveSchoolId];
    let sql = `SELECT u.id, u.full_name AS "fullName", u.bio, u.status, u.avatar_url AS "avatarUrl",
               (${avgResponseMinutesSubquery('u.id')}) AS "avgResponseMinutes"
               FROM users u WHERE u.school_id = $1 AND u.role = 'TEACHER'`;
    if (q) {
      sql += ' AND u.full_name ILIKE $2';
      params.push(`%${q}%`);
    }
    sql += ' ORDER BY u.full_name LIMIT 20';
    const { rows } = await pool.query(sql, params);
    res.json(rows.map((r) => ({ ...r, avgResponseMinutes: r.avgResponseMinutes != null ? Math.round(r.avgResponseMinutes) : null })));
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const validStatuses = ['ONLINE', 'AWAY', 'OFFLINE', 'DO_NOT_DISTURB'];
    if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status');

    await pool.query('UPDATE users SET status = $1, last_seen_at = now() WHERE id = $2', [status, userId]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    next(err);
  }
}

export async function getUserAvailability(req, res, next) {
  try {
    const { userId } = req.params;
    const { rows } = await pool.query(
      `SELECT day_of_week AS "dayOfWeek", start_time AS "startTime", end_time AS "endTime", available_for AS "availableFor"
       FROM office_hours WHERE teacher_id = $1 ORDER BY day_of_week`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function setOfficeHours(req, res, next) {
  try {
    const { userId } = req.params;
    const { slots } = req.body;

    await pool.query('DELETE FROM office_hours WHERE teacher_id = $1', [userId]);

    for (const slot of slots) {
      await pool.query(
        `INSERT INTO office_hours (teacher_id, day_of_week, start_time, end_time, available_for)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, slot.dayOfWeek, slot.startTime, slot.endTime, slot.availableFor || 'PARENTS']
      );
    }

    res.json({ message: 'Office hours updated' });
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const { schoolId } = req.query;

    const fastResponders = await pool.query(
      `SELECT u.id, u.full_name AS name, (${avgResponseMinutesSubquery('u.id')}) AS metric
       FROM users u WHERE u.school_id = $1 AND u.role = 'TEACHER'
       ORDER BY metric ASC NULLS LAST LIMIT 5`,
      [schoolId]
    );

    const engagedParents = await pool.query(
      `SELECT u.id, u.full_name AS name, COUNT(m.id) AS metric
       FROM users u
       JOIN messages m ON m.sender_id = u.id
       WHERE u.school_id = $1 AND u.role = 'PARENT' AND m.created_at > now() - interval '30 days'
       GROUP BY u.id, u.full_name
       ORDER BY metric DESC LIMIT 5`,
      [schoolId]
    );

    const curiousStudents = await pool.query(
      `SELECT u.id, u.full_name AS name, COUNT(m.id) AS metric
       FROM users u
       JOIN messages m ON m.sender_id = u.id
       WHERE u.school_id = $1 AND u.role = 'STUDENT' AND m.category = 'HOMEWORK_HELP' AND m.created_at > now() - interval '30 days'
       GROUP BY u.id, u.full_name
       ORDER BY metric DESC LIMIT 5`,
      [schoolId]
    );

    res.json({
      fastResponders: fastResponders.rows
        .filter((r) => r.metric != null)
        .map((r) => ({ ...r, metric: `${Math.round(r.metric)} min` })),
      engagedParents: engagedParents.rows.map((r) => ({ ...r, metric: `${r.metric} msgs` })),
      curiousStudents: curiousStudents.rows.map((r) => ({ ...r, metric: `${r.metric} questions` })),
    });
  } catch (err) {
    next(err);
  }
}