/**
 * Game Logic module for Chronicles of the Kethaneum
 * This module handles game mechanics, rules, and flow
 */

import type { GameState, WordData, Cell, SessionStats } from './state';
import type { Config } from '../core/config';

/**
 * Check if the selected cells form a word in the puzzle
 */
export function checkForWord(
  selectedCells: Cell[],
  wordList: WordData[],
  config: Config
): { found: boolean; wordData: WordData | null } {
  if (selectedCells.length < config.minWordLength) {
    return { found: false, wordData: null };
  }

  // Extract the word from selected cells
  const selectedWord = selectedCells.map(cell => cell.value).join('');

  // Get start and end coordinates
  const startRow = selectedCells[0].row;
  const startCol = selectedCells[0].col;
  const endRow = selectedCells[selectedCells.length - 1].row;
  const endCol = selectedCells[selectedCells.length - 1].col;

  // Calculate direction
  const dRow = endRow === startRow ? 0 : (endRow - startRow) / Math.abs(endRow - startRow);
  const dCol = endCol === startCol ? 0 : (endCol - startCol) / Math.abs(endCol - startCol);

  // Check against word list
  for (const wordData of wordList) {
    if (wordData.found) continue;

    // Check if word matches in either direction
    if (
      (selectedWord === wordData.word &&
        startRow === wordData.row &&
        startCol === wordData.col &&
        dRow === wordData.direction[0] &&
        dCol === wordData.direction[1]) ||
      (selectedWord === wordData.word.split('').reverse().join('') &&
        endRow === wordData.row &&
        endCol === wordData.col &&
        dRow === -wordData.direction[0] &&
        dCol === -wordData.direction[1])
    ) {
      return { found: true, wordData };
    }
  }

  return { found: false, wordData: null };
}

/**
 * Mark a word as found and update the state
 */
export function markWordAsFound(
  state: GameState,
  wordData: WordData
): { newState: GameState; allWordsFound: boolean } {
  // Mark word as found
  const newWordList = state.wordList.map(word => 
    word === wordData ? { ...word, found: true } : word
  );

  const newState: GameState = {
    ...state,
    wordList: newWordList,
  };

  // Check if all words are found
  const allWordsFound = newWordList.every(word => word.found);

  return { newState, allWordsFound };
}

/**
 * Check if all words have been found to trigger win condition
 */
export function checkWinCondition(state: GameState): boolean {
  return state.wordList.every(wordData => wordData.found);
}

/**
 * End the game
 */
export function endGame(
  state: GameState,
  isWin: boolean
): { newState: GameState } {
  // Stop the timer
  if (state.timer) {
    clearInterval(state.timer);
  }

  let newState: GameState = {
    ...state,
    gameOver: true,
    timer: null,
  };

  if (isWin) {
    // Clear any saved uncompleted puzzle since this one is now complete
    if (newState.lastUncompletedPuzzle &&
      newState.lastUncompletedPuzzle.book === newState.currentBook &&
      newState.lastUncompletedPuzzle.part === newState.currentStoryPart) {
      newState.lastUncompletedPuzzle = null;
    }

    // Increment completed puzzles count
    newState.completedPuzzles++;

    // Update book completion status
    if (newState.currentBook && newState.currentStoryPart >= 0) {
      // Initialize book tracking if it doesn't exist
      if (!newState.books[newState.currentBook]) {
        newState.books[newState.currentBook] = [];
      }

      const bookData = newState.books[newState.currentBook];
      if (Array.isArray(bookData)) {
        // Mark the story part as complete
        bookData[newState.currentStoryPart] = true;
      }

      // Ensure discoveredBooks exists and is a Set
      if (!newState.discoveredBooks || !(newState.discoveredBooks instanceof Set)) {
        newState.discoveredBooks = new Set();
      }

      // Add to discoveredBooks if this is a new book
      if (!newState.discoveredBooks.has(newState.currentBook)) {
        newState.discoveredBooks.add(newState.currentBook);
        // Update completedBooks based on the actual set size
        newState.completedBooks = newState.discoveredBooks.size;
      }

      // Update the next story part to show for this book
      if (!newState.bookProgress) {
        newState.bookProgress = {};
      }

      // Advance to next part
      newState.bookProgress[newState.currentBook] = newState.currentStoryPart + 1;

      // Check if the book is now complete
      const isComplete = checkBookCompletion(newState.currentBook, newState);
      if (isComplete) {
        // Mark book as complete
        const bookData = newState.books[newState.currentBook];
        if (Array.isArray(bookData)) {
          // Convert to object with complete flag
          newState.books[newState.currentBook] = {
            ...bookData.reduce((acc, val, idx) => ({ ...acc, [idx]: val }), {}),
            complete: true,
          };
        }
      }
    }
  }

  return { newState };
}

/**
 * Check if a book has all parts completed
 */
export function checkBookCompletion(bookTitle: string, state: GameState): boolean {
  // Return false if the book doesn't exist in state
  if (!state.books[bookTitle]) return false;

  // Get available parts from the mapping 
  const availableParts = state.bookPartsMap[bookTitle];

  // If no parts mapping exists, we can't determine completion
  if (!availableParts || availableParts.length === 0) return false;

  // Check if ALL available parts are complete
  const bookData = state.books[bookTitle];
  if (Array.isArray(bookData)) {
    const allPartsComplete = availableParts.every(part =>
      bookData[part] === true
    );
    return allPartsComplete;
  }

  return false;
}

/**
 * Start the game timer
 */
export function startTimer(
  state: GameState,
  config: Config,
  onTick?: (timeRemaining: number) => void,
  onTimeUp?: () => void,
  isPaused?: () => boolean
): { newState: GameState; timer: NodeJS.Timeout | null } {
  // Clear any existing timer
  if (state.timer) {
    clearInterval(state.timer);
  }

  // Story Mode: Don't decrement timer, always show full time (decorative)
  if (state.gameMode === 'story') {
    const timeRemaining = config.timeLimit;
    // Still call tick callback to update UI, but don't decrement
    if (onTick) {
      onTick(timeRemaining);
    }
    return {
      newState: {
        ...state,
        timer: null, // No active timer for Story Mode
        timeRemaining,
      },
      timer: null,
    };
  }

  // Puzzle Only Mode and Beat the Clock: Normal countdown
  let timeRemaining = state.timeRemaining || config.timeLimit;

  // Set up new timer
  const timer = setInterval(() => {
    // Check paused state - use provided function if available, otherwise fall back to captured state
    const paused = isPaused ? isPaused() : state.paused;
    if (paused) return;

    timeRemaining--;

    // Call tick callback if provided
    if (onTick) {
      onTick(timeRemaining);
    }

    // Check for time's up
    if (timeRemaining <= 0) {
      clearInterval(timer);
      if (onTimeUp) {
        onTimeUp();
      }
    }
  }, 1000);

  const newState: GameState = {
    ...state,
    timer,
    timeRemaining,
  };

  return { newState, timer };
}

/**
 * Reset and replay current puzzle
 */
export function resetCurrentPuzzle(
  state: GameState,
  config: Config
): { newState: GameState } {
  // Get current puzzle data
  const puzzleData = state.puzzles[state.currentGenre]?.[state.currentPuzzleIndex];
  
  if (!puzzleData) {
    return { newState: state };
  }

  // Reset game state for puzzle
  const newState: GameState = {
    ...state,
    wordList: [],
    selectedCells: [],
    startCell: null,
    currentCell: null,
    timeRemaining: config.timeLimit,
    paused: true,
    gameOver: false,
  };

  return { newState };
}

/**
 * Resume game from paused state
 */
export function resumeGame(state: GameState): GameState {
  return {
    ...state,
    paused: false,
  };
}

/**
 * Clear puzzle timer without ending the game
 * Used for beat-the-clock mode when puzzle completes but run continues
 */
export function clearPuzzleTimer(state: GameState): GameState {
  console.log('[clearPuzzleTimer] Clearing puzzle timer, gameMode:', state.gameMode, 'timer exists:', !!state.timer);
  
  // Stop the timer - store reference before clearing
  const timerToClear = state.timer;
  if (timerToClear) {
    clearInterval(timerToClear);
    console.log('[clearPuzzleTimer] Timer interval cleared');
  }
  
  return {
    ...state,
    timer: null,
    // Note: We do NOT set gameOver: true here
    // This allows the run to continue in beat-the-clock mode
  };
}

/**
 * Pause the game
 */
export function pauseGame(state: GameState): GameState {
  // Clear the timer immediately when pausing
  if (state.timer) {
    clearInterval(state.timer);
  }
  
  return {
    ...state,
    paused: true,
    timer: null,
  };
}

/**
 * Start a Beat the Clock run (fixed 5 minutes)
 */
export function startBeatTheClockRun(state: GameState): GameState {
  const runDuration = 300; // Fixed 5 minutes in seconds
  const runStartTime = Date.now();
  
  return {
    ...state,
    runStartTime,
    runDuration,
    timeRemaining: runDuration, // Initialize puzzle timer with run duration
  };
}

/**
 * End a Beat the Clock run and calculate final stats
 */
export function endBeatTheClockRun(state: GameState): { newState: GameState; sessionStats: SessionStats | null } {
  // Calculate total time elapsed
  const runEndTime = Date.now();
  const totalTime = state.runStartTime 
    ? Math.floor((runEndTime - state.runStartTime) / 1000)
    : 0;
  
  // Get current session stats or create new
  const sessionStats = state.sessionStats || {
    puzzlesCompleted: 0,
    totalTime: 0,
    averageTime: 0,
    totalWordsFound: 0,
    puzzles: [],
  };
  
  const newState: GameState = {
    ...state,
    runStartTime: null,
    timeRemaining: 0,
  };
  
  return { newState, sessionStats };
}

