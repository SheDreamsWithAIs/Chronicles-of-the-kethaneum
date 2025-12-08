'use client';

import { useEffect, useState, useRef } from 'react';
import { audioManager, AudioCategory, PlaylistMode, type PlaylistTrack } from '@/lib/audio/audioManager';
import { loadAudioSettings, saveAudioSettings } from '@/lib/save/saveSystem';
import { getConfig } from '@/lib/core/config';
import { fetchAsset } from '@/lib/utils/assetPath';

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
 * - Loads background music playlist from config file
 *
 * To update background music, edit: public/data/audio-config.json
 * - Add/remove tracks in the "tracks" array
 * - Change playlist mode: SEQUENTIAL, SHUFFLE, REPEAT_ONE, or REPEAT_ALL
 * - Adjust fadeDuration (in milliseconds)
 * - No code changes needed!
 */

interface AudioConfig {
  backgroundMusic: {
    playlistId: string;
    playlistName: string;
    mode: 'SEQUENTIAL' | 'SHUFFLE' | 'REPEAT_ONE' | 'REPEAT_ALL';
    autoAdvance: boolean;
    fadeDuration: number;
    tracks: Array<{
      id: string;
      src: string;
      title: string;
    }>;
  };
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [audioConfig, setAudioConfig] = useState<AudioConfig | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const resumeAudioHandlerRef = useRef<((e: Event) => Promise<void>) | null>(null);

  // Load audio configuration from JSON file
  useEffect(() => {
    const loadAudioConfig = async () => {
      try {
        const response = await fetchAsset('/data/audio-config.json');
        if (!response.ok) {
          console.warn('[Audio] Failed to load audio config, using defaults');
          return;
        }
        const config: AudioConfig = await response.json();
        setAudioConfig(config);
      } catch (error) {
        console.warn('[Audio] Error loading audio config:', error);
        // Continue without config - background music just won't play
      }
    };

    loadAudioConfig();
  }, []);

  // Load audio settings FIRST (before initializing music)
  useEffect(() => {
    // Try loading audio settings from unified save system first
    // This ensures audio settings are synced with game progress
    const loadAudioFromUnifiedSave = async () => {
      try {
        const { loadProgress } = await import('@/lib/save/unifiedSaveSystem');
        const result = await loadProgress();
        if (result.audioSettings) {
          audioManager.initialize(result.audioSettings);
          setSettingsLoaded(true);
          return;
        }
      } catch (error) {
        // Fall back to separate localStorage if unified save fails
        console.warn('[Audio] Failed to load from unified save, using fallback');
      }
      
      // Fallback: Load from separate localStorage or use defaults from config
      const savedSettings = loadAudioSettings();
      const configSettings = getConfig().audio;
      const settingsToUse = savedSettings || configSettings;
      
      // Initialize audio manager with settings
      audioManager.initialize(settingsToUse);
      setSettingsLoaded(true);
    };
    
    loadAudioFromUnifiedSave();
  }, []);

  // Initialize music ONLY after both config AND settings are loaded
  useEffect(() => {
    // Don't initialize music until both config AND settings are loaded
    if (!audioConfig || !settingsLoaded) return;

    // Preload and start background music playlist
    const initializeBackgroundMusic = async () => {
      try {
        const bgMusic = audioConfig.backgroundMusic;
        
        // Convert mode string to enum
        const playlistMode = PlaylistMode[bgMusic.mode as keyof typeof PlaylistMode] || PlaylistMode.REPEAT_ALL;
        
        // Convert tracks to PlaylistTrack format
        const tracks: PlaylistTrack[] = bgMusic.tracks.map(track => ({
          id: track.id,
          src: track.src,
          title: track.title
        }));

        // Create the background music playlist
        audioManager.createPlaylist(
          bgMusic.playlistId,
          bgMusic.playlistName,
          tracks,
          AudioCategory.MUSIC,
          playlistMode,
          bgMusic.autoAdvance
        );

        // Also create act-based playlists for story progression system
        // For now, all acts use the same track(s) - can be updated later with act-specific tracks
        const actPlaylists = [
          { id: 'act1', name: 'Act 1 Music' },
          { id: 'act2', name: 'Act 2 Music' },
          { id: 'act3', name: 'Act 3 Music' },
        ];

        actPlaylists.forEach(actPlaylist => {
          // Only create if it doesn't already exist (initializeAudioSystem might have created it)
          if (!audioManager.getPlaylist(actPlaylist.id)) {
            audioManager.createPlaylist(
              actPlaylist.id,
              actPlaylist.name,
              tracks, // Use same tracks for all acts for now
              AudioCategory.MUSIC,
              playlistMode,
              bgMusic.autoAdvance
            );
            console.log(`[Audio] Created ${actPlaylist.name} playlist`);
          }
        });

        // Load (preload) all tracks in the playlists
        // Errors are handled gracefully - failed tracks are skipped
        const playlistsToLoad = [bgMusic.playlistId, ...actPlaylists.map(p => p.id)];
        for (const playlistId of playlistsToLoad) {
          await audioManager.loadPlaylist(playlistId).catch((error) => {
            console.warn(`[Audio] Error loading playlist ${playlistId}, continuing:`, error);
          });
        }

        // Start playing the playlist with a fade-in
        // Wait for user interaction first (browser requirement)
        const startMusic = async () => {
          try {
            // Check if playlist has any loaded tracks before trying to play
            const playlist = audioManager.getPlaylist(bgMusic.playlistId);
            if (!playlist || playlist.tracks.length === 0) {
              console.warn('[Audio] Playlist is empty, skipping playback');
              return;
            }
            
            // Check mute state before playing - don't play if muted
            if (audioManager.isMuted('master') || audioManager.isMuted(AudioCategory.MUSIC)) {
              console.log('[Audio] Music is muted, skipping playback');
              return;
            }
            
            await audioManager.playPlaylist(bgMusic.playlistId, 0, bgMusic.fadeDuration);
          } catch (error) {
            console.warn('[Audio] Failed to start background music:', error);
            // Continue without music - not a critical error
          }
        };

        // Resume audio context and start music on user interaction
        const resumeAudioHandler = async () => {
          await audioManager.resumeAudioContext();
          
          // Double-check mute state right before playing (in case settings changed)
          if (audioManager.isMuted('master') || audioManager.isMuted(AudioCategory.MUSIC)) {
            console.log('[Audio] Music is muted, skipping playback on user interaction');
            // Still remove listeners even if muted
            const handler = resumeAudioHandlerRef.current;
            if (handler) {
              document.removeEventListener('click', handler);
              document.removeEventListener('keydown', handler);
              document.removeEventListener('touchstart', handler);
              resumeAudioHandlerRef.current = null;
            }
            return;
          }
          
          await startMusic();
          // Remove listeners after first interaction
          const handler = resumeAudioHandlerRef.current;
          if (handler) {
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', handler);
            document.removeEventListener('touchstart', handler);
            resumeAudioHandlerRef.current = null;
          }
        };

        // Store handler in ref for cleanup
        resumeAudioHandlerRef.current = resumeAudioHandler;

        // Add event listeners for user interaction
        document.addEventListener('click', resumeAudioHandler);
        document.addEventListener('keydown', resumeAudioHandler);
        document.addEventListener('touchstart', resumeAudioHandler);
      } catch (error) {
        console.warn('[Audio] Failed to load background music:', error);
        // Continue without music if files don't exist
      }
    };

    initializeBackgroundMusic();

    // Create a function to save settings whenever they change
    const saveSettings = () => {
      const currentSettings = audioManager.getSettings();
      saveAudioSettings(currentSettings);
    };

    // Set up an interval to periodically save settings (in case they changed)
    // This is a simple approach - in a production app you might use a more sophisticated method
    const saveInterval = setInterval(saveSettings, 5000); // Save every 5 seconds

    // Cleanup
    return () => {
      clearInterval(saveInterval);
      saveSettings(); // Save one last time on unmount
      // Remove event listeners if they still exist
      const handler = resumeAudioHandlerRef.current;
      if (handler) {
        document.removeEventListener('click', handler);
        document.removeEventListener('keydown', handler);
        document.removeEventListener('touchstart', handler);
        resumeAudioHandlerRef.current = null;
      }
      // Stop music playlist on unmount (though this shouldn't happen in a SPA)
      if (audioConfig) {
        audioManager.stopPlaylist(1000).catch(() => {});
      }
    };
  }, [audioConfig, settingsLoaded]);

  return <>{children}</>;
}
