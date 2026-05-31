import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {sendPushToProfile} from '../services/webPushClient.js';

export const pushRouter = Router();

pushRouter.post('/send-streak-reminder', async (_req, res, next) => {
  try {
    const {data: profiles, error} = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('notifications_enabled', true)
      .not('push_subscription', 'is', null);
    if (error) throw new HttpError(400, 'Could not load push subscribers', 'PUSH_USERS_FAILED');

    const today = new Date().toISOString().slice(0, 10);
    let sent = 0;
    for (const profile of profiles || []) {
      const {data: sessions} = await supabaseAdmin
        .from('study_session_logs')
        .select('id')
        .eq('user_id', profile.id)
        .gte('timestamp', `${today}T00:00:00.000Z`)
        .limit(1);
      if (sessions?.length) continue;
      await sendPushToProfile(
        profile,
        `Hey ${profile.full_name || 'there'}, do not break your ${profile.streak || 0}-day streak!`,
        'Time to focus.',
      );
      sent += 1;
    }
    res.json({sent});
  } catch (error) {
    next(error);
  }
});
