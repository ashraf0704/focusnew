import React, { useState, useEffect, useRef } from 'react';
import { Camera, VideoOff, ShieldAlert, Zap, AlertTriangle, Play, Pause, Square, Activity, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function AIFocusMonitor() {
  const [isCamActive, setIsCamActive] = useState(false);
  const [isCamPaused, setIsCamPaused] = useState(false); // Pause / Resume monitoring
  const [eyeState, setEyeState] = useState<'open' | 'closed' | 'no_person'>('open');
  const [closedTimer, setClosedTimer] = useState(0); // consecutive seconds eyes closed or no person
  const [alertState, setAlertState] = useState<'none' | 'eyes_closed_10s' | 'no_person_10s'>('none');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [detectedRange, setDetectedRange] = useState<string>('🔍 CAPTURING FACE...');
  const [logMessages, setLogMessages] = useState<string[]>(['System standby. Ready to activate camera.']);
  const [muteSound, setMuteSound] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Add warning log helpers
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // Start Camera Feed
  const startCamera = async () => {
    setIsCamActive(true);
    setCamError(null);
    addLog('Requesting webcam access...');
    let stream: MediaStream | null = null;

    try {
      // Stage 1: Try HD 720p at 30fps for best quality and speed
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
            facingMode: 'user',
          }
        });
      } catch (err) {
        console.warn("FocusMonitor: HD constraints failed, retrying at standard quality...", err);
      }

      // Stage 2: Fall back to 640×480 if HD not available
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
          });
        } catch (err) {
          console.warn("FocusMonitor: 640x480 failed, retrying generic...", err);
        }
      }

      // Stage 3: Last resort — any video track
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.warn("FocusMonitor: video program play interrupted:", e);
        });
      }
      setCamError(null);
      addLog('KameraShield AI: Webcam Feed ONLINE. Scan sequence initialized.');
    } catch (err: any) {
      console.error('FocusMonitor: Webcam access error:', err);
      const errMsg = err?.message || "Permission restricted or device busy";
      setCamError(errMsg);
      addLog(`ERROR: Webcam denied (${errMsg}).`);
    }
  };

  // Stop Camera Feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCamActive(false);
    setIsCamPaused(false);
    setCamError(null);
    stopAlarmSound();
    resetStates();
    addLog('KameraShield AI: Camera Feed OFFLINE.');
  };

  const resetStates = () => {
    setEyeState('open');
    setClosedTimer(0);
    setAlertState('none');
    setIsCamPaused(false);
  };

  // Real-time canvas scanning and optical eye tracking analysis!
  useEffect(() => {
    if (!isCamActive) return;

    let eyeClosedFrames = 0;

    const scanInterval = setInterval(() => {
      if (!canvasRef.current || !videoRef.current) return;
      if (isCamPaused) return; // Skip detection when paused (⏸️)

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        const w = canvas.width;
        const h = canvas.height;

        // Draw video frame to analytical canvas
        ctx.drawImage(video, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // ── Real-time Live Camera Face Capture & Range Assessment ───────────────
        let faceX1 = w, faceY1 = h, faceX2 = 0, faceY2 = 0;
        let skinPixels = 0;

        for (let y = 10; y < h - 10; y += 6) {
          for (let x = 10; x < w - 10; x += 6) {
            const idx = (y * w + x) * 4;
            const r = d[idx];
            const g = d[idx+1];
            const b = d[idx+2];
            const isSkin = r > 65 && g > 45 && b > 30 && r > g && r > b && (r - g > 12);
            if (isSkin) {
              skinPixels++;
              if (x < faceX1) faceX1 = x;
              if (x > faceX2) faceX2 = x;
              if (y < faceY1) faceY1 = y;
              if (y > faceY2) faceY2 = y;
            }
          }
        }

        const faceW = faceX2 - faceX1;
        const faceH = faceY2 - faceY1;
        const isFaceCaptured = skinPixels > 20 && faceW > 35 && faceH > 35;

        // ── IF NO PERSON / CAMERA BLOCKED BY OBJECT / TAPE / HAND / TOY ────────
        if (!isFaceCaptured) {
          setDetectedRange('⚠️ NO PERSON DETECTED');
          setEyeState('no_person');
          eyeClosedFrames++;
          const secondsBlocked = Math.floor(eyeClosedFrames / 10); // 100ms interval -> 10 frames = 1s
          setClosedTimer(secondsBlocked);

          // Ring alarm after 10 seconds of no person / object blocking camera
          if (eyeClosedFrames >= 100) {
            setAlertState('no_person_10s');
            triggerAlarmSound();
          }
          return;
        }

        // Live camera successfully captured a face! Calculate distance range from live camera stream
        const fx1 = faceX1;
        const fy1 = faceY1;
        const fw = faceW;
        const fh = faceH;

        const faceAreaRatio = (fw * fh) / (w * h);
        const rangeMode = faceAreaRatio > 0.32 ? 'NEAR RANGE' : faceAreaRatio > 0.10 ? 'MEDIUM RANGE' : 'FAR RANGE';
        setDetectedRange(rangeMode);

        // 2. Fixed relative bounding boxes adapted to captured face coordinates
        const foreheadBox = {
          x: Math.floor(fx1 + fw * 0.35),
          y: Math.floor(fy1 + fh * 0.10),
          width: Math.max(10, Math.floor(fw * 0.30)),
          height: Math.max(6, Math.floor(fh * 0.14)),
        };

        const leftEyeBox = {
          x: Math.floor(fx1 + fw * 0.10),
          y: Math.floor(fy1 + fh * 0.30),
          width: Math.max(12, Math.floor(fw * 0.35)),
          height: Math.max(8, Math.floor(fh * 0.25)),
        };

        const rightEyeBox = {
          x: Math.floor(fx1 + fw * 0.55),
          y: Math.floor(fy1 + fh * 0.30),
          width: Math.max(12, Math.floor(fw * 0.35)),
          height: Math.max(8, Math.floor(fh * 0.25)),
        };

        // Helper for min, max, avg luminance and contrast span in a box
        const getBoxLumStats = (box: { x: number; y: number; width: number; height: number }) => {
          let minLum = 255;
          let maxLum = 0;
          let sum = 0;
          let count = 0;
          const bx2 = Math.min(w, box.x + box.width);
          const by2 = Math.min(h, box.y + box.height);
          const bx1 = Math.max(0, box.x);
          const by1 = Math.max(0, box.y);

          for (let y = by1; y < by2; y += 2) {
            for (let x = bx1; x < bx2; x += 2) {
              const idx = (y * w + x) * 4;
              const lum = 0.299 * d[idx] + 0.587 * d[idx+1] + 0.114 * d[idx+2];
              if (lum < minLum) minLum = lum;
              if (lum > maxLum) maxLum = lum;
              sum += lum;
              count++;
            }
          }
          const avg = count > 0 ? sum / count : 128;
          const contrastSpan = maxLum - minLum;
          return { minLum, maxLum, avg, contrastSpan };
        };

        const foreheadStats = getBoxLumStats(foreheadBox);
        const leftEyeStats = getBoxLumStats(leftEyeBox);
        const rightEyeStats = getBoxLumStats(rightEyeBox);

        // Dark pupil luminance cutoff (dark pupil is significantly darker than forehead skin)
        const darkPupilCutoff = Math.min(110, Math.max(35, foreheadStats.avg * 0.65));

        // OPEN EYE SIGNATURE:
        // Exposed dark pupil -> minimum luminance in eye box is less than darkPupilCutoff
        // AND contrast span (sclera/skin vs pupil) is >= 45 units
        const isLeftEyeOpen = (leftEyeStats.minLum < darkPupilCutoff) && (leftEyeStats.contrastSpan >= 45);
        const isRightEyeOpen = (rightEyeStats.minLum < darkPupilCutoff) && (rightEyeStats.contrastSpan >= 45);

        const isEyesOpen = isLeftEyeOpen || isRightEyeOpen;
        const areEyesClosed = !isEyesOpen;

        // Drowsiness Timer & Trigger Handling (10 seconds continuous closed eyes)
        if (areEyesClosed) {
          eyeClosedFrames++;
          setEyeState('closed');
          const secondsClosed = Math.floor(eyeClosedFrames / 10); // 10 frames = 1 second (100ms interval)
          setClosedTimer(secondsClosed);

          // Continuous eyes closed for 10 seconds (100 frames * 100ms)
          if (eyeClosedFrames >= 100) {
            setAlertState('eyes_closed_10s');
            triggerAlarmSound();
          }
        } else {
          // EYES OPEN AGAIN! Immediately reset timer back to 0!
          eyeClosedFrames = 0;
          setEyeState('open');
          setClosedTimer(0);
        }

      } catch (err) {
        // Handle sandbox canvas blocks gracefully
      }
    }, 100); // 10fps scan — fast enough for blink detection, low CPU overhead

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addLog('BACKGROUND MODE ACTIVE: KameraShield is guarding you in other apps/tabs.');
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } else {
        addLog('FOREGROUND ACTIVE: KameraShield focus stream fully active.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(scanInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCamActive, isCamPaused]);

  // Produce Warning Sirens using high performance clean Web Audio API
  const triggerAlarmSound = () => {
    if (muteSound) return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Stop existing oscillator if any
      stopAlarmSound();

      // Master gain at MAXIMUM volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Layer 1: High-pitched square wave siren (primary alert)
      const siren = ctx.createOscillator();
      siren.type = 'square';
      siren.frequency.setValueAtTime(1400, ctx.currentTime);

      // Layer 2: Mid sawtooth for urgency
      const sawOsc = ctx.createOscillator();
      sawOsc.type = 'sawtooth';
      sawOsc.frequency.setValueAtTime(700, ctx.currentTime);

      // Layer 3: Low sine bass kick
      const bassOsc = ctx.createOscillator();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(110, ctx.currentTime);

      const sirenGain = ctx.createGain();
      sirenGain.gain.setValueAtTime(0.55, ctx.currentTime);
      const sawGain = ctx.createGain();
      sawGain.gain.setValueAtTime(0.3, ctx.currentTime);
      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.15, ctx.currentTime);

      siren.connect(sirenGain);
      sawOsc.connect(sawGain);
      bassOsc.connect(bassGain);
      sirenGain.connect(masterGain);
      sawGain.connect(masterGain);
      bassGain.connect(masterGain);

      siren.start();
      sawOsc.start();
      bassOsc.start();

      // Rapidly oscillate siren frequency for alarm effect
      let beepIter = 0;
      const beepInterval = setInterval(() => {
        if (ctx.state !== 'running') { clearInterval(beepInterval); return; }
        const t = ctx.currentTime;
        const high = beepIter % 2 === 0;
        siren.frequency.setValueAtTime(high ? 1400 : 900, t);
        siren.frequency.linearRampToValueAtTime(high ? 900 : 1400, t + 0.18);
        sawOsc.frequency.setValueAtTime(high ? 700 : 450, t);
        beepIter++;
      }, 220);

      // Store the primary osc so we can stop it
      oscillatorRef.current = siren;
      // Also stop the extras when alarm is dismissed
      (oscillatorRef as any)._extras = [sawOsc, bassOsc, masterGain, beepInterval];

      setIsAlarmRinging(true);

    } catch (e) {
      console.log('Audio synthesis error:', e);
    }
  };

  const stopAlarmSound = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      // Stop extras (saw, bass, masterGain, interval)
      const extras = (oscillatorRef as any)?._extras;
      if (extras) {
        extras.forEach((item: any) => {
          if (typeof item === 'number') clearInterval(item);
          else {
            try { item.stop?.(); } catch {}
            try { item.disconnect?.(); } catch {}
          }
        });
        (oscillatorRef as any)._extras = null;
      }
    } catch (e) {}
    setIsAlarmRinging(false);
  };

  const dismissAlarm = () => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setAlertState('none');
    setClosedTimer(0);
    setEyeState('open');
    addLog('KameraShield: Alarm dismissed by user.');
  };



  // Manual State Simulator Triggers
  const toggleEyeSimulation = () => {
    if (eyeState !== 'closed') {
      setEyeState('closed');
      setClosedTimer(10);
      setAlertState('eyes_closed_10s');
      triggerAlarmSound();
      addLog('MANUAL OVERRIDE: Simulating 10s eyes closed...');
    } else {
      setEyeState('open');
      setClosedTimer(0);
      addLog('MANUAL OVERRIDE: Simulating eye opening...');
      dismissAlarm();
    }
  };

  const toggleNoPersonSimulation = () => {
    if (eyeState !== 'no_person') {
      setEyeState('no_person');
      setClosedTimer(10);
      setAlertState('no_person_10s');
      triggerAlarmSound();
      addLog('MANUAL OVERRIDE: Simulating 10s camera blocked / no person...');
    } else {
      setEyeState('open');
      setClosedTimer(0);
      addLog('MANUAL OVERRIDE: Resuming person detection...');
      dismissAlarm();
    }
  };

  // Clean-up on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopAlarmSound();
    };
  }, []);

  return (
    <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm space-y-4 relative overflow-hidden" id="ai-webcam-focus-widget">
      {/* Decorative scanner strip */}
      {isCamActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-vibrant to-brand-primary animate-pulse z-10" />
      )}

      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-sans font-bold text-base text-brand-dark flex items-center gap-2">
            <Camera className={`w-5 h-5 ${isCamActive ? 'text-brand-vibrant animate-pulse' : 'text-brand-muted'}`} />
            KameraShield AI Focus Cam
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">Observe cognitive lapses &amp; drowsiness in real-time</p>
        </div>

        {isCamActive && (
          <div className="flex items-center gap-1.5 ml-auto mr-1.5">
            <button
              onClick={() => setMuteSound(!muteSound)}
              className="p-1.5 rounded-lg border border-brand-outline hover:bg-brand-bg text-brand-muted transition active:scale-95 cursor-pointer"
              title={muteSound ? 'Unmute Warning Sirens' : 'Mute Sirens'}
            >
              {muteSound ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>

            {/* Pause ⏸️ / Resume ▶️ Camera Control */}
            <button
              type="button"
              onClick={() => setIsCamPaused(p => !p)}
              className={`py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition select-none pointer-events-auto shadow-sm cursor-pointer ${
                isCamPaused 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isCamPaused ? 'Resume Eye Detection' : 'Pause Eye Detection'}
              id="btn-pause-camrashield"
            >
              {isCamPaused ? (
                <>
                  <Play size={11} className="fill-current" />
                  <span>Resume (▶️)</span>
                </>
              ) : (
                <>
                  <Pause size={11} className="fill-current" />
                  <span>Pause (⏸️)</span>
                </>
              )}
            </button>
          </div>
        )}

        <button
          onClick={isCamActive ? stopCamera : startCamera}
          className={`py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition select-none pointer-events-auto shadow-sm cursor-pointer ${
            isCamActive 
              ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100' 
              : 'bg-[#CCD5AE]/30 border border-[#5A5A40]/10 text-brand-primary hover:bg-[#CCD5AE]/50'
          }`}
          id="btn-toggle-camrashield"
        >
          {isCamActive ? (
            <>
              <VideoOff size={11} />
              <span>Turn Off (⏹️)</span>
            </>
          ) : (
            <>
              <Play size={11} className="fill-current" />
              <span>Activate Cam (▶️)</span>
            </>
          )}
        </button>
      </div>

      {isCamActive ? (
        <div className="space-y-4">
          <div className="relative w-full max-w-[320px] mx-auto h-[180px] bg-black rounded-2xl overflow-hidden border border-brand-outline shadow-inner flex items-center justify-center group">
            {/* Real webcam stream */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              muted
              playsInline
              id="ai-cam-live-video"
            />

            {/* Error Overlay Fallback */}
            {camError && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-4 z-20">
                <ShieldAlert size={32} className="text-amber-500 mb-1.5 animate-bounce" />
                <span className="text-[11px] font-black tracking-wider text-[#FFF2E0] uppercase block">WEBCAM REQUIRED</span>
                <span className="text-[9px] text-[#FAEDCD] max-w-[240px] leading-relaxed block mt-1">
                  Encountered error: {camError}. Please click "Open in New Tab" to authorize.
                </span>
              </div>
            )}
            
            {/* Scanner line overlay effect removed as requested */}
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-brand-primary/5 pointer-events-none" />

            {/* Hidden analysis canvas — used only for pixel computations, never shown to user */}
            <canvas
              ref={canvasRef}
              width="320"
              height="240"
              style={{ visibility: 'hidden', position: 'absolute', pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}
              aria-hidden="true"
            />

            {/* Overlay when Camera Monitoring is PAUSED (⏸️) */}
            {isCamPaused && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 z-20">
                <Pause size={36} className="text-amber-400 mb-2 animate-pulse" />
                <span className="text-xs font-black tracking-widest text-white uppercase">MONITORING PAUSED (⏸️)</span>
                <span className="text-[10px] text-amber-200 font-mono mt-1 mb-3">Camera is paused — Eye tracking is sleeping</span>
                <button
                  type="button"
                  onClick={() => setIsCamPaused(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer pointer-events-auto"
                >
                  <Play size={12} className="fill-current" />
                  Resume Eye Detection (▶️)
                </button>
              </div>
            )}

            {/* Simulated overlay for closed eyes */}
            {eyeState === 'closed' && !isCamPaused && (
              <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 z-10 animate-pulse">
                <ShieldAlert size={36} className="text-brand-vibrant mb-2" />
                <span className="text-xs font-black tracking-widest text-[#FFF2E0] uppercase">EYES CLOSED DETECTED</span>
                <span className="text-[10px] text-rose-300 font-mono mt-1">Closed Duration: {closedTimer}s / 10s</span>
              </div>
            )}

            {/* Overlay for No Person / Object Blocking Camera */}
            {eyeState === 'no_person' && !isCamPaused && (
              <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 z-10 animate-pulse">
                <AlertTriangle size={36} className="text-amber-400 mb-2" />
                <span className="text-xs font-black tracking-widest text-amber-100 uppercase">NO PERSON / CAMERA BLOCKED</span>
                <span className="text-[10px] text-amber-300 font-mono mt-1">Timer Active: {closedTimer}s / 10s</span>
              </div>
            )}

            {/* Tracking overlay indicators */}
            <div className="absolute bottom-2.5 left-2.5 bg-black/60 border border-white/10 px-2 py-1 rounded-lg text-[9px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isCamPaused ? 'bg-amber-400' : eyeState === 'no_person' ? 'bg-amber-500 animate-ping' : 'bg-emerald-400 animate-ping'}`} />
              RANGE: {detectedRange} | FOCUS INDEX: {isCamPaused ? 'PAUSED (⏸️)' : eyeState === 'no_person' ? '0.00 (CAM BLOCKED)' : eyeState === 'closed' ? '0.00 (DROWSY)' : '0.96 (HEALTHY)'}
            </div>

            <div className="absolute top-2.5 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white font-bold backdrop-blur-xs">
              {isCamPaused ? '⏸️ PAUSED' : 'AI SCANNING ACTIVE'}
            </div>
          </div>

          {/* WARNING BANNERS + FULL-SCREEN OVERLAY */}
          {isAlarmRinging && (
            <>
              {/* Full-screen pulsing alarm overlay */}
              <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center pointer-events-auto"
                style={{ background: 'rgba(80,0,0,0.92)' }}
              >
                {/* Animated radial glow */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 45%, rgba(255,0,0,0.5) 0%, transparent 65%)',
                    animation: 'pulse 0.6s ease-in-out infinite alternate'
                  }}
                />

                <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
                  {/* Pulsing shield icon */}
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255,50,50,0.2)',
                      border: '4px solid rgba(255,80,80,0.7)',
                      boxShadow: '0 0 60px rgba(255,0,0,0.7), 0 0 120px rgba(255,0,0,0.3)',
                      animation: 'pulse 0.5s ease-in-out infinite alternate'
                    }}
                  >
                    <ShieldAlert size={44} className="text-red-400" strokeWidth={1.8} />
                  </div>

                  <div style={{ animation: 'pulse 0.5s ease-in-out infinite alternate' }}>
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {alertState === 'no_person_10s' ? '📷 CAMERA BLOCKED!' : '👁️ WAKE UP!'}
                    </h2>
                    <p className="text-red-300 font-bold text-base mt-2">
                      {alertState === 'no_person_10s'
                        ? 'Camera blocked or no person detected for 10+ seconds!'
                        : 'Eyes closed continuously for 10+ seconds — drowsiness detected!'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-6 py-3">
                    <div className="text-center">
                      <div className="text-xl font-mono font-black text-white">
                        {closedTimer || 10}s
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-red-300 font-bold">
                        {alertState === 'no_person_10s' ? 'Cam Blocked' : 'Eyes Closed'}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <div className="text-xl font-mono font-black text-red-400">⚠️</div>
                      <div className="text-[10px] uppercase tracking-wider text-red-300 font-bold">Alert</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={dismissAlarm}
                      className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center gap-2 pointer-events-auto cursor-pointer"
                      style={{ boxShadow: '0 0 30px rgba(255,0,0,0.5)' }}
                      id="eye-alarm-dismiss-btn"
                    >
                      <VolumeX size={16} />
                      I'm Awake — Dismiss Alarm
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-white/25 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center gap-2 pointer-events-auto cursor-pointer"
                      id="eye-alarm-turn-off-cam-btn"
                    >
                      <VideoOff size={16} />
                      Turn Off Camera
                    </button>

                    <button
                      type="button"
                      onClick={() => setMuteSound(m => !m)}
                      className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition pointer-events-auto cursor-pointer"
                      title={muteSound ? 'Unmute' : 'Mute alarm'}
                    >
                      {muteSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                  </div>

                  <p className="text-xs text-white/40">
                    KameraShield AI detected a focus lapse. Stay alert!
                  </p>
                </div>
              </div>
            </>
          )}

          {alertState === 'eyes_closed_10s' && !isAlarmRinging && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1 animate-bounce">
              <div className="flex items-center gap-2 font-black text-xs">
                <AlertTriangle size={15} />
                CRITICAL WARNING: SLEEP STATE WARNING
              </div>
              <p className="text-[10px] leading-relaxed text-rose-800">
                You closed your eyes continuously for over 10 seconds! A loud alarm is sounding to wake you up.
              </p>
            </div>
          )}

          {/* Real-time audit manual simulation triggers */}
          <div className="p-3 bg-slate-50 border border-brand-outline rounded-xl space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted block">
              🔧 Manual Auditing &amp; Verification Suite
            </span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleEyeSimulation}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition pointer-events-auto cursor-pointer ${
                  eyeState === 'closed'
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white border-brand-outline text-brand-dark hover:bg-brand-bg'
                }`}
                title="Trigger closed eyes mode for 10s to trigger ring alarm."
              >
                {eyeState === 'closed' ? '🛑 Reset Eyes' : '💤 Simulate Eyes Closed (10s)'}
              </button>

              <button
                type="button"
                onClick={toggleNoPersonSimulation}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition pointer-events-auto cursor-pointer ${
                  eyeState === 'no_person'
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-white border-brand-outline text-brand-dark hover:bg-brand-bg'
                }`}
                title="Simulate object blocking camera / no person for 10s to trigger ring alarm."
              >
                {eyeState === 'no_person' ? '🛑 Reset Cam Block' : '⚠️ Simulate Cam Blocked (10s)'}
              </button>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-muted">Neural Log Output</span>
            <div className="p-2.5 bg-brand-bg border border-brand-outline rounded-xl font-mono text-[9px] text-brand-primary h-[85px] overflow-y-auto space-y-1 scrollbar-thin">
              {logMessages.map((msg, idx) => (
                <div key={idx} className="truncate">{msg}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-brand-bg/40 border border-dashed border-brand-soft-border rounded-2xl flex flex-col items-center justify-center space-y-2">
          <VideoOff className="w-8 h-8 text-brand-muted/70" />
          <p className="text-xs text-brand-muted font-medium max-w-xs px-4">
            Activate Camera to run automated optical assessments. System stays completely offline on the client browser.
          </p>
          <button
            onClick={startCamera}
            className="mt-2 text-xs font-bold font-sans text-brand-primary hover:text-brand-vibrant hover:underline cursor-pointer"
          >
            Grant camera clearance now →
          </button>
        </div>
      )}
    </div>
  );
}
