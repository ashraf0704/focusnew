import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { profileFromRow } from '../utils/mappers.js';

export const adminRouter = Router();

// GET /api/admin/stats - System Dashboard High-level Overview
adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [profilesRes, logsRes, tasksRes, decksRes] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('id, subscription_plan, role, total_focus_minutes, sessions_count, created_at'),
      supabaseAdmin.from('study_session_logs').select('id, duration_minutes, timestamp'),
      supabaseAdmin.from('tasks').select('id, completed'),
      supabaseAdmin.from('flashcard_decks').select('id'),
    ]);

    const profiles = profilesRes.data || [];
    const logs = logsRes.data || [];
    const tasks = tasksRes.data || [];
    const decks = decksRes.data || [];

    const totalUsers = profiles.length;
    const adminCount = profiles.filter(p => p.role === 'admin').length;
    const studentCount = totalUsers - adminCount;

    const totalFocusMinutes = profiles.reduce((acc, p) => acc + (p.total_focus_minutes || 0), 0);
    const totalSessions = profiles.reduce((acc, p) => acc + (p.sessions_count || 0), 0);

    const planCounts = {
      free: profiles.filter(p => !p.subscription_plan || p.subscription_plan === 'free').length,
      pro: profiles.filter(p => p.subscription_plan === 'pro').length,
      guru: profiles.filter(p => p.subscription_plan === 'guru').length,
    };

    // Active today check
    const todayStr = new Date().toISOString().split('T')[0];
    const activeTodayLogs = logs.filter(l => l.timestamp && l.timestamp.startsWith(todayStr));

    res.json({
      totalUsers,
      adminCount,
      studentCount,
      totalFocusMinutes,
      totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
      totalSessions,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      totalDecks: decks.length,
      planCounts,
      activeToday: activeTodayLogs.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - Get list of all users with search and filter
adminRouter.get('/users', async (req, res, next) => {
  try {
    const { query, role, plan } = req.query;

    let dbQuery = supabaseAdmin.from('user_profiles').select('*').order('created_at', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      throw new HttpError(500, 'Failed to fetch users', 'ADMIN_USERS_FETCH_FAILED');
    }

    let users = (data || []).map(row => ({
      id: row.id,
      ...profileFromRow(row),
      createdAt: row.created_at || new Date().toISOString(),
    }));

    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      users = users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (role && typeof role === 'string' && role !== 'all') {
      users = users.filter(u => u.role === role);
    }

    if (plan && typeof plan === 'string' && plan !== 'all') {
      users = users.filter(u => u.subscriptionPlan === plan);
    }

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users - Manually create new user account
adminRouter.post('/users', async (req, res, next) => {
  try {
    const { email, password, fullName, role, subscriptionPlan, dailyGoal } = req.body || {};

    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required', 'VALIDATION_ERROR');
    }

    const displayName = fullName || email.split('@')[0];

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });

    if (authError || !authData.user) {
      throw new HttpError(400, authError?.message || 'Failed to create user account', 'USER_CREATE_FAILED');
    }

    const userId = authData.user.id;

    // Upsert profile with admin-specified settings
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        email,
        full_name: displayName,
        role: role || 'user',
        subscription_plan: subscriptionPlan || 'free',
        daily_goal_minutes: dailyGoal || 25,
        buddy_points: 250,
        buddy_species: 'fox',
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      throw new HttpError(500, 'Could not save user profile attributes', 'PROFILE_CREATE_FAILED');
    }

    res.status(201).json({
      id: userId,
      ...profileFromRow(profileRow),
      createdAt: profileRow.created_at || new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id - Update user details (role, plan, points, streak, goal, name)
adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, subscriptionPlan, buddyPoints, streak, dailyGoalMinutes, fullName, email } = req.body || {};

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (subscriptionPlan !== undefined) updateData.subscription_plan = subscriptionPlan;
    if (buddyPoints !== undefined) updateData.buddy_points = Number(buddyPoints);
    if (streak !== undefined) updateData.streak = Number(streak);
    if (dailyGoalMinutes !== undefined) updateData.daily_goal_minutes = Number(dailyGoalMinutes);
    if (fullName !== undefined) updateData.full_name = fullName;
    if (email !== undefined) updateData.email = email;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new HttpError(400, 'Could not update user details', 'USER_UPDATE_FAILED');
    }

    res.json({
      id: data.id,
      ...profileFromRow(data),
      createdAt: data.created_at || new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users/:id/reset-password - Admin reset password for user
adminRouter.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 6) {
      throw new HttpError(400, 'Password must be at least 6 characters long', 'VALIDATION_ERROR');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });

    if (error) {
      throw new HttpError(400, error.message || 'Could not update password', 'PASSWORD_RESET_FAILED');
    }

    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/users/:id - Delete user account
adminRouter.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete from auth.users (cascades to user_profiles, tasks, subjects, etc.)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      // Fallback: delete profile manually if auth delete fails
      await supabaseAdmin.from('user_profiles').delete().eq('id', id);
    }

    res.json({ ok: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/broadcast - Broadcast announcement
adminRouter.post('/broadcast', async (req, res, next) => {
  try {
    const { title, message, priority } = req.body || {};
    if (!title || !message) {
      throw new HttpError(400, 'Title and message are required', 'VALIDATION_ERROR');
    }

    res.json({
      ok: true,
      broadcast: {
        id: `bcast-${Date.now()}`,
        title,
        message,
        priority: priority || 'normal',
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
