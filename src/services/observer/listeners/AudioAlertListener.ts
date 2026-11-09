/**
 * Concrete Observer / Listener: AudioAlertListener
 * 
 * Subscribes to EMAIL_RECEIVED events and synthesizes an audible chime alert
 * using the browser's native Web Audio API (zero external audio file dependencies).
 */

import { IMailEventListener, MailEventPayloads } from '../../../types/observer.types';
import { STORAGE_KEYS } from '../../../library/constants';

export class AudioAlertListener implements IMailEventListener<'EMAIL_RECEIVED'> {
  public readonly listenerName = 'AudioAlertListener';
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Check initial preference from localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED_KEY);
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED_KEY, String(enabled));
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public update(_event: 'EMAIL_RECEIVED', data: MailEventPayloads['EMAIL_RECEIVED']): void {
    if (!this.isEnabled || data.newEmails.length === 0) {
      return;
    }

    this.playChime();
  }

  /**
   * Synthesize a two-tone pleasant notification chime using Web Audio API
   */
  private playChime(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      // Resume context if suspended by browser autoplay policy
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: B5 (987.77 Hz) slightly delayed
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('[AudioAlertListener] Web Audio chime playback failed:', err);
    }
  }
}

