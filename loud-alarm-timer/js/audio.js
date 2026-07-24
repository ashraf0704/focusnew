/**
 * Web Audio API Loud & Decent Alarm Generator & Synthesizer
 * Produces synthesized audio alarm tones including Emergency Sirens and Decent Wake-Up Chimes.
 */

class AlarmAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGainNode = null;
    this.compressorNode = null;
    this.activeOscillators = [];
    this.isPlaying = false;
    this.loopInterval = null;

    this.volume = 1.0;
    this.boostEnabled = true;
    this.currentSoundType = 'decent'; // Default to decent sound tone for pleasant wake-up
  }

  /**
   * Initializes the Audio Context on user gesture to bypass browser autoplay policies
   */
  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      // Dynamics compressor node for loudness boosting & anti-clipping
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-10, this.audioCtx.currentTime);
      this.compressorNode.knee.setValueAtTime(40, this.audioCtx.currentTime);
      this.compressorNode.ratio.setValueAtTime(16, this.audioCtx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressorNode.release.setValueAtTime(0.1, this.audioCtx.currentTime);

      // Master Gain Node
      this.masterGainNode = this.audioCtx.createGain();
      this.updateGain();

      this.compressorNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolume(volPercent) {
    this.volume = Math.max(0.1, Math.min(1.0, volPercent / 100));
    this.updateGain();
  }

  setBoost(enabled) {
    this.boostEnabled = enabled;
    this.updateGain();
  }

  setSoundType(soundType) {
    this.currentSoundType = soundType;
  }

  updateGain() {
    if (this.masterGainNode && this.audioCtx) {
      const boostFactor = this.boostEnabled ? 1.8 : 1.0;
      const targetGain = this.volume * boostFactor;
      this.masterGainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    }
  }

  /**
   * Plays continuous alarm loop until stopped
   */
  startAlarm(soundType = null) {
    this.initContext();
    this.stopAlarm(); // Clear previous sound

    const type = soundType || this.currentSoundType;
    this.isPlaying = true;

    // Trigger immediate sound pulse and repeat loop
    this.triggerPulse(type);
    this.loopInterval = setInterval(() => {
      if (this.isPlaying) {
        this.triggerPulse(type);
      }
    }, this.getPulseInterval(type));
  }

  getPulseInterval(type) {
    switch (type) {
      case 'decent': return 750;
      case 'digital': return 600;
      case 'heavy_bell': return 800;
      case 'high_octave': return 400;
      case 'siren': default: return 700;
    }
  }

  /**
   * Stops the active alarm
   */
  stopAlarm() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  /**
   * Plays a 2-second test audio preview
   */
  testSound(soundType) {
    this.startAlarm(soundType);
    setTimeout(() => {
      this.stopAlarm();
    }, 2200);
  }

  /**
   * Synthesizes audio pulses based on selected preset type
   */
  triggerPulse(type) {
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'decent':
        this.playDecentChime(now);
        break;
      case 'siren':
        this.playSirenPulse(now);
        break;
      case 'digital':
        this.playDigitalPulse(now);
        break;
      case 'heavy_bell':
        this.playBellPulse(now);
        break;
      case 'high_octave':
        this.playHighOctavePulse(now);
        break;
      default:
        this.playDecentChime(now);
        break;
    }
  }

  // 0. Decent Wake-Up Chime (Harmonic Gentle Synth Pulse - Pleasant yet clear)
  playDecentChime(now) {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.5, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.connect(gain);
      gain.connect(this.compressorNode);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
      this.activeOscillators.push(osc);
    });
  }

  // 1. Loud Emergency Siren (Dual Sweep)
  playSirenPulse(now) {
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(700, now);
    osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
    osc1.frequency.exponentialRampToValueAtTime(700, now + 0.6);

    osc2.frequency.setValueAtTime(1050, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(1050, now + 0.6);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.compressorNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);

    this.activeOscillators.push(osc1, osc2);
  }

  // 2. Classic Digital Watch Beep
  playDigitalPulse(now) {
    const beepTimes = [0, 0.12, 0.24];
    beepTimes.forEach(delay => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now + delay);

      gain.gain.setValueAtTime(0.9, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);

      osc.connect(gain);
      gain.connect(this.compressorNode);

      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
      this.activeOscillators.push(osc);
    });
  }

  // 3. Heavy Brass Bell
  playBellPulse(now) {
    const freqs = [440, 880, 1320, 1760];
    freqs.forEach(freq => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.7 / (freq / 440), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.compressorNode);

      osc.start(now);
      osc.stop(now + 0.75);
      this.activeOscillators.push(osc);
    });
  }

  // 4. High Octave Pulse
  playHighOctavePulse(now) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.setValueAtTime(3500, now + 0.15);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    osc.connect(gain);
    gain.connect(this.compressorNode);

    osc.start(now);
    osc.stop(now + 0.32);
    this.activeOscillators.push(osc);
  }
}

// Global Singleton Instance
window.alarmAudio = new AlarmAudioEngine();
