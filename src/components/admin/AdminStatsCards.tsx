import React from 'react';
import { Users, Clock, Flame, Crown } from 'lucide-react';
import { AdminStats } from '../../types';

interface AdminStatsCardsProps {
  stats: AdminStats | null;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Users */}
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

      {/* Total Focus Hours */}
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

      {/* Active Students Today */}
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

      {/* Subscriptions Breakdown */}
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
  );
};
