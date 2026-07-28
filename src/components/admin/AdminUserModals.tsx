import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, UserPlus, Key, AlertTriangle, Send, X } from 'lucide-react';
import { AdminUserItem } from '../../types';

interface AdminUserModalsProps {
  editingUser: AdminUserItem | null;
  onCloseEdit: () => void;
  editUserForm: {
    fullName: string;
    email: string;
    role: 'user' | 'admin';
    subscriptionPlan: 'free' | 'pro' | 'guru';
    buddyPoints: number;
    streak: number;
    dailyGoalMinutes: number;
  };
  setEditUserForm: React.Dispatch<React.SetStateAction<AdminUserModalsProps['editUserForm']>>;
  onSaveEditUser: (e: React.FormEvent) => void;

  showCreateModal: boolean;
  onCloseCreate: () => void;
  createUserForm: {
    fullName: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    subscriptionPlan: 'free' | 'pro' | 'guru';
    dailyGoal: number;
  };
  setCreateUserForm: React.Dispatch<React.SetStateAction<AdminUserModalsProps['createUserForm']>>;
  onCreateUser: (e: React.FormEvent) => void;

  resetPasswordUser: AdminUserItem | null;
  onCloseResetPassword: () => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  onResetPassword: (e: React.FormEvent) => void;

  deletingUser: AdminUserItem | null;
  onCloseDelete: () => void;
  onDeleteUser: () => void;

  showBroadcastModal: boolean;
  onCloseBroadcast: () => void;
  broadcastForm: {
    title: string;
    message: string;
    priority: 'normal' | 'high';
  };
  setBroadcastForm: React.Dispatch<React.SetStateAction<AdminUserModalsProps['broadcastForm']>>;
  onSendBroadcast: (e: React.FormEvent) => void;
}

export const AdminUserModals: React.FC<AdminUserModalsProps> = ({
  editingUser,
  onCloseEdit,
  editUserForm,
  setEditUserForm,
  onSaveEditUser,
  showCreateModal,
  onCloseCreate,
  createUserForm,
  setCreateUserForm,
  onCreateUser,
  resetPasswordUser,
  onCloseResetPassword,
  newPassword,
  setNewPassword,
  onResetPassword,
  deletingUser,
  onCloseDelete,
  onDeleteUser,
  showBroadcastModal,
  onCloseBroadcast,
  broadcastForm,
  setBroadcastForm,
  onSendBroadcast,
}) => {
  return (
    <>
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
                <button onClick={onCloseEdit} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={onSaveEditUser} className="space-y-4 text-xs">
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
                    onClick={onCloseEdit}
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
                <button onClick={onCloseCreate} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={onCreateUser} className="space-y-4 text-xs">
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
                    onClick={onCloseCreate}
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
                <button onClick={onCloseResetPassword} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={onResetPassword} className="space-y-4 text-xs">
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
                    onClick={onCloseResetPassword}
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
                  onClick={onCloseDelete}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDeleteUser}
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
                <button onClick={onCloseBroadcast} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={onSendBroadcast} className="space-y-4 text-xs">
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
                    onClick={onCloseBroadcast}
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
    </>
  );
};
