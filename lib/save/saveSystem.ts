/**
 * Save system for Chronicles of the Kethaneum
 * This module handles saving and loading game progress
 */

import type { GameState } from '../game/state';

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
}

/**
 * Save game progress to local storage
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
      gameMode: state.gameMode || undefined
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

