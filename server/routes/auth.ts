import {Router} from 'express';
import type {User} from '@supabase/supabase-js';
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

async function findAuthUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const {data, error} = await supabaseAdmin.auth.admin.listUsers({page, perPage: 100});
    if (error) throw new HttpError(500, 'Could not inspect auth users', 'AUTH_LOOKUP_FAILED');

    const users = data.users as User[];
    const match = users.find(user => user.email?.toLowerCase() === normalizedEmail);
    if (match) return match;
    if (users.length < 100) return null;
    page += 1;
  }

  return null;
}

async function signInWithPassword(email: string, password: string) {
  const {data, error} = await supabase.auth.signInWithPassword({email, password});
  if (error || !data.session || !data.user) return null;
  return data;
}

async function createConfirmedUser(email: string, password: string, fullName: string) {
  const {data, error} = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {full_name: fullName},
  });

  if (error || !data.user) return null;
  return data.user;
}

async function confirmExistingAuthUser(userId: string, fullName?: string) {
  const {error} = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    ...(fullName ? {user_metadata: {full_name: fullName}} : {}),
  });
  if (error) throw new HttpError(500, 'Could not confirm auth user', 'AUTH_CONFIRM_FAILED');
}

authRouter.post('/signup', async (req, res, next) => {
  try {
    const {fullName, email, password, dailyGoal} = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Email and password are required', 'VALIDATION_ERROR');
    const displayName = fullName || email.split('@')[0];

    let user = await createConfirmedUser(email, password, displayName);
    if (!user) {
      const existing = await findAuthUserByEmail(email);
      if (existing) await confirmExistingAuthUser(existing.id, displayName);
      const existingSession = await signInWithPassword(email, password);
      if (!existingSession) {
        throw new HttpError(400, 'Could not create account. If this email already exists, use Sign In.', 'SIGNUP_FAILED');
      }
      user = existingSession.user;
    }

    const session = await signInWithPassword(email, password);
    if (!session) throw new HttpError(401, 'Account created, but sign-in failed. Please try Sign In.', 'SIGNIN_FAILED');

    const profile = await upsertProfile(user.id, email, displayName, dailyGoal || 25);
    res.json({jwt: session.session.access_token, profile});
  } catch (error) {
    next(error);
  }
});

authRouter.post('/signin', async (req, res, next) => {
  try {
    const {email, password} = req.body || {};
    let data = await signInWithPassword(email, password);
    if (!data) {
      const existing = email ? await findAuthUserByEmail(email) : null;
      if (existing) {
        await confirmExistingAuthUser(existing.id);
        data = await signInWithPassword(email, password);
      }
    }
    if (!data) throw new HttpError(401, 'Invalid email or password', 'SIGNIN_FAILED');

    const profile = await upsertProfile(data.user.id, data.user.email || email, data.user.user_metadata?.full_name);
    res.json({jwt: data.session.access_token, profile});
  } catch (error) {
    next(error);
  }
});

authRouter.post('/guest', async (_req, res, next) => {
  try {
    const email = process.env.GUEST_EMAIL || 'guest@focusbuddy.local';
    const password = process.env.GUEST_PASSWORD || 'focusbuddy-guest-password';
    const fullName = 'Guest Student';

    const existing = await findAuthUserByEmail(email);
    if (existing) {
      const {error} = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: {full_name: fullName},
      });
      if (error) throw new HttpError(500, 'Could not prepare guest account', 'GUEST_UPDATE_FAILED');
    } else {
      const user = await createConfirmedUser(email, password, fullName);
      if (!user) throw new HttpError(500, 'Could not create guest account', 'GUEST_CREATE_FAILED');
    }

    const session = await signInWithPassword(email, password);
    if (!session) throw new HttpError(500, 'Could not start guest session', 'GUEST_SIGNIN_FAILED');

    const profile = await upsertProfile(session.user.id, email, fullName, 25);
    res.json({jwt: session.session.access_token, profile});
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
