import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {taskFromRow} from '../utils/mappers.js';

export const tasksRouter = Router();

tasksRouter.get('/', async (req, res, next) => {
  try {
    const {data, error} = await supabaseAdmin.from('tasks').select('*').eq('user_id', req.user!.id).order('created_at', {ascending: false});
    if (error) throw new HttpError(400, 'Could not load tasks', 'TASKS_LOAD_FAILED');
    res.json(data.map(taskFromRow));
  } catch (error) {
    next(error);
  }
});

tasksRouter.post('/', async (req, res, next) => {
  try {
    const {title, subjectId, priority, dueDate} = req.body || {};
    const {data, error} = await supabaseAdmin
      .from('tasks')
      .insert({user_id: req.user!.id, title, subject_id: subjectId, priority, due_date: dueDate, completed: false})
      .select()
      .single();
    if (error) throw new HttpError(400, 'Could not create task', 'TASK_CREATE_FAILED');
    res.status(201).json(taskFromRow(data));
  } catch (error) {
    next(error);
  }
});

tasksRouter.patch('/:id/toggle', async (req, res, next) => {
  try {
    const {data: task, error: loadError} = await supabaseAdmin.from('tasks').select('*').eq('id', req.params.id).eq('user_id', req.user!.id).single();
    if (loadError || !task) throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    const {data, error} = await supabaseAdmin.from('tasks').update({completed: !task.completed}).eq('id', task.id).select().single();
    if (error) throw new HttpError(400, 'Could not update task', 'TASK_UPDATE_FAILED');
    res.json(taskFromRow(data));
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const {error} = await supabaseAdmin.from('tasks').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) throw new HttpError(400, 'Could not delete task', 'TASK_DELETE_FAILED');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
