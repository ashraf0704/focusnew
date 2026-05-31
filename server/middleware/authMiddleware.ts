import {NextFunction, Request, Response} from 'express';
import {supabase} from '../services/supabaseClient.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token) {
    return res.status(401).json({error: 'Authentication required', code: 'AUTH_REQUIRED'});
  }

  const {data, error} = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({error: 'Invalid or expired session', code: 'AUTH_INVALID'});
  }

  req.user = {id: data.user.id, email: data.user.email || undefined};
  next();
}
