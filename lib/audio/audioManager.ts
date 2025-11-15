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

export enum PlaylistMode {
  SEQUENTIAL = 'sequential',
  SHUFFLE = 'shuffle',
  REPEAT_ONE = 'repeat-one',
  REPEAT_ALL = 'repeat-all',
}

export interface PlaylistTrack {
  id: string;
  src: string;
  title?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: PlaylistTrack[];
  category: AudioCategory;
  mode: PlaylistMode;
  autoAdvance: boolean;
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

  // Playlist management
  private playlists: Map<string, Playlist> = new Map();
  private currentPlaylist: string | null = null;
  private currentTrackIndex = 0;
  private shuffleHistory: number[] = [];

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

  // ========================================
  // PLAYLIST MANAGEMENT
  // ========================================

  /**
   * Create and register a playlist
   */
  public createPlaylist(
    id: string,
    name: string,
    tracks: PlaylistTrack[],
    category: AudioCategory = AudioCategory.MUSIC,
    mode: PlaylistMode = PlaylistMode.SEQUENTIAL,
    autoAdvance = true
  ): void {
    const playlist: Playlist = {
      id,
      name,
      tracks,
      category,
      mode,
      autoAdvance,
    };

    this.playlists.set(id, playlist);
  }

  /**
   * Load (preload) all tracks in a playlist
   */
  public async loadPlaylist(playlistId: string): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) {
      console.warn(`Playlist not found: ${playlistId}`);
      return;
    }

    // Preload all tracks in the playlist
    const promises = playlist.tracks.map(track =>
      this.preload(track.id, track.src, playlist.category, false)
    );

    await Promise.all(promises);
  }

  /**
   * Play a playlist starting from the first track (or specified index)
   */
  public async playPlaylist(
    playlistId: string,
    startIndex = 0,
    fadeDuration = 1000
  ): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) {
      console.warn(`Playlist not found: ${playlistId}`);
      return;
    }

    if (playlist.tracks.length === 0) {
      console.warn(`Playlist is empty: ${playlistId}`);
      return;
    }

    // Set as current playlist
    this.currentPlaylist = playlistId;
    this.currentTrackIndex = startIndex;

    // Initialize shuffle if needed
    if (playlist.mode === PlaylistMode.SHUFFLE) {
      this.initializeShuffle(playlist.tracks.length);
    }

    // Play the first track
    await this.playPlaylistTrack(fadeDuration);
  }

  /**
   * Play next track in playlist
   */
  public async nextTrack(fadeDuration = 1000): Promise<void> {
    if (!this.currentPlaylist) {
      console.warn('No active playlist');
      return;
    }

    const playlist = this.playlists.get(this.currentPlaylist);
    if (!playlist) return;

    const nextIndex = this.getNextTrackIndex(playlist);
    if (nextIndex !== null) {
      this.currentTrackIndex = nextIndex;
      await this.playPlaylistTrack(fadeDuration);
    } else {
      // End of playlist
      await this.stopMusic(fadeDuration);
      this.currentPlaylist = null;
    }
  }

  /**
   * Play previous track in playlist
   */
  public async previousTrack(fadeDuration = 1000): Promise<void> {
    if (!this.currentPlaylist) {
      console.warn('No active playlist');
      return;
    }

    const playlist = this.playlists.get(this.currentPlaylist);
    if (!playlist) return;

    const prevIndex = this.getPreviousTrackIndex(playlist);
    if (prevIndex !== null) {
      this.currentTrackIndex = prevIndex;
      await this.playPlaylistTrack(fadeDuration);
    }
  }

  /**
   * Stop current playlist
   */
  public async stopPlaylist(fadeDuration = 1000): Promise<void> {
    if (this.currentPlaylist) {
      await this.stopMusic(fadeDuration);
      this.currentPlaylist = null;
      this.currentTrackIndex = 0;
      this.shuffleHistory = [];
    }
  }

  /**
   * Set playlist mode (sequential, shuffle, repeat, etc.)
   */
  public setPlaylistMode(playlistId: string, mode: PlaylistMode): void {
    const playlist = this.playlists.get(playlistId);
    if (playlist) {
      playlist.mode = mode;

      // Reinitialize shuffle if switching to shuffle mode
      if (mode === PlaylistMode.SHUFFLE && playlistId === this.currentPlaylist) {
        this.initializeShuffle(playlist.tracks.length);
      }
    }
  }

  /**
   * Get current playlist information
   */
  public getCurrentPlaylistInfo(): {
    playlistId: string;
    playlistName: string;
    currentTrack: number;
    totalTracks: number;
    currentTrackTitle?: string;
    mode: PlaylistMode;
  } | null {
    if (!this.currentPlaylist) return null;

    const playlist = this.playlists.get(this.currentPlaylist);
    if (!playlist) return null;

    const currentTrack = playlist.tracks[this.currentTrackIndex];

    return {
      playlistId: playlist.id,
      playlistName: playlist.name,
      currentTrack: this.currentTrackIndex + 1,
      totalTracks: playlist.tracks.length,
      currentTrackTitle: currentTrack?.title,
      mode: playlist.mode,
    };
  }

  /**
   * Get all registered playlists
   */
  public getPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }

  /**
   * Get a specific playlist
   */
  public getPlaylist(playlistId: string): Playlist | undefined {
    return this.playlists.get(playlistId);
  }

  /**
   * Remove a playlist
   */
  public removePlaylist(playlistId: string): void {
    if (this.currentPlaylist === playlistId) {
      this.stopPlaylist();
    }
    this.playlists.delete(playlistId);
  }

  // Private helper methods

  /**
   * Play the current track in the active playlist
   */
  private async playPlaylistTrack(fadeDuration: number): Promise<void> {
    if (!this.currentPlaylist) return;

    const playlist = this.playlists.get(this.currentPlaylist);
    if (!playlist) return;

    const track = playlist.tracks[this.currentTrackIndex];
    if (!track) return;

    // Stop current music
    if (this.currentMusic) {
      await this.stopMusic(fadeDuration);
    }

    // Play the track
    const audioTrack = this.tracks.get(track.id);
    if (!audioTrack) {
      console.warn(`Track not loaded: ${track.id}`);
      return;
    }

    this.currentMusic = track.id;
    audioTrack.audio.volume = 0;

    // Set up event listener for track end
    if (playlist.autoAdvance) {
      const handleTrackEnd = async () => {
        audioTrack.audio.removeEventListener('ended', handleTrackEnd);

        // Auto-advance to next track
        if (playlist.mode === PlaylistMode.REPEAT_ONE) {
          // Replay the same track
          audioTrack.audio.currentTime = 0;
          await audioTrack.audio.play();
          audioTrack.audio.addEventListener('ended', handleTrackEnd);
        } else {
          // Move to next track
          await this.nextTrack(fadeDuration);
        }
      };

      audioTrack.audio.addEventListener('ended', handleTrackEnd);
    }

    try {
      await audioTrack.audio.play();
      await this.fadeIn(audioTrack.audio, fadeDuration);
      this.updateVolume(audioTrack.audio, playlist.category);
    } catch (e) {
      console.error(`Failed to play track: ${track.id}`, e);
    }
  }

  /**
   * Get next track index based on playlist mode
   */
  private getNextTrackIndex(playlist: Playlist): number | null {
    const totalTracks = playlist.tracks.length;

    switch (playlist.mode) {
      case PlaylistMode.SEQUENTIAL:
        if (this.currentTrackIndex < totalTracks - 1) {
          return this.currentTrackIndex + 1;
        }
        return null; // End of playlist

      case PlaylistMode.REPEAT_ALL:
        return (this.currentTrackIndex + 1) % totalTracks;

      case PlaylistMode.REPEAT_ONE:
        return this.currentTrackIndex; // Stay on same track

      case PlaylistMode.SHUFFLE:
        return this.getNextShuffleIndex(totalTracks);

      default:
        return null;
    }
  }

  /**
   * Get previous track index
   */
  private getPreviousTrackIndex(playlist: Playlist): number | null {
    const totalTracks = playlist.tracks.length;

    switch (playlist.mode) {
      case PlaylistMode.SHUFFLE:
        return this.getPreviousShuffleIndex();

      case PlaylistMode.REPEAT_ONE:
        return this.currentTrackIndex;

      default:
        if (this.currentTrackIndex > 0) {
          return this.currentTrackIndex - 1;
        }
        if (playlist.mode === PlaylistMode.REPEAT_ALL) {
          return totalTracks - 1;
        }
        return null;
    }
  }

  /**
   * Initialize shuffle order
   */
  private initializeShuffle(totalTracks: number): void {
    this.shuffleHistory = [this.currentTrackIndex];
  }

  /**
   * Get next shuffle index
   */
  private getNextShuffleIndex(totalTracks: number): number | null {
    if (this.shuffleHistory.length >= totalTracks) {
      // All tracks played, reset shuffle
      this.shuffleHistory = [];
    }

    // Get available tracks
    const available = Array.from({ length: totalTracks }, (_, i) => i)
      .filter(i => !this.shuffleHistory.includes(i));

    if (available.length === 0) return null;

    // Pick random track from available
    const nextIndex = available[Math.floor(Math.random() * available.length)];
    this.shuffleHistory.push(nextIndex);

    return nextIndex;
  }

  /**
   * Get previous shuffle index
   */
  private getPreviousShuffleIndex(): number | null {
    if (this.shuffleHistory.length <= 1) return null;

    // Remove current from history and return previous
    this.shuffleHistory.pop();
    return this.shuffleHistory[this.shuffleHistory.length - 1];
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
