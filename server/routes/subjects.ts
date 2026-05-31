import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {subjectFromRow} from '../utils/mappers.js';

export const subjectsRouter = Router();

subjectsRouter.get('/', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin.from('subjects').select('*').eq('user_id', req.user!.id).order('created_at');
    if (error) throw new HttpError(400, 'Could not load subjects', 'SUBJECTS_LOAD_FAILED');
    res.json(data.map(subjectFromRow));
  } catch (error) {
    next(error);
  }
});

subjectsRouter.post('/', async (req, res, next) => {
  try {
    const {name, color, accentColor, iconName} = req.body || {};
    const {data, error} = await supabaseAdmin
      .from('subjects')
      .insert({user_id: req.user!.id, name, color, accent_color: accentColor, icon_name: iconName})
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not create subject', 'SUBJECT_CREATE_FAILED');
    res.status(201).json(subjectFromRow(data));
  } catch (error) {
    next(error);
  }
});

subjectsRouter.delete('/:id', async (req, res, next) => {
  try {
    const {error} = await supabaseAdmin.from('subjects').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) throw new HttpError(400, 'Could not delete subject', 'SUBJECT_DELETE_FAILED');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
