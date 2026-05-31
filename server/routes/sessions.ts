import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {sendPushToProfile} from '../services/webPushClient.js';
import {profileFromRow, sessionFromRow} from '../utils/mappers.js';
import {getProfileRow} from './profile.js';

export const sessionsRouter = Router();

function sameUtcDate(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function yesterdayUtc() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date;
}

sessionsRouter.get('/', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin
      .from('study_session_logs')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('timestamp', {ascending: false});
    if (error) throw new HttpError(400, 'Could not load sessions', 'SESSIONS_LOAD_FAILED');
    res.json(data.map(sessionFromRow));
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post('/', async (req, res, next) => {
  try {
    const {durationMinutes, subjectId, mode, completed, focusScore = 100} = req.body || {};
    const minutes = Number(durationMinutes || 0);
    if (!minutes || !subjectId) throw new HttpError(400, 'Duration and subject are required', 'VALIDATION_ERROR');

    const {data: log, error} = await supabaseAdmin
      .from('study_session_logs')
      .insert({
        user_id: req.user!.id,
        subject_id: subjectId,
        duration_minutes: minutes,
        mode: mode || 'pomodoro',
        completed: Boolean(completed),
        focus_score: focusScore,
      })
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not save study session', 'SESSION_CREATE_FAILED');

    const profile = await getProfileRow(req.user!.id);
    const pointsEarned = completed ? Math.round(minutes * 10 * (Number(focusScore) / 100)) : 0;

    const {data: recent} = await supabaseAdmin
      .from('study_session_logs')
      .select('timestamp')
      .eq('user_id', req.user!.id)
      .eq('completed', true)
      .order('timestamp', {ascending: false})
      .limit(2);

    let streak = profile.streak || 0;
    if (completed) {
      const previous = recent?.find(item => item.timestamp !== log.timestamp);
      if (!previous) {
        streak = 1;
      } else {
        const previousDate = new Date(previous.timestamp);
        const today = new Date();
        streak = sameUtcDate(previousDate, today) || sameUtcDate(previousDate, yesterdayUtc()) ? streak + 1 : 1;
      }
    }

    const {data: updatedProfile, error: profileError} = await supabaseAdmin
      .from('user_profiles')
      .update({
        total_focus_minutes: Number(profile.total_focus_minutes || 0) + minutes,
        sessions_count: Number(profile.sessions_count || 0) + 1,
        buddy_points: Number(profile.buddy_points || 0) + pointsEarned,
        streak,
      })
      .eq('id', req.user!.id)
      .select()
      .single();
    if (profileError) throw new HttpError(400, 'Could not update profile statistics', 'PROFILE_STATS_FAILED');

    await sendPushToProfile(
      updatedProfile,
      'Focus session complete!',
      `You studied for ${minutes} min. +${pointsEarned} Buddy Points earned!`,
    );

    res.status(201).json({log: sessionFromRow(log), profile: profileFromRow(updatedProfile), pointsEarned});
  } catch (error) {
    next(error);
  }
});
