/**
 * AudioManager - Core audio playback engine
 * Singleton pattern for global music playback across all screens
 */

import type { AudioConfig, BackgroundMusicConfig, AudioTrack } from './types';

export class AudioManager {
  private static instance: AudioManager | null = null;

  private audio: HTMLAudioElement | null = null;
  private config: BackgroundMusicConfig | null = null;
  private currentTrackIndex: number = 0;
  private volume: number = 70; // 0-100
  private isMuted: boolean = false;
  private fadeDuration: number = 2000;
  private fadeInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the audio manager with config
   */
  public async initialize(configPath: string = '/data/audio-config.json'): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const response = await fetch(configPath);
      const audioConfig: AudioConfig = await response.json();
      this.config = audioConfig.backgroundMusic;
      this.fadeDuration = this.config.fadeDuration || 2000;

      // Create audio element
      this.audio = new Audio();
      this.audio.preload = 'auto';

      // Set up event listeners
      this.audio.addEventListener('ended', this.handleTrackEnded.bind(this));
      this.audio.addEventListener('error', this.handleError.bind(this));

      // Load first track
      if (this.config.tracks.length > 0) {
        this.loadTrack(0);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
      throw error;
    }
  }

  /**
   * Load a specific track by index
   */
  private loadTrack(index: number): void {
    if (!this.audio || !this.config || !this.config.tracks[index]) {
      return;
    }

    this.currentTrackIndex = index;
    const track = this.config.tracks[index];
    this.audio.src = track.src;
    this.updateVolume();
  }

  /**
   * Handle track ended event
   */
  private handleTrackEnded(): void {
    if (!this.config) return;

    if (this.config.mode === 'REPEAT_ONE') {
      this.play();
    } else if (this.config.mode === 'REPEAT_ALL' || this.config.autoAdvance) {
      // For single-track playlists, just restart the current track
      if (this.config.tracks.length === 1) {
        if (this.audio) {
          this.audio.currentTime = 0;
        }
        this.play();
      } else {
        this.nextTrack();
      }
    }
  }

  /**
   * Handle audio errors
   */
  private handleError(event: Event): void {
    console.error('Audio playback error:', event);
  }

  /**
   * Play audio
   */
  public async play(): Promise<void> {
    if (!this.audio || this.isMuted) {
      return;
    }

    try {
      await this.audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  /**
   * Pause audio
   */
  public pause(): void {
    if (!this.audio) {
      return;
    }
    this.audio.pause();
  }

  /**
   * Stop audio with fade out
   */
  public async stop(): Promise<void> {
    if (!this.audio) {
      return;
    }

    await this.fadeOut();
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  /**
   * Go to next track
   */
  public nextTrack(): void {
    if (!this.config) return;

    const nextIndex = (this.currentTrackIndex + 1) % this.config.tracks.length;
    this.changeTrack(nextIndex);
  }

  /**
   * Go to previous track
   */
  public previousTrack(): void {
    if (!this.config) return;

    const prevIndex = this.currentTrackIndex === 0
      ? this.config.tracks.length - 1
      : this.currentTrackIndex - 1;
    this.changeTrack(prevIndex);
  }

  /**
   * Change to a specific track with crossfade
   */
  private async changeTrack(newIndex: number): Promise<void> {
    if (!this.audio || !this.config) return;

    // Check if audio was playing - includes ended state for auto-advance
    const wasPlaying = !this.audio.paused || this.audio.ended;

    if (wasPlaying && !this.audio.paused) {
      await this.fadeOut();
    }

    this.loadTrack(newIndex);

    if (wasPlaying && !this.isMuted) {
      await this.fadeIn();
    }
  }

  /**
   * Fade out audio
   */
  private async fadeOut(): Promise<void> {
    if (!this.audio) return;

    return new Promise((resolve) => {
      const startVolume = this.audio!.volume;
      const steps = 20;
      const stepDuration = this.fadeDuration / steps;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
      }

      this.fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
        this.audio!.volume = newVolume;

        if (currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Fade in audio
   */
  private async fadeIn(): Promise<void> {
    if (!this.audio) return;

    const targetVolume = this.volume / 100;
    this.audio.volume = 0;

    await this.play();

    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = this.fadeDuration / steps;
      const volumeStep = targetVolume / steps;
      let currentStep = 0;

      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
      }

      this.fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = Math.min(targetVolume, volumeStep * currentStep);
        this.audio!.volume = newVolume;

        if (currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Set volume (0-100)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, volume));
    this.updateVolume();
  }

  /**
   * Update the actual audio volume based on current settings
   */
  private updateVolume(): void {
    if (!this.audio) return;
    this.audio.volume = this.isMuted ? 0 : this.volume / 100;
  }

  /**
   * Toggle mute
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.updateVolume();

    // If unmuting and audio is loaded but not playing, start playing
    if (!this.isMuted && this.audio && this.audio.paused && this.isInitialized) {
      this.play();
    }

    // If muting, pause the audio
    if (this.isMuted && this.audio && !this.audio.paused) {
      this.pause();
    }
  }

  /**
   * Set mute state
   */
  public setMuted(muted: boolean): void {
    if (this.isMuted !== muted) {
      this.toggleMute();
    }
  }

  /**
   * Get current state
   */
  public getState() {
    return {
      volume: this.volume,
      isMuted: this.isMuted,
      isPlaying: this.audio ? !this.audio.paused : false,
      currentTrackIndex: this.currentTrackIndex,
      currentTrack: this.config?.tracks[this.currentTrackIndex] || null,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Get volume
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Get mute state
   */
  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Check if playing
   */
  public isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.removeEventListener('ended', this.handleTrackEnded);
      this.audio.removeEventListener('error', this.handleError);
      this.audio = null;
    }

    this.isInitialized = false;
    AudioManager.instance = null;
  }
}
