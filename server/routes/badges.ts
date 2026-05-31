import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {sendPushToProfile} from '../services/webPushClient.js';
import {badgeFromRow} from '../utils/mappers.js';
import {getProfileRow} from './profile.js';

export const badgesRouter = Router();

badgesRouter.get('/', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin.from('user_badges').select('*').eq('user_id', req.user!.id).order('badge_key');
    if (error) throw new HttpError(400, 'Could not load badges', 'BADGES_LOAD_FAILED');
    res.json(data.map(badgeFromRow));
  } catch (error) {
    next(error);
  }
});

badgesRouter.post('/:id/unlock', async (req, res, next) => {
  try {
    const {data: current} = await supabaseAdmin
      .from('user_badges')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('badge_key', req.params.id)
      .single();
    if (!current) throw new HttpError(404, 'Badge not found', 'BADGE_NOT_FOUND');

    const update = current.unlocked ? {} : {unlocked: true, unlocked_at: new Date().toISOString()};
    const {data, error} = await supabaseAdmin
      .from('user_badges')
      .update(update)
      .eq('user_id', req.user!.id)
      .eq('badge_key', req.params.id)
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not unlock badge', 'BADGE_UNLOCK_FAILED');

    if (!current.unlocked) {
      const profile = await getProfileRow(req.user!.id);
      await sendPushToProfile(profile, `Badge unlocked: ${data.title}!`, data.description);
    }

    res.json(badgeFromRow(data));
  } catch (error) {
    next(error);
  }
});
