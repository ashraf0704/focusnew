import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {supabase, supabaseAdmin} from '../services/supabaseClient.js';
import {profileFromRow} from '../utils/mappers.js';

export const authRouter = Router();

async function upsertProfile(userId: string, email: string, fullName?: string, dailyGoal = 25) {
  const {data, error} = await supabaseAdmin
    .from('user_profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName || email.split('@')[0],
      daily_goal_minutes: dailyGoal,
    }, {onConflict: 'id'})
    .select()
    .single();

  if (error) throw new HttpError(500, 'Could not save user profile', 'PROFILE_SAVE_FAILED');
  return profileFromRow(data);
}

authRouter.post('/signup', async (req, res, next) => {
  try {
    const {fullName, email, password, dailyGoal} = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Email and password are required', 'VALIDATION_ERROR');

    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {data: {full_name: fullName}},
    });
    if (error || !data.user) throw new HttpError(400, 'Could not create account', 'SIGNUP_FAILED');

    const profile = await upsertProfile(data.user.id, email, fullName, dailyGoal || 25);
    const jwt = data.session?.access_token;
    if (!jwt) throw new HttpError(409, 'Signup succeeded, but email confirmation is required before sign-in', 'EMAIL_CONFIRMATION_REQUIRED');
    res.json({jwt, profile});
  } catch (error) {
    next(error);
  }
});

authRouter.post('/signin', async (req, res, next) => {
  try {
    const {email, password} = req.body || {};
    const {data, error} = await supabase.auth.signInWithPassword({email, password});
    if (error || !data.session || !data.user) throw new HttpError(401, 'Invalid email or password', 'SIGNIN_FAILED');

    const profile = await upsertProfile(data.user.id, data.user.email || email, data.user.user_metadata?.full_name);
    res.json({jwt: data.session.access_token, profile});
  } catch (error) {
    next(error);
  }
});

authRouter.post('/oauth/github', async (req, res, next) => {
  try {
    const {accessToken} = req.body || {};
    if (!accessToken) throw new HttpError(400, 'OAuth access token is required', 'VALIDATION_ERROR');

    const {data, error} = await supabase.auth.getUser(accessToken);
    if (error || !data.user) throw new HttpError(401, 'Invalid OAuth callback token', 'OAUTH_FAILED');

    const profile = await upsertProfile(data.user.id, data.user.email || '', data.user.user_metadata?.full_name);
    res.json({jwt: accessToken, profile});
  } catch (error) {
    next(error);
  }
});

authRouter.post('/signout', async (_req, res) => {
  res.status(204).send();
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const {email} = req.body || {};
    if (!email) throw new HttpError(400, 'Email is required', 'VALIDATION_ERROR');
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`,
    });
    if (error) throw new HttpError(400, 'Could not send reset email', 'RESET_FAILED');
    res.json({ok: true});
  } catch (error) {
    next(error);
  }
});
