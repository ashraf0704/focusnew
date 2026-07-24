/**
 * Precision Timer Engine
 * Handles countdown calculations, SVG progress ring updating, and alarm events.
 */

class PrecisionTimer {
  constructor(id, label = 'Timer', durationSeconds = 300, onTick = null, onExpire = null) {
    this.id = id;
    this.label = label;
    this.totalSeconds = Math.max(1, durationSeconds);
    this.remainingSeconds = this.totalSeconds;
    
    this.state = 'IDLE'; // IDLE, RUNNING, PAUSED, EXPIRED
    this.endTime = null;
    this.animFrameId = null;
    this.intervalId = null;

    this.onTick = onTick;
    this.onExpire = onExpire;
  }

  setDuration(hours, mins, secs) {
    const total = (parseInt(hours) || 0) * 3600 + (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);
    this.totalSeconds = Math.max(1, total);
    if (this.state === 'IDLE') {
      this.remainingSeconds = this.totalSeconds;
    }
  }

  addSeconds(secs) {
    this.totalSeconds += secs;
    this.remainingSeconds += secs;
    if (this.state === 'RUNNING') {
      this.endTime += secs * 1000;
    }
    if (this.onTick) this.onTick(this);
  }

  start() {
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = this.totalSeconds;
    }
    
    this.state = 'RUNNING';
    this.endTime = Date.now() + (this.remainingSeconds * 1000);

    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, 200);

    this.tick();
  }

  pause() {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
      if (this.onTick) this.onTick(this);
    }
  }

  reset() {
    this.state = 'IDLE';
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.remainingSeconds = this.totalSeconds;
    if (this.onTick) this.onTick(this);
  }

  tick() {
    if (this.state !== 'RUNNING') return;

    const now = Date.now();
    const diff = Math.ceil((this.endTime - now) / 1000);

    if (diff <= 0) {
      this.remainingSeconds = 0;
      this.state = 'EXPIRED';
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
      
      if (this.onTick) this.onTick(this);
      if (this.onExpire) this.onExpire(this);
    } else {
      this.remainingSeconds = diff;
      if (this.onTick) this.onTick(this);
    }
  }

  getFormattedTime() {
    const hrs = Math.floor(this.remainingSeconds / 3600);
    const mins = Math.floor((this.remainingSeconds % 3600) / 60);
    const secs = this.remainingSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  getProgressFraction() {
    if (this.totalSeconds === 0) return 0;
    return Math.max(0, Math.min(1, this.remainingSeconds / this.totalSeconds));
  }
}
