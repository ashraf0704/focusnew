import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, Clock, Award, Sparkles, 
  Search, Filter, Plus, UserPlus, Key, Trash2, Edit3, 
  Send, RefreshCw, CheckCircle, AlertTriangle, X, ShieldAlert,
  Zap, Crown, Flame, BookOpen
} from 'lucide-react';
import { AdminStats, AdminUserItem, UserProfile } from '../types';
import { api } from '../api';

interface AdminDashboardProps {
  currentProfile: UserProfile;
}

export default function AdminDashboard({ currentProfile }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'guru'>('all');

  // Modals state
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Form states
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    subscriptionPlan: 'free' as 'free' | 'pro' | 'guru',
    dailyGoal: 25,
  });

  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    subscriptionPlan: 'free' as 'free' | 'pro' | 'guru',
    buddyPoints: 250,
    streak: 0,
    dailyGoalMinutes: 25,
  });

  const [newPassword, setNewPassword] = useState('');
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'normal' | 'high',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers({ query: searchQuery, role: roleFilter, plan: planFilter }),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Could not fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [searchQuery, roleFilter, planFilter]);

  // Handle Edit User
  const handleOpenEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditUserForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role || 'user',
      subscriptionPlan: user.subscriptionPlan || 'free',
      buddyPoints: user.buddyPoints ?? 250,
      streak: user.streak || 0,
      dailyGoalMinutes: user.dailyGoalMinutes || 25,
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updated = await api.updateAdminUser(editingUser.id, editUserForm);
      setUsers(prev => prev.map(u => (u.id === editingUser.id ? updated : u)));
      showNotification(`Updated user details for ${updated.email}`);
      setEditingUser(null);
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminUser(createUserForm);
      setUsers(prev => [created, ...prev]);
      showNotification(`User account created for ${created.email}`);
      setShowCreateModal(false);
      setCreateUserForm({
        fullName: '',
        email: '',
        password: '',
        role: 'user',
        subscriptionPlan: 'free',
        dailyGoal: 25,
      });
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create user account');
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword) return;

    try {
      await api.resetAdminUserPassword(resetPasswordUser.id, newPassword);
      showNotification(`Password reset successfully for ${resetPasswordUser.email}`);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await api.deleteAdminUser(deletingUser.id);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      showNotification(`Account ${deletingUser.email} has been permanently deleted.`);
      setDeletingUser(null);
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user account');
    }
  };

  // Handle Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sendAdminBroadcast(broadcastForm);
      showNotification(`Broadcast announcement "${broadcastForm.title}" sent successfully!`);
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', priority: 'normal' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send broadcast');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-brand-primary border border-brand-accent text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="text-emerald-400" size={18} />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Portal Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-primary via-[#2C2C1E] to-[#1E1E14] text-white p-6 sm:p-8 border border-brand-vibrant/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-vibrant/20 border border-brand-vibrant/40 text-brand-vibrant text-xs font-black uppercase tracking-wider mb-3">
              <ShieldCheck size={14} />
              Admin Controls • Exclusive Privileges
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Master Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-brand-bg/70 mt-1 max-[#600px]">
              Manage registered users, modify subscriptions & points, issue security credentials, and view real-time focus platform analytics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/15 transition cursor-pointer"
            >
              <Send size={15} />
              Broadcast Alert
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-brand-vibrant hover:opacity-90 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <UserPlus size={15} />
              Create New User
            </button>

            <button
              onClick={loadAdminData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white rounded-2xl border border-brand-soft-border/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Total System Users</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-brand-dark">{stats?.totalUsers ?? '1'}</span>
            <div className="text-[11px] text-brand-muted mt-1 flex items-center gap-2">
              <span className="text-indigo-600 font-bold">{stats?.adminCount ?? 1} Admins</span>
              <span>•</span>
              <span>{stats?.studentCount ?? 0} Students</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-brand-soft-border/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Total Focus Hours</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-brand-dark">{stats?.totalFocusHours ?? 0} hrs</span>
            <div className="text-[11px] text-brand-muted mt-1">
              {stats?.totalSessions ?? 0} deep concentration study sessions
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-brand-soft-border/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Active Students Today</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-brand-dark">{stats?.activeToday ?? 1}</span>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">
              Active platform sessions logged
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-brand-soft-border/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Subscriptions Breakdown</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Crown size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-xs">
              <span className="font-extrabold text-slate-700">{stats?.planCounts.free ?? 1}</span> Free
            </div>
            <div className="text-xs">
              <span className="font-extrabold text-indigo-600">{stats?.planCounts.pro ?? 0}</span> Pro
            </div>
            <div className="text-xs">
              <span className="font-extrabold text-purple-600">{stats?.planCounts.guru ?? 0}</span> Guru
            </div>
          </div>
        </div>
      </div>

      {/* Users Management Section */}
      <div className="bg-white rounded-3xl border border-brand-soft-border/80 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
              <Users size={20} className="text-brand-vibrant" />
              Registered User Directory
            </h2>
            <p className="text-xs text-brand-muted">
              Inspect user profiles, manage authorization roles, update subscriptions, or issue password resets.
            </p>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-vibrant"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-vibrant"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>

            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-vibrant"
            >
              <option value="all">All Plans</option>
              <option value="free">Free Tier</option>
              <option value="pro">Pro Tier</option>
              <option value="guru">Guru Tier</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-brand-muted">
            Loading user profiles...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="mx-auto text-slate-300" size={32} />
            <p className="text-xs font-bold text-brand-dark">No user profiles matched your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setRoleFilter('all'); setPlanFilter('all'); }}
              className="text-xs text-brand-vibrant underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-brand-muted font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-3">User / Identity</th>
                  <th className="pb-3 px-3">Access Role</th>
                  <th className="pb-3 px-3">Subscription</th>
                  <th className="pb-3 px-3">Focus Stats</th>
                  <th className="pb-3 px-3">Buddy Points</th>
                  <th className="pb-3 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map(user => {
                  const isAdmin = user.role === 'admin';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${isAdmin ? 'bg-purple-600' : 'bg-brand-vibrant'}`}>
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-brand-dark block text-xs">{user.fullName}</span>
                            <span className="text-[10px] text-brand-muted block">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-black uppercase">
                            <ShieldCheck size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                            User
                          </span>
                        )}
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3 px-3">
                        {user.subscriptionPlan === 'guru' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">
                            <Crown size={12} />
                            Guru
                          </span>
                        ) : user.subscriptionPlan === 'pro' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase">
                            <Zap size={12} />
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Free
                          </span>
                        )}
                      </td>

                      {/* Focus Stats */}
                      <td className="py-3 px-3">
                        <div className="text-[11px]">
                          <span className="font-extrabold text-brand-dark">{user.totalFocusMinutes} mins</span>
                          <span className="text-brand-muted ml-1">({user.sessionsCount} sessions)</span>
                        </div>
                        <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                          <Flame size={10} /> {user.streak} Day Streak
                        </div>
                      </td>

                      {/* Points */}
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-brand-vibrant">🪙 {user.buddyPoints ?? 250}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Edit User Details & Permissions"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => setResetPasswordUser(user)}
                            className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition cursor-pointer"
                            title="Reset User Password"
                          >
                            <Key size={14} />
                          </button>

                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-brand-soft-border/80 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
                  <Edit3 size={18} className="text-brand-vibrant" />
                  Edit User: {editingUser.email}
                </h3>
                <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editUserForm.fullName}
                    onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Access Role</label>
                    <select
                      value={editUserForm.role}
                      onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-brand-vibrant"
                    >
                      <option value="user">User (Standard Student)</option>
                      <option value="admin">Admin (Full Control)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Subscription Tier</label>
                    <select
                      value={editUserForm.subscriptionPlan}
                      onChange={e => setEditUserForm({ ...editUserForm, subscriptionPlan: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-brand-vibrant"
                    >
                      <option value="free">Free Tier</option>
                      <option value="pro">Pro Tier</option>
                      <option value="guru">Guru Tier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Buddy Points</label>
                    <input
                      type="number"
                      value={editUserForm.buddyPoints}
                      onChange={e => setEditUserForm({ ...editUserForm, buddyPoints: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Streak (Days)</label>
                    <input
                      type="number"
                      value={editUserForm.streak}
                      onChange={e => setEditUserForm({ ...editUserForm, streak: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Daily Goal (m)</label>
                    <input
                      type="number"
                      value={editUserForm.dailyGoalMinutes}
                      onChange={e => setEditUserForm({ ...editUserForm, dailyGoalMinutes: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-vibrant hover:opacity-90 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW USER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-soft-border/80 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
                  <UserPlus size={18} className="text-brand-vibrant" />
                  Create New Account
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={createUserForm.fullName}
                    onChange={e => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={createUserForm.email}
                    onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={createUserForm.password}
                    onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Access Role</label>
                    <select
                      value={createUserForm.role}
                      onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-brand-dark block mb-1">Subscription</label>
                    <select
                      value={createUserForm.subscriptionPlan}
                      onChange={e => setCreateUserForm({ ...createUserForm, subscriptionPlan: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="guru">Guru</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-vibrant hover:opacity-90 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESET PASSWORD MODAL */}
      <AnimatePresence>
        {resetPasswordUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-soft-border/80 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
                  <Key size={18} className="text-amber-600" />
                  Reset Password for {resetPasswordUser.email}
                </h3>
                <button onClick={() => setResetPasswordUser(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 space-y-6"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-dark">Delete Account Confirmation</h3>
                  <p className="text-xs text-brand-muted">This action is permanent and cannot be undone.</p>
                </div>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 leading-relaxed">
                Are you sure you want to delete the user account for <strong>{deletingUser.email}</strong>? All associated study tasks, flashcards, and focus logs will be removed.
              </div>

              <div className="flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BROADCAST ALERT MODAL */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-soft-border/80 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
                  <Send size={18} className="text-brand-vibrant" />
                  Broadcast System Announcement
                </h3>
                <button onClick={() => setShowBroadcastModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Maintenance Notice"
                    value={broadcastForm.title}
                    onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Message Body</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe announcement or update for students..."
                    value={broadcastForm.message}
                    onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-vibrant resize-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-brand-dark block mb-1">Priority Level</label>
                  <select
                    value={broadcastForm.priority}
                    onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="normal">Normal Announcement</option>
                    <option value="high">High Priority Alert</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-vibrant hover:opacity-90 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    Send Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
