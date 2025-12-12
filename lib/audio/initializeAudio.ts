/**
 * Audio System Initialization
 * Sets up the audio manager with all configured playlists
 */

import { audioManager } from './audioManager';
import { ALL_PLAYLISTS } from './playlistConfig';

/**
 * Initialize the audio system with all playlists
 * Call this during app initialization
 */
export async function initializeAudioSystem(): Promise<boolean> {
  try {
    // Don't call initialize() here - AudioProvider handles initialization with saved settings
    // This function only registers playlists, not audio settings
    // If audio manager isn't initialized yet, AudioProvider will initialize it with saved settings

    // Register all playlists
    for (const playlist of ALL_PLAYLISTS) {
      audioManager.createPlaylist(
        playlist.id,
        playlist.name,
        playlist.tracks,
        playlist.category,
        playlist.mode,
        playlist.autoAdvance
      );
    }

    // Optionally preload playlists (comment out if you want lazy loading)
    // console.log('[Audio] Preloading playlists...');
    // for (const playlist of ALL_PLAYLISTS) {
    //   try {
    //     await audioManager.loadPlaylist(playlist.id);
    //   } catch (error) {
    //     console.warn(`[Audio] Failed to preload playlist ${playlist.id}:`, error);
    //   }
    // }

    return true;
  } catch (error) {
    console.error('[Audio] Failed to initialize audio system:', error);
    return false;
  }
}

/**
 * Resume audio context (required after user interaction in some browsers)
 */
export async function resumeAudio(): Promise<void> {
  try {
    await audioManager.resumeAudioContext();
  } catch (error) {
    console.error('[Audio] Failed to resume audio context:', error);
  }
}
