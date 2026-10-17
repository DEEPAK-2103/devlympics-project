// Web Audio Floor Chimes & Speech Synthesis Service
import { ToneType, VoiceProfile } from '../types';

const VOICE_PROFILE_KEY = 'synapseflow_voice_profile_v1';

export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  userName: 'Alex Rivera',
  role: 'Staff Distributed Systems Architect',
  techStack: 'Distributed Systems, TypeScript, Go, Redis',
  selectedVoice: '',
  speechPitch: 1.0,
  speechRate: 1.0,
};

export class SpeechService {
  private static audioCtx: AudioContext | null = null;
  private static cachedProfile: VoiceProfile | null = null;

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public static loadSavedVoiceProfile(): VoiceProfile {
    if (this.cachedProfile) return this.cachedProfile;
    if (typeof window === 'undefined') return DEFAULT_VOICE_PROFILE;

    try {
      const stored = localStorage.getItem(VOICE_PROFILE_KEY);
      if (stored) {
        const profile: VoiceProfile = { ...DEFAULT_VOICE_PROFILE, ...JSON.parse(stored) };
        this.cachedProfile = profile;
        return profile;
      }
    } catch (e) {
      console.warn('Failed to load voice profile from localStorage:', e);
    }

    const defaultProf: VoiceProfile = { ...DEFAULT_VOICE_PROFILE };
    this.cachedProfile = defaultProf;
    return defaultProf;
  }

  public static saveVoiceProfile(profile: VoiceProfile): void {
    this.cachedProfile = profile;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(VOICE_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save voice profile to localStorage:', e);
    }
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
   * Plays audio cues for facial gesture detection (head nod, head shake, brow raise)
   */
  public static playGestureChime(type: 'nod' | 'shake' | 'brow'): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'nod') {
        // Ascending affirmative chime: C5 -> E5
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.32);
      } else if (type === 'shake') {
        // Descending gentle rejection tone: 440 -> 349 Hz
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440.0, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(349.23, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Brow raise: High beacon chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.18); // C6
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      }
    } catch (e) {
      console.warn('Gesture chime error:', e);
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
   * Speaks the generated sentence aloud with calibrated pitch/rate per tone & user profile
   */
  public static speakText(
    text: string,
    tone: ToneType = 'professional',
    onEnd?: () => void,
    customProfile?: Partial<VoiceProfile>
  ): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any active speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const profile = { ...this.loadSavedVoiceProfile(), ...customProfile };

    // Select chosen voice from user profile or best available natural voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (profile.selectedVoice) {
      selectedVoice = voices.find((v) => v.name === profile.selectedVoice);
    }

    if (!selectedVoice) {
      selectedVoice =
        voices.find(
          (v) =>
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Alex')) &&
            v.lang.startsWith('en')
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Tone multiplier adjustments
    let toneRateMultiplier = 1.0;
    let tonePitchMultiplier = 1.0;

    if (tone === 'direct') {
      toneRateMultiplier = 1.15;
      tonePitchMultiplier = 1.0;
    } else if (tone === 'casual') {
      toneRateMultiplier = 1.05;
      tonePitchMultiplier = 1.06;
    } else {
      // professional
      toneRateMultiplier = 1.0;
      tonePitchMultiplier = 0.98;
    }

    // Combine user profile pitch/rate with tone multiplier
    const finalRate = Math.max(0.7, Math.min(1.5, profile.speechRate * toneRateMultiplier));
    const finalPitch = Math.max(0.7, Math.min(1.4, profile.speechPitch * tonePitchMultiplier));

    utterance.rate = finalRate;
    utterance.pitch = finalPitch;

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
