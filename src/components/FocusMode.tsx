import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Sparkles, Volume2, VolumeX, Check, AlertCircle, Wind, FastForward, CheckSquare } from 'lucide-react';
import { Subject, Task } from '../types';

interface FocusModeProps {
  totalSeconds: number;
  selectedSound: string;
  subject: Subject;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onFinishSession: (totalMinutes: number, completed: boolean, focusScore?: number) => void;
  onCancelSession: () => void;
}

export default function FocusMode({
  totalSeconds,
  selectedSound,
  subject,
  tasks,
  onToggleTask,
  onFinishSession,
  onCancelSession,
}: FocusModeProps) {
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(totalSeconds);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(60);
  const [isMuted, setIsMuted] = useState(false);
  const [breathingMessage, setBreathingMessage] = useState('Inhale deeply...');
  const [showBreathingTrainer, setShowBreathingTrainer] = useState(true);

  const [focusScore, setFocusScore] = useState<number>(100);

  // Time editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editSeconds, setEditSeconds] = useState(0);

  // Audio Context Ref for procedural focus synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Filter tasks specific to this session subjectId
  const sessionTasks = tasks.filter(t => t.subjectId === subject.id);

  // Progress calculations
  const progressPercent = sessionTotalSeconds > 0 ? ((sessionTotalSeconds - timeLeft) / sessionTotalSeconds) * 100 : 0;
  const radius = 90;
  const strokeDashoffset = 2 * Math.PI * radius * (1 - progressPercent / 100);

  // Standard countdown interval
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionEnd(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft]);

  // Breathing message generator cycle (6-second frequency)
  useEffect(() => {
    let interval: any = null;
    let turn = 0;
    if (isPlaying) {
      interval = setInterval(() => {
        setBreathingMessage(turn === 0 ? 'Hold focus gently...' : turn === 1 ? 'Exhale cognitive stress...' : 'Inhale deeply...');
        // Mindful breath execution slowly restores brain focus score up to 100%!
        setFocusScore(prev => Math.min(100, prev + 2));
        turn = (turn + 1) % 3;
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Procedural focuses sound generator (Web Audio API)
  useEffect(() => {
    if (selectedSound !== 'off' && isPlaying && !isMuted) {
      setupProceduralSound();
    } else {
      stopProceduralSound();
    }
    return () => {
      stopProceduralSound();
    };
  }, [selectedSound, isPlaying, isMuted]);

  // Adjust output gain node
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const dbVolume = isMuted ? 0 : volume / 100;
      gainNodeRef.current.gain.setValueAtTime(dbVolume * 0.15, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted]);

  const setupProceduralSound = () => {
    try {
      if (audioCtxRef.current) {
        stopProceduralSound();
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNodeRef.current = gainNode;

      const dbVolume = isMuted ? 0 : volume / 100;
      gainNode.gain.setValueAtTime(dbVolume * 0.15, ctx.currentTime);

      if (selectedSound === 'whitenoise' || selectedSound === 'rain') {
        // Create custom organic brownian-like rain noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Apply low-pass filter to simulate rain or brownian sound
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain boost for filter compensation
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Filters to replicate falling rain acoustics
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = selectedSound === 'rain' ? 800 : 1800;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start(0);
        noiseNodeRef.current = whiteNoise;
      } else if (selectedSound === 'forest' || selectedSound === 'cafe') {
        // Create a relaxing low chord wave representing focus synths
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(selectedSound === 'cafe' ? 120 : 160, ctx.currentTime); // low hum
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(selectedSound === 'cafe' ? 180 : 240, ctx.currentTime); // soft overtone
        
        // Add low frequency oscillator (LFO) for breathing sensation
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.15; // ultra-low rate
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 3;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        lfo.start(0);
        osc.start(0);
        osc2.start(0);

        noiseNodeRef.current = osc; // store reference to stop later
      }
    } catch (e) {
      console.warn('Audio Context block occurred:', e);
    }
  };

  const stopProceduralSound = () => {
    try {
      if (noiseNodeRef.current) {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    } catch (e) {
      // safe bypass
    }
  };

  const handleSessionEnd = (completed: boolean) => {
    stopProceduralSound();
    const elapsedSeconds = sessionTotalSeconds - timeLeft;
    const maxMinutes = Math.ceil(sessionTotalSeconds / 60);
    const elapsedMinutes = Math.min(maxMinutes, Math.ceil(elapsedSeconds / 60));
    onFinishSession(elapsedMinutes, completed, focusScore);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEditClick = () => {
    setIsPlaying(false); // Pause while editing
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    setEditHours(h);
    setEditMinutes(m);
    setEditSeconds(s);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const totalSecs = (editHours * 3600) + (editMinutes * 60) + editSeconds;
    if (totalSecs > 0) {
      setSessionTotalSeconds(totalSecs);
      setTimeLeft(totalSecs);
    }
    setIsEditing(false);
  };

  // Skip simulation helper (excellent for development auditing and user convenience to test stats)
  const handleFastForward = () => {
    if (timeLeft > 10) {
      setTimeLeft(prev => Math.max(5, prev - 60)); // jump 1 minute forward
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg z-50 overflow-y-auto px-6 py-12 flex flex-col justify-between select-none">
      {/* Immersive radial glow centering the clock coordinates */}
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full bg-[#CCD5AE]/20 blur-[120px] pointer-events-none" />

      {/* Close and subject badge header bar */}
      <div className="max-w-[550px] w-full mx-auto flex justify-between items-center z-10">
        <button
          onClick={onCancelSession}
          className="px-3.5 py-1.5 rounded-xl border border-brand-outline bg-white text-brand-muted hover:text-rose-600 hover:border-rose-200 hover:bg-rose-100/30 text-xs font-bold transition flex items-center gap-1 focus:outline-none shadow-sm"
        >
          <Square size={12} className="fill-current" />
          Abandon Session
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-vibrant animate-pulse" />
          <span className="text-xs font-sans font-bold text-brand-dark bg-white border border-brand-outline px-3 py-1.5 rounded-xl shadow-sm">
            {subject.name}
          </span>
        </div>
      </div>

      {/* Concentrated Focal center Column */}
      <div className="my-auto max-w-[500px] w-full mx-auto text-center py-6 z-10 space-y-8 flex flex-col items-center">
        {/* SVG Circular Ring Coordinates */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-brand-outline fill-transparent"
              strokeWidth="6"
            />
            {/* Progress Active Ring overlay */}
            <motion.circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-brand-primary fill-transparent"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * radius}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3 }}
            />
          </svg>

          {/* Time text coordinates block inside circle or the inline editor */}
          {isEditing ? (
            <div className="absolute flex flex-col items-center justify-center space-y-2 z-20 px-4 w-full">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary">Edit Duration</span>
              <div className="flex items-center gap-1 font-mono text-lg font-bold text-brand-dark" id="timer-inline-edit-fields">
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={2}
                    value={editHours.toString().padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setEditHours(Math.max(0, Math.min(23, val)));
                    }}
                    className="w-9 h-8 text-center bg-white border border-brand-outline rounded-lg font-black text-sm focus:ring-1 focus:ring-brand-primary focus:outline-none"
                    title="Hours"
                  />
                  <span className="text-[8px] uppercase text-brand-muted mt-1 font-sans">hr</span>
                </div>
                <span className="relative bottom-3">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={2}
                    value={editMinutes.toString().padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setEditMinutes(Math.max(0, Math.min(59, val)));
                    }}
                    className="w-9 h-8 text-center bg-white border border-brand-outline rounded-lg font-black text-sm focus:ring-1 focus:ring-brand-primary focus:outline-none"
                    title="Minutes"
                  />
                  <span className="text-[8px] uppercase text-brand-muted mt-1 font-sans">min</span>
                </div>
                <span className="relative bottom-3">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={2}
                    value={editSeconds.toString().padStart(2, '0')}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setEditSeconds(Math.max(0, Math.min(59, val)));
                    }}
                    className="w-9 h-8 text-center bg-white border border-brand-outline rounded-lg font-black text-sm focus:ring-1 focus:ring-brand-primary focus:outline-none"
                    title="Seconds"
                  />
                  <span className="text-[8px] uppercase text-brand-muted mt-1 font-sans">sec</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 text-[10px] bg-brand-primary text-white rounded-lg font-bold hover:opacity-90 active:scale-95 transition pointer-events-auto"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[10px] bg-white border border-brand-outline text-brand-muted rounded-lg font-bold hover:bg-brand-bg active:scale-95 transition pointer-events-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="absolute flex flex-col items-center justify-center space-y-1 cursor-pointer group pointer-events-auto select-none"
              onClick={handleEditClick}
              title="Click numbers to edit timer directly"
            >
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-brand-dark group-hover:text-brand-primary transition-colors duration-200" id="focus-countdown-numbers">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[9px] text-brand-muted/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 block text-center">
                ✎ Click to edit
              </span>
              <div className="flex items-center gap-1.5 bg-[#E9EDC9]/35 border border-[#5A5A40]/10 px-2.5 py-0.5 rounded-full mt-1">
                <Sparkles size={11} className="text-brand-primary animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-[9px] font-black tracking-widest text-brand-primary uppercase">
                  {isPlaying ? 'Studying' : 'Paused'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Focus & Buddy Points Tracker Dashboard */}
        <div className="w-full max-w-[340px] bg-brand-vibrant/5 border border-brand-vibrant/20 rounded-2xl p-3.5 space-y-2.5 shadow-xs text-center select-none animate-fade-in">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-extrabold text-[#7C5A38] uppercase tracking-wider flex items-center gap-1">
              🎯 Focal Concentration Score
            </span>
            <span className="font-mono font-black text-brand-vibrant bg-white shadow-xxs rounded-lg px-2 py-0.5 border border-brand-outline">
              {focusScore}%
            </span>
          </div>

          {/* Indicator graphical row */}
          <div className="w-full bg-[#CCD5AE]/30 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-brand-vibrant h-full transition-all duration-300"
              style={{ width: `${focusScore}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <span className="text-brand-muted font-medium">
              Accumulated Reward: <strong className="text-brand-dark font-mono font-bold">+{Math.max(5, Math.round(Math.ceil((sessionTotalSeconds - timeLeft) / 60) * 10 * (focusScore / 100)))} Pts</strong>
            </span>
            <span className="text-[9px] text-[#7C5A38] bg-white border border-brand-vibrant/10 rounded px-1.5 py-0.5">
              10 Pts × min × %
            </span>
          </div>
        </div>

        {/* Central Study controls toolbar - Custom dynamic controllers with explicit Start and Stop */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 sm:gap-3 bg-white border border-brand-outline p-3 rounded-2xl shadow-sm">
            {/* Start options button */}
            <button
              onClick={() => setIsPlaying(true)}
              disabled={isPlaying || isEditing}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition shadow-sm pointer-events-auto ${
                isPlaying 
                  ? 'bg-slate-55 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-brand-primary border-brand-primary text-white hover:opacity-95 transform active:scale-95'
              }`}
              title="Start / Resume Countdown"
              id="focus-timer-start-btn"
            >
              <Play size={13} className="fill-current" />
              Start
            </button>
  
            {/* Pause options button */}
            <button
              onClick={() => {
                setIsPlaying(false);
                // Pause drops brain focus slightly by 5 pts
                setFocusScore(prev => Math.max(35, prev - 5));
              }}
              disabled={!isPlaying || isEditing}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition shadow-sm pointer-events-auto ${
                !isPlaying
                  ? 'bg-slate-55 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white border-brand-outline text-brand-dark hover:bg-[#CCD5AE]/10 transform active:scale-95'
              }`}
              title="Pause Countdown"
              id="focus-timer-pause-btn"
            >
              <Pause size={13} className="fill-current" />
              Pause
            </button>
  
            {/* Stop / Reset option button */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setTimeLeft(sessionTotalSeconds);
              }}
              disabled={isEditing}
              className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100/50 flex items-center gap-1.5 text-xs font-bold transition shadow-sm pointer-events-auto transform active:scale-95"
              title="Stop and Reset duration"
              id="focus-timer-stop-btn"
            >
              <Square size={11} className="fill-current" />
              Stop
            </button>
  
            {/* Separator */}
            <div className="h-6 w-px bg-brand-outline" />

            {/* Fast forward duration helper */}
            <button
              onClick={handleFastForward}
              disabled={isEditing}
              className="w-10 h-10 rounded-xl bg-white border border-brand-outline text-brand-muted hover:text-brand-primary hover:border-brand-primary hover:bg-[#E9EDC9]/20 flex items-center justify-center transition shadow-sm pointer-events-auto disabled:opacity-50"
              title="Fast forward 1 min"
            >
              <FastForward size={14} />
            </button>
  
            {/* Direct successful checkout */}
            <button
              onClick={() => handleSessionEnd(true)}
              disabled={isEditing}
              className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition shadow-sm pointer-events-auto disabled:opacity-50"
              title="Complete session now"
            >
              <Check size={16} strokeWidth={2.5} />
            </button>
          </div>
          <span className="text-[10px] text-brand-muted/80 font-sans tracking-wide">
            💡 "Stop" pauses countdown and resets time back to set duration. Click clock numbers to edit time.
          </span>
        </div>

        {/* Custom Breathing Coordination Node */}
        <div className="w-full max-w-[360px] bg-white border border-brand-outline rounded-3xl p-5 shadow-sm">
          <button 
            type="button"
            onClick={() => setShowBreathingTrainer(!showBreathingTrainer)}
            className="w-full flex justify-between items-center text-xs font-bold text-brand-dark focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <Wind size={14} className="text-brand-primary animate-pulse" />
              Mindful Breathing Assist
            </span>
            <span className="text-[10px] text-brand-muted font-normal">
              {showBreathingTrainer ? 'Collapse' : 'Expand'}
            </span>
          </button>

          <AnimatePresence>
            {showBreathingTrainer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden text-center space-y-4 pt-4"
              >
                {/* Expanding circle representation */}
                <div className="h-16 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#CCD5AE]/20 flex items-center justify-center relative">
                    <div className="w-14 h-14 rounded-full bg-[#CCD5AE]/10 absolute breathing-node" />
                    <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center z-10 text-xs">
                      🧘
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-brand-dark min-h-4">
                  {breathingMessage}
                </div>
                <p className="text-[10px] text-brand-muted">
                  Synch key inhalations with node expansion to relieve study fatigue
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Soundtrack Volume indicator */}
        {selectedSound !== 'off' && (
          <div className="w-full max-w-[320px] bg-[#E9EDC9]/20 border border-brand-outline rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-brand-primary hover:text-brand-vibrant transition"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] text-brand-muted font-bold uppercase truncate max-w-[70px]">
                {selectedSound}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-[#CCD5AE] rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-brand-muted min-w-8 text-right">
              {isMuted ? 'Muted' : `${volume}%`}
            </span>
          </div>
        )}
      </div>

      {/* Task isolation panel at bottom coordinates */}
      <div className="max-w-[440px] w-full mx-auto z-10 mt-6 bg-white border border-brand-outline rounded-3xl p-5 shadow-sm">
        <h4 className="font-sans font-bold text-xs text-brand-muted tracking-wider uppercase mb-3 flex items-center gap-1">
          <CheckSquare size={13} className="text-brand-primary" />
          Target Checklist for This Session
        </h4>
        {sessionTasks.length === 0 ? (
          <div className="text-center p-3 text-xs text-brand-muted italic">
            No specific study study tasks created for {subject.name} yet. Feel free to concentrate generally.
          </div>
        ) : (
          <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
            {sessionTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  onToggleTask(t.id);
                  if (!t.completed) {
                    // Completing target tasks triggers points boost!
                    setFocusScore(prev => Math.min(100, prev + 10));
                  } else {
                    setFocusScore(prev => Math.max(35, prev - 5));
                  }
                }}
                className={`p-2.5 rounded-lg border text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  t.completed
                    ? 'bg-brand-bg border-emerald-100 text-brand-muted line-through'
                    : 'bg-white border-brand-outline hover:bg-brand-bg text-brand-dark'
                }`}
              >
                <span className="truncate pr-4">{t.title}</span>
                <div className={`w-4 class-toggle h-4 rounded-full border flex items-center justify-center ${
                  t.completed ? 'bg-brand-vibrant border-brand-vibrant text-white' : 'border-brand-soft-border'
                }`}>
                  {t.completed && <Check size={10} strokeWidth={3} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
