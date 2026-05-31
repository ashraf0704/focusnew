import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Play, Headphones, HelpCircle, Flame, Check, Sparkles, BookOpen, Square } from 'lucide-react';
import { Subject } from '../types';

export type PresetMode = 'pomodoro' | 'short_break' | 'long_break' | 'custom';

interface FocusTimerProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  onStartSession: (totalSeconds: number, sound: string, mode: PresetMode) => void;
  activeSession: { mode: PresetMode; totalSeconds: number; sound: string; subjectId: string } | null;
  onCancelSession: () => void;
}

export default function FocusTimer({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onStartSession,
  activeSession,
  onCancelSession,
}: FocusTimerProps) {
  const [selectedSound, setSelectedSound] = useState('rain');

  // Multi-mode custom duration states - making all modes fully customizable
  const [pomoHours, setPomoHours] = useState(0);
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);

  const [shortHours, setShortHours] = useState(0);
  const [shortMinutes, setShortMinutes] = useState(5);
  const [shortSeconds, setShortSeconds] = useState(0);

  const [longHours, setLongHours] = useState(0);
  const [longMinutes, setLongMinutes] = useState(15);
  const [longSeconds, setLongSeconds] = useState(0);

  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customSeconds, setCustomSeconds] = useState(0);

  const ambientSounds = [
    { id: 'rain', name: 'Rain Shower', icon: '🌧️', description: 'Soft, relaxing raindrops' },
    { id: 'forest', name: 'Forest Birds', icon: '🌲', description: 'Tranquil environmental stream' },
    { id: 'cafe', name: 'Espresso Cafe', icon: '☕', description: 'Low hum & gentle chatter' },
    { id: 'whitenoise', name: 'White Noise', icon: '📻', description: 'Static waves for deep work' },
    { id: 'off', name: 'Silence', icon: '🔇', description: 'Pure silent concentrate' },
  ];

  const categories = [
    {
      id: 'pomodoro' as PresetMode,
      name: 'Pomodoro Interval',
      icon: '⏱️',
      hours: pomoHours,
      setHours: setPomoHours,
      minutes: pomoMinutes,
      setMinutes: setPomoMinutes,
      seconds: pomoSeconds,
      setSeconds: setPomoSeconds,
      themeClass: 'border-[#D4A373]/30 bg-[#FAEDCD]/10',
      tagline: 'High intensity productivity focus',
    },
    {
      id: 'short_break' as PresetMode,
      name: 'Short Break Interval',
      icon: '☕',
      hours: shortHours,
      setHours: setShortHours,
      minutes: shortMinutes,
      setMinutes: setShortMinutes,
      seconds: shortSeconds,
      setSeconds: setShortSeconds,
      themeClass: 'border-[#CCD5AE]/30 bg-[#E9EDC9]/25',
      tagline: 'Quick cognitive cool down',
    },
    {
      id: 'long_break' as PresetMode,
      name: 'Long Break Interval',
      icon: '🌲',
      hours: longHours,
      setHours: setLongHours,
      minutes: longMinutes,
      setMinutes: setLongMinutes,
      seconds: longSeconds,
      setSeconds: setLongSeconds,
      themeClass: 'border-indigo-100 bg-indigo-50/20',
      tagline: 'Deep cognitive recovery period',
    },
    {
      id: 'custom' as PresetMode,
      name: 'Custom Target Range',
      icon: '⚙️',
      hours: customHours,
      setHours: setCustomHours,
      minutes: customMinutes,
      setMinutes: setCustomMinutes,
      seconds: customSeconds,
      setSeconds: setCustomSeconds,
      themeClass: 'border-brand-outline bg-[#FEFAE0]/15',
      tagline: 'Tailor-made customized duration',
    },
  ];

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  return (
    <div className="space-y-6" id="timer-configurator-deck">
      {/* Subject Picker Row */}
      <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-sans font-bold text-lg text-brand-dark">1. Choose Your Active Subject</h3>
            <p className="text-xs text-brand-muted mt-0.5">Tag your focus session to organize insights and track growth</p>
          </div>
          <span className="text-[11px] font-bold text-brand-primary bg-[#E9EDC9]/30 px-2.5 py-1 rounded-full uppercase tracking-wide">
            Required
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" id="subject-selector-grid">
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubject(sub.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all duration-300 relative group ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary/5 shadow-sm ring-1 ring-brand-primary'
                    : 'border-brand-outline bg-white hover:border-[#CCD5AE] hover:bg-brand-bg/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${sub.color}`}>
                  <BookOpen size={16} />
                </div>
                <div className="block mt-2">
                  <span className="text-xs font-bold block text-brand-dark leading-4 truncate">
                    {sub.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-primary flex items-center justify-center text-white">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Study Range / Category Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="font-sans font-bold text-lg text-brand-dark">2. Time Categories (Start & Stop)</h3>
          <p className="text-xs text-brand-muted mt-0.5">Customize, start, or stop any category of study interval independently below</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="time-categories-board">
          {categories.map((cat) => {
            const isRunningThisMode = activeSession !== null && activeSession.mode === cat.id;
            const totalSecsOfMode = (cat.hours * 3600) + (cat.minutes * 60) + cat.seconds;
            
            return (
              <div
                key={cat.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden ${cat.themeClass} ${
                  isRunningThisMode ? 'ring-2 ring-emerald-500 scale-[1.02] shadow-md border-emerald-500/50' : ''
                }`}
              >
                {/* Visual active pulse banner */}
                {isRunningThisMode && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[20px]">{cat.icon}</span>
                    {isRunningThisMode ? (
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                        Running
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-black tracking-wider text-brand-muted">
                        Adjustable
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-brand-dark leading-snug">{cat.name}</h4>
                    <p className="text-[10px] text-brand-muted line-clamp-1">{cat.tagline}</p>
                  </div>

                  {/* Micro-pills duration spinner dashboard */}
                  <div className="grid grid-cols-3 gap-1 py-1 bg-white/45 p-1.5 border border-brand-outline/40 rounded-2xl select-none">
                    {/* Hours Segment */}
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-brand-muted mb-0.5">Hour</span>
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => cat.setHours(prev => Math.max(0, prev - 1))}
                          className="w-4 h-4 rounded bg-white hover:bg-slate-100 border border-brand-outline/60 font-black flex items-center justify-center text-[10px] text-brand-muted"
                          title="Decrement hour"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs text-brand-dark min-w-[12px] text-center">
                          {cat.hours}
                        </span>
                        <button
                          type="button"
                          onClick={() => cat.setHours(prev => (prev + 1) % 24)}
                          className="w-4 h-4 rounded bg-white hover:bg-slate-100 border border-brand-outline/60 font-black flex items-center justify-center text-[10px] text-brand-muted"
                          title="Increment hour"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Minutes Segment */}
                    <div className="flex flex-col items-center border-l border-r border-[#5A5A40]/10">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-brand-muted mb-0.5">Min</span>
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => cat.setMinutes(prev => Math.max(0, prev - 1))}
                          className="w-4 h-4 rounded bg-white hover:bg-slate-100 border border-brand-outline/60 font-black flex items-center justify-center text-[10px] text-brand-muted"
                          title="Decrement minute"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs text-brand-dark min-w-[14px] text-center">
                          {cat.minutes}
                        </span>
                        <button
                          type="button"
                          onClick={() => cat.setMinutes(prev => (prev + 1) % 60)}
                          className="w-4 h-4 rounded bg-white hover:bg-slate-100 border border-brand-outline/60 font-black flex items-center justify-center text-[10px] text-brand-muted"
                          title="Increment minute"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Seconds Segment */}
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-brand-muted mb-0.5">Sec</span>
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => cat.setSeconds(prev => Math.max(0, prev - 1))}
                          className="w-4 h-4 rounded bg-white hover:bg-slate-100 border border-brand-outline/60 font-black flex items-center justify-center text-[10px] text-brand-muted"
                          title="Decrement second"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs text-brand-dark min-w-[14px] text-center">
                          {cat.seconds}
                        </span>
                        <button
                          type="button"
                          onClick={() => cat.setSeconds(prev => (prev + 1) % 60)}
                          className="w-4 h-4 rounded bg-white hover:bg-slate-100 border border-brand-outline/60 font-black flex items-center justify-center text-[10px] text-brand-muted"
                          title="Increment second"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="text-center font-mono text-[11px] font-black text-brand-dark/80 bg-white/40 border border-brand-outline/50 py-1 rounded-xl">
                    ⏱️ Total: {cat.hours.toString().padStart(2, '0')}:{cat.minutes.toString().padStart(2, '0')}:{cat.seconds.toString().padStart(2, '0')}
                  </div>

                  {/* Independent Start and Stop direct option actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (totalSecsOfMode <= 0) {
                          alert(`Please configure the ${cat.name} duration to be greater than 0 seconds before launching focus.`);
                          return;
                        }
                        onStartSession(totalSecsOfMode, selectedSound, cat.id);
                      }}
                      disabled={activeSession !== null}
                      className={`w-full py-2.5 px-1.5 text-[10px] font-sans font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 group active:scale-[0.97] cursor-pointer ${
                        isRunningThisMode
                          ? 'bg-emerald-600 text-white shadow-inner font-bold'
                          : activeSession !== null
                            ? 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                            : 'bg-brand-primary text-white hover:opacity-95 shadow-sm'
                      }`}
                      title={`Start study focus using ${cat.name}`}
                    >
                      <Play size={10} className="fill-current" />
                      {isRunningThisMode ? 'Running' : 'Start'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onCancelSession();
                      }}
                      disabled={!isRunningThisMode}
                      className={`w-full py-2.5 px-1.5 text-[10px] font-sans font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 border active:scale-[0.97] cursor-pointer ${
                        isRunningThisMode
                          ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700 shadow-sm animate-pulse'
                          : 'bg-white/50 border-brand-outline text-slate-300 cursor-not-allowed'
                      }`}
                      title={`Stop active study focus session`}
                    >
                      <Square size={10} className="fill-current" />
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ambient Soundboard Picker */}
      <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-sans font-bold text-lg text-brand-dark flex items-center gap-1.5">
            <Headphones size={20} className="text-brand-primary" />
            3. Ambient Focus Soundboard
          </h3>
          <span className="text-xs font-semibold text-brand-muted">Simulated loops</span>
        </div>
        <p className="text-xs text-brand-muted mb-5">
          Select soft auditory backdrops to mute interruptions and optimize neurological focus
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" id="soundboard-selectors">
          {ambientSounds.map((snd) => {
            const isSel = selectedSound === snd.id;
            return (
              <button
                key={snd.id}
                type="button"
                onClick={() => setSelectedSound(snd.id)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 relative group ${
                  isSel
                    ? 'border-brand-vibrant bg-brand-vibrant/5 shadow-sm ring-1 ring-brand-vibrant'
                    : 'border-brand-outline bg-white hover:border-brand-primary hover:bg-brand-bg/50'
                }`}
              >
                <div className="text-2xl mb-1.5 transition-transform duration-300 group-hover:scale-110">
                  {snd.icon}
                </div>
                <span className="text-xs font-bold text-brand-dark">{snd.name}</span>
                <span className="text-[9px] text-brand-muted mt-1 block leading-3 leading-tight font-light truncate max-w-full">
                  {snd.description}
                </span>
                {isSel && (
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-brand-vibrant flex items-center justify-center text-white">
                    <Check size={8} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global quick configuration help reset */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-brand-primary text-white rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#D4A373]/20 blur-xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-[#FAEDCD]/20 blur-xl" />

        <div className="space-y-1.5 relative z-10 text-center sm:text-left">
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <Sparkles size={16} className="text-brand-accent" />
            <span className="text-xs font-bold text-[#FEFAE0]/80 tracking-wider uppercase">Tactile Presets Configured</span>
          </div>
          <p className="text-xs text-brand-bg/90 max-w-sm">
            Focus Mode automatically centers your mind. Use separate Start and Stop buttons on any card above to adjust!
          </p>
          <div className="text-xs font-mono text-[#FEFAE0]">
            Targeting: <span className="font-bold underline">{selectedSubject.name}</span>
          </div>
        </div>

        <div className="z-10 font-sans">
          <button
            type="button"
            onClick={() => {
              setPomoHours(0); setPomoMinutes(25); setPomoSeconds(0);
              setShortHours(0); setShortMinutes(5); setShortSeconds(0);
              setLongHours(0); setLongMinutes(15); setLongSeconds(0);
              setCustomHours(0); setCustomMinutes(25); setCustomSeconds(0);
              alert("All study category timers reverted back to standard defaults (Pomodoro: 25m, Short Break: 5m, Long Break: 15m).");
            }}
            className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-sans font-black text-xs uppercase tracking-wide shadow-sm flex items-center justify-center gap-2 transition w-full sm:w-auto text-white cursor-pointer"
            id="global-stop-reset-durations-button"
            title="Reset all customised durations to original defaults"
          >
            Reset All Durations
          </button>
        </div>
      </div>
    </div>
  );
}
