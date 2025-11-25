/**
 * Game State for Chronicles of the Kethaneum
 * This module handles the core game state and initialization
 */

import { StoryProgressState, DEFAULT_STORY_PROGRESS } from '../story/types';

// Re-export for convenience
export type { StoryProgressState } from '../story/types';

export interface WordData {
  word: string;
  found: boolean;
  row: number;
  col: number;
  direction: [number, number];
}

export interface Cell {
  row: number;
  col: number;
  value: string;
}

export interface UncompletedPuzzle {
  book: string;
  part: number;
  genre: string;
}

export interface BookProgress {
  [bookTitle: string]: boolean[] | { complete?: boolean };
}

export interface PuzzleStats {
  timeTaken: number;
  wordsFound: number;
  accuracy: number;
  puzzleIndex: number;
}

export interface SessionStats {
  puzzlesCompleted: number;
  totalTime: number;
  averageTime: number;
  totalWordsFound: number;
  puzzles: PuzzleStats[];
}

export interface GameState {
  currentScreen: string;
  grid: string[][];
  wordList: WordData[];
  selectedCells: Cell[];
  startCell: Cell | null;
  currentCell: Cell | null;
  timer: NodeJS.Timeout | null;
  timeRemaining: number;
  paused: boolean;
  gameOver: boolean;
  puzzles: { [genre: string]: PuzzleData[] };
  currentGenre: string;
  currentPuzzleIndex: number;
  completedPuzzles: number;
  lastUncompletedPuzzle: UncompletedPuzzle | null;
  books: BookProgress;
  currentBook: string;
  currentStoryPart: number;
  completedBooks: number;
  discoveredBooks: Set<string>;
  bookProgress: { [bookTitle: string]: number };
  bookPartsMap: { [bookTitle: string]: number[] };
  gameMode: 'story' | 'puzzle-only' | 'beat-the-clock';
  runStartTime: number | null;
  runDuration: number;
  sessionStats: SessionStats | null;
  // Puzzle selection system fields
  selectedGenre: string; // The genre actively chosen by player
  nextKethaneumIndex: number; // Which Kethaneum book to show next
  puzzlesSinceLastKethaneum: number; // Counter for pattern tracking
  nextKethaneumInterval: number; // Randomly chosen interval for next Kethaneum
  completedPuzzlesByGenre: { [genre: string]: Set<string> }; // Track completed puzzles by title
  kethaneumRevealed: boolean; // Whether Kethaneum genre is visible in selection
  genreExhausted: boolean; // Whether current selected genre has no more new puzzles
  // Story progress tracking
  storyProgress: StoryProgressState; // Player's story journey progress
}

export interface PuzzleData {
  title: string;
  book: string;
  words: string[];
  genre?: string; // Genre is included in puzzle data files
  storyPart?: number;
  storyExcerpt?: string;
}

// Define the base state with default values
export const baseState: Omit<GameState, 'discoveredBooks' | 'completedPuzzlesByGenre' | 'storyProgress'> & {
  discoveredBooks: Set<string>;
  completedPuzzlesByGenre: { [genre: string]: Set<string> };
  storyProgress: StoryProgressState;
} = {
  currentScreen: 'title-screen',
  grid: [],
  wordList: [],
  selectedCells: [],
  startCell: null,
  currentCell: null,
  timer: null,
  timeRemaining: 0,
  paused: false,
  gameOver: false,
  puzzles: {},
  currentGenre: '',
  currentPuzzleIndex: -1,
  completedPuzzles: 0,
  lastUncompletedPuzzle: null,
  books: {},
  currentBook: '',
  currentStoryPart: -1,
  completedBooks: 0,
  discoveredBooks: new Set(),
  bookProgress: {},
  bookPartsMap: {},
  gameMode: 'story',
  runStartTime: null,
  runDuration: 300, // 5 minutes in seconds for Beat the Clock
  sessionStats: null,
  // Puzzle selection system defaults
  selectedGenre: '',
  nextKethaneumIndex: 0,
  puzzlesSinceLastKethaneum: 0,
  nextKethaneumInterval: 3, // Will be randomized on first use
  completedPuzzlesByGenre: {},
  kethaneumRevealed: false,
  genreExhausted: false,
  storyProgress: { ...DEFAULT_STORY_PROGRESS },
};

/**
 * Initialize the game state object with default values
 */
export function initializeGameState(): GameState {
  // Create state object
  const state: GameState = {
    ...baseState,
    discoveredBooks: new Set(),
    completedPuzzlesByGenre: {},
    storyProgress: { ...DEFAULT_STORY_PROGRESS },
  };

  return state;
}

/**
 * Get the current game state
 */
export function getGameState(state: GameState): GameState {
  return state;
}

/**
 * Check if the game is in a playable state
 */
export function isGameReady(state: GameState): boolean {
  // Check if puzzles are loaded
  const puzzlesLoaded = state.puzzles && 
                       Object.keys(state.puzzles).length > 0 &&
                       Object.values(state.puzzles).some(genre => genre.length > 0);
  
  return puzzlesLoaded;
}

/**
 * Update a specific property in the game state
 */
export function updateGameState(state: GameState, property: keyof GameState, value: any): GameState {
  return {
    ...state,
    [property]: value,
  };
}

/**
 * Restore a saved game state
 */
export function restoreGameState(state: GameState, savedState: Partial<GameState>): GameState {
  const restored: GameState = { ...state };

  // Only restore known properties to avoid corruption
  for (const key in savedState) {
    if (key in baseState) {
      // Special handling for the discoveredBooks Set
      if (key === 'discoveredBooks') {
        const savedBooks = (savedState as any).discoveredBooks;
        if (savedBooks instanceof Set) {
          // Already a Set - use directly
          restored.discoveredBooks = savedBooks;
        } else if (Array.isArray(savedBooks)) {
          // Array from JSON - convert to Set
          restored.discoveredBooks = new Set(savedBooks);
        }
      }
      // Special handling for completedPuzzlesByGenre (nested Sets)
      else if (key === 'completedPuzzlesByGenre') {
        const savedCompleted = (savedState as any).completedPuzzlesByGenre;
        if (savedCompleted && typeof savedCompleted === 'object') {
          restored.completedPuzzlesByGenre = {};
          for (const genre in savedCompleted) {
            if (savedCompleted[genre] instanceof Set) {
              // Already a Set - use directly
              restored.completedPuzzlesByGenre[genre] = savedCompleted[genre];
            } else if (Array.isArray(savedCompleted[genre])) {
              // Array from JSON - convert to Set
              restored.completedPuzzlesByGenre[genre] = new Set(savedCompleted[genre]);
            }
          }
        }
      }
      // Special handling for storyProgress
      else if (key === 'storyProgress') {
        const savedProgress = (savedState as any).storyProgress;
        if (savedProgress && typeof savedProgress === 'object') {
          restored.storyProgress = {
            ...DEFAULT_STORY_PROGRESS,
            ...savedProgress,
            // Ensure arrays are properly restored
            unlockedBlurbs: Array.isArray(savedProgress.unlockedBlurbs)
              ? savedProgress.unlockedBlurbs
              : [],
            firedTriggers: Array.isArray(savedProgress.firedTriggers)
              ? savedProgress.firedTriggers
              : [],
          };
        }
      } else {
        (restored as any)[key] = (savedState as any)[key];
      }
    }
  }

  // Ensure discoveredBooks is a Set
  if (!(restored.discoveredBooks instanceof Set)) {
    restored.discoveredBooks = new Set();
  }

  // Ensure completedPuzzlesByGenre exists
  if (!restored.completedPuzzlesByGenre || typeof restored.completedPuzzlesByGenre !== 'object') {
    restored.completedPuzzlesByGenre = {};
  }

  // Ensure completedBooks matches the size of discoveredBooks
  restored.completedBooks = restored.discoveredBooks.size;

  // Ensure storyProgress exists with default values
  if (!restored.storyProgress || typeof restored.storyProgress !== 'object') {
    restored.storyProgress = { ...DEFAULT_STORY_PROGRESS };
  }

  return restored;
}

