import {NextFunction, Request, Response} from 'express';
import {supabase} from '../services/supabaseClient.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token) {
    return res.status(401).json({error: 'Authentication required', code: 'AUTH_REQUIRED'});
  }

  // Let simulated tokens flow through the normal getUser path below,
  // which is proxied to mockAuth.getUser() in offline mode to resolve the real user.

  try {
    const {data, error} = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({error: 'Invalid or expired session', code: 'AUTH_INVALID'});
    }
    req.user = {id: data.user.id, email: data.user.email || undefined};
    next();
  } catch (err) {
    // If Supabase server is down or unreachable (network failure), allow fallback to simulated session
    console.warn('Supabase auth server unreachable. Falling back to local simulated user.', err);
    req.user = { id: 'simulated-user-id-fallback', email: 'offline-student@focusbuddy.local' };
    next();
  }
}

