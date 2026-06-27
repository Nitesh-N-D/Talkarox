import pool from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { sendAppointmentConfirmedEmail } from '../services/emailService.js';
import { sendPushToUser } from '../services/pushService.js';

const SLOT_DURATION_MINUTES = 20;

export async function getAvailableSlots(req, res, next) {
  try {
    const { teacherId, date } = req.query;
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const { rows: officeHours } = await pool.query(
      `SELECT start_time AS "startTime", end_time AS "endTime" FROM office_hours
       WHERE teacher_id = $1 AND day_of_week = $2`,
      [teacherId, dayOfWeek]
    );

    if (officeHours.length === 0) return res.json([]);

    const { rows: existingAppointments } = await pool.query(
      `SELECT scheduled_at AS "scheduledAt" FROM appointments
       WHERE teacher_id = $1 AND status != 'CANCELLED'
         AND scheduled_at >= $2::date AND scheduled_at < ($2::date + interval '1 day')`,
      [teacherId, targetDate.toISOString().split('T')[0]]
    );
    const bookedTimes = new Set(existingAppointments.map((a) => new Date(a.scheduledAt).getTime()));

    const slots = [];
    for (const window of officeHours) {
      const [startH, startM] = window.startTime.split(':').map(Number);
      const [endH, endM] = window.endTime.split(':').map(Number);

      let cursor = new Date(targetDate);
      cursor.setHours(startH, startM, 0, 0);
      const end = new Date(targetDate);
      end.setHours(endH, endM, 0, 0);

      while (cursor < end) {
        if (!bookedTimes.has(cursor.getTime()) && cursor > new Date()) {
          slots.push({ startsAt: cursor.toISOString() });
        }
        cursor = new Date(cursor.getTime() + SLOT_DURATION_MINUTES * 60000);
      }
    }

    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function requestAppointment(req, res, next) {
  try {
    const parentId = req.userId;
    const { teacherId, scheduledAt, studentId, notes } = req.body;
    if (!teacherId || !scheduledAt) throw new ApiError(400, 'teacherId and scheduledAt are required');

    const meetingUrl = `https://meet.jit.si/talkarox-${uuidv4()}`;

    const { rows } = await pool.query(
      `INSERT INTO appointments (teacher_id, parent_id, student_id, scheduled_at, meeting_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [teacherId, parentId, studentId || null, scheduledAt, meetingUrl, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function confirmAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE appointments SET status = 'CONFIRMED' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) throw new ApiError(404, 'Appointment not found');

    const { rows: parentRows } = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [rows[0].parent_id]);
    const { rows: teacherRows } = await pool.query('SELECT full_name FROM users WHERE id = $1', [rows[0].teacher_id]);
    if (parentRows[0]) {
      sendAppointmentConfirmedEmail(parentRows[0].email, teacherRows[0]?.full_name || 'your teacher', rows[0].scheduled_at, rows[0].meeting_url)
        .catch((e) => console.error('Appointment email failed:', e.message));
      sendPushToUser(rows[0].parent_id, {
        title: 'Meeting confirmed',
        body: `Your meeting with ${teacherRows[0]?.full_name || 'your teacher'} is confirmed.`,
        data: { type: 'appointment', appointmentId: rows[0].id },
      }).catch(() => {});
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function cancelAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) throw new ApiError(404, 'Appointment not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getMyAppointments(req, res, next) {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      `SELECT a.id, a.scheduled_at AS "scheduledAt", a.status, a.meeting_url AS "zoomUrl", a.notes,
              t.full_name AS "teacherName", p.full_name AS "parentName"
       FROM appointments a
       JOIN users t ON t.id = a.teacher_id
       JOIN users p ON p.id = a.parent_id
       WHERE a.teacher_id = $1 OR a.parent_id = $1
       ORDER BY a.scheduled_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
