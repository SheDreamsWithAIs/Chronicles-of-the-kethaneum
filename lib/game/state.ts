/**
 * Game State for Chronicles of the Kethaneum
 * This module handles the core game state and initialization
 */

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
}

export interface PuzzleData {
  title: string;
  book: string;
  genre?: string;
  words: string[];
  storyPart?: number;
  storyExcerpt?: string;
}

// Define the base state with default values
export const baseState: Omit<GameState, 'discoveredBooks'> & { discoveredBooks: Set<string> } = {
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
};

/**
 * Initialize the game state object with default values
 */
export function initializeGameState(): GameState {
  // Create state object
  const state: GameState = {
    ...baseState,
    discoveredBooks: new Set(),
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
        if (Array.isArray(savedBooks)) {
          restored.discoveredBooks = new Set(savedBooks);
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
  
  // Ensure completedBooks matches the size of discoveredBooks
  restored.completedBooks = restored.discoveredBooks.size;
  
  return restored;
}

