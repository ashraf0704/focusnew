import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Sparkles, Volume2, VolumeX, Check, AlertCircle, Wind, FastForward, CheckSquare, Bell, BellOff, AlarmClock } from 'lucide-react';
import { Subject, Task } from '../types';

interface FocusModeProps {
  totalSeconds: number;
  selectedSound: string;
  subject: Subject;
  tasks: Task[];
  alarmTone?: string;
  alarmVolume?: number; // 0-100
  onToggleTask: (id: string) => void;
  onFinishSession: (totalMinutes: number, completed: boolean, focusScore?: number) => void;
  onCancelSession: () => void;
}

export default function FocusMode({
  totalSeconds,
  selectedSound,
  subject,
  tasks,
  alarmTone = 'singing-bowl',
  alarmVolume = 80,
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

  // Alarm state – fires when timer reaches 0
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const [liveAlarmVolume, setLiveAlarmVolume] = useState(alarmVolume);
  const alarmAudioCtxRef = useRef<AudioContext | null>(null);
  const alarmStopRef = useRef<(() => void) | null>(null);

  // Time editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editSeconds, setEditSeconds] = useState(0);

  // Audio Context Ref for procedural focus synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // ── Alarm Audio Engine ──────────────────────────────────────────────────────
  const playTimerAlarm = useCallback(() => {
    if (alarmMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!alarmAudioCtxRef.current || alarmAudioCtxRef.current.state === 'closed') {
        alarmAudioCtxRef.current = new AudioCtx();
      }
      const ctx = alarmAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      let stopped = false;
      const scheduledOscs: AudioNode[] = [];
      const vol = Math.max(0.05, liveAlarmVolume / 100);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const scheduleLoop = (startTime: number) => {
        if (stopped) return;

        if (alarmTone === 'classic-bell') {
          // Sharp ascending bell tones
          [880, 1108, 1318, 1760, 1318, 1108, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime + i * 0.16);
            env.gain.setValueAtTime(0, startTime + i * 0.16);
            env.gain.linearRampToValueAtTime(1.0, startTime + i * 0.16 + 0.04);
            env.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.16 + 0.38);
            osc.connect(env); env.connect(masterGain);
            osc.start(startTime + i * 0.16); osc.stop(startTime + i * 0.16 + 0.4);
            scheduledOscs.push(osc, env);
          });
          // Buzzer undertone
          const buzz = ctx.createOscillator();
          const buzzGain = ctx.createGain();
          buzz.type = 'sawtooth'; buzz.frequency.setValueAtTime(160, startTime);
          buzz.frequency.linearRampToValueAtTime(440, startTime + 1.0);
          buzzGain.gain.setValueAtTime(0.4, startTime);
          buzzGain.gain.linearRampToValueAtTime(0, startTime + 1.1);
          buzz.connect(buzzGain); buzzGain.connect(masterGain);
          buzz.start(startTime); buzz.stop(startTime + 1.1);
          scheduledOscs.push(buzz, buzzGain);

        } else if (alarmTone === 'singing-bowl') {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(220, startTime);
          env.gain.setValueAtTime(0.95, startTime);
          env.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);
          osc.connect(env); env.connect(masterGain);
          osc.start(startTime); osc.stop(startTime + 2.2);
          const osc2 = ctx.createOscillator();
          const env2 = ctx.createGain();
          osc2.type = 'sine'; osc2.frequency.setValueAtTime(440, startTime);
          env2.gain.setValueAtTime(0.45, startTime);
          env2.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
          osc2.connect(env2); env2.connect(masterGain);
          osc2.start(startTime); osc2.stop(startTime + 2);
          scheduledOscs.push(osc, env, osc2, env2);

        } else if (alarmTone === 'digital-chime') {
          [1046, 1318, 1568, 2093, 1568, 1318, 1046].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'square'; osc.frequency.setValueAtTime(freq, startTime + i * 0.13);
            env.gain.setValueAtTime(0, startTime + i * 0.13);
            env.gain.linearRampToValueAtTime(0.55, startTime + i * 0.13 + 0.02);
            env.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.13 + 0.28);
            osc.connect(env); env.connect(masterGain);
            osc.start(startTime + i * 0.13); osc.stop(startTime + i * 0.13 + 0.3);
            scheduledOscs.push(osc, env);
          });

        } else if (alarmTone === 'birdsong') {
          [0, 0.28, 0.52, 0.78].forEach((offset) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, startTime + offset);
            osc.frequency.exponentialRampToValueAtTime(2400, startTime + offset + 0.14);
            osc.frequency.exponentialRampToValueAtTime(1800, startTime + offset + 0.24);
            env.gain.setValueAtTime(0, startTime + offset);
            env.gain.linearRampToValueAtTime(0.7, startTime + offset + 0.03);
            env.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.25);
            osc.connect(env); env.connect(masterGain);
            osc.start(startTime + offset); osc.stop(startTime + offset + 0.28);
            scheduledOscs.push(osc, env);
          });

        } else if (alarmTone === 'ocean-wave') {
          const bufferSize = ctx.sampleRate * 2;
          const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buf.getChannelData(0);
          let last = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (last + 0.015 * white) / 1.015; last = data[i]; data[i] *= 4;
          }
          const src = ctx.createBufferSource(); src.buffer = buf;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass'; filter.frequency.value = 600;
          const env = ctx.createGain();
          env.gain.setValueAtTime(0, startTime);
          env.gain.linearRampToValueAtTime(0.9, startTime + 0.4);
          env.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
          src.connect(filter); filter.connect(env); env.connect(masterGain);
          src.start(startTime); src.stop(startTime + 2);
          scheduledOscs.push(src, env);

        } else {
          // Fallback: default ascending chime
          [880, 1108, 1318, 1760, 1318, 1108, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime + i * 0.16);
            env.gain.setValueAtTime(0, startTime + i * 0.16);
            env.gain.linearRampToValueAtTime(1.0, startTime + i * 0.16 + 0.04);
            env.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.16 + 0.38);
            osc.connect(env); env.connect(masterGain);
            osc.start(startTime + i * 0.16); osc.stop(startTime + i * 0.16 + 0.4);
            scheduledOscs.push(osc, env);
          });
        }
      };

      let iter = 0;
      const loop = () => {
        if (stopped) return;
        scheduleLoop(ctx.currentTime + 0.05);
        iter++;
        const interval = alarmTone === 'singing-bowl' || alarmTone === 'ocean-wave' ? 2400 : 1400;
        if (iter < 25) setTimeout(loop, interval);
      };
      loop();

      alarmStopRef.current = () => {
        stopped = true;
        scheduledOscs.forEach(node => { try { (node as any).stop?.(); } catch {} try { node.disconnect(); } catch {} });
        try { masterGain.disconnect(); } catch {}
      };
    } catch (e) {
      console.warn('Timer alarm error:', e);
    }
  }, [alarmMuted, alarmTone, liveAlarmVolume]);

  const stopTimerAlarm = useCallback(() => {
    if (alarmStopRef.current) {
      alarmStopRef.current();
      alarmStopRef.current = null;
    }
    setAlarmActive(false);
  }, []);

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
            // Timer completed – show alarm overlay FIRST, then finish session
            setIsPlaying(false);
            setAlarmActive(true);
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

  // Fire alarm sound whenever alarm becomes active
  useEffect(() => {
    if (alarmActive) {
      playTimerAlarm();
      // Trigger device vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([400, 200, 400, 200, 400]);
      }
    }
    return () => {
      if (!alarmActive) stopTimerAlarm();
    };
  }, [alarmActive]);

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
    stopTimerAlarm();
    setAlarmActive(false);
    const elapsedSeconds = sessionTotalSeconds - timeLeft;
    const maxMinutes = Math.ceil(sessionTotalSeconds / 60);
    const elapsedMinutes = Math.min(maxMinutes, Math.ceil(elapsedSeconds / 60));
    onFinishSession(elapsedMinutes, completed, focusScore);
  };

  const handleDismissAlarm = () => {
    stopTimerAlarm();
    // After dismissing, complete the session
    handleSessionEnd(true);
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

      {/* ── TIMER COMPLETE ALARM OVERLAY ──────────────────────────────────── */}
      <AnimatePresence>
        {alarmActive && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Pulsing red-orange backdrop */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#2d1000] to-[#0d0015]"
              animate={{ opacity: [0.92, 1, 0.92] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />

            {/* Radial alarm glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(255,80,0,0.45) 0%, transparent 65%)'
              }}
            />

            {/* Alarm content */}
            <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
              {/* Pulsing bell icon */}
              <motion.div
                animate={{ scale: [1, 1.18, 1], rotate: [-12, 12, -12, 12, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-28 h-28 rounded-full bg-orange-500/20 border-4 border-orange-500/60 flex items-center justify-center shadow-2xl"
                style={{ boxShadow: '0 0 60px rgba(255,120,0,0.6), 0 0 120px rgba(255,80,0,0.3)' }}
              >
                <AlarmClock size={52} className="text-orange-400" strokeWidth={1.8} />
              </motion.div>

              {/* Title */}
              <motion.div
                animate={{ opacity: [1, 0.75, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="space-y-2"
              >
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  ⏰ Time's Up!
                </h2>
                <p className="text-orange-300 font-bold text-base sm:text-lg">
                  Your focus session for <span className="text-white">{subject.name}</span> is complete!
                </p>
              </motion.div>

              {/* Stats row */}
              <div className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-2xl px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-mono font-black text-white">
                    {Math.ceil(sessionTotalSeconds / 60)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-orange-300 font-bold">Minutes</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-mono font-black text-white">{focusScore}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-orange-300 font-bold">Focus Score</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    +{Math.max(5, Math.round(Math.ceil(sessionTotalSeconds / 60) * 10 * (focusScore / 100)))}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-orange-300 font-bold">Points</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <motion.button
                  onClick={handleDismissAlarm}
                  whileTap={{ scale: 0.96 }}
                  className="px-8 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center gap-2"
                  style={{ boxShadow: '0 0 30px rgba(255,120,0,0.5)' }}
                  id="alarm-dismiss-btn"
                >
                  <Bell size={16} />
                  Dismiss & Save Session
                </motion.button>

                <button
                  onClick={() => {
                    setAlarmMuted(m => !m);
                    if (!alarmMuted && alarmStopRef.current) {
                      alarmStopRef.current();
                      alarmStopRef.current = null;
                    } else if (alarmMuted) {
                      playTimerAlarm();
                    }
                  }}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
                  title={alarmMuted ? 'Unmute alarm' : 'Mute alarm'}
                  id="alarm-mute-btn"
                >
                  {alarmMuted ? <BellOff size={18} /> : <Bell size={18} />}
                </button>
              </div>

              {/* Live volume slider */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Volume2 size={11} /> Alarm Volume</span>
                  <span className="font-mono text-orange-300">{liveAlarmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={liveAlarmVolume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLiveAlarmVolume(v);
                    // Restart alarm at new volume
                    if (!alarmMuted) {
                      if (alarmStopRef.current) { alarmStopRef.current(); alarmStopRef.current = null; }
                      playTimerAlarm();
                    }
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-orange-400"
                  id="alarm-volume-slider"
                />
              </div>

              <p className="text-xs text-white/40 font-medium">
                🎉 Excellent work! Keep building that focus streak.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
