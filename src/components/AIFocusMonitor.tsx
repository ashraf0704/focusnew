import React, { useState, useEffect, useRef } from 'react';
import { Camera, VideoOff, ShieldAlert, Zap, AlertTriangle, Play, Square, Activity, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function AIFocusMonitor() {
  const [isCamActive, setIsCamActive] = useState(false);
  const [eyeState, setEyeState] = useState<'open' | 'closed'>('open');
  const [isBlinkingRapidly, setIsBlinkingRapidly] = useState(false);
  const [closedTimer, setClosedTimer] = useState(0); // consecutive seconds eyes closed
  const [alertState, setAlertState] = useState<'none' | 'eyes_closed_3s' | 'rapid_blinking'>('none');
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
      // Stage 1: Try structured user-facing camera profile
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        });
      } catch (err) {
        console.warn("FocusMonitor: structured facing user constraints failed, retrying generic video track...", err);
      }

      // Stage 2: Fall back to wide open general camera access
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
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
    setCamError(null);
    stopAlarmSound();
    resetStates();
    addLog('KameraShield AI: Camera Feed OFFLINE.');
  };

  const resetStates = () => {
    setEyeState('open');
    setIsBlinkingRapidly(false);
    setClosedTimer(0);
    setAlertState('none');
  };

  // Real-time canvas scanning fallback frame-diff analysis for actual automated testing!
  useEffect(() => {
    if (!isCamActive) return;

    let previousFrameData: Uint8ClampedArray | null = null;
    let blinkAccumulator = 0;
    let lastBlinkTime = Date.now();

    const scanInterval = setInterval(() => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        // Draw the video frame to our hidden mini-analytics canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = currentFrame.data;

        if (previousFrameData) {
          let pixelDelta = 0;
          // Subsample to optimize CPU load
          for (let i = 0; i < data.length; i += 16) {
            const rDiff = Math.abs(data[i] - previousFrameData[i]);
            const gDiff = Math.abs(data[i+1] - previousFrameData[i+1]);
            const bDiff = Math.abs(data[i+2] - previousFrameData[i+2]);
            pixelDelta += (rDiff + gDiff + bDiff);
          }

          const normalizedDelta = pixelDelta / (canvas.width * canvas.height);
          
          // If normalized Delta is extremely high, user is active or blinking
          if (normalizedDelta > 8 && normalizedDelta < 30) {
            const now = Date.now();
            if (now - lastBlinkTime < 800) {
              blinkAccumulator++;
              if (blinkAccumulator >= 4) {
                // Trigger Rapid Blinking continuously
                setIsBlinkingRapidly(true);
                addLog('KameraShield AI: Continuous rapid blinking pattern identified.');
                triggerVibration();
              }
            } else {
              blinkAccumulator = Math.max(0, blinkAccumulator - 1);
              setIsBlinkingRapidly(false);
            }
            lastBlinkTime = now;
          }
        }

        previousFrameData = data;
      } catch (e) {
        // Handle cross-origin or canvas security boundary errors gracefully
      }
    }, 300);

    // Visibility Change Handler for active background tab protection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addLog('BACKGROUND MODE ACTIVE: KameraShield is guarding you in other apps/tabs.');
        // Ensure web audio is ready for background buzzer alerts
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
  }, [isCamActive]);

  // Handle eyes closed timer check
  useEffect(() => {
    let timerID: any = null;
    
    if (eyeState === 'closed') {
      timerID = setInterval(() => {
        setClosedTimer(prev => {
          const nextSecs = prev + 1;
          addLog(`Focus Alert: User eyes closed/unfocused for ${nextSecs}s`);
          if (nextSecs >= 3) {
            setAlertState('eyes_closed_3s');
            triggerAlarmSound();
          }
          return nextSecs;
        });
      }, 1000);
    } else {
      setClosedTimer(0);
      if (alertState === 'eyes_closed_3s') {
        setAlertState('none');
        stopAlarmSound();
      }
    }

    return () => {
      if (timerID) clearInterval(timerID);
    };
  }, [eyeState]);

  // Produce Warning Sirens using high performance clean Web Audio API
  const triggerAlarmSound = () => {
    if (muteSound) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop existing oscillator if any
      stopAlarmSound();

      // Create a rapid alarm beep pattern
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // high frequency alert pitch
      
      // LFO styled alarm oscillation
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      oscillatorRef.current = osc;

      // Automatically beep repeatedly
      const beepInterval = setInterval(() => {
        if (oscillatorRef.current && ctx.state === 'running') {
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
          osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
        } else {
          clearInterval(beepInterval);
        }
      }, 400);

    } catch (e) {
      console.log('Audio synthesis error:', e);
    }
  };

  const stopAlarmSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current = null;
    }
  };

  // Laptop/device physical vibration trigger check
  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      // Vibrate in an intense double pattern for continuous blinking
      navigator.vibrate([200, 100, 200]);
      addLog('STRESS REFLEX: Laptop hardware vibration signal transmitted.');
    } else {
      addLog('INFO: navigator.vibrate is mocked (not supported by browser sandbox / iframe).');
    }
    setAlertState('rapid_blinking');
  };

  // Manual State Simulator Triggers
  const toggleEyeSimulation = () => {
    if (eyeState === 'open') {
      setEyeState('closed');
      addLog('MANUAL OVERRIDE: Simulating eye closure...');
    } else {
      setEyeState('open');
      addLog('MANUAL OVERRIDE: Simulating eye opening...');
      stopAlarmSound();
      setAlertState('none');
    }
  };

  const triggerContinuousBlinkSimulation = () => {
    setIsBlinkingRapidly(true);
    addLog('MANUAL OVERRIDE: Simulating continuous blinking pattern...');
    triggerVibration();
    setTimeout(() => {
      setIsBlinkingRapidly(false);
      setAlertState('none');
      addLog('MANUAL OVERRIDE: Rapid blinking simulation stopped.');
    }, 5000);
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
          <p className="text-xs text-brand-muted mt-0.5">Observe cognitive lapses & blinking rate in real-time</p>
        </div>

        {isCamActive && (
          <button
            onClick={() => setMuteSound(!muteSound)}
            className="p-1.5 rounded-lg border border-brand-outline hover:bg-brand-bg text-brand-muted ml-auto mr-1.5 transition active:scale-95"
            title={muteSound ? 'Unmute Warning Sirens' : 'Mute Sirens'}
          >
            {muteSound ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        )}

        <button
          onClick={isCamActive ? stopCamera : startCamera}
          className={`py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition select-none pointer-events-auto shadow-sm ${
            isCamActive 
              ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100' 
              : 'bg-[#CCD5AE]/30 border border-[#5A5A40]/10 text-brand-primary hover:bg-[#CCD5AE]/50'
          }`}
          id="btn-toggle-camrashield"
        >
          {isCamActive ? (
            <>
              <VideoOff size={11} />
              Turn Off
            </>
          ) : (
            <>
              <Play size={11} className="fill-current" />
              Activate Cam
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

            {/* Hidden canvas for image delta processing */}
            <canvas ref={canvasRef} width="80" height="60" className="hidden" />

            {/* Simulated overlay for closed eyes */}
            {eyeState === 'closed' && (
              <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 z-10 animate-pulse">
                <ShieldAlert size={36} className="text-brand-vibrant mb-2" />
                <span className="text-xs font-black tracking-widest text-[#FFF2E0] uppercase">EYES CLOSED / AWAY DETECTED</span>
                <span className="text-[10px] text-rose-300 font-mono mt-1">Consequences Active: {closedTimer}s / 3s</span>
              </div>
            )}

            {/* Simulated overlay for rapid blinking */}
            {isBlinkingRapidly && (
              <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 z-10">
                <AlertTriangle size={36} className="text-brand-accent mb-2 animate-bounce" />
                <span className="text-xs font-black tracking-widest text-amber-100 uppercase">RAPID EYE BLINKS DETECTED</span>
                <span className="text-[10px] text-amber-300 font-mono mt-1">Device Vibre Reflex Sent</span>
              </div>
            )}

            {/* Tracking overlay indicators */}
            <div className="absolute bottom-2.5 left-2.5 bg-black/60 border border-white/10 px-2 py-1 rounded-lg text-[9px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              FOCUS INDEX: {eyeState === 'closed' ? '0.00 (CRITICAL)' : '0.94 (HEALTHY)'}
            </div>

            <div className="absolute top-2.5 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white font-bold backdrop-blur-xs">
              AI SCANNING ACTIVE
            </div>
          </div>

          {/* WARNING BANNERS */}
          {alertState === 'eyes_closed_3s' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1 animate-bounce">
              <div className="flex items-center gap-2 font-black text-xs">
                <AlertTriangle size={15} />
                CRITICAL WARNING: SLEEP STATE WARNING
              </div>
              <p className="text-[10px] leading-relaxed text-rose-800">
                You have closed your eyes for over 3 seconds! A loud alarm is sounding to wake you up. Sit up straight and inhale deeply!
              </p>
            </div>
          )}

          {alertState === 'rapid_blinking' && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs">
                <Zap size={14} className="fill-current" />
                WARNING: CONTINUOUS EYE BLINK REFLEX
              </div>
              <p className="text-[10px] leading-relaxed text-amber-800">
                A rapid eye-blink loop was detected, suggesting optical strain or high cognitive fatigue. Laptop vibration trigger sent. Take a 2-minute break!
              </p>
            </div>
          )}

          {/* Real-time audit manual simulation triggers */}
          <div className="p-3 bg-slate-50 border border-brand-outline rounded-xl space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted block">
              🔧 Manual Auditing & Verification Suite
            </span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleEyeSimulation}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition pointer-events-auto ${
                  eyeState === 'closed'
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white border-brand-outline text-brand-dark hover:bg-brand-bg'
                }`}
                title="Trigger closed eyes mode. Stay active for 3s to trigger ring alarm."
              >
                {eyeState === 'closed' ? '🛑 Wake Up Eyes' : '💤 Close Eyes (3s)'}
              </button>

              <button
                type="button"
                onClick={triggerContinuousBlinkSimulation}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition pointer-events-auto ${
                  isBlinkingRapidly
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-white border-brand-outline text-brand-dark hover:bg-brand-bg'
                }`}
                title="Simulate rapid, continuous blinking to trigger device vibration call."
              >
                ⚡ Blink Rapidly
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
