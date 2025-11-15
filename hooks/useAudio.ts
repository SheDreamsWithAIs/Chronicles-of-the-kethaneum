/**
 * useAudio Hook
 * React hook for integrating AudioManager into components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  audioManager,
  AudioCategory,
  AudioSettings,
  Playlist,
  PlaylistTrack,
  PlaylistMode
} from '@/lib/audio/audioManager';

export interface UseAudioReturn {
  // Playback controls
  playMusic: (id: string, fadeDuration?: number) => Promise<void>;
  stopMusic: (fadeDuration?: number) => Promise<void>;
  playAmbient: (id: string, fadeDuration?: number) => Promise<void>;
  stopAmbient: (fadeDuration?: number) => Promise<void>;
  playSFX: (id: string, volume?: number) => void;
  playVoice: (id: string) => Promise<void>;
  stop: (id: string) => void;
  stopAll: () => void;

  // Preloading
  preload: (id: string, src: string, category: AudioCategory, loop?: boolean) => Promise<void>;

  // Playlist controls
  createPlaylist: (
    id: string,
    name: string,
    tracks: PlaylistTrack[],
    category?: AudioCategory,
    mode?: PlaylistMode,
    autoAdvance?: boolean
  ) => void;
  loadPlaylist: (playlistId: string) => Promise<void>;
  playPlaylist: (playlistId: string, startIndex?: number, fadeDuration?: number) => Promise<void>;
  stopPlaylist: (fadeDuration?: number) => Promise<void>;
  nextTrack: (fadeDuration?: number) => Promise<void>;
  previousTrack: (fadeDuration?: number) => Promise<void>;
  setPlaylistMode: (playlistId: string, mode: PlaylistMode) => void;
  getCurrentPlaylistInfo: () => ReturnType<typeof audioManager.getCurrentPlaylistInfo>;
  getPlaylists: () => Playlist[];
  getPlaylist: (playlistId: string) => Playlist | undefined;
  removePlaylist: (playlistId: string) => void;

  // Volume controls
  setVolume: (category: 'master' | AudioCategory, volume: number) => void;
  getVolume: (category: 'master' | AudioCategory) => number;

  // Mute controls
  setMuted: (category: 'master' | AudioCategory, muted: boolean) => void;
  isMuted: (category: 'master' | AudioCategory) => boolean;
  toggleMute: (category: 'master' | AudioCategory) => void;

  // Settings
  settings: AudioSettings;
  updateSettings: (settings: Partial<AudioSettings>) => void;

  // Utility
  resumeAudioContext: () => Promise<void>;
  initialized: boolean;
}

/**
 * Hook for accessing the audio manager
 * @param autoInitialize - Automatically initialize on mount (default: true)
 */
export function useAudio(autoInitialize = true): UseAudioReturn {
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (autoInitialize && !initialized) {
      audioManager.initialize();
      setInitialized(true);
    }
  }, [autoInitialize, initialized]);

  // Wrapped playback methods
  const playMusic = useCallback(async (id: string, fadeDuration?: number) => {
    await audioManager.playMusic(id, fadeDuration);
  }, []);

  const stopMusic = useCallback(async (fadeDuration?: number) => {
    await audioManager.stopMusic(fadeDuration);
  }, []);

  const playAmbient = useCallback(async (id: string, fadeDuration?: number) => {
    await audioManager.playAmbient(id, fadeDuration);
  }, []);

  const stopAmbient = useCallback(async (fadeDuration?: number) => {
    await audioManager.stopAmbient(fadeDuration);
  }, []);

  const playSFX = useCallback((id: string, volume?: number) => {
    audioManager.playSFX(id, volume);
  }, []);

  const playVoice = useCallback(async (id: string) => {
    await audioManager.playVoice(id);
  }, []);

  const stop = useCallback((id: string) => {
    audioManager.stop(id);
  }, []);

  const stopAll = useCallback(() => {
    audioManager.stopAll();
  }, []);

  const preload = useCallback(async (
    id: string,
    src: string,
    category: AudioCategory,
    loop = false
  ) => {
    await audioManager.preload(id, src, category, loop);
  }, []);

  // Volume controls with state update
  const setVolume = useCallback((category: 'master' | AudioCategory, volume: number) => {
    audioManager.setVolume(category, volume);
    setSettings(audioManager.getSettings());
  }, []);

  const getVolume = useCallback((category: 'master' | AudioCategory) => {
    return audioManager.getVolume(category);
  }, []);

  // Mute controls with state update
  const setMuted = useCallback((category: 'master' | AudioCategory, muted: boolean) => {
    audioManager.setMuted(category, muted);
    setSettings(audioManager.getSettings());
  }, []);

  const isMuted = useCallback((category: 'master' | AudioCategory) => {
    return audioManager.isMuted(category);
  }, []);

  const toggleMute = useCallback((category: 'master' | AudioCategory) => {
    audioManager.toggleMute(category);
    setSettings(audioManager.getSettings());
  }, []);

  // Settings update
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    audioManager.updateSettings(newSettings);
    setSettings(audioManager.getSettings());
  }, []);

  const resumeAudioContext = useCallback(async () => {
    await audioManager.resumeAudioContext();
  }, []);

  // Playlist controls
  const createPlaylist = useCallback((
    id: string,
    name: string,
    tracks: PlaylistTrack[],
    category?: AudioCategory,
    mode?: PlaylistMode,
    autoAdvance?: boolean
  ) => {
    audioManager.createPlaylist(id, name, tracks, category, mode, autoAdvance);
  }, []);

  const loadPlaylist = useCallback(async (playlistId: string) => {
    await audioManager.loadPlaylist(playlistId);
  }, []);

  const playPlaylist = useCallback(async (
    playlistId: string,
    startIndex?: number,
    fadeDuration?: number
  ) => {
    await audioManager.playPlaylist(playlistId, startIndex, fadeDuration);
  }, []);

  const stopPlaylist = useCallback(async (fadeDuration?: number) => {
    await audioManager.stopPlaylist(fadeDuration);
  }, []);

  const nextTrack = useCallback(async (fadeDuration?: number) => {
    await audioManager.nextTrack(fadeDuration);
  }, []);

  const previousTrack = useCallback(async (fadeDuration?: number) => {
    await audioManager.previousTrack(fadeDuration);
  }, []);

  const setPlaylistMode = useCallback((playlistId: string, mode: PlaylistMode) => {
    audioManager.setPlaylistMode(playlistId, mode);
  }, []);

  const getCurrentPlaylistInfo = useCallback(() => {
    return audioManager.getCurrentPlaylistInfo();
  }, []);

  const getPlaylists = useCallback(() => {
    return audioManager.getPlaylists();
  }, []);

  const getPlaylist = useCallback((playlistId: string) => {
    return audioManager.getPlaylist(playlistId);
  }, []);

  const removePlaylist = useCallback((playlistId: string) => {
    audioManager.removePlaylist(playlistId);
  }, []);

  return {
    playMusic,
    stopMusic,
    playAmbient,
    stopAmbient,
    playSFX,
    playVoice,
    stop,
    stopAll,
    preload,
    createPlaylist,
    loadPlaylist,
    playPlaylist,
    stopPlaylist,
    nextTrack,
    previousTrack,
    setPlaylistMode,
    getCurrentPlaylistInfo,
    getPlaylists,
    getPlaylist,
    removePlaylist,
    setVolume,
    getVolume,
    setMuted,
    isMuted,
    toggleMute,
    settings,
    updateSettings,
    resumeAudioContext,
    initialized,
  };
}

/**
 * Convenience hook for preloading multiple audio files
 */
export function useAudioPreload(
  audioFiles: Array<{
    id: string;
    src: string;
    category: AudioCategory;
    loop?: boolean;
  }>
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const audio = useAudio();

  useEffect(() => {
    const preloadAll = async () => {
      try {
        setLoading(true);
        await Promise.all(
          audioFiles.map(file =>
            audio.preload(file.id, file.src, file.category, file.loop)
          )
        );
        setLoading(false);
      } catch (e) {
        setError(e as Error);
        setLoading(false);
      }
    };

    if (audioFiles.length > 0) {
      preloadAll();
    }
  }, [audioFiles, audio]);

  return { loading, error, audio };
}
