/**
 * Playlist Configuration
 * Define playlists for different game contexts (Acts, levels, moods, etc.)
 */

import { PlaylistTrack, PlaylistMode, AudioCategory } from './audioManager';

/**
 * Example playlist configuration for different game acts
 * You can organize audio by folders: public/audio/music/act1/, act2/, etc.
 */

// ===================================
// ACT 1 - Beginning / Tutorial
// ===================================
export const ACT1_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'act1-intro',
    src: '/audio/music/act1/mysterious-beginning.mp3',
    title: 'Mysterious Beginning'
  },
  {
    id: 'act1-discovery',
    src: '/audio/music/act1/discovery.mp3',
    title: 'First Discovery'
  },
  {
    id: 'act1-wonder',
    src: '/audio/music/act1/cosmic-wonder.mp3',
    title: 'Cosmic Wonder'
  }
];

// ===================================
// ACT 2 - Adventure / Exploration
// ===================================
export const ACT2_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'act2-journey',
    src: '/audio/music/act2/journey-begins.mp3',
    title: 'Journey Begins'
  },
  {
    id: 'act2-exploration',
    src: '/audio/music/act2/exploring-realms.mp3',
    title: 'Exploring Realms'
  },
  {
    id: 'act2-challenge',
    src: '/audio/music/act2/rising-challenge.mp3',
    title: 'Rising Challenge'
  },
  {
    id: 'act2-triumph',
    src: '/audio/music/act2/small-victory.mp3',
    title: 'Small Victory'
  }
];

// ===================================
// ACT 3 - Climax / Resolution
// ===================================
export const ACT3_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'act3-tension',
    src: '/audio/music/act3/mounting-tension.mp3',
    title: 'Mounting Tension'
  },
  {
    id: 'act3-revelation',
    src: '/audio/music/act3/great-revelation.mp3',
    title: 'Great Revelation'
  },
  {
    id: 'act3-finale',
    src: '/audio/music/act3/epic-finale.mp3',
    title: 'Epic Finale'
  },
  {
    id: 'act3-resolution',
    src: '/audio/music/act3/peaceful-resolution.mp3',
    title: 'Peaceful Resolution'
  }
];

// ===================================
// Menu / UI Music
// ===================================
export const MENU_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'menu-main',
    src: '/audio/music/menu/main-theme.mp3',
    title: 'Main Theme'
  },
  {
    id: 'menu-ambient',
    src: '/audio/music/menu/ambient-loop.mp3',
    title: 'Ambient Loop'
  }
];

// ===================================
// Puzzle-specific music
// ===================================
export const PUZZLE_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'puzzle-focus1',
    src: '/audio/music/puzzle/concentration.mp3',
    title: 'Concentration'
  },
  {
    id: 'puzzle-focus2',
    src: '/audio/music/puzzle/thinking-time.mp3',
    title: 'Thinking Time'
  },
  {
    id: 'puzzle-focus3',
    src: '/audio/music/puzzle/mental-workout.mp3',
    title: 'Mental Workout'
  }
];

// ===================================
// Ambient Soundscapes by Location
// ===================================
export const LIBRARY_AMBIENT: PlaylistTrack[] = [
  {
    id: 'library-ambient1',
    src: '/audio/ambient/library/quiet-pages.mp3',
    title: 'Quiet Pages'
  },
  {
    id: 'library-ambient2',
    src: '/audio/ambient/library/distant-whispers.mp3',
    title: 'Distant Whispers'
  }
];

export const COSMIC_AMBIENT: PlaylistTrack[] = [
  {
    id: 'cosmic-ambient1',
    src: '/audio/ambient/cosmic/stellar-wind.mp3',
    title: 'Stellar Wind'
  },
  {
    id: 'cosmic-ambient2',
    src: '/audio/ambient/cosmic/void-echoes.mp3',
    title: 'Void Echoes'
  }
];

// ===================================
// Helper function to initialize all playlists
// ===================================
export interface PlaylistConfig {
  id: string;
  name: string;
  tracks: PlaylistTrack[];
  category: AudioCategory;
  mode: PlaylistMode;
  autoAdvance: boolean;
}

/**
 * All available playlists configuration
 * Easy to register all at once
 */
export const ALL_PLAYLISTS: PlaylistConfig[] = [
  // Note: act1, act2, act3 playlists are now managed by AudioProvider from audio-config.json
  // They are excluded here to prevent conflicts with placeholder MP3 files
  
  // Music playlists (examples for future use)
  {
    id: 'menu',
    name: 'Menu Music',
    tracks: MENU_PLAYLIST,
    category: AudioCategory.MUSIC,
    mode: PlaylistMode.REPEAT_ALL,
    autoAdvance: true
  },
  {
    id: 'puzzle',
    name: 'Puzzle Music',
    tracks: PUZZLE_PLAYLIST,
    category: AudioCategory.MUSIC,
    mode: PlaylistMode.SHUFFLE,
    autoAdvance: true
  },

  // Ambient playlists
  {
    id: 'library-ambient',
    name: 'Library Ambience',
    tracks: LIBRARY_AMBIENT,
    category: AudioCategory.AMBIENT,
    mode: PlaylistMode.REPEAT_ALL,
    autoAdvance: true
  },
  {
    id: 'cosmic-ambient',
    name: 'Cosmic Ambience',
    tracks: COSMIC_AMBIENT,
    category: AudioCategory.AMBIENT,
    mode: PlaylistMode.REPEAT_ALL,
    autoAdvance: true
  }
];

/**
 * Context-based playlist mapping
 * Makes it easy to switch playlists based on game state
 */
export const PLAYLIST_BY_CONTEXT = {
  // Game phases
  menu: 'menu',
  intro: 'act1',
  earlygame: 'act1',
  midgame: 'act2',
  lategame: 'act3',
  endgame: 'act3',

  // Specific modes
  puzzle: 'puzzle',
  story: 'act1', // Default to act1, should change based on progress

  // Locations
  library: 'library-ambient',
  cosmos: 'cosmic-ambient',
} as const;

/**
 * Helper function to get playlist ID based on game context
 */
export function getPlaylistForContext(
  context: keyof typeof PLAYLIST_BY_CONTEXT
): string {
  return PLAYLIST_BY_CONTEXT[context];
}

/**
 * Helper function to get playlist ID based on story progress
 * Example: automatically switch to different acts based on completed puzzles
 */
export function getPlaylistForStoryProgress(
  completedPuzzles: number,
  totalPuzzles: number
): string {
  const progress = completedPuzzles / totalPuzzles;

  if (progress < 0.33) {
    return 'act1';
  } else if (progress < 0.67) {
    return 'act2';
  } else {
    return 'act3';
  }
}
