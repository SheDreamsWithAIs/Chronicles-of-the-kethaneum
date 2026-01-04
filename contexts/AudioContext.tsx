'use client';

/**
 * AudioContext - Global audio state management
 * Provides audio controls and state across all screens
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

  // Use ref to maintain stable reference to AudioManager singleton
  const audioManagerRef = useRef<AudioManager>(AudioManager.getInstance());

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
   * Initialize audio system - only runs once on mount
   */
  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      try {
        const audioManager = audioManagerRef.current;

        // Load saved settings
        const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const settings = saved ? JSON.parse(saved) : { volume: 70, isMuted: false };

        // Initialize the audio manager (only happens once due to isInitialized flag)
        await audioManager.initialize('/data/config/audio-config.json');

        if (!mounted) return;

        // Apply saved settings
        audioManager.setVolume(settings.volume ?? 70);
        audioManager.setMuted(settings.isMuted ?? false);

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
    // Empty dependency array - only run once on mount
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    const audioManager = audioManagerRef.current;
    audioManager.setVolume(volume);

    setAudioState((prev) => {
      const newMuted = prev.isMuted;
      saveSettings(volume, newMuted);
      return {
        ...prev,
        volume,
      };
    });
  }, [saveSettings]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    const audioManager = audioManagerRef.current;
    audioManager.toggleMute();
    const newMuted = audioManager.getMuted();
    const isPlaying = audioManager.isPlaying();

    setAudioState((prev) => {
      saveSettings(prev.volume, newMuted);
      return {
        ...prev,
        isMuted: newMuted,
        isPlaying,
      };
    });
  }, [saveSettings]);

  /**
   * Play audio
   */
  const play = useCallback(async () => {
    const audioManager = audioManagerRef.current;
    await audioManager.play();
    setAudioState((prev) => ({
      ...prev,
      isPlaying: true,
    }));
  }, []);

  /**
   * Pause audio
   */
  const pause = useCallback(() => {
    const audioManager = audioManagerRef.current;
    audioManager.pause();
    setAudioState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

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
