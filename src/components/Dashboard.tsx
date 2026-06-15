import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Trash, Layers, Calendar, 
  Clock, AlertCircle, MessageSquareCode, 
  HelpCircle, ChevronRight, Play, Flame, 
  Bookmark, Award, Search, Sparkles, FolderKanban, ListTodo, ClipboardList
} from 'lucide-react';
import { Subject, Task, Priority, UserProfile } from '../types';
import AIFocusMonitor from './AIFocusMonitor';
import SubscriptionHub from './SubscriptionHub';

interface DashboardProps {
  subjects: Subject[];
  tasks: Task[];
  totalFocusMinutes: number;
  dailyGoal: number;
  profileName?: string;
  streakCount?: number;
  buddySpecies?: string;
  buddyPoints?: number;
  onProfileUpdated?: (profile: UserProfile) => void;
  onAddTask: (title: string, subjectId: string, priority: Priority, dueDate: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubject: (name: string, color: string, iconName: string) => void;
  onDeleteSubject?: (id: string) => void;
  deletedSubjectsHistory?: Subject[];
  onRestoreSubject?: (sub: Subject) => void;
  onClearDeletedSubjectsHistory?: () => void;
  onTriggerQuickFocus: (subjectId: string) => void;
  onOpenSubjectModal?: () => void;
}

// Keyword → YouTube video map. Matched by checking if the subject name contains any keyword.
const YOUTUBE_KEYWORD_MAP: Array<{ keywords: string[]; videos: Array<{title: string; url: string}> }> = [
  {
    keywords: ['math', 'calculus', 'algebra', 'geometry', 'statistics', 'trigonometry', 'arithmetic', 'probability'],
    videos: [
      { title: "Essence of Calculus – 3Blue1Brown", url: "https://www.youtube.com/watch?v=WUvTyaaNkzM" },
      { title: "Algebra Full Course – Khan Academy", url: "https://www.youtube.com/watch?v=LwCRRUa8yTU" },
      { title: "Statistics – Full Crash Course", url: "https://www.youtube.com/watch?v=xxpc-HPKN28" },
    ]
  },
  {
    keywords: ['computer', 'programming', 'code', 'software', 'algorithm', 'data structure', 'cs', 'python', 'java', 'web'],
    videos: [
      { title: "CS50 – Harvard Intro to Computer Science", url: "https://www.youtube.com/watch?v=8mAITcNt710" },
      { title: "Python Full Course for Beginners (2024)", url: "https://www.youtube.com/watch?v=ix9cRaBkVe0" },
      { title: "How the Internet Works in 5 Minutes", url: "https://www.youtube.com/watch?v=7_LPdttKXPc" },
    ]
  },
  {
    keywords: ['physics', 'mechanics', 'thermodynamics', 'quantum', 'electromagnetism', 'optics', 'relativity'],
    videos: [
      { title: "Map of Physics – Domain Overview", url: "https://www.youtube.com/watch?v=ZihywtixUYo" },
      { title: "Physics Full Course – Crash Course", url: "https://www.youtube.com/watch?v=b1t41Q3xRM8" },
      { title: "Understanding Quantum Mechanics", url: "https://www.youtube.com/watch?v=p7bzE1E5PMY" },
    ]
  },
  {
    keywords: ['chemistry', 'organic', 'inorganic', 'biochemistry', 'periodic', 'molecule', 'reaction', 'acid', 'base'],
    videos: [
      { title: "Chemistry Fundamentals – Atom to Molecule", url: "https://www.youtube.com/watch?v=FSyAehMdpyI" },
      { title: "Organic Chemistry Full Course", url: "https://www.youtube.com/watch?v=bSMx0NS0XfY" },
      { title: "Crash Course Chemistry (Complete)", url: "https://www.youtube.com/watch?v=uVFCOfSuPTo" },
    ]
  },
  {
    keywords: ['biology', 'genetics', 'cell', 'evolution', 'ecology', 'anatomy', 'microbiology', 'botany', 'zoology'],
    videos: [
      { title: "Biology Full Course – Crash Course", url: "https://www.youtube.com/watch?v=ea3BsRSCKV8" },
      { title: "DNA & Genetics Explained Simply", url: "https://www.youtube.com/watch?v=zwibgNGe4aY" },
      { title: "Human Anatomy – Organ Systems Overview", url: "https://www.youtube.com/watch?v=Ae4MadKPJhg" },
    ]
  },
  {
    keywords: ['history', 'civilization', 'world war', 'empire', 'ancient', 'modern history', 'revolution', 'colonial'],
    videos: [
      { title: "World History – Crash Course (Complete)", url: "https://www.youtube.com/watch?v=Yocja_N5s1I" },
      { title: "Modern History of India – Overview", url: "https://www.youtube.com/watch?v=7VT3ySE6-aI" },
      { title: "How Empires Formed and Fell – Explained", url: "https://www.youtube.com/watch?v=xuCn8ux2gbs" },
    ]
  },
  {
    keywords: ['economics', 'macro', 'micro', 'finance', 'market', 'stock', 'gdp', 'trade', 'monetary', 'fiscal'],
    videos: [
      { title: "Economics in One Lesson – Animated", url: "https://www.youtube.com/watch?v=EMEqpuJNhME" },
      { title: "Microeconomics Full Course – Crash Course", url: "https://www.youtube.com/watch?v=aO9-8zjQ7Rk" },
      { title: "How Stock Markets Work – Simply Explained", url: "https://www.youtube.com/watch?v=p7HKvqRI_Bo" },
    ]
  },
  {
    keywords: ['english', 'grammar', 'literature', 'writing', 'essay', 'vocabulary', 'language', 'ielts', 'toefl', 'reading'],
    videos: [
      { title: "English Grammar Masterclass", url: "https://www.youtube.com/watch?v=6vcIPMbKHVo" },
      { title: "How to Write an Essay – 7 Steps", url: "https://www.youtube.com/watch?v=qmSCH4gPfdE" },
      { title: "IELTS / TOEFL Speaking Tips That Work", url: "https://www.youtube.com/watch?v=9hHMiR7ZUoY" },
    ]
  },
  {
    keywords: ['design', 'ui', 'ux', 'graphic', 'figma', 'illustration', 'typography', 'color', 'visual', 'interface'],
    videos: [
      { title: "UI/UX Design Principles Every Designer Needs", url: "https://www.youtube.com/watch?v=YiLUYf4HDh4" },
      { title: "Figma Tutorial for Beginners (2024)", url: "https://www.youtube.com/watch?v=FTFaQWZBqQ8" },
      { title: "Fundamentals of Design – Full Course", url: "https://www.youtube.com/watch?v=_Hp_dI0__qE" },
    ]
  },
  {
    keywords: ['geography', 'map', 'climate', 'environment', 'earth', 'continent', 'ocean', 'population', 'urban'],
    videos: [
      { title: "Geography Now! – World Overview", url: "https://www.youtube.com/watch?v=Ph5a9MBubVM" },
      { title: "Climate Change Explained Visually", url: "https://www.youtube.com/watch?v=G4H1N_yXBiA" },
      { title: "Physical Geography Full Course", url: "https://www.youtube.com/watch?v=ZyNZNJFPVR8" },
    ]
  },
  {
    keywords: ['law', 'legal', 'constitution', 'rights', 'court', 'criminal', 'civil', 'justice', 'contract', 'tort'],
    videos: [
      { title: "Introduction to Law – Full Course", url: "https://www.youtube.com/watch?v=qmSCH4gPfdE" },
      { title: "Constitutional Law – Key Concepts", url: "https://www.youtube.com/watch?v=3bHNHAQ4nCk" },
      { title: "How the Legal System Works", url: "https://www.youtube.com/watch?v=HEZAHmg0bYA" },
    ]
  },
  {
    keywords: ['psychology', 'mental', 'behavior', 'cognitive', 'neuroscience', 'therapy', 'social', 'personality'],
    videos: [
      { title: "Intro to Psychology – Crash Course", url: "https://www.youtube.com/watch?v=vo4pMVb0R6M" },
      { title: "The Science of Well-Being – Yale", url: "https://www.youtube.com/watch?v=ZizdB0TgAVM" },
      { title: "Cognitive Psychology – Memory & Attention", url: "https://www.youtube.com/watch?v=R-sVnmmw6WY" },
    ]
  },
  {
    keywords: ['music', 'theory', 'instrument', 'harmony', 'composition', 'audio', 'sound', 'rhythm', 'notation'],
    videos: [
      { title: "Music Theory Complete – Beginner to Advanced", url: "https://www.youtube.com/watch?v=rgaTLrZGlk0" },
      { title: "How Music Works – Howard Goodall", url: "https://www.youtube.com/watch?v=LTkCQBhSGTk" },
      { title: "Learn Piano – Beginner Full Course", url: "https://www.youtube.com/watch?v=827ygD_rUFM" },
    ]
  },
];

// Get YouTube videos for a subject based on keyword matching its name
function getYouTubeVideosForSubject(subjectName: string): Array<{title: string; url: string}> {
  if (!subjectName || subjectName === 'all') return YOUTUBE_GENERAL;
  const lower = subjectName.toLowerCase();
  for (const entry of YOUTUBE_KEYWORD_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.videos;
    }
  }
  return YOUTUBE_GENERAL;
}

const YOUTUBE_GENERAL: Array<{title: string; url: string}> = [
  { title: "The Feynman Technique – Learn Anything Fast", url: "https://www.youtube.com/watch?v=_f-qkGJBPts" },
  { title: "How to Study Effectively with Spaced Repetition", url: "https://www.youtube.com/watch?v=Z-zNHHpXoMM" },
  { title: "How to Focus – Tips for Deep Work", url: "https://www.youtube.com/watch?v=Hu4Yvq-g7_Y" }
];

export default function Dashboard({
  subjects,
  tasks,
  totalFocusMinutes,
  dailyGoal,
  profileName = 'Ashraf',
  streakCount = 3,
  buddySpecies = 'fox',
  buddyPoints = 250,
  onProfileUpdated,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddSubject,
  onDeleteSubject,
  deletedSubjectsHistory,
  onRestoreSubject,
  onClearDeletedSubjectsHistory,
  onTriggerQuickFocus,
  onOpenSubjectModal,
}: DashboardProps) {
  // Filtering states
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Get YouTube videos matching selected subject's name
  const activeSubjectObj = subjects.find(s => s.id === subjectFilter);
  const activeVideos = getYouTubeVideosForSubject(activeSubjectObj ? activeSubjectObj.name : 'all');

  // Input forms states
  const [showTaskAdd, setShowTaskAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState(subjects[0]?.id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-05-22');

  const [showSubjectAdd, setShowSubjectAdd] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('bg-indigo-50 border-indigo-200 text-indigo-700');

  // Dynamic Time-of-day greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(
      newTaskTitle.trim(),
      newTaskSubjectId,
      newTaskPriority,
      newTaskDueDate
    );
    setNewTaskTitle('');
    setShowTaskAdd(false);
  };

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject(
      newSubjectName.trim(),
      newSubjectColor,
      'Bookmark'
    );
    setNewSubjectName('');
    setShowSubjectAdd(false);
  };

  // Filter processes
  const filteredTasks = tasks.filter((t) => {
    const statusMatch = 
      taskFilter === 'all' 
        ? true 
        : taskFilter === 'completed' 
          ? t.completed 
          : !t.completed;
    
    const subjectMatch = 
      subjectFilter === 'all' 
        ? true 
        : t.subjectId === subjectFilter;

    return statusMatch && subjectMatch;
  });

  // Calculate goal percentage met today
  const progressRatio = Math.min(100, Math.round((totalFocusMinutes / dailyGoal) * 100));

  const motivationalQuotes = [
    "Commitment is what transforms focus into deep expertise.",
    "Concentration isn't about ignoring things, it's about channeling force.",
    "One Pomodoro session at a time blocks distractions and compiles progress.",
    "Order brings competence. Your active time is well allocated.",
  ];

  const currentQuote = motivationalQuotes[totalFocusMinutes % motivationalQuotes.length];

  const buddyEmojis: Record<string, string> = {
    fox: '🦊',
    owl: '🦉',
    panda: '🐼',
    dog: '🐶',
    cat: '🐱',
  };

  const buddyNames: Record<string, string> = {
    fox: 'Barnaby',
    owl: 'Otis',
    panda: 'Mei',
    dog: 'Buster',
    cat: 'Pippin',
  };

  return (
    <div className="space-y-6" id="dashboard-view-wrapper">
      {/* 1. Header Banner of Capability */}
      <div className="p-6 bg-[#CCD5AE]/30 border border-[#5A5A40]/10 rounded-3xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Abstract design elements matching Natural Tones look */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-vibrant/10 via-brand-primary/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-brand-primary">
            <Sparkles size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs font-bold font-sans tracking-wide uppercase">Workspace Active</span>
          </div>
          <h2 className="font-sans font-extrabold text-brand-dark text-2xl flex items-center gap-2" id="dashboard-greeting-text">
            {getGreeting()}, {profileName} <span className="hover:scale-120 transition-transform cursor-help inline-block select-none filter drop-shadow-sm" title={`Your focus buddy companion is ${buddyNames[buddySpecies] || 'Barnaby'}`}>{buddyEmojis[buddySpecies] || '🦊'}</span>
          </h2>
          <p className="text-xs text-brand-muted italic max-w-md">
            "{currentQuote}"
          </p>
        </div>

        {/* Dynamic Streak counter summary */}
        <div className="flex items-center gap-3.5 bg-brand-vibrant/[0.1] border border-brand-vibrant/25 p-4 rounded-2xl relative z-10 self-start sm:self-center">
          <div className="w-10 h-10 rounded-full bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-primary tracking-wider block">Consistent Performance</span>
            <span className="text-base font-black text-brand-dark">{streakCount} Days Streak</span>
          </div>
        </div>
      </div>

      {/* 2. Overview bento row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Goal target indicator */}
        <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm flex flex-col justify-between h-48">
          <div>
            <h4 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Clock size={12} className="text-brand-primary" />
              Concentration Threshold
            </h4>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-dark">{totalFocusMinutes}</span>
              <span className="text-xs text-brand-muted">/ {dailyGoal} Minutes today</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-brand-muted font-medium">
              <span>Goal Progress Meter</span>
              <span className="font-bold text-brand-primary">{progressRatio}%</span>
            </div>
            {/* Soft Gray background track with loaded bar */}
            <div className="w-full bg-[#E8E4DE] h-2.5 rounded-full overflow-hidden border border-brand-outline">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressRatio}%` }}
                className="bg-brand-primary h-full rounded-full"
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>

        {/* Fast navigation tips or indicators */}
        <div className="p-6 bg-brand-accent/[0.12] border border-brand-outline rounded-3xl shadow-sm flex flex-col justify-between h-48 relative overflow-hidden">
          <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-brand-primary/5" />
          <div>
            <span className="text-xs font-black text-brand-primary uppercase tracking-wider block mb-1">Interactive Deck</span>
            <h4 className="font-sans font-bold text-base text-brand-dark">Micro Revision Active</h4>
            <p className="text-xs text-brand-muted mt-1 leading-5">
              Review memory cards for 5 minutes during breaks to maintain spatial memory cues.
            </p>
          </div>
          <span className="text-[10px] font-sans font-bold text-brand-primary hover:text-brand-vibrant flex items-center gap-1 cursor-pointer">
            Read revision principles
            <ChevronRight size={12} />
          </span>
        </div>

        {/* Cognitive Clarity Quote */}
        <div className="p-6 bg-brand-primary border border-brand-primary text-brand-bg rounded-3xl shadow-sm flex flex-col justify-between h-48">
          <div>
            <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest block mb-2">Workspace Guidelines</span>
            <h4 className="font-sans font-bold text-sm text-white leading-5">
              "Focus is a muscle. The more you reduce lateral alerts, the deeper your concentration climbs."
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-bg/80 font-mono mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-vibrant animate-ping" />
            Autonomous focus active
          </div>
        </div>
      </div>

      {/* 3. Subjects Study grid section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center" id="subjects-heading-toolbar">
          <div>
            <h3 className="font-sans font-bold text-lg text-brand-dark">Active Subjects Course Folders</h3>
            <p className="text-xs text-brand-muted mt-0.5">Click any subject to quickly start a custom study timer</p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSubjectModal && (
              <button
                type="button"
                onClick={onOpenSubjectModal}
                className="p-2.5 border border-brand-outline bg-brand-bg/50 hover:bg-brand-bg text-brand-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition select-none pointer-events-auto"
                id="change-subjects-modal-toggle"
              >
                <Sparkles size={14} className="text-brand-vibrant animate-pulse" />
                Change Subjects
              </button>
            )}
            <button
              onClick={() => setShowSubjectAdd(true)}
              className="p-2.5 border border-brand-outline bg-white hover:bg-brand-bg text-brand-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition select-none pointer-events-auto"
              id="add-subject-panel-toggle"
            >
              <Plus size={14} />
              Add Folder
            </button>
          </div>
        </div>

        {/* Add custom Subject Course floating popup */}
        {showSubjectAdd && (
          <motion.form
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleSubjectSubmit}
            className="p-4.5 bg-white border border-brand-outline rounded-2xl space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-center text-xs font-bold text-brand-dark">
              <span>New Subject Folder details</span>
              <button 
                type="button" 
                onClick={() => setShowSubjectAdd(false)} 
                className="text-brand-muted hover:text-brand-dark focus:outline-none"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              <input
                type="text"
                placeholder="Subject Name (e.g. Theoretical Biology)"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="p-2.5 border border-brand-outline rounded-lg text-xs font-semibold outline-none focus:border-brand-primary"
                required
              />
              <select
                value={newSubjectColor}
                onChange={(e) => setNewSubjectColor(e.target.value)}
                className="p-2.5 border border-brand-outline rounded-lg text-xs bg-white outline-none"
              >
                <option value="bg-[#E9EDC9] border-[#5A5A40]/10 text-[#5A5A40]">Sage Green Folder Accent</option>
                <option value="bg-[#CCD5AE]/20 border-[#CCD5AE]/50 text-[#4A4A3A]">Meadow Green Folder Accent</option>
                <option value="bg-[#F2E9E1] border-[#D4A373]/30 text-[#B87D4B]">Terracotta Clay Folder Accent</option>
                <option value="bg-[#FEFAE0] border-[#E9EDC9] text-[#7E7E63]">Yellow Tea Folder Accent</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary hover:opacity-90 text-white rounded-lg text-xs font-bold transition"
            >
              Confirm Folder Creation
            </button>
          </motion.form>
        )}

        {/* Grid display list of active subject items */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3" id="main-subjects-grid-list">
          {subjects.map((sub) => {
            const courseTasks = tasks.filter((t) => t.subjectId === sub.id);
            const activeCount = courseTasks.filter((t) => !t.completed).length;

            return (
              <div
                key={sub.id}
                className="p-4.5 bg-white border border-brand-outline rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent focus stripes as per custom layout guidelines */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: sub.accentColor || '#5A5A40' }} />

                <div className="space-y-3 pl-2.5">
                  <div className="flex justify-between items-start">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${sub.color}`}>
                      <Bookmark size={15} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeCount > 0 && (
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full truncate">
                          {activeCount} active task{activeCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSubject?.(sub.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Remove Subject"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-sm text-brand-dark tracking-tight group-hover:text-brand-primary transition-colors leading-5">
                      {sub.name}
                    </h4>
                  </div>
                </div>

                <div className="pt-4 mt-2.5 border-t border-brand-outline flex justify-end pl-2.5">
                  <button
                    onClick={() => onTriggerQuickFocus(sub.id)}
                    className="py-1.5 px-3 rounded-xl bg-brand-bg hover:bg-brand-primary hover:text-white text-[11px] font-bold text-brand-primary transition flex items-center gap-1 select-none pointer-events-auto"
                    title={`Trigger prompt focus for ${sub.name}`}
                  >
                    <Play size={10} className="fill-current" />
                    Quick Focus
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Render recently deleted subjects to restore them */}
        {deletedSubjectsHistory && deletedSubjectsHistory.length > 0 && (
          <div className="p-4 bg-slate-50 border border-brand-outline rounded-3xl space-y-2 mt-4 select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider text-brand-muted">Recently Removed Subjects History</span>
              <button 
                onClick={() => {
                  if (window.confirm("Clear all subject deletion history?")) {
                    onClearDeletedSubjectsHistory?.();
                  }
                }}
                className="text-[10px] font-black text-rose-600 hover:text-rose-800 transition cursor-pointer"
              >
                Clear History
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {deletedSubjectsHistory.map((sub) => (
                <div 
                  key={sub.id} 
                  className="px-3 py-1.5 bg-white border border-brand-outline rounded-2xl text-[11px] flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="text-brand-dark font-bold">{sub.name}</span>
                  <button
                    type="button"
                    onClick={() => onRestoreSubject?.(sub)}
                    className="px-2.5 py-1 bg-brand-primary text-white hover:bg-brand-primary/90 text-[10px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer shadow-xs active:scale-95"
                    title={`Restore "${sub.name}"`}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Tasks Workspace segment (Filters, Inputs, List tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core items column: 2 grids wide */}
        <div className="lg:col-span-2 space-y-4" id="tasks-table-cohort">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-sans font-bold text-lg text-brand-dark flex items-center gap-1.5">
                <ClipboardList size={20} className="text-brand-primary" />
                Study Task Checklist
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">Define structured milestones to maintain focus schedules</p>
            </div>

            <button
              onClick={() => setShowTaskAdd(!showTaskAdd)}
              className="py-2.5 px-4 rounded-xl bg-brand-primary hover:opacity-90 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 select-none self-start pointer-events-auto"
              id="add-task-panel-toggle"
            >
              <Plus size={15} />
              Add Task
            </button>
          </div>

          {/* Quick Task input form layout */}
          {showTaskAdd && (
            <motion.form
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleTaskSubmit}
              className="p-4 border border-brand-outline bg-white rounded-2xl space-y-4 shadow-sm"
              id="quick-task-add-form"
            >
              <div className="flex justify-between items-center font-bold text-xs text-brand-dark">
                <span>Create New Milestone Task</span>
                <button 
                  type="button" 
                  onClick={() => setShowTaskAdd(false)} 
                  className="text-brand-muted hover:text-brand-dark focus:outline-none"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="What is your target study task milestone?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 border border-brand-outline rounded-lg text-xs outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  required
                />

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted block">Course Folder</label>
                    <select
                      value={newTaskSubjectId}
                      onChange={(e) => setNewTaskSubjectId(e.target.value)}
                      className="w-full p-2.5 border border-brand-outline bg-white text-xs rounded-lg outline-none focus:border-brand-primary"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted block">Focus Level Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                      className="w-full p-2.5 border border-brand-outline bg-white text-xs rounded-lg outline-none focus:border-brand-primary"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted block">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full p-2.5 border border-brand-outline text-xs bg-white rounded-lg outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:opacity-90 transition"
                  >
                    Confirm Task
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          {/* Table Filters header */}
          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-brand-outline">
            {/* Completion filters */}
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as const).map((filter) => {
                const label = filter === 'all' ? 'All Milestones' : filter === 'completed' ? 'Completed' : 'Active Only';
                const isSel = taskFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      isSel 
                        ? 'bg-brand-primary text-white font-black' 
                        : 'text-brand-muted hover:text-brand-dark'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Subject Filters dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-muted uppercase">course:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="p-1.5 border border-brand-outline bg-white text-xs rounded-lg outline-none font-bold text-brand-muted"
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List layout of tasks */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1" id="rendered-tasks-cohort">
            {filteredTasks.length === 0 ? (
              <div className="text-center p-8 bg-white border border-brand-outline rounded-3xl text-sm text-brand-muted italic">
                No active target tasks defined matching your chosen courses or statuses. Add new ones to organize focus!
              </div>
            ) : (
              filteredTasks.map((t) => {
                const sub = subjects.find(s => s.id === t.subjectId) || subjects[subjects.length - 1];
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 bg-white border rounded-2xl shadow-xs flex items-center justify-between gap-4 group transition ${
                      t.completed 
                        ? 'border-brand-outline bg-[#F2EFE9]/40 opacity-70' 
                        : 'border-brand-outline hover:border-brand-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Interactive toggle switch checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleTask(t.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition focus:outline-none ${
                          t.completed 
                            ? 'bg-brand-vibrant border-brand-vibrant text-white' 
                            : 'border-brand-soft-border hover:border-brand-primary bg-white'
                        }`}
                        id={`task-check-${t.id}`}
                      >
                        {t.completed && <Check size={12} strokeWidth={3.5} />}
                      </button>

                      <div className="min-w-0">
                        <span className={`text-xs font-semibold block truncate leading-4 pr-2 ${
                          t.completed ? 'text-brand-muted line-through font-normal' : 'text-brand-dark'
                        }`}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[120px] uppercase font-sans ${sub.color}`}>
                            {sub.name}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-sans ${
                            t.priority === 'high' 
                              ? 'bg-rose-50 text-rose-700 font-extrabold' 
                              : t.priority === 'medium'
                                ? 'bg-amber-50 text-amber-700 font-bold'
                                : 'bg-[#EBD7FF]/10 text-brand-muted'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-brand-muted whitespace-nowrap hidden sm:inline">
                        📅 {t.dueDate}
                      </span>
                      <button
                        onClick={() => onDeleteTask(t.id)}
                        className="text-brand-muted/60 hover:text-rose-600 p-2 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Milestone"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar helper columns: 1 block wide */}
        <div className="space-y-6">
          {/* CAMERA FOCUS MONITOR */}
          <AIFocusMonitor />

          {/* YouTube Study Resources */}
          <div className="p-6 bg-white border border-brand-outline rounded-3xl space-y-3 shadow-none">
            <div className="flex items-center gap-2 text-rose-600 font-sans font-black text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse shrink-0" />
              <span>YouTube Tutorials</span>
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Direct lectures and study guides matching your active folder selection.
            </p>
            <div className="space-y-2.5 pt-1.5">
              {activeVideos.map((video, idx) => (
                <a
                  key={idx}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-rose-50/25 hover:bg-rose-50/60 border border-rose-100/50 hover:border-rose-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-brand-dark group transition-all duration-300 pointer-events-auto cursor-pointer"
                >
                  <span className="truncate pr-2 leading-snug group-hover:text-rose-700">{video.title}</span>
                  <span className="text-[10px] text-rose-600 font-extrabold uppercase shrink-0 flex items-center gap-1">
                    Play ▶
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick study metrics tracker widget */}
          <div className="p-6 bg-gradient-to-tr from-brand-primary to-brand-muted text-white rounded-3xl shadow-sm space-y-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#E9EDC9]">Daily Focus Milestone</span>
              <h4 className="font-sans font-bold text-lg mt-1">Study Streak Center</h4>
            </div>

            <p className="text-xs text-brand-bg/90 leading-5">
              Consistently completing even 1 Pomodoro session every day prevents information decay and establishes clean cognitive routines.
            </p>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-brand-accent block">Weekly Streak Progress</span>
                <span className="font-semibold text-white">Mon — Sun (3/7 active)</span>
              </div>
              <Flame size={20} className="text-brand-vibrant animate-pulse" />
            </div>
          </div>

          {/* Quick instructions panel details */}
          <div className="p-6 bg-white border border-brand-outline rounded-3xl space-y-3 shadow-none">
            <h4 className="font-sans font-black text-xs text-brand-dark uppercase tracking-wider">
              Focus Buddy Directions
            </h4>
            <div className="space-y-2 text-xs text-brand-muted leading-5">
              <div className="flex gap-2">
                <span className="text-brand-vibrant font-bold font-mono">1.</span>
                <p>Add study goals / target tasks for subjects in the left panel.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-brand-vibrant font-bold font-mono">2.</span>
                <p>Launch Pomodoro Sessions using the <strong>Focus Timer</strong> tab in the navigation suite.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-brand-vibrant font-bold font-mono">3.</span>
                <p>Customize environmental background music with our <strong>Ambient Soundboard</strong>.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-brand-vibrant font-bold font-mono">4.</span>
                <p>Revise memory cues at scheduled times with interactive <strong>Study Decks</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INDIAN SUBSCRIPTION HUB PORT */}
      <div className="pt-6 border-t border-brand-outline">
        <SubscriptionHub buddyPoints={buddyPoints} onRedeemBuddyPoints={onProfileUpdated} />
      </div>
    </div>
  );
}
