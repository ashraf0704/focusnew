import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Flame, TrendingUp, Cpu, LayoutGrid, PenTool, Percent, Calendar, Heart, Globe, Sparkles } from 'lucide-react';
import { Badge, Subject, StudySessionLog, UserProfile } from '../types';
import SubscriptionHub from './SubscriptionHub';

interface InsightsProps {
  badges: Badge[];
  subjects: Subject[];
  sessionLogs: StudySessionLog[];
  totalFocusMinutes: number;
  dailyGoal: number;
  buddyPoints: number;
  onRedeemBuddyPoints: (profile: UserProfile) => void;
}

export default function Insights({
  badges,
  subjects,
  sessionLogs,
  totalFocusMinutes,
  dailyGoal,
  buddyPoints,
  onRedeemBuddyPoints,
}: InsightsProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Simulated 7 days study minutes
  const weeklyData = [
    { day: 'Fri', mins: 45, date: 'May 15' },
    { day: 'Sat', mins: 15, date: 'May 16' },
    { day: 'Sun', mins: 0, date: 'May 17' },
    { day: 'Mon', mins: 30, date: 'May 18' },
    { day: 'Tue', mins: 60, date: 'May 19' },
    { day: 'Wed', mins: 25, date: 'May 20' },
    { day: 'Thu', mins: totalFocusMinutes, date: 'May 21 (Today)' },
  ];

  const maxMins = Math.max(...weeklyData.map(d => d.mins), 60);

  // Subject allocation builder
  const subjectTotals = subjects.map(sub => {
    // calculate total minutes from simulated logs + this session if exists
    const matchedLogs = sessionLogs.filter(l => l.subjectId === sub.id && l.completed);
    const sumMins = matchedLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    // Add default pre-filled values to look beautiful
    let defaultValue = 0;
    if (sub.id === 'subj-math') defaultValue = 75;
    else if (sub.id === 'subj-cs') defaultValue = 120;
    else if (sub.id === 'subj-design') defaultValue = 50;
    return {
      ...sub,
      minutes: sumMins + defaultValue,
    };
  });

  const totalAllMins = subjectTotals.reduce((acc, curr) => acc + curr.minutes, 1);

  // Stats summaries
  const unlockedBadges = badges.filter(b => b.unlocked);
  const goalCompletionPercent = Math.min(100, Math.round((totalFocusMinutes / dailyGoal) * 100));

  return (
    <div className="space-y-6" id="insights-statistics-board">
      {/* Upper overview counts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today target progress */}
        <div className="p-5 bg-white border border-brand-outline rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wide">Daily Target Progress</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-brand-vibrant">{totalFocusMinutes}</span>
              <span className="text-xs text-brand-muted">/ {dailyGoal} minutes</span>
            </div>
            <p className="text-[11px] text-brand-muted font-medium">Resetting in 4 hours</p>
          </div>
          <div className="relative w-14 h-14">
            {/* Visual Mini Progress circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="#E8E4DE" strokeWidth="4" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="#D4A373"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - goalCompletionPercent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-vibrant">
              {goalCompletionPercent}%
            </span>
          </div>
        </div>

        {/* Global summary stats */}
        <div className="p-5 bg-white border border-brand-outline rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wide">Consistency Rate</span>
            <Flame size={16} className="text-brand-vibrant animate-pulse" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-brand-vibrant">3 Days</span>
              <span className="text-xs text-brand-muted">unbeaten streak</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 flex gap-0.5">
              <div className="flex-1 bg-brand-vibrant h-full" />
              <div className="flex-1 bg-brand-vibrant h-full" />
              <div className="flex-1 bg-brand-vibrant h-full animate-pulse" />
              <div className="flex-1 bg-[#E8E4DE] h-full" />
              <div className="flex-1 bg-[#E8E4DE] h-full" />
            </div>
          </div>
        </div>

        {/* Total stats */}
        <div className="p-5 bg-white border border-brand-outline rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-muted uppercase tracking-wide">Global Revision Score</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-brand-primary">245 mins</span>
              <span className="text-xs text-brand-muted">total time focused</span>
            </div>
            <p className="text-[11px] text-brand-muted font-medium">
              Across {sessionLogs.length + 3} active deep-focus sessions
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E9EDC9]/35 border border-[#5A5A40]/10 text-brand-primary flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Visual analytics segment grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interactive SVGs Column 1: Weekly minutes */}
        <div className="bg-white border border-brand-outline rounded-3xl p-6 shadow-sm">
          <h4 className="font-sans font-bold text-base text-brand-dark mb-1">Weekly Focus Trends</h4>
          <p className="text-xs text-brand-muted mb-6">Aggregate concentration periods (minutes) calculated daily</p>

          {/* Interactive pure SVG chart */}
          <div className="relative h-44 w-full flex items-end justify-between font-mono" id="weekly-trends-svg-chart">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* grid lines */}
              <line x1="0" y1="40" x2="100%" y2="40" stroke="#E8E4DE" strokeDasharray="3,3" />
              <line x1="0" y1="90" x2="100%" y2="90" stroke="#E8E4DE" strokeDasharray="3,3" />
              <line x1="0" y1="140" x2="100%" y2="140" stroke="#E8E4DE" strokeDasharray="3,3" />
            </svg>

            {weeklyData.map((dayData, i) => {
              const heightPct = (dayData.mins / maxMins) * 110; // scaled height
              const isToday = dayData.day === 'Thu';
              const isHovered = hoveredBar === i;

              return (
                <div
                  key={dayData.day}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex flex-col items-center flex-1 cursor-pointer group px-2 z-10 relative"
                >
                  {/* Tooltip on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: -15 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute -top-10 bg-brand-dark text-white font-sans text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md whitespace-nowrap z-20 pointer-events-none animate-fade-in"
                      >
                        {dayData.mins} Mins on {dayData.date}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Visual block bar graph */}
                  <div className="w-full flex items-end justify-center h-28">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, heightPct)}px` }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className={`w-4 sm:w-6 rounded-t-md transition-all duration-200 ${
                        isToday 
                          ? 'bg-brand-primary opacity-100 shadow-[0_2px_8px_rgba(90,90,64,0.2)]' 
                          : isHovered 
                            ? 'bg-brand-vibrant opacity-90' 
                            : 'bg-[#CCD5AE]/50'
                      }`}
                    />
                  </div>

                  <span className={`text-[10px] sm:text-xs font-sans mt-2 block ${
                    isToday ? 'text-brand-primary font-extrabold' : 'text-brand-muted font-medium'
                  }`}>
                    {dayData.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive SVGs Column 2: Subject allocation distributions */}
        <div className="bg-white border border-brand-outline rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h4 className="font-sans font-bold text-base text-brand-dark mb-1">Subject Time Allocation</h4>
            <p className="text-xs text-brand-muted">Neurological study distribution breakdown by focus course folder</p>
          </div>

          <div className="space-y-3.5">
            {subjectTotals.map(sub => {
              const portionPct = Math.round((sub.minutes / totalAllMins) * 100);
              return (
                <div key={sub.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-brand-dark">
                      <span className="w-2.5 h-2.5 rounded bg-brand-bg" style={{ backgroundColor: sub.accentColor }} />
                      <span className="truncate max-w-[180px]">{sub.name}</span>
                    </div>
                    <span className="text-brand-muted font-mono">
                      {sub.minutes} mins <span className="text-brand-soft-border">({portionPct}%)</span>
                    </span>
                  </div>
                  {/* Progress Line bar block */}
                  <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden border border-brand-outline">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${portionPct}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: sub.accentColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badges and milestones showcase board */}
      <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h4 className="font-sans font-bold text-lg text-brand-dark flex items-center gap-1.5">
              <Award className="text-brand-vibrant" size={20} />
              Scholar Accomplishments & Credentials
            </h4>
            <p className="text-xs text-brand-muted mt-0.5">Simulated unlock milestones for study targets</p>
          </div>
          <span className="text-[11px] font-bold text-brand-primary bg-[#E9EDC9]/40 border border-[#5A5A40]/10 px-2.5 py-1 rounded-full uppercase">
            {unlockedBadges.length} / {badges.length} Unlocked
          </span>
        </div>

        {/* Badge inventory grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5" id="badges-inventory-grid">
          {badges.map(b => {
            const isUnlocked = b.unlocked;
            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center justify-between group h-40 transition-all duration-300 hover:scale-[1.02] ${
                  isUnlocked
                    ? 'border-brand-vibrant bg-[#D4A373]/5 shadow-sm'
                    : 'border-brand-outline bg-brand-bg/40 opacity-50'
                }`}
              >
                {/* Badge visual icon disk */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 ${
                  isUnlocked 
                    ? 'bg-[#D4A373]/20 text-brand-vibrant' 
                    : 'bg-brand-soft-border text-brand-muted'
                }`}>
                  <Award size={24} />
                </div>

                <div className="space-y-1 w-full">
                  <span className={`text-xs font-sans font-bold block truncate max-w-full ${
                    isUnlocked ? 'text-brand-dark' : 'text-brand-muted'
                  }`}>
                    {b.title}
                  </span>
                  <p className="text-[9px] text-brand-muted leading-3 leading-tight line-clamp-2">
                    {b.description}
                  </p>
                </div>

                {isUnlocked ? (
                  <span className="text-[8px] font-bold font-mono tracking-wider text-brand-vibrant bg-[#D4A373]/15 px-2 py-0.5 rounded uppercase">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[8px] font-bold font-mono text-brand-muted tracking-wide uppercase">
                    Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* INDIAN SUBSCRIPTION OPTION BELOW INSIGHTS & GROWTH */}
      <div className="pt-6 border-t border-brand-outline">
        <SubscriptionHub buddyPoints={buddyPoints} onRedeemBuddyPoints={onRedeemBuddyPoints} />
      </div>
    </div>
  );
}
