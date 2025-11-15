/**
 * Example: Using Playlists in Your Game
 * This file demonstrates how to use the playlist system
 */

import { useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { PlaylistMode } from './audioManager';
import { ALL_PLAYLISTS, getPlaylistForStoryProgress } from './playlistConfig';

/**
 * Example 1: Initialize all playlists on app start
 */
export function useInitializePlaylists() {
  const audio = useAudio();

  useEffect(() => {
    // Register all playlists
    ALL_PLAYLISTS.forEach(playlist => {
      audio.createPlaylist(
        playlist.id,
        playlist.name,
        playlist.tracks,
        playlist.category,
        playlist.mode,
        playlist.autoAdvance
      );
    });

    console.log('All playlists registered');
  }, [audio]);
}

/**
 * Example 2: Load and play a playlist for a specific game phase
 */
export function useActMusic(actNumber: number) {
  const audio = useAudio();

  useEffect(() => {
    const playAct = async () => {
      const playlistId = `act${actNumber}`;

      // Load all tracks in the playlist
      await audio.loadPlaylist(playlistId);

      // Play the playlist with a 2-second fade-in
      await audio.playPlaylist(playlistId, 0, 2000);
    };

    playAct();

    // Cleanup: stop playlist when component unmounts
    return () => {
      audio.stopPlaylist(1000);
    };
  }, [actNumber, audio]);
}

/**
 * Example 3: Switch playlists based on game progress
 */
export function useDynamicPlaylist(completedPuzzles: number, totalPuzzles: number) {
  const audio = useAudio();

  useEffect(() => {
    const switchPlaylist = async () => {
      const playlistId = getPlaylistForStoryProgress(completedPuzzles, totalPuzzles);

      // Only switch if we're not already playing this playlist
      const currentInfo = audio.getCurrentPlaylistInfo();
      if (currentInfo?.playlistId !== playlistId) {
        await audio.loadPlaylist(playlistId);
        await audio.playPlaylist(playlistId, 0, 3000); // 3-second crossfade
      }
    };

    switchPlaylist();
  }, [completedPuzzles, totalPuzzles, audio]);
}

/**
 * Example 4: Component with full playlist controls
 */
export function PlaylistControlsExample() {
  const audio = useAudio();

  useEffect(() => {
    // Initialize playlists
    ALL_PLAYLISTS.forEach(p => {
      audio.createPlaylist(p.id, p.name, p.tracks, p.category, p.mode, p.autoAdvance);
    });
  }, [audio]);

  const handlePlayAct2 = async () => {
    await audio.loadPlaylist('act2');
    await audio.playPlaylist('act2');
  };

  const handleNext = () => {
    audio.nextTrack();
  };

  const handlePrevious = () => {
    audio.previousTrack();
  };

  const handleToggleShuffle = () => {
    const info = audio.getCurrentPlaylistInfo();
    if (info) {
      const newMode = info.mode === PlaylistMode.SHUFFLE
        ? PlaylistMode.SEQUENTIAL
        : PlaylistMode.SHUFFLE;
      audio.setPlaylistMode(info.playlistId, newMode);
    }
  };

  const info = audio.getCurrentPlaylistInfo();

  return (
    <div>
      <h2>Playlist Controls</h2>

      {info && (
        <div>
          <p>Now Playing: {info.playlistName}</p>
          <p>Track {info.currentTrack} of {info.totalTracks}</p>
          {info.currentTrackTitle && <p>{info.currentTrackTitle}</p>}
          <p>Mode: {info.mode}</p>
        </div>
      )}

      <button onClick={handlePlayAct2}>Play Act 2</button>
      <button onClick={handlePrevious}>Previous Track</button>
      <button onClick={handleNext}>Next Track</button>
      <button onClick={handleToggleShuffle}>Toggle Shuffle</button>
      <button onClick={() => audio.stopPlaylist()}>Stop</button>
    </div>
  );
}

/**
 * Example 5: Context-aware music system
 * Automatically changes music based on game state
 */
export function useContextualMusic(gameContext: {
  location?: 'menu' | 'library' | 'cosmos';
  phase?: 'intro' | 'earlygame' | 'midgame' | 'lategame';
  mode?: 'puzzle' | 'story';
}) {
  const audio = useAudio();

  useEffect(() => {
    const playContextMusic = async () => {
      let playlistId: string;

      // Determine playlist based on context
      if (gameContext.location === 'menu') {
        playlistId = 'menu';
      } else if (gameContext.mode === 'puzzle') {
        playlistId = 'puzzle';
      } else if (gameContext.phase) {
        // Map phase to act
        const phaseToAct: Record<string, string> = {
          intro: 'act1',
          earlygame: 'act1',
          midgame: 'act2',
          lategame: 'act3',
        };
        playlistId = phaseToAct[gameContext.phase] || 'act1';
      } else {
        playlistId = 'act1'; // Default
      }

      // Check if we need to switch
      const currentInfo = audio.getCurrentPlaylistInfo();
      if (currentInfo?.playlistId !== playlistId) {
        await audio.loadPlaylist(playlistId);
        await audio.playPlaylist(playlistId, 0, 2000);
      }

      // Also handle ambient based on location
      if (gameContext.location === 'library') {
        await audio.loadPlaylist('library-ambient');
        await audio.playPlaylist('library-ambient');
      } else if (gameContext.location === 'cosmos') {
        await audio.loadPlaylist('cosmic-ambient');
        await audio.playPlaylist('cosmic-ambient');
      }
    };

    playContextMusic();
  }, [gameContext.location, gameContext.phase, gameContext.mode, audio]);
}

/**
 * Example 6: Simple usage in a component
 */
export function GameScreen() {
  const audio = useAudio();

  useEffect(() => {
    const initMusic = async () => {
      // Create Act 2 playlist
      audio.createPlaylist(
        'act2',
        'Act 2 Music',
        [
          { id: 'track1', src: '/audio/music/act2/track1.mp3', title: 'Journey' },
          { id: 'track2', src: '/audio/music/act2/track2.mp3', title: 'Adventure' },
          { id: 'track3', src: '/audio/music/act2/track3.mp3', title: 'Discovery' },
        ],
        undefined, // Use default category (MUSIC)
        PlaylistMode.SHUFFLE, // Shuffle mode
        true // Auto-advance to next track
      );

      // Load and play
      await audio.loadPlaylist('act2');
      await audio.playPlaylist('act2');
    };

    initMusic();

    return () => {
      audio.stopPlaylist();
    };
  }, [audio]);

  return <div>Game content here...</div>;
}
