# Loud Alarm & Multi-Timer with AI Eye Drowsiness Detection

A high-audibility web-based timer application with real-time AI webcam eye closure detection and background desktop notifications.

## Features

- **⏱️ Precision Multi-Timer System** — Hero focus timer with SVG ring countdown + parallel task timers
- **🔊 Web Audio API Loud Alarm Engine** — Synthesized alarm tones (Decent Chime, Emergency Siren, Digital Beep, Brass Bell, High Octave Pulse)
- **👁️ AI Drowsiness & Eye Closure Monitor** — Webcam-based Eye Aspect Ratio (EAR) analysis using MediaPipe Face Landmarker
- **📳 Background Desktop Warnings** — System push notifications via Web Notifications API when timers expire or eyes close while app is minimized
- **🚨 Full-Screen Alert Modals** — High-visibility red flashing overlay with STOP ALARM and SNOOZE (+5 min) controls

## Usage

Just open `index.html` in a browser (served via HTTP, not file://).

```bash
npx http-server . -p 8080
```

Then visit `http://localhost:8080/loud-alarm-timer/`

## File Structure

```
loud-alarm-timer/
├── index.html           # Main UI with timer controls, camera card & alert modals
├── styles.css           # Glassmorphism dark theme design system
└── js/
    ├── audio.js         # Web Audio API synthesizer (5 alarm sound presets)
    ├── timer.js         # Precision countdown engine
    ├── eye-detector.js  # MediaPipe Face & EAR eye closure detector
    ├── background.js    # Web Notifications & Page Visibility API
    └── app.js           # Main UI binder, keyboard shortcuts & state management
```
