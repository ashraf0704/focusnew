/**
 * alarmUtils.ts
 * Shared utility for generating loud alarm sounds via Web Audio API.
 * Used by FocusMode (timer completion) and AIFocusMonitor (eye state detection).
 */

/** Play a loud repeating alarm using Web Audio API.
 *  Returns a stop function to silence the alarm. */
export function playLoudAlarm(
  audioCtxRef: React.MutableRefObject<AudioContext | null>,
  type: 'timer_complete' | 'eye_warning' = 'timer_complete'
): () => void {
  let stopped = false;
  let scheduledNodes: AudioNode[] = [];

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return () => {};

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const masterGain = ctx.createGain();
    // Max volume – this is intentionally LOUD
    masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
    masterGain.connect(ctx.destination);
    scheduledNodes.push(masterGain);

    if (type === 'timer_complete') {
      // ─────────────────────────────────────────────
      // TIMER COMPLETE: triumphant repeating siren
      // Three-tone ascending chime loop
      // ─────────────────────────────────────────────
      const scheduleChime = (startTime: number) => {
        const freqs = [880, 1100, 1320, 1100, 880]; // ascending-descending bell
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const envGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime + i * 0.18);
          envGain.gain.setValueAtTime(0, startTime + i * 0.18);
          envGain.gain.linearRampToValueAtTime(0.9, startTime + i * 0.18 + 0.04);
          envGain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.18 + 0.35);
          osc.connect(envGain);
          envGain.connect(masterGain);
          osc.start(startTime + i * 0.18);
          osc.stop(startTime + i * 0.18 + 0.38);
          scheduledNodes.push(osc, envGain);
        });

        // Add a harsh buzzer undertone for urgency
        const buzzer = ctx.createOscillator();
        const buzzerGain = ctx.createGain();
        buzzer.type = 'sawtooth';
        buzzer.frequency.setValueAtTime(220, startTime);
        buzzer.frequency.linearRampToValueAtTime(440, startTime + 0.8);
        buzzerGain.gain.setValueAtTime(0.3, startTime);
        buzzerGain.gain.linearRampToValueAtTime(0, startTime + 0.9);
        buzzer.connect(buzzerGain);
        buzzerGain.connect(masterGain);
        buzzer.start(startTime);
        buzzer.stop(startTime + 0.9);
        scheduledNodes.push(buzzer, buzzerGain);
      };

      // Schedule 8 chime bursts, 1.2 seconds apart (loop repeats via recursive timeout)
      let iteration = 0;
      const scheduleNext = () => {
        if (stopped) return;
        const t = ctx.currentTime + 0.05;
        scheduleChime(t);
        iteration++;
        if (iteration < 20) { // keep playing up to 24 seconds
          setTimeout(scheduleNext, 1200);
        }
      };
      scheduleNext();

    } else {
      // ─────────────────────────────────────────────
      // EYE WARNING: harsh repeating alert beeps
      // ─────────────────────────────────────────────
      const scheduleBeep = (startTime: number) => {
        [0, 0.25, 0.5].forEach(offset => {
          const osc = ctx.createOscillator();
          const envGain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1400, startTime + offset);
          osc.frequency.linearRampToValueAtTime(900, startTime + offset + 0.12);
          envGain.gain.setValueAtTime(0.85, startTime + offset);
          envGain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.22);
          osc.connect(envGain);
          envGain.connect(masterGain);
          osc.start(startTime + offset);
          osc.stop(startTime + offset + 0.22);
          scheduledNodes.push(osc, envGain);
        });
      };

      let iter = 0;
      const scheduleNext = () => {
        if (stopped) return;
        scheduleBeep(ctx.currentTime + 0.05);
        iter++;
        if (iter < 30) {
          setTimeout(scheduleNext, 800);
        }
      };
      scheduleNext();
    }
  } catch (e) {
    console.warn('Alarm audio error:', e);
  }

  return () => {
    stopped = true;
    scheduledNodes.forEach(node => {
      try { (node as any).stop?.(); } catch {}
      try { node.disconnect(); } catch {}
    });
    scheduledNodes = [];
  };
}

// Needed for React.MutableRefObject type in the utility
import React from 'react';
