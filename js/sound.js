// Gerenciador de efeitos sonoros sintetizados via Web Audio API e feedback tátil.

export class SoundManager {
  constructor(muted = false) {
    this.ctx = null;
    this.muted = Boolean(muted);
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (!this.muted) this.playClick();
    return this.muted;
  }

  init() {
    if (this.muted) return false;
    if (typeof window === 'undefined') return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  vibrate(pattern = 12) {
    if (this.muted) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignora dispositivos sem suporte
      }
    }
  }

  playTone(freq, duration = 0.08, type = 'sine', startDelay = 0, volume = 0.12, endFreq = null) {
    if (!this.init()) return;
    const now = this.ctx.currentTime + startDelay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playClick() {
    this.playTone(440, 0.05, 'sine', 0, 0.1, 880);
  }

  playError() {
    this.vibrate([25, 40, 25]);
    this.playTone(150, 0.18, 'sawtooth', 0, 0.14, 95);
  }

  playMatch(comboLevel = 1) {
    this.vibrate(18);
    const baseFreq = 300 + Math.min(comboLevel * 50, 600);
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.13, 'triangle', idx * 0.04, 0.11);
    });
  }

  playUndo() {
    this.playTone(620, 0.09, 'sine', 0, 0.1, 310);
  }

  playPowerup(kind = 'generic') {
    this.vibrate(25);
    if (kind === 'freeze') {
      [880, 1174, 1318, 1760].forEach((f, i) => this.playTone(f, 0.12, 'sine', i * 0.04, 0.09));
    } else if (kind === 'bomb') {
      this.vibrate([40, 30, 60]);
      this.playTone(180, 0.32, 'sawtooth', 0, 0.18, 45);
      this.playTone(320, 0.2, 'square', 0.05, 0.1, 80);
    } else if (kind === 'magnet') {
      this.playTone(340, 0.18, 'triangle', 0, 0.12, 780);
    } else {
      [523, 659, 784].forEach((f, i) => this.playTone(f, 0.1, 'triangle', i * 0.04, 0.1));
    }
  }

  playAchievement() {
    this.vibrate([30, 50, 50]);
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((freq, idx) => {
      this.playTone(freq, 0.25, 'triangle', idx * 0.06, 0.13);
    });
  }

  playWin() {
    this.vibrate([35, 45, 70]);
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((freq, idx) => {
      this.playTone(freq, 0.3, 'sine', idx * 0.08, 0.15);
    });
  }
}

