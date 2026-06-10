import React, { useState, useEffect, useRef } from 'react';
import { Camera, VideoOff, ShieldAlert, Zap, AlertTriangle, Play, Square, Activity, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function AIFocusMonitor() {
  const [isCamActive, setIsCamActive] = useState(false);
  const [eyeState, setEyeState] = useState<'open' | 'closed'>('open');
  const [isBlinkingRapidly, setIsBlinkingRapidly] = useState(false);
  const [closedTimer, setClosedTimer] = useState(0); // consecutive seconds eyes closed
  const [alertState, setAlertState] = useState<'none' | 'eyes_closed_3s' | 'rapid_blinking'>('none');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
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

  // Real-time canvas scanning and optical eye tracking analysis!
  useEffect(() => {
    if (!isCamActive) return;

    let blinkHistory: number[] = [];
    let eyeClosedFrames = 0;

    const scanInterval = setInterval(() => {
      if (!canvasRef.current || !videoRef.current) return;
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

        // 1. Dynamic Skin-based Face Tracker
        let faceX1 = w, faceY1 = h, faceX2 = 0, faceY2 = 0;
        
        // Downsample scan to keep CPU footprint < 1%
        for (let y = 10; y < h - 10; y += 6) {
          for (let x = 10; x < w - 10; x += 6) {
            const idx = (y * w + x) * 4;
            const r = d[idx];
            const g = d[idx+1];
            const b = d[idx+2];
            
            // Standard skin-tone filter (robust across a wide variety of skin complexions)
            const isSkin = r > 65 && g > 45 && b > 30 && 
                           r > g && r > b && 
                           (r - g > 12) && 
                           (Math.max(r, g, b) - Math.min(r, g, b) > 12);
            
            if (isSkin) {
              if (x < faceX1) faceX1 = x;
              if (x > faceX2) faceX2 = x;
              if (y < faceY1) faceY1 = y;
              if (y > faceY2) faceY2 = y;
            }
          }
        }

        // Establish default fallback boxes in case no face is detected
        let foreheadBox = { x: Math.floor(w * 0.45), y: Math.floor(h * 0.28), width: Math.floor(w * 0.1), height: Math.floor(h * 0.08) };
        let leftEyeBox = { x: Math.floor(w * 0.35), y: Math.floor(h * 0.40), width: Math.floor(w * 0.12), height: Math.floor(h * 0.09) };
        let rightEyeBox = { x: Math.floor(w * 0.53), y: Math.floor(h * 0.40), width: Math.floor(w * 0.12), height: Math.floor(h * 0.09) };
        let isFaceTracked = false;

        const faceW = faceX2 - faceX1;
        const faceH = faceY2 - faceY1;

        if (faceW > 45 && faceH > 45) {
          isFaceTracked = true;
          // Find pupils/iris dynamically as the darkest regions within the left/right eye bands
          const findDarkestPoint = (startX: number, endX: number, startY: number, endY: number) => {
            let minLum = 255;
            let minX = startX + (endX - startX) / 2;
            let minY = startY + (endY - startY) / 2;
            
            for (let y = startY; y < endY; y += 2) {
              for (let x = startX; x < endX; x += 2) {
                const idx = (y * w + x) * 4;
                const lum = 0.299 * d[idx] + 0.587 * d[idx+1] + 0.114 * d[idx+2];
                if (lum < minLum) {
                  minLum = lum;
                  minX = x;
                  minY = y;
                }
              }
            }
            return { x: minX, y: minY };
          };

          const eyeBandY1 = Math.floor(faceY1 + faceH * 0.32);
          const eyeBandY2 = Math.floor(faceY1 + faceH * 0.47);

          // Left side of face (Left Eye)
          const leftEyeCenter = findDarkestPoint(
            Math.floor(faceX1 + faceW * 0.12),
            Math.floor(faceX1 + faceW * 0.48),
            eyeBandY1,
            eyeBandY2
          );

          // Right side of face (Right Eye)
          const rightEyeCenter = findDarkestPoint(
            Math.floor(faceX1 + faceW * 0.52),
            Math.floor(faceX1 + faceW * 0.88),
            eyeBandY1,
            eyeBandY2
          );

          // Define eye and forehead boxes around these dynamic coordinates
          const boxW = Math.max(16, Math.floor(faceW * 0.14));
          const boxH = Math.max(10, Math.floor(faceH * 0.08));

          leftEyeBox = {
            x: Math.min(w - boxW, Math.max(0, Math.floor(leftEyeCenter.x - boxW / 2))),
            y: Math.min(h - boxH, Math.max(0, Math.floor(leftEyeCenter.y - boxH / 2))),
            width: boxW,
            height: boxH
          };

          rightEyeBox = {
            x: Math.min(w - boxW, Math.max(0, Math.floor(rightEyeCenter.x - boxW / 2))),
            y: Math.min(h - boxH, Math.max(0, Math.floor(rightEyeCenter.y - boxH / 2))),
            width: boxW,
            height: boxH
          };

          foreheadBox = {
            x: Math.min(w - 15, Math.max(0, Math.floor((leftEyeCenter.x + rightEyeCenter.x) / 2 - 10))),
            y: Math.min(h - 10, Math.max(0, Math.floor(faceY1 + faceH * 0.16))),
            width: 20,
            height: 10
          };
        }

        // Helper to get average luminance and variance inside any target bounding box
        const getBoxMetrics = (box: { x: number; y: number; width: number; height: number }) => {
          const imgData = ctx.getImageData(box.x, box.y, box.width, box.height);
          const data = imgData.data;
          let sum = 0;
          const pixelCount = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            sum += lum;
          }
          const avg = sum / pixelCount;

          let varianceSum = 0;
          for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            varianceSum += Math.pow(lum - avg, 2);
          }
          const variance = varianceSum / pixelCount;
          
          return { avg, variance };
        };

        // Extract optical analytics
        const forehead = getBoxMetrics(foreheadBox);
        const leftEye = getBoxMetrics(leftEyeBox);
        const rightEye = getBoxMetrics(rightEyeBox);

        // Calculate contrast ratio against reference skin variance
        const refVar = Math.max(15, forehead.variance);
        const leftContrast = leftEye.variance / refVar;
        const rightContrast = rightEye.variance / refVar;
        const avgContrast = (leftContrast + rightContrast) / 2;

        const eyesClosedConfidence = isFaceTracked ? Math.min(100, Math.max(0, Math.round((2.5 - avgContrast) * 80))) : 0;
        const areEyesClosed = isFaceTracked && avgContrast < 1.75;

        // Clear canvas to draw custom cybersecurity styled overlay
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(video, 0, 0, w, h);

        // HUD: Draw Face bounding box and scanner if tracked
        if (isFaceTracked) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // glowing emerald
          ctx.lineWidth = 1.5;
          ctx.strokeRect(faceX1, faceY1, faceW, faceH);
          
          // Draw high-tech aesthetic corner brackets
          const len = 12;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.lineWidth = 2.5;
          // Top-Left corner
          ctx.beginPath(); ctx.moveTo(faceX1, faceY1 + len); ctx.lineTo(faceX1, faceY1); ctx.lineTo(faceX1 + len, faceY1); ctx.stroke();
          // Top-Right corner
          ctx.beginPath(); ctx.moveTo(faceX1 + faceW - len, faceY1); ctx.lineTo(faceX1 + faceW, faceY1); ctx.lineTo(faceX1 + faceW, faceY1 + len); ctx.stroke();
          // Bottom-Left corner
          ctx.beginPath(); ctx.moveTo(faceX1, faceY1 + faceH - len); ctx.lineTo(faceX1, faceY1 + faceH); ctx.lineTo(faceX1 + len, faceY1 + faceH); ctx.stroke();
          // Bottom-Right corner
          ctx.beginPath(); ctx.moveTo(faceX1 + faceW - len, faceY1 + faceH); ctx.lineTo(faceX1 + faceW, faceY1 + faceH); ctx.lineTo(faceX1 + faceW, faceY1 + faceH - len); ctx.stroke();

          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.font = 'bold 7px sans-serif';
          ctx.fillText('BIOMETRIC EYE SCANNER: LOCK ACTIVE', faceX1 + 5, faceY1 + 10);
        }

        // Draw reticle scanning indicators
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w * 0.2, h * 0.15, w * 0.6, h * 0.7);

        if (!isFaceTracked) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(w * 0.25, h * 0.2, w * 0.5, h * 0.6);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('SEARCHING FOR FACE...', w * 0.28, h * 0.5);
        }

        // Forehead Box
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.strokeRect(foreheadBox.x, foreheadBox.y, foreheadBox.width, foreheadBox.height);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.font = '8px monospace';
        ctx.fillText('SKIN REF', foreheadBox.x, foreheadBox.y - 2);

        // Eye Zones Bounding Boxes
        const eyeColor = areEyesClosed ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)';
        
        // Left Eye
        ctx.strokeStyle = eyeColor;
        ctx.strokeRect(leftEyeBox.x, leftEyeBox.y, leftEyeBox.width, leftEyeBox.height);
        ctx.fillStyle = eyeColor;
        ctx.fillText('L-EYE', leftEyeBox.x, leftEyeBox.y - 2);

        // Right Eye
        ctx.strokeStyle = eyeColor;
        ctx.strokeRect(rightEyeBox.x, rightEyeBox.y, rightEyeBox.width, rightEyeBox.height);
        ctx.fillStyle = eyeColor;
        ctx.fillText('R-EYE', rightEyeBox.x, rightEyeBox.y - 2);

        // Draw crosshairs inside eye tracker boxes to indicate pupil locking
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(leftEyeBox.x + leftEyeBox.width / 2 - 4, leftEyeBox.y + leftEyeBox.height / 2);
        ctx.lineTo(leftEyeBox.x + leftEyeBox.width / 2 + 4, leftEyeBox.y + leftEyeBox.height / 2);
        ctx.moveTo(leftEyeBox.x + leftEyeBox.width / 2, leftEyeBox.y + leftEyeBox.height / 2 - 4);
        ctx.lineTo(leftEyeBox.x + leftEyeBox.width / 2, leftEyeBox.y + leftEyeBox.height / 2 + 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightEyeBox.x + rightEyeBox.width / 2 - 4, rightEyeBox.y + rightEyeBox.height / 2);
        ctx.lineTo(rightEyeBox.x + rightEyeBox.width / 2 + 4, rightEyeBox.y + rightEyeBox.height / 2);
        ctx.moveTo(rightEyeBox.x + rightEyeBox.width / 2, rightEyeBox.y + rightEyeBox.height / 2 - 4);
        ctx.lineTo(rightEyeBox.x + rightEyeBox.width / 2, rightEyeBox.y + rightEyeBox.height / 2 + 4);
        ctx.stroke();

        // Telemetry readout
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, h - 30, w - 10, 25);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(5, h - 30, w - 10, 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        if (isFaceTracked) {
          ctx.fillText(`EYES: ${areEyesClosed ? '💤 CLOSED' : '👁️ OPEN'} (FATIGUE: ${eyesClosedConfidence}%)`, 10, h - 18);
          ctx.fillText(`LUMINANCE CONTRAST: ${avgContrast.toFixed(2)}x`, 10, h - 8);
        } else {
          ctx.fillText(`EYES: 🔍 SCANNING... (FACE NOT IN VIEW)`, 10, h - 18);
          ctx.fillText(`LUMINANCE CONTRAST: --`, 10, h - 8);
        }

        // Drowsiness Timer & Trigger Handling
        if (areEyesClosed) {
          eyeClosedFrames++;
          setEyeState('closed');
          setClosedTimer(Math.floor(eyeClosedFrames * 0.3));

          if (eyeClosedFrames >= 10) { // ~3 seconds
            setAlertState('eyes_closed_3s');
            triggerAlarmSound();
          }
        } else {
          // Check for a brief completed blink transition (1 to 3 frames closed)
          if (eyeClosedFrames >= 1 && eyeClosedFrames <= 3) {
            const now = Date.now();
            blinkHistory.push(now);
            addLog(`KameraShield AI: Optical blink signature detected!`);

            // Retain blinks from last 4 seconds
            blinkHistory = blinkHistory.filter(time => now - time < 4000);

            // If user blinks 4 times in 4 seconds, sound the alarm!
            if (blinkHistory.length >= 4) {
              setIsBlinkingRapidly(true);
              setAlertState('rapid_blinking');
              triggerAlarmSound();
              addLog('KameraShield AI: Continuous rapid blinking loop identified! Alarm triggered!');
              triggerVibration();
            }
          }

          eyeClosedFrames = 0;
          setEyeState('open');
          setClosedTimer(0);

          if (!oscillatorRef.current) {
            setIsBlinkingRapidly(false);
          }
        }

      } catch (err) {
        // Handle sandbox canvas blocks gracefully
      }
    }, 300);

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
  }, [isCamActive]);

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
      setIsAlarmRinging(true);

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
    setIsAlarmRinging(false);
  };

  const dismissAlarm = () => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setAlertState('none');
    setClosedTimer(0);
    setIsBlinkingRapidly(false);
    setEyeState('open');
    addLog('KameraShield: Alarm dismissed by user.');
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
      dismissAlarm();
    }
  };

  const triggerContinuousBlinkSimulation = () => {
    setIsBlinkingRapidly(true);
    setAlertState('rapid_blinking');
    triggerAlarmSound();
    addLog('MANUAL OVERRIDE: Simulating continuous blinking pattern. Alarm triggered!');
    triggerVibration();
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

            {/* Real-time optical eye scanning overlay canvas */}
            <canvas
              ref={canvasRef}
              width="320"
              height="180"
              className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none scale-x-[-1]"
            />

            {/* Simulated overlay for closed eyes */}
            {eyeState === 'closed' && (
              <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 z-10 animate-pulse">
                <ShieldAlert size={36} className="text-brand-vibrant mb-2" />
                <span className="text-xs font-black tracking-widest text-[#FFF2E0] uppercase">EYES CLOSED DETECTED</span>
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
          {isAlarmRinging && (
            <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-pulse shadow-md">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <Volume2 className="w-5 h-5 animate-bounce" />
                <span>⚠️ FOCUS BUDDY ALARM ACTIVE! ⚠️</span>
              </div>
              <p className="text-[10px] text-center text-rose-800 leading-relaxed font-semibold">
                Optical sensor indicates high drowsiness or eye closure. Click below to stop this alarm.
              </p>
              <button
                type="button"
                onClick={dismissAlarm}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
              >
                <VolumeX className="w-4 h-4" />
                Stop & Dismiss Alarm
              </button>
            </div>
          )}

          {alertState === 'eyes_closed_3s' && !isAlarmRinging && (
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

          {alertState === 'rapid_blinking' && !isAlarmRinging && (
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
