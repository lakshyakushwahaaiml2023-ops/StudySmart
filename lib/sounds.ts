/**
 * Premium UI Sound System for StudySmart
 * Uses the Web Audio API to generate clean, high-end synth blips 
 * without needing external assets.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", volume: number = 0.1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Soft "Blip" for incidental UI actions
  playBlip() {
    this.playTone(880, 0.1, "sine", 0.05);
  }

  // Success chime for task completion
  playSuccess() {
    this.playTone(440, 0.1, "triangle", 0.1);
    setTimeout(() => this.playTone(880, 0.2, "triangle", 0.08), 50);
    setTimeout(() => this.playTone(1320, 0.4, "triangle", 0.05), 100);
  }

  // Notification for incoming messages or alerts
  playNotify() {
    this.playTone(660, 0.15, "sine", 0.1);
    setTimeout(() => this.playTone(550, 0.2, "sine", 0.08), 100);
  }

  // Error/Refusal sound
  playError() {
    this.playTone(220, 0.1, "sawtooth", 0.05);
    setTimeout(() => this.playTone(110, 0.2, "sawtooth", 0.05), 100);
  }
}

export const sounds = new SoundSystem();
