import pool from '../config/db.js';
import { categorizeMessage, translateText, getHomeworkHelp as getHomeworkHelpService } from '../services/aiService.js';

export async function categorizeMessageHandler(req, res, next) {
  try {
    const { content } = req.body;
    const result = await categorizeMessage(content);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function translateMessageHandler(req, res, next) {
  try {
    const { text, targetLanguage } = req.body;
    const result = await translateText(text, targetLanguage);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function homeworkHelpHandler(req, res, next) {
  try {
    const { question } = req.body;
    const result = await getHomeworkHelpService(question);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function weeklyDigestHandler(req, res, next) {
  try {
    const { userId } = req.params;

    const { rows: msgStats } = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE category = 'HOMEWORK_HELP') AS homework,
              COUNT(DISTINCT CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END) AS contacts
       FROM messages
       WHERE (sender_id = $1 OR recipient_id = $1) AND created_at > now() - interval '7 days'`,
      [userId]
    );

    const stats = msgStats[0];
    const summary = `You exchanged ${stats.total} messages this week across ${stats.contacts} conversations, including ${stats.homework} homework questions answered.`;

    res.json({ summary, ...stats });
  } catch (err) {
    next(err);
  }
}
