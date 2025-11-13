'use client';

import { useEffect } from 'react';
import { audioManager } from '@/lib/audio/audioManager';
import { loadAudioSettings, saveAudioSettings } from '@/lib/save/saveSystem';
import { getConfig } from '@/lib/core/config';

interface AudioProviderProps {
  children: React.ReactNode;
}

/**
 * AudioProvider - Wraps the app to initialize and manage audio system
 *
 * This component:
 * - Loads saved audio settings on mount
 * - Initializes the audio manager
 * - Auto-saves audio settings when they change
 * - Handles audio context resume on user interaction
 */
export function AudioProvider({ children }: AudioProviderProps) {
  useEffect(() => {
    // Load saved audio settings or use defaults from config
    const savedSettings = loadAudioSettings();
    const configSettings = getConfig().audio;
    const settingsToUse = savedSettings || configSettings;

    // Initialize audio manager with settings
    audioManager.initialize(settingsToUse);

    // Create a function to save settings whenever they change
    const saveSettings = () => {
      const currentSettings = audioManager.getSettings();
      saveAudioSettings(currentSettings);
    };

    // Set up an interval to periodically save settings (in case they changed)
    // This is a simple approach - in a production app you might use a more sophisticated method
    const saveInterval = setInterval(saveSettings, 5000); // Save every 5 seconds

    // Resume audio context on user interaction (required by browsers)
    const resumeAudio = async () => {
      await audioManager.resumeAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);

    // Cleanup
    return () => {
      clearInterval(saveInterval);
      saveSettings(); // Save one last time on unmount
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
    };
  }, []);

  return <>{children}</>;
}
