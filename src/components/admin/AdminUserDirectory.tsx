import React from 'react';
import { Users, Search, Edit3, Key, Trash2, ShieldCheck, Crown, Zap, Flame } from 'lucide-react';
import { AdminUserItem } from '../../types';

interface AdminUserDirectoryProps {
  users: AdminUserItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  roleFilter: 'all' | 'admin' | 'user';
  onRoleFilterChange: (val: 'all' | 'admin' | 'user') => void;
  planFilter: 'all' | 'free' | 'pro' | 'guru';
  onPlanFilterChange: (val: 'all' | 'free' | 'pro' | 'guru') => void;
  onOpenEdit: (user: AdminUserItem) => void;
  onOpenResetPassword: (user: AdminUserItem) => void;
  onOpenDelete: (user: AdminUserItem) => void;
  onClearFilters: () => void;
}

export const AdminUserDirectory: React.FC<AdminUserDirectoryProps> = ({
  users,
  loading,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  planFilter,
  onPlanFilterChange,
  onOpenEdit,
  onOpenResetPassword,
  onOpenDelete,
  onClearFilters,
}) => {
  return (
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
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-vibrant"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => onRoleFilterChange(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-vibrant"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Users Only</option>
          </select>

          <select
            value={planFilter}
            onChange={e => onPlanFilterChange(e.target.value as any)}
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
            onClick={onClearFilters}
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
                          onClick={() => onOpenEdit(user)}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit User Details & Permissions"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => onOpenResetPassword(user)}
                          className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition cursor-pointer"
                          title="Reset User Password"
                        >
                          <Key size={14} />
                        </button>

                        <button
                          onClick={() => onOpenDelete(user)}
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
  );
};
