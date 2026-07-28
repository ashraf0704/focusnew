import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabaseClient.js';

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@focusbuddy.local').toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase();

    if (userEmail && userEmail === adminEmail) {
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, email')
      .eq('id', req.user.id)
      .single();

    if (profile && (profile.role === 'admin' || (profile.email && profile.email.toLowerCase() === adminEmail))) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied. Admin privileges required.',
      code: 'FORBIDDEN',
    });
  } catch (err) {
    console.error('Error in adminMiddleware:', err);
    return res.status(500).json({ error: 'Could not verify admin permissions', code: 'ADMIN_CHECK_FAILED' });
  }
}
