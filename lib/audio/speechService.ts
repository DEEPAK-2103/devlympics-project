// Web Audio Floor Chimes & Speech Synthesis Service
import { ToneType } from '../types';

export class SpeechService {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a polite, pleasant floor-reservation audio cue ("The Beacon")
   * alerting meeting participants that the user is actively formulating speech.
   */
  public static playFloorChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  /**
   * Plays a soft cancel/abort tone when prolonged blink cancel guard triggers
   */
  public static playCancelChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440.0, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(220.0, ctx.currentTime + 0.2); // A3

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio cancel tone error:', e);
    }
  }

  /**
   * Speaks the generated sentence aloud with calibrated pitch/rate per tone
   */
  public static speakText(text: string, tone: ToneType = 'professional', onEnd?: () => void): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any active speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Pick a high-quality natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (tone === 'direct') {
      utterance.rate = 1.15;
      utterance.pitch = 1.0;
    } else if (tone === 'casual') {
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
    } else {
      // professional
      utterance.rate = 1.0;
      utterance.pitch = 0.98;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public static stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
