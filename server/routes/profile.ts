import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {badgeFromRow, deckFromRows, profileFromRow, sessionFromRow, subjectFromRow, taskFromRow} from '../utils/mappers.js';

export const profileRouter = Router();

export async function getProfileRow(userId: string, defaultEmail?: string) {
  try {
    const {data, error} = await supabaseAdmin.from('user_profiles').select('*').eq('id', userId).single();
    if (error || !data) {
      const email = defaultEmail || 'student@focusbuddy.local';
      const {data: created, error: createError} = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          full_name: email.split('@')[0],
          daily_goal_minutes: 25,
          buddy_points: 250,
          buddy_species: 'fox',
        })
        .select()
        .single();
      
      if (createError || !created) {
        console.warn('Database user_profiles table is unavailable or profile insertion failed. Returning simulated/offline profile.');
        return {
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          avatar_url: null,
          streak: 0,
          total_focus_minutes: 0,
          sessions_count: 0,
          daily_goal_minutes: 25,
          buddy_points: 250,
          buddy_species: 'fox',
          alarm_tone: 'singing-bowl',
          sound_volume: 75,
          notifications_enabled: true,
          language: 'en',
        };
      }
      return created;
    }
    return data;
  } catch (err) {
    console.warn('Exception querying database. Returning offline mock profile.', err);
    return {
      id: userId,
      email: defaultEmail || 'offline-student@focusbuddy.local',
      full_name: (defaultEmail || 'offline-student').split('@')[0],
      avatar_url: null,
      streak: 0,
      total_focus_minutes: 0,
      sessions_count: 0,
      daily_goal_minutes: 25,
      buddy_points: 250,
      buddy_species: 'fox',
      alarm_tone: 'singing-bowl',
      sound_volume: 75,
      notifications_enabled: true,
      language: 'en',
    };
  }
}

profileRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const fetchSafe = async (queryPromise: PromiseLike<any>) => {
      try {
        const res = await queryPromise;
        return res && !res.error ? res : {data: []};
      } catch (err) {
        console.warn('Supabase query failed, using empty fallback.', err);
        return {data: []};
      }
    };

    const [profileRow, subjectsRes, tasksRes, deckRowsRes, cardRowsRes, logsRes, badgesRes] = await Promise.all([
      getProfileRow(userId, email),
      fetchSafe(supabaseAdmin.from('subjects').select('*').eq('user_id', userId).order('created_at', {ascending: true})),
      fetchSafe(supabaseAdmin.from('tasks').select('*').eq('user_id', userId).order('created_at', {ascending: false})),
      fetchSafe(supabaseAdmin.from('flashcard_decks').select('*').eq('user_id', userId).order('created_at', {ascending: false})),
      fetchSafe(supabaseAdmin.from('flashcards').select('*').eq('user_id', userId).order('created_at', {ascending: true})),
      fetchSafe(supabaseAdmin.from('study_session_logs').select('*').eq('user_id', userId).order('timestamp', {ascending: false})),
      fetchSafe(supabaseAdmin.from('user_badges').select('*').eq('user_id', userId).order('badge_key', {ascending: true})),
    ]);

    const cards = cardRowsRes.data || [];
    res.json({
      profile: profileFromRow(profileRow),
      subjects: (subjectsRes.data || []).map(subjectFromRow),
      tasks: (tasksRes.data || []).map(taskFromRow),
      decks: (deckRowsRes.data || []).map(deck => deckFromRows(deck, cards.filter(card => card.deck_id === deck.id))),
      sessionLogs: (logsRes.data || []).map(sessionFromRow),
      badges: (badgesRes.data || []).map(badgeFromRow),
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
      language: 'language',
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
