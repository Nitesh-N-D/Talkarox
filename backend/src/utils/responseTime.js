/**
 * Computes a user's real average response time in minutes, derived from
 * actual message timestamps rather than any cached/stale column.
 *
 * Definition: for every message someone sent TO this user, find the time
 * until this user's next reply to that same sender, then average those
 * gaps across the last 60 days. Messages with no reply yet are excluded
 * (they don't have a response time — including them as "infinite" or
 * zero would distort the average rather than reflect reality).
 *
 * CRITICAL: userIdExpr must be a fully-qualified reference to the OUTER
 * query's user id — either a table-aliased column (e.g. 'u.id') or a
 * parameter placeholder (e.g. '$1'). Never pass a bare column name like
 * 'id': because this subquery nests through an inner `messages` table
 * (which has its own `id` column), an unqualified reference resolves to
 * the nearest enclosing scope and silently picks up the wrong column,
 * producing NULL for every row instead of an error. This is exactly the
 * bug this comment exists to prevent from being reintroduced.
 *
 * Usage:
 *   SELECT u.id, u.full_name, (${avgResponseMinutesSubquery('u.id')}) AS avg_response_minutes
 *   FROM users u WHERE ...
 */
export function avgResponseMinutesSubquery(userIdExpr) {
  if (!userIdExpr.includes('.') && !userIdExpr.startsWith('$')) {
    throw new Error(
      `avgResponseMinutesSubquery: userIdExpr must be table-qualified (e.g. "u.id") or a parameter placeholder (e.g. "$1"), got unqualified "${userIdExpr}" which will silently produce wrong results.`
    );
  }
  return `
    SELECT AVG(EXTRACT(EPOCH FROM (replied_at - received_at)) / 60)
    FROM (
      SELECT i.created_at AS received_at,
             (SELECT MIN(r.created_at) FROM messages r
              WHERE r.sender_id = ${userIdExpr} AND r.recipient_id = i.sender_id AND r.created_at > i.created_at) AS replied_at
      FROM messages i
      WHERE i.recipient_id = ${userIdExpr} AND i.created_at > now() - interval '60 days'
    ) gaps
    WHERE replied_at IS NOT NULL
  `;
}
