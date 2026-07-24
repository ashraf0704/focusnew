import React from 'react';
import { motion } from 'motion/react';
import { 
  BookMarked, Plus, Clock, ListTodo, Trash2, RotateCcw, 
  Sparkles, CheckCircle2, Play, ChevronRight, BookOpen, GraduationCap 
} from 'lucide-react';
import { Subject, Task, StudySessionLog } from '../types';

interface ActiveSubjectsProps {
  subjects: Subject[];
  tasks: Task[];
  sessionLogs: StudySessionLog[];
  onAddSubject: (name: string, color: string, iconName: string) => void;
  onDeleteSubject: (id: string) => void;
  deletedSubjectsHistory: Subject[];
  onRestoreSubject: (subject: Subject) => void;
  onClearDeletedSubjectsHistory: () => void;
  onSelectSubjectForTimer: (subjectId: string) => void;
  onOpenSubjectModal: () => void;
}

export default function ActiveSubjects({
  subjects,
  tasks,
  sessionLogs,
  onAddSubject,
  onDeleteSubject,
  deletedSubjectsHistory,
  onRestoreSubject,
  onClearDeletedSubjectsHistory,
  onSelectSubjectForTimer,
  onOpenSubjectModal,
}: ActiveSubjectsProps) {
  
  // Compute metrics per subject
  const getSubjectMetrics = (subjectId: string) => {
    const subjectTasks = tasks.filter(t => t.subjectId === subjectId);
    const pendingTasks = subjectTasks.filter(t => !t.completed).length;
    const completedTasks = subjectTasks.filter(t => t.completed).length;

    const totalMinutes = sessionLogs
      .filter(log => log.subjectId === subjectId && log.completed)
      .reduce((acc, log) => acc + log.durationMinutes, 0);

    return { pendingTasks, completedTasks, totalMinutes, totalTasks: subjectTasks.length };
  };

  return (
    <div className="space-y-6" id="active-subjects-hub">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-brand-outline rounded-3xl p-6 shadow-xxs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] bg-brand-primary text-white font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap size={12} /> Academic Curriculum
              </span>
              <span className="text-xs font-bold text-brand-muted">• {subjects.length} Enrolled Courses</span>
            </div>
            <h1 className="font-heading font-black text-2xl tracking-tight text-brand-dark">
              Active Subjects &amp; Courses
            </h1>
            <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
              Manage your course roster, track study hours per topic, and trigger focus timers tailored to each subject.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSubjectModal}
              className="py-3 px-5 bg-brand-primary hover:opacity-95 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-xs cursor-pointer"
              id="active-subjects-add-btn"
            >
              <Plus size={16} />
              <span>Add New Subject</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Active Subjects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-extrabold text-xs text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
            <BookMarked size={14} className="text-brand-primary" /> Active Enrolled Subjects ({subjects.length})
          </h3>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white border border-dashed border-brand-outline rounded-3xl p-12 text-center text-brand-muted space-y-3">
            <BookOpen size={36} className="mx-auto text-brand-primary/40" />
            <h4 className="font-sans font-black text-sm text-brand-dark">No Active Subjects Found</h4>
            <p className="text-xs text-brand-muted max-w-md mx-auto leading-relaxed">
              Add your current college or high school subjects to start tracking tasks and focus hours.
            </p>
            <button
              onClick={onOpenSubjectModal}
              className="mt-2 py-2.5 px-5 bg-brand-primary text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <Plus size={14} /> Add First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => {
              const { pendingTasks, completedTasks, totalMinutes, totalTasks } = getSubjectMetrics(subj.id);

              return (
                <motion.div
                  key={subj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-brand-outline rounded-3xl p-5 shadow-xxs hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  {/* Subject Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-xs shrink-0"
                        style={{ backgroundColor: subj.accentColor || subj.color || '#3A5A40' }}
                      >
                        {subj.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-sans font-black text-sm text-brand-dark truncate group-hover:text-brand-primary transition">
                          {subj.name}
                        </h4>
                        <span className="text-[10px] text-brand-muted font-semibold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subj.accentColor || subj.color || '#3A5A40' }} />
                          Enrolled Course
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remove "${subj.name}" from active subjects? You can restore it anytime.`)) {
                          onDeleteSubject(subj.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Remove Subject"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Subject Metrics Bar */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-brand-outline/60 rounded-2xl p-3 text-center">
                    <div>
                      <div className="text-sm font-black text-brand-dark font-mono flex items-center justify-center gap-1">
                        <Clock size={13} className="text-brand-primary" />
                        {totalMinutes}m
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-brand-muted font-bold block mt-0.5">
                        Focus Time
                      </span>
                    </div>

                    <div className="border-l border-slate-200">
                      <div className="text-sm font-black text-brand-dark font-mono flex items-center justify-center gap-1">
                        <ListTodo size={13} className="text-brand-vibrant" />
                        {pendingTasks} / {totalTasks}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-brand-muted font-bold block mt-0.5">
                        Pending Tasks
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectSubjectForTimer(subj.id)}
                      className="flex-1 py-2.5 px-3 bg-brand-primary hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Start Focus Timer</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Deleted / Archived Subjects Restore Drawer */}
      {deletedSubjectsHistory.length > 0 && (
        <div className="bg-white border border-brand-outline rounded-3xl p-5 shadow-xxs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw size={14} className="text-amber-600" /> Archived / Removed Subjects ({deletedSubjectsHistory.length})
            </h4>
            <button
              onClick={onClearDeletedSubjectsHistory}
              className="text-[10px] text-rose-500 hover:underline font-bold"
            >
              Clear Archive
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {deletedSubjectsHistory.map(ds => (
              <div
                key={ds.id}
                className="bg-slate-50 border border-brand-outline px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-brand-dark"
              >
                <span>{ds.name}</span>
                <button
                  onClick={() => onRestoreSubject(ds)}
                  className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-500 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
