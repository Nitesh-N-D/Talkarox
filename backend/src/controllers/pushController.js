import { ApiError } from '../middleware/errorHandler.js';
import { registerPushToken, unregisterPushToken, isPushConfigured } from '../services/pushService.js';

export async function registerToken(req, res, next) {
  try {
    const { token, platform } = req.body;
    if (!token) throw new ApiError(400, 'token is required');

    await registerPushToken(req.userId, token, platform);
    res.json({ message: 'Push token registered' });
  } catch (err) {
    next(err);
  }
}

export async function unregisterToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) throw new ApiError(400, 'token is required');

    await unregisterPushToken(token);
    res.json({ message: 'Push token removed' });
  } catch (err) {
    next(err);
  }
}

export function getPushStatus(req, res) {
  res.json({ configured: isPushConfigured() });
}
