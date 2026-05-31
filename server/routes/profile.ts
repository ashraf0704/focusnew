import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {badgeFromRow, deckFromRows, profileFromRow, sessionFromRow, subjectFromRow, taskFromRow} from '../utils/mappers.js';

export const profileRouter = Router();

export async function getProfileRow(userId: string) {
  const {data, error} = await supabaseAdmin.from('user_profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new HttpError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
  return data;
}

profileRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [profileRow, subjects, tasks, deckRows, cardRows, logs, badges] = await Promise.all([
      getProfileRow(userId),
      supabaseAdmin.from('subjects').select('*').eq('user_id', userId).order('created_at', {ascending: true}),
      supabaseAdmin.from('tasks').select('*').eq('user_id', userId).order('created_at', {ascending: false}),
      supabaseAdmin.from('flashcard_decks').select('*').eq('user_id', userId).order('created_at', {ascending: false}),
      supabaseAdmin.from('flashcards').select('*').eq('user_id', userId).order('created_at', {ascending: true}),
      supabaseAdmin.from('study_session_logs').select('*').eq('user_id', userId).order('timestamp', {ascending: false}),
      supabaseAdmin.from('user_badges').select('*').eq('user_id', userId).order('badge_key', {ascending: true}),
    ]);

    const cards = cardRows.data || [];
    res.json({
      profile: profileFromRow(profileRow),
      subjects: (subjects.data || []).map(subjectFromRow),
      tasks: (tasks.data || []).map(taskFromRow),
      decks: (deckRows.data || []).map(deck => deckFromRows(deck, cards.filter(card => card.deck_id === deck.id))),
      sessionLogs: (logs.data || []).map(sessionFromRow),
      badges: (badges.data || []).map(badgeFromRow),
    });
  } catch (error) {
    next(error);
  }
});

profileRouter.patch('/', async (req, res, next) => {
  try {
    const allowed: Record<string, string> = {
      fullName: 'full_name',
      dailyGoalMinutes: 'daily_goal_minutes',
      buddySpecies: 'buddy_species',
      alarmTone: 'alarm_tone',
      soundVolume: 'sound_volume',
      notificationsEnabled: 'notifications_enabled',
    };
    const update: Record<string, unknown> = {};
    for (const [camel, snake] of Object.entries(allowed)) {
      if (camel in req.body) update[snake] = req.body[camel];
    }

    const {data, error} = await supabaseAdmin
      .from('user_profiles')
      .update(update)
      .eq('id', req.user!.id)
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not update profile', 'PROFILE_UPDATE_FAILED');
    res.json(profileFromRow(data));
  } catch (error) {
    next(error);
  }
});

profileRouter.patch('/buddy-points', async (req, res, next) => {
  try {
    const deduct = Number(req.body?.deduct || 0);
    if (!Number.isFinite(deduct) || deduct < 0) throw new HttpError(400, 'Invalid point deduction', 'VALIDATION_ERROR');

    const current = await getProfileRow(req.user!.id);
    const nextPoints = Number(current.buddy_points || 0) - deduct;
    if (nextPoints < 0) throw new HttpError(400, 'Not enough Buddy Points', 'INSUFFICIENT_POINTS');

    const {data, error} = await supabaseAdmin
      .from('user_profiles')
      .update({buddy_points: nextPoints})
      .eq('id', req.user!.id)
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not update Buddy Points', 'POINTS_UPDATE_FAILED');
    res.json(profileFromRow(data));
  } catch (error) {
    next(error);
  }
});

profileRouter.post('/push-subscription', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin
      .from('user_profiles')
      .update({push_subscription: req.body, notifications_enabled: true})
      .eq('id', req.user!.id)
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not save push subscription', 'PUSH_SAVE_FAILED');
    res.json(profileFromRow(data));
  } catch (error) {
    next(error);
  }
});

profileRouter.delete('/push-subscription', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin
      .from('user_profiles')
      .update({push_subscription: null, notifications_enabled: false})
      .eq('id', req.user!.id)
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not remove push subscription', 'PUSH_DELETE_FAILED');
    res.json(profileFromRow(data));
  } catch (error) {
    next(error);
  }
});
