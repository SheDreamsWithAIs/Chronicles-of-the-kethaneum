/**
 * Save system for Chronicles of the Kethaneum
 * This module handles saving and loading game progress
 */

import type { GameState } from '../game/state';
import type { AudioSettings } from '../core/config';
import type { StoryProgressState } from '../story/types';

export interface SavedProgress {
  completedPuzzles: number;
  completedBooks: number;
  books: { [bookTitle: string]: boolean[] | { complete?: boolean } };
  discoveredBooks: string[];
  bookProgress: { [bookTitle: string]: number };
  lastUncompletedPuzzle: { book: string; part: number; genre: string } | null;
  currentGenre?: string;
  currentBook?: string;
  currentStoryPart?: number;
  currentPuzzleIndex?: number;
  gameMode?: string;
  // Puzzle selection system fields
  selectedGenre?: string;
  nextKethaneumIndex?: number;
  puzzlesSinceLastKethaneum?: number;
  nextKethaneumInterval?: number;
  completedPuzzlesByGenre?: { [genre: string]: string[] }; // Arrays instead of Sets for JSON
  kethaneumRevealed?: boolean;
  genreExhausted?: boolean;
  // Story progress system fields
  storyProgress?: StoryProgressState;
}

/**
 * Save game progress to local storage
 *
 * @deprecated Use `saveProgress` from `unifiedSaveSystem` instead. This legacy
 * format is ~3-5x larger and only maintained for backward compatibility.
 *
 * @see {@link unifiedSaveSystem.saveProgress}
 */
export function saveGameProgress(state: GameState): void {
  try {
    // Ensure discoveredBooks exists and is a Set
    if (!state.discoveredBooks || !(state.discoveredBooks instanceof Set)) {
      console.warn('discoveredBooks is not a Set during save - reinitializing');
      state.discoveredBooks = new Set();
    }

    // Always update completedBooks based on the actual set size
    const completedBooks = state.discoveredBooks.size;

    // Convert completedPuzzlesByGenre Sets to Arrays for JSON serialization
    const completedPuzzlesByGenre: { [genre: string]: string[] } = {};
    if (state.completedPuzzlesByGenre) {
      for (const genre in state.completedPuzzlesByGenre) {
        if (state.completedPuzzlesByGenre[genre] instanceof Set) {
          completedPuzzlesByGenre[genre] = Array.from(state.completedPuzzlesByGenre[genre]);
        }
      }
    }

    // Create a clean progress object with only the data we need
    const progress: SavedProgress = {
      completedPuzzles: state.completedPuzzles,
      completedBooks: completedBooks,
      books: JSON.parse(JSON.stringify(state.books)), // Deep copy to avoid reference issues
      discoveredBooks: Array.from(state.discoveredBooks), // Convert Set to Array
      bookProgress: JSON.parse(JSON.stringify(state.bookProgress || {})), // Deep copy
      lastUncompletedPuzzle: state.lastUncompletedPuzzle ?
        JSON.parse(JSON.stringify(state.lastUncompletedPuzzle)) : null,
      currentGenre: state.currentGenre && state.currentGenre.trim() !== '' ? state.currentGenre : undefined,
      currentBook: state.currentBook && state.currentBook.trim() !== '' ? state.currentBook : undefined,
      currentStoryPart: state.currentStoryPart !== undefined && state.currentStoryPart >= 0 ? state.currentStoryPart : undefined,
      currentPuzzleIndex: state.currentPuzzleIndex !== undefined && state.currentPuzzleIndex >= 0 ? state.currentPuzzleIndex : undefined,
      gameMode: state.gameMode || undefined,
      // Puzzle selection system fields
      selectedGenre: state.selectedGenre && state.selectedGenre.trim() !== '' ? state.selectedGenre : undefined,
      nextKethaneumIndex: state.nextKethaneumIndex !== undefined && state.nextKethaneumIndex >= 0 ? state.nextKethaneumIndex : undefined,
      puzzlesSinceLastKethaneum: state.puzzlesSinceLastKethaneum !== undefined ? state.puzzlesSinceLastKethaneum : undefined,
      nextKethaneumInterval: state.nextKethaneumInterval !== undefined ? state.nextKethaneumInterval : undefined,
      completedPuzzlesByGenre: Object.keys(completedPuzzlesByGenre).length > 0 ? completedPuzzlesByGenre : undefined,
      kethaneumRevealed: state.kethaneumRevealed || undefined,
      genreExhausted: state.genreExhausted || undefined,
      // Story progress system fields
      storyProgress: state.storyProgress ? JSON.parse(JSON.stringify(state.storyProgress)) : undefined,
    };

    // Save to localStorage
    localStorage.setItem('kethaneumProgress', JSON.stringify(progress));
  } catch (error) {
    console.error('Error during saveGameProgress:', error);
    throw error;
  }
}

/**
 * Load game progress from local storage
 *
 * @deprecated Use `loadProgress` from `unifiedSaveSystem` instead. This function
 * is only maintained for backward compatibility with old save formats.
 *
 * @see {@link unifiedSaveSystem.loadProgress}
 */
export function loadGameProgress(): SavedProgress | null {
  try {
    const savedProgress = localStorage.getItem('kethaneumProgress');
    if (!savedProgress) {
      console.log('No saved progress found');
      return null;
    }

    // Parse the saved data
    const progress: SavedProgress = JSON.parse(savedProgress);
    return progress;
  } catch (error) {
    console.error('Failed to load game progress:', error);
    return null;
  }
}

/**
 * Reset the game state
 */
export function resetGameState(fullReset: boolean = false): void {
  // If it's a full reset, clear localStorage
  if (fullReset) {
    localStorage.removeItem('kethaneumProgress');
  }
}

/**
 * Clear all game progress
 */
export function clearGameProgress(): void {
  try {
    // Clear localStorage
    localStorage.removeItem('kethaneumProgress');
  } catch (error) {
    console.error('Failed to clear game progress:', error);
  }
}

/**
 * Save audio settings to local storage
 */
export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem('kethaneumAudioSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save audio settings:', error);
  }
}

/**
 * Load audio settings from local storage
 */
export function loadAudioSettings(): AudioSettings | null {
  try {
    const savedSettings = localStorage.getItem('kethaneumAudioSettings');
    if (!savedSettings) {
      return null;
    }

    return JSON.parse(savedSettings) as AudioSettings;
  } catch (error) {
    console.error('Failed to load audio settings:', error);
    return null;
  }
}

/**
 * Clear audio settings
 */
export function clearAudioSettings(): void {
  try {
    localStorage.removeItem('kethaneumAudioSettings');
  } catch (error) {
    console.error('Failed to clear audio settings:', error);
  }
}

