/**
 * Main Application Binder & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Hero Main Timer
  const mainLabelInput = document.getElementById('main-timer-label');
  const mainDisplay = document.getElementById('main-display');
  const timerStatusText = document.getElementById('timer-status-text');
  const ringFill = document.getElementById('ring-fill');
  
  const hoursInput = document.getElementById('hours-input');
  const minsInput = document.getElementById('mins-input');
  const secsInput = document.getElementById('secs-input');

  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');

  // DOM Elements - Settings & Audio
  const testAudioBtn = document.getElementById('test-audio-btn');
  const soundSelect = document.getElementById('alarm-sound-select');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeValDisplay = document.getElementById('volume-val-display');
  const boostCheck = document.getElementById('boost-volume-check');

  // DOM Elements - Camera & Eye Monitor
  const toggleCameraBtn = document.getElementById('toggle-camera-btn');
  const webcamVideo = document.getElementById('webcam-video');
  const eyeCanvas = document.getElementById('eye-canvas');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const eyeSensitivitySelect = document.getElementById('eye-sensitivity-select');

  // DOM Elements - Multi Timers
  const addMultiTimerBtn = document.getElementById('add-multi-timer-btn');
  const multiTimersList = document.getElementById('multi-timers-list');

  // DOM Elements - Alarm Modal Overlays
  const alarmOverlay = document.getElementById('alarm-overlay');
  const alarmTimerName = document.getElementById('alarm-timer-name');
  const alarmTimeFinished = document.getElementById('alarm-time-finished');
  const stopAlarmBtn = document.getElementById('stop-alarm-btn');
  const snoozeAlarmBtn = document.getElementById('snooze-alarm-btn');

  const eyeAlertOverlay = document.getElementById('eye-alert-overlay');
  const stopEyeAlarmBtn = document.getElementById('stop-eye-alarm-btn');

  // App State
  let heroTimer = null;
  let parallelTimers = [];
  let currentActiveAlarmTimer = null;
  let eyeDetector = null;
  let isEyeAlarmActive = false;
  const RING_CIRCUMFERENCE = 785.4; // 2 * PI * 125

  // 1. Initialize Hero Main Timer
  function initHeroTimer() {
    const initialSecs = 300; // 5 mins
    heroTimer = new PrecisionTimer('hero-main', mainLabelInput.value, initialSecs, updateHeroUI, onTimerExpire);
    updateHeroInputs(initialSecs);
    updateHeroUI(heroTimer);
  }

  function updateHeroInputs(totalSecs) {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    hoursInput.value = String(h).padStart(2, '0');
    minsInput.value = String(m).padStart(2, '0');
    secsInput.value = String(s).padStart(2, '0');
  }

  function updateHeroUI(timer) {
    mainDisplay.textContent = timer.getFormattedTime();
    
    // Update SVG Progress Ring
    const fraction = timer.getProgressFraction();
    const dashOffset = RING_CIRCUMFERENCE * (1 - fraction);
    ringFill.style.strokeDashoffset = dashOffset;

    // Status & Title Sync
    if (timer.state === 'RUNNING') {
      timerStatusText.textContent = '⏱️ Timer is counting down...';
      timerStatusText.style.color = 'var(--primary-cyan)';
      document.title = `(${timer.getFormattedTime()}) ${timer.label}`;
      startBtn.disabled = true;
      pauseBtn.disabled = false;
    } else if (timer.state === 'PAUSED') {
      timerStatusText.textContent = '⏸️ Timer Paused';
      timerStatusText.style.color = 'var(--accent-orange)';
      document.title = `[PAUSED] ${timer.label}`;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    } else if (timer.state === 'EXPIRED') {
      timerStatusText.textContent = '🚨 TIMER COMPLETED!';
      timerStatusText.style.color = 'var(--accent-pink)';
      document.title = `🚨 ALARM - ${timer.label}`;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    } else { // IDLE
      timerStatusText.textContent = 'Ready to start';
      timerStatusText.style.color = 'var(--text-muted)';
      document.title = 'Loud Alarm & Multi-Timer';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  }

  // Handle Input Changes on Hero Timer
  [hoursInput, minsInput, secsInput].forEach(input => {
    input.addEventListener('change', () => {
      if (heroTimer.state === 'IDLE') {
        heroTimer.setDuration(hoursInput.value, minsInput.value, secsInput.value);
        updateHeroUI(heroTimer);
      }
    });
  });

  mainLabelInput.addEventListener('input', () => {
    heroTimer.label = mainLabelInput.value || 'Primary Timer';
  });

  // Hero Controls
  startBtn.addEventListener('click', () => {
    window.alarmAudio.initContext();
    if (heroTimer.state === 'IDLE') {
      heroTimer.setDuration(hoursInput.value, minsInput.value, secsInput.value);
    }
    heroTimer.start();
    updateHeroUI(heroTimer);
  });

  pauseBtn.addEventListener('click', () => {
    heroTimer.pause();
    updateHeroUI(heroTimer);
  });

  resetBtn.addEventListener('click', () => {
    heroTimer.reset();
    updateHeroUI(heroTimer);
  });

  // Presets
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.dataset.secs);
      if (heroTimer.state === 'RUNNING') {
        heroTimer.addSeconds(secs);
      } else {
        const newTotal = heroTimer.remainingSeconds + secs;
        updateHeroInputs(newTotal);
        heroTimer.setDuration(hoursInput.value, minsInput.value, secsInput.value);
        updateHeroUI(heroTimer);
      }
    });
  });

  // 2. Audio Control & Sound Testing
  testAudioBtn.addEventListener('click', () => {
    window.alarmAudio.initContext();
    window.alarmAudio.testSound(soundSelect.value);
  });

  soundSelect.addEventListener('change', () => {
    window.alarmAudio.setSoundType(soundSelect.value);
  });

  volumeSlider.addEventListener('input', () => {
    const val = volumeSlider.value;
    volumeValDisplay.textContent = `${val}%`;
    window.alarmAudio.setVolume(val);
  });

  boostCheck.addEventListener('change', () => {
    window.alarmAudio.setBoost(boostCheck.checked);
  });

  // 3. AI Camera Eye Detection Monitor
  eyeDetector = new EyeDrowsinessDetector(
    webcamVideo,
    eyeCanvas,
    (status) => {
      // Status update callback
      if (status.error) {
        alert(status.error);
        toggleCameraBtn.innerHTML = '<i class="lni lni-video"></i> Enable Camera';
        cameraPlaceholder.classList.remove('hidden');
      }
    },
    (durationMs) => {
      // Eye closure / Drowsiness alarm trigger callback!
      if (!isEyeAlarmActive) {
        isEyeAlarmActive = true;

        window.alarmAudio.initContext();
        window.alarmAudio.startAlarm(soundSelect.value || 'decent');

        eyeAlertOverlay.classList.remove('hidden');
        document.title = "😴 EYES CLOSED DETECTED!";

        window.bgManager.sendDesktopWarning(
          "😴 EYES CLOSED ALERT!",
          "Drowsiness detected! Your eyes have been closed. Please wake up!",
          "eye-closed-alarm"
        );
      }
    }
  );

  toggleCameraBtn.addEventListener('click', async () => {
    window.alarmAudio.initContext();
    if (!eyeDetector.isRunning) {
      cameraPlaceholder.style.display = 'none';
      toggleCameraBtn.innerHTML = '<i class="lni lni-power-switch"></i> Stop Camera';
      await eyeDetector.startCamera();
    } else {
      eyeDetector.stopCamera();
      cameraPlaceholder.style.display = 'flex';
      toggleCameraBtn.innerHTML = '<i class="lni lni-video"></i> Enable Camera';
    }
  });

  eyeSensitivitySelect.addEventListener('change', () => {
    const val = parseFloat(eyeSensitivitySelect.value);
    eyeDetector.setSensitivity(val);
  });

  stopEyeAlarmBtn.addEventListener('click', () => {
    silenceEyeAlarm();
  });

  function silenceEyeAlarm() {
    isEyeAlarmActive = false;
    window.alarmAudio.stopAlarm();
    eyeAlertOverlay.classList.add('hidden');
    document.title = 'Loud Alarm & Multi-Timer';
  }

  // 4. Timer Expiration Trigger & Background Warning
  function onTimerExpire(timer) {
    currentActiveAlarmTimer = timer;

    // Start audio alarm synthesis loop
    window.alarmAudio.startAlarm(soundSelect.value);

    // Show overlay modal
    alarmTimerName.textContent = timer.label || 'Timer';
    alarmTimeFinished.textContent = timer.getFormattedTime();
    alarmOverlay.classList.remove('hidden');

    // Send Background Desktop Warning
    window.bgManager.sendDesktopWarning(
      '🚨 TIMER EXPIRED!',
      `${timer.label} has completed!`,
      'timer-expired-alarm'
    );
  }

  stopAlarmBtn.addEventListener('click', silenceAlarm);
  
  snoozeAlarmBtn.addEventListener('click', () => {
    silenceAlarm();
    if (currentActiveAlarmTimer) {
      if (currentActiveAlarmTimer.id === 'hero-main') {
        updateHeroInputs(300); // 5 mins
        heroTimer.setDuration(0, 5, 0);
        heroTimer.start();
        updateHeroUI(heroTimer);
      } else {
        currentActiveAlarmTimer.setDuration(0, 5, 0);
        currentActiveAlarmTimer.start();
        renderParallelTimersList();
      }
    }
  });

  function silenceAlarm() {
    window.alarmAudio.stopAlarm();
    alarmOverlay.classList.add('hidden');
    document.title = 'Loud Alarm & Multi-Timer';
  }

  // 5. Parallel Multi-Timers Management
  let multiTimerCounter = 1;

  addMultiTimerBtn.addEventListener('click', () => {
    window.alarmAudio.initContext();
    const timerId = `multi-${Date.now()}`;
    const name = `Parallel Task ${multiTimerCounter++}`;
    const defaultDuration = 180; // 3 mins

    const newTimer = new PrecisionTimer(
      timerId,
      name,
      defaultDuration,
      () => renderParallelTimersList(),
      (t) => {
        renderParallelTimersList();
        onTimerExpire(t);
      }
    );

    parallelTimers.push(newTimer);
    renderParallelTimersList();
  });

  function renderParallelTimersList() {
    if (parallelTimers.length === 0) {
      multiTimersList.innerHTML = `
        <div class="empty-state">
          <i class="lni lni-alarm"></i>
          <p>No parallel timers added. Click "New Timer" to track multiple tasks at once!</p>
        </div>
      `;
      return;
    }

    multiTimersList.innerHTML = '';
    parallelTimers.forEach(t => {
      const item = document.createElement('div');
      item.className = `multi-timer-item ${t.state === 'RUNNING' ? 'running' : ''}`;
      
      item.innerHTML = `
        <div class="multi-timer-info">
          <span class="multi-timer-name">${t.label}</span>
          <span class="multi-timer-time">${t.getFormattedTime()}</span>
        </div>
        <div class="multi-timer-actions">
          ${t.state === 'RUNNING' 
            ? `<button class="btn btn-secondary btn-icon-only pause-p-btn" title="Pause"><i class="lni lni-pause"></i></button>`
            : `<button class="btn btn-accent btn-icon-only start-p-btn" title="Start"><i class="lni lni-play"></i></button>`
          }
          <button class="btn btn-outline btn-icon-only reset-p-btn" title="Reset"><i class="lni lni-reload"></i></button>
          <button class="btn btn-outline btn-icon-only delete-p-btn" style="color:#ff0844;" title="Delete"><i class="lni lni-trash-can"></i></button>
        </div>
      `;

      const startP = item.querySelector('.start-p-btn');
      const pauseP = item.querySelector('.pause-p-btn');
      const resetP = item.querySelector('.reset-p-btn');
      const deleteP = item.querySelector('.delete-p-btn');

      if (startP) startP.addEventListener('click', () => { window.alarmAudio.initContext(); t.start(); renderParallelTimersList(); });
      if (pauseP) pauseP.addEventListener('click', () => { t.pause(); renderParallelTimersList(); });
      if (resetP) resetP.addEventListener('click', () => { t.reset(); renderParallelTimersList(); });
      if (deleteP) deleteP.addEventListener('click', () => {
        t.reset();
        parallelTimers = parallelTimers.filter(pt => pt.id !== t.id);
        renderParallelTimersList();
      });

      multiTimersList.appendChild(item);
    });
  }

  // 6. Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (heroTimer.state === 'RUNNING') {
        heroTimer.pause();
      } else {
        window.alarmAudio.initContext();
        heroTimer.start();
      }
      updateHeroUI(heroTimer);
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      heroTimer.reset();
      updateHeroUI(heroTimer);
    } else if (e.code === 'Escape') {
      if (!alarmOverlay.classList.contains('hidden')) {
        silenceAlarm();
      }
      if (!eyeAlertOverlay.classList.contains('hidden')) {
        silenceEyeAlarm();
      }
    }
  });

  // Start initialization
  initHeroTimer();
});
