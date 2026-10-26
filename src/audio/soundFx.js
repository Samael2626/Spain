class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.45;
    this.lastPlayed = 0;
    this.master = null;
  }

  init() {
    if (!this.enabled || typeof window === 'undefined') return false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
      return this.ctx.state !== 'closed';
    } catch {
      return false;
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master && this.ctx?.state !== 'closed') {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.015);
    }
  }

  playTone(start, end, duration, peak, type = 'sine', delay = 0) {
    if (!this.init()) return;
    const now = performance.now();
    if (delay === 0 && now - this.lastPlayed < 35) return;
    if (delay === 0) this.lastPlayed = now;
    const at = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, at);
    oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(peak, at + Math.min(0.015, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.005);
  }

  playClick() { this.playTone(800, 300, 0.055, 0.13); }
  playSwitch() { this.playTone(450, 950, 0.09, 0.13, 'triangle'); }
  playHotspot() { this.playTone(520, 1040, 0.15, 0.1); }
  playSuccess() {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      this.playTone(frequency, frequency, 0.28, 0.1, 'sine', index * 0.07);
    });
  }
}

export const sound = new SoundManager();
