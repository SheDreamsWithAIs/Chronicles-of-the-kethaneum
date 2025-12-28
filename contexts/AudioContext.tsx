'use client';

/**
 * AudioContext - Global audio state management
 * Provides audio controls and state across all screens
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AudioManager } from '@/lib/audio/AudioManager';
import type { AudioState } from '@/lib/audio/types';

interface AudioContextValue {
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  isLoaded: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

const STORAGE_KEY = 'audioSettings';

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [audioState, setAudioState] = useState<AudioState>({
    volume: 70,
    isMuted: false,
    isPlaying: false,
    currentTrackIndex: 0,
    isLoaded: false,
  });

  const audioManager = AudioManager.getInstance();

  /**
   * Load saved settings from localStorage
   */
  const loadSettings = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          volume: settings.volume ?? 70,
          isMuted: settings.isMuted ?? false,
        };
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }

    return { volume: 70, isMuted: false };
  }, []);

  /**
   * Save settings to localStorage
   */
  const saveSettings = useCallback((volume: number, isMuted: boolean) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, isMuted }));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }, []);

  /**
   * Initialize audio system
   */
  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      try {
        // Load saved settings
        const settings = loadSettings();

        // Initialize the audio manager
        await audioManager.initialize('/data/audio-config.json');

        if (!mounted) return;

        // Apply saved settings
        audioManager.setVolume(settings.volume);
        audioManager.setMuted(settings.isMuted);

        // Start playing if not muted
        if (!settings.isMuted) {
          await audioManager.play();
        }

        // Update state
        const state = audioManager.getState();
        setAudioState({
          volume: state.volume,
          isMuted: state.isMuted,
          isPlaying: state.isPlaying,
          currentTrackIndex: state.currentTrackIndex,
          isLoaded: true,
        });
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        // Still mark as loaded even if initialization failed
        if (mounted) {
          setAudioState((prev) => ({ ...prev, isLoaded: true }));
        }
      }
    };

    initAudio();

    return () => {
      mounted = false;
    };
  }, [audioManager, loadSettings]);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    audioManager.setVolume(volume);
    const newMuted = audioState.isMuted;

    setAudioState((prev) => ({
      ...prev,
      volume,
    }));

    saveSettings(volume, newMuted);
  }, [audioManager, audioState.isMuted, saveSettings]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    audioManager.toggleMute();
    const newMuted = audioManager.getMuted();
    const isPlaying = audioManager.isPlaying();

    setAudioState((prev) => ({
      ...prev,
      isMuted: newMuted,
      isPlaying,
    }));

    saveSettings(audioState.volume, newMuted);
  }, [audioManager, audioState.volume, saveSettings]);

  /**
   * Play audio
   */
  const play = useCallback(async () => {
    await audioManager.play();
    setAudioState((prev) => ({
      ...prev,
      isPlaying: true,
    }));
  }, [audioManager]);

  /**
   * Pause audio
   */
  const pause = useCallback(() => {
    audioManager.pause();
    setAudioState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, [audioManager]);

  const value: AudioContextValue = {
    volume: audioState.volume,
    isMuted: audioState.isMuted,
    isPlaying: audioState.isPlaying,
    isLoaded: audioState.isLoaded,
    setVolume,
    toggleMute,
    play,
    pause,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

/**
 * Hook to access audio context
 */
export function useAudioContext(): AudioContextValue {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
}
