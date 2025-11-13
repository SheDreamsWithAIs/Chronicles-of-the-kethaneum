/**
 * Audio Manager
 * Centralized audio system for managing background music, ambient sounds,
 * sound effects, and voice lines with volume control and muting
 */

export enum AudioCategory {
  MUSIC = 'music',
  AMBIENT = 'ambient',
  SFX = 'sfx',
  VOICE = 'voice',
}

export interface AudioSettings {
  masterVolume: number; // 0-1
  musicVolume: number; // 0-1
  ambientVolume: number; // 0-1
  sfxVolume: number; // 0-1
  voiceVolume: number; // 0-1
  masterMuted: boolean;
  musicMuted: boolean;
  ambientMuted: boolean;
  sfxMuted: boolean;
  voiceMuted: boolean;
}

interface AudioTrack {
  audio: HTMLAudioElement;
  category: AudioCategory;
  loop: boolean;
  fadeDuration?: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.8,
  ambientVolume: 0.6,
  sfxVolume: 0.7,
  voiceVolume: 1.0,
  masterMuted: false,
  musicMuted: false,
  ambientMuted: false,
  sfxMuted: false,
  voiceMuted: false,
};

/**
 * AudioManager - Singleton class for managing all game audio
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private tracks: Map<string, AudioTrack> = new Map();
  private currentMusic: string | null = null;
  private currentAmbient: string | null = null;
  private initialized = false;
  private audioContext: AudioContext | null = null;

  private constructor() {
    // Private constructor for singleton pattern
    if (typeof window !== 'undefined') {
      // Initialize Web Audio Context for advanced features
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
      }
    }
  }

  /**
   * Get the singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the audio manager with saved settings
   */
  public initialize(settings?: Partial<AudioSettings>): void {
    if (this.initialized) return;

    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    this.initialized = true;
  }

  /**
   * Preload an audio file
   */
  public async preload(
    id: string,
    src: string,
    category: AudioCategory,
    loop = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.tracks.has(id)) {
        resolve();
        return;
      }

      const audio = new Audio(src);
      audio.loop = loop;
      audio.preload = 'auto';

      audio.addEventListener('canplaythrough', () => {
        this.tracks.set(id, { audio, category, loop });
        resolve();
      }, { once: true });

      audio.addEventListener('error', (e) => {
        console.error(`Failed to load audio: ${id}`, e);
        reject(e);
      }, { once: true });

      audio.load();
    });
  }

  /**
   * Play background music (crossfades if music is already playing)
   */
  public async playMusic(id: string, fadeDuration = 1000): Promise<void> {
    const track = this.tracks.get(id);
    if (!track || track.category !== AudioCategory.MUSIC) {
      console.warn(`Music track not found: ${id}`);
      return;
    }

    // Stop current music with fade out
    if (this.currentMusic && this.currentMusic !== id) {
      await this.stopMusic(fadeDuration);
    }

    this.currentMusic = id;
    track.audio.volume = 0;

    try {
      await track.audio.play();
      await this.fadeIn(track.audio, fadeDuration);
      this.updateVolume(track.audio, AudioCategory.MUSIC);
    } catch (e) {
      console.error(`Failed to play music: ${id}`, e);
    }
  }

  /**
   * Stop background music
   */
  public async stopMusic(fadeDuration = 1000): Promise<void> {
    if (!this.currentMusic) return;

    const track = this.tracks.get(this.currentMusic);
    if (track) {
      await this.fadeOut(track.audio, fadeDuration);
      track.audio.pause();
      track.audio.currentTime = 0;
    }
    this.currentMusic = null;
  }

  /**
   * Play ambient sound (loops automatically)
   */
  public async playAmbient(id: string, fadeDuration = 2000): Promise<void> {
    const track = this.tracks.get(id);
    if (!track || track.category !== AudioCategory.AMBIENT) {
      console.warn(`Ambient track not found: ${id}`);
      return;
    }

    // Stop current ambient
    if (this.currentAmbient && this.currentAmbient !== id) {
      await this.stopAmbient(fadeDuration);
    }

    this.currentAmbient = id;
    track.audio.volume = 0;

    try {
      await track.audio.play();
      await this.fadeIn(track.audio, fadeDuration);
      this.updateVolume(track.audio, AudioCategory.AMBIENT);
    } catch (e) {
      console.error(`Failed to play ambient: ${id}`, e);
    }
  }

  /**
   * Stop ambient sound
   */
  public async stopAmbient(fadeDuration = 2000): Promise<void> {
    if (!this.currentAmbient) return;

    const track = this.tracks.get(this.currentAmbient);
    if (track) {
      await this.fadeOut(track.audio, fadeDuration);
      track.audio.pause();
      track.audio.currentTime = 0;
    }
    this.currentAmbient = null;
  }

  /**
   * Play a sound effect (one-shot, no looping)
   */
  public playSFX(id: string, volume?: number): void {
    const track = this.tracks.get(id);
    if (!track || track.category !== AudioCategory.SFX) {
      console.warn(`SFX track not found: ${id}`);
      return;
    }

    // Clone the audio element for overlapping sounds
    const sfx = track.audio.cloneNode() as HTMLAudioElement;
    sfx.volume = volume !== undefined ? volume : 1;
    this.updateVolume(sfx, AudioCategory.SFX);

    sfx.play().catch(e => console.error(`Failed to play SFX: ${id}`, e));

    // Clean up after playing
    sfx.addEventListener('ended', () => {
      sfx.remove();
    });
  }

  /**
   * Play a voice line
   */
  public async playVoice(id: string): Promise<void> {
    const track = this.tracks.get(id);
    if (!track || track.category !== AudioCategory.VOICE) {
      console.warn(`Voice track not found: ${id}`);
      return;
    }

    track.audio.currentTime = 0;
    this.updateVolume(track.audio, AudioCategory.VOICE);

    try {
      await track.audio.play();
    } catch (e) {
      console.error(`Failed to play voice: ${id}`, e);
    }
  }

  /**
   * Stop a specific audio track
   */
  public stop(id: string): void {
    const track = this.tracks.get(id);
    if (track) {
      track.audio.pause();
      track.audio.currentTime = 0;
    }
  }

  /**
   * Stop all audio
   */
  public stopAll(): void {
    this.tracks.forEach(track => {
      track.audio.pause();
      track.audio.currentTime = 0;
    });
    this.currentMusic = null;
    this.currentAmbient = null;
  }

  /**
   * Update volume settings
   */
  public setVolume(category: 'master' | AudioCategory, volume: number): void {
    volume = Math.max(0, Math.min(1, volume)); // Clamp 0-1

    if (category === 'master') {
      this.settings.masterVolume = volume;
    } else {
      this.settings[`${category}Volume` as keyof AudioSettings] = volume;
    }

    // Update all active tracks
    this.updateAllVolumes();
  }

  /**
   * Get volume setting
   */
  public getVolume(category: 'master' | AudioCategory): number {
    if (category === 'master') {
      return this.settings.masterVolume;
    }
    return this.settings[`${category}Volume` as keyof AudioSettings] as number;
  }

  /**
   * Toggle mute for a category
   */
  public setMuted(category: 'master' | AudioCategory, muted: boolean): void {
    if (category === 'master') {
      this.settings.masterMuted = muted;
    } else {
      this.settings[`${category}Muted` as keyof AudioSettings] = muted;
    }

    this.updateAllVolumes();
  }

  /**
   * Get mute status
   */
  public isMuted(category: 'master' | AudioCategory): boolean {
    if (category === 'master') {
      return this.settings.masterMuted;
    }
    return this.settings[`${category}Muted` as keyof AudioSettings] as boolean;
  }

  /**
   * Toggle mute
   */
  public toggleMute(category: 'master' | AudioCategory): void {
    this.setMuted(category, !this.isMuted(category));
  }

  /**
   * Get current settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Update all settings at once
   */
  public updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.updateAllVolumes();
  }

  /**
   * Resume audio context (required after user interaction in some browsers)
   */
  public async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Private helper methods

  private updateVolume(audio: HTMLAudioElement, category: AudioCategory): void {
    const categoryVolume = this.settings[`${category}Volume` as keyof AudioSettings] as number;
    const categoryMuted = this.settings[`${category}Muted` as keyof AudioSettings] as boolean;
    const masterMuted = this.settings.masterMuted;

    if (masterMuted || categoryMuted) {
      audio.volume = 0;
    } else {
      audio.volume = this.settings.masterVolume * categoryVolume;
    }
  }

  private updateAllVolumes(): void {
    this.tracks.forEach((track, id) => {
      // Only update if audio is playing or paused (not for cloned SFX)
      if (track.audio.parentElement || id === this.currentMusic || id === this.currentAmbient) {
        this.updateVolume(track.audio, track.category);
      }
    });
  }

  private async fadeIn(audio: HTMLAudioElement, duration: number): Promise<void> {
    const startVolume = 0;
    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      audio.volume = startVolume + (i / steps);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  private async fadeOut(audio: HTMLAudioElement, duration: number): Promise<void> {
    const startVolume = audio.volume;
    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = steps; i >= 0; i--) {
      audio.volume = startVolume * (i / steps);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    audio.volume = 0;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopAll();
    this.tracks.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
