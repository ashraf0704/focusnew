import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Send, UserPlus, RefreshCw, CheckCircle 
} from 'lucide-react';
import { AdminStats, AdminUserItem, UserProfile } from '../../types';
import { api } from '../../api';
import { AdminStatsCards } from './AdminStatsCards';
import { AdminUserDirectory } from './AdminUserDirectory';
import { AdminUserModals } from './AdminUserModals';

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

      {/* KPI Metric Cards Component */}
      <AdminStatsCards stats={stats} />

      {/* Users Directory Table Component */}
      <AdminUserDirectory
        users={users}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        onOpenEdit={handleOpenEdit}
        onOpenResetPassword={setResetPasswordUser}
        onOpenDelete={setDeletingUser}
        onClearFilters={() => { setSearchQuery(''); setRoleFilter('all'); setPlanFilter('all'); }}
      />

      {/* Modals Component */}
      <AdminUserModals
        editingUser={editingUser}
        onCloseEdit={() => setEditingUser(null)}
        editUserForm={editUserForm}
        setEditUserForm={setEditUserForm}
        onSaveEditUser={handleSaveEditUser}
        showCreateModal={showCreateModal}
        onCloseCreate={() => setShowCreateModal(false)}
        createUserForm={createUserForm}
        setCreateUserForm={setCreateUserForm}
        onCreateUser={handleCreateUser}
        resetPasswordUser={resetPasswordUser}
        onCloseResetPassword={() => setResetPasswordUser(null)}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        onResetPassword={handleResetPassword}
        deletingUser={deletingUser}
        onCloseDelete={() => setDeletingUser(null)}
        onDeleteUser={handleDeleteUser}
        showBroadcastModal={showBroadcastModal}
        onCloseBroadcast={() => setShowBroadcastModal(false)}
        broadcastForm={broadcastForm}
        setBroadcastForm={setBroadcastForm}
        onSendBroadcast={handleSendBroadcast}
      />
    </div>
  );
}
