/**
 * Puzzle Selection System with Kethaneum Weaving
 * Chronicles of the Kethaneum
 *
 * This module handles intelligent puzzle selection that:
 * - Primarily selects from the player's chosen genre
 * - Weaves Kethaneum narrative books in sequential order at configured intervals
 * - Tracks completed puzzles to avoid repetition
 * - Handles genre exhaustion and Kethaneum completion
 */

import type { GameState, PuzzleData } from './state';
import {
  defaultPuzzleSelectionConfig,
  getRandomKethaneumInterval,
  type PuzzleSelectionConfig,
} from './puzzleSelectionConfig';

export interface PuzzleSelectionResult {
  puzzle: PuzzleData | null;
  newState: GameState;
  isKethaneum: boolean;
  genreExhausted: boolean;
  kethaneumExhausted: boolean;
  message?: string; // Optional message for UI notifications
}

/**
 * Select the next puzzle based on the puzzle selection system
 */
export function selectNextPuzzle(
  state: GameState,
  config: PuzzleSelectionConfig = defaultPuzzleSelectionConfig
): PuzzleSelectionResult {
  try {
    console.log(`[PuzzleSelector] Selecting next puzzle. Selected genre: "${state.selectedGenre}", Puzzles since last Kethaneum: ${state.puzzlesSinceLastKethaneum}/${state.nextKethaneumInterval}`);

    // Validate state
    if (!state) {
      throw new Error('Game state is null or undefined');
    }

    if (!state.puzzles || typeof state.puzzles !== 'object') {
      throw new Error('Game state puzzles is invalid');
    }

    // Ensure completedPuzzlesByGenre is initialized
    if (!state.completedPuzzlesByGenre) {
      state.completedPuzzlesByGenre = {};
    }

    // Check if we have a selected genre
    if (!state.selectedGenre || !state.puzzles[state.selectedGenre]) {
      return {
        puzzle: null,
        newState: state,
        isKethaneum: false,
        genreExhausted: false,
        kethaneumExhausted: false,
        message: 'No genre selected. Please select a genre from the library.',
      };
    }

    const newState = { ...state };

    // Check if it's time for a Kethaneum puzzle
    const shouldInsertKethaneum = checkIfTimeForKethaneum(newState, config);

    if (shouldInsertKethaneum) {
      console.log('[PuzzleSelector] Time for Kethaneum puzzle!');
      const kethaneumResult = selectKethaneumPuzzle(newState, config);

      if (kethaneumResult.puzzle) {
        // Successfully got a Kethaneum puzzle
        return kethaneumResult;
      } else {
        // No more Kethaneum puzzles available, continue with regular genre
        console.log('[PuzzleSelector] No Kethaneum puzzles available, continuing with regular genre');
        // Fall through to select from chosen genre
      }
    }

    // Select from the player's chosen genre
    return selectGenrePuzzle(newState, config);
  } catch (error) {
    console.error('[PuzzleSelector] Fatal error in selectNextPuzzle:', error);
    return {
      puzzle: null,
      newState: state,
      isKethaneum: false,
      genreExhausted: false,
      kethaneumExhausted: false,
      message: `Error selecting puzzle: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if it's time to insert a Kethaneum puzzle based on the counter and interval
 */
function checkIfTimeForKethaneum(
  state: GameState,
  config: PuzzleSelectionConfig
): boolean {
  // Check if we have any Kethaneum puzzles
  const kethaneumPuzzles = state.puzzles[config.kethaneumGenreName];
  if (!kethaneumPuzzles || kethaneumPuzzles.length === 0) {
    return false;
  }

  // Check if all Kethaneum puzzles have been shown
  if (state.nextKethaneumIndex >= kethaneumPuzzles.length) {
    return false;
  }

  // Check if we've reached the interval
  return state.puzzlesSinceLastKethaneum >= state.nextKethaneumInterval;
}

/**
 * Select the next Kethaneum puzzle in sequential order
 */
function selectKethaneumPuzzle(
  state: GameState,
  config: PuzzleSelectionConfig
): PuzzleSelectionResult {
  try {
    const kethaneumPuzzles = state.puzzles[config.kethaneumGenreName];

    if (!kethaneumPuzzles || kethaneumPuzzles.length === 0) {
      return {
        puzzle: null,
        newState: state,
        isKethaneum: false,
        genreExhausted: false,
        kethaneumExhausted: true,
      };
    }

    // Validate nextKethaneumIndex
    if (typeof state.nextKethaneumIndex !== 'number' || state.nextKethaneumIndex < 0) {
      throw new Error(`Invalid nextKethaneumIndex: ${state.nextKethaneumIndex}`);
    }

    // Check if all Kethaneum puzzles have been shown
    if (state.nextKethaneumIndex >= kethaneumPuzzles.length) {
      return {
        puzzle: null,
        newState: state,
        isKethaneum: false,
        genreExhausted: false,
        kethaneumExhausted: true,
      };
    }

    // Get the next Kethaneum puzzle
    const puzzle = kethaneumPuzzles[state.nextKethaneumIndex];

    // Validate puzzle exists and has required fields
    if (!puzzle) {
      throw new Error(`Kethaneum puzzle at index ${state.nextKethaneumIndex} not found. Total puzzles: ${kethaneumPuzzles.length}`);
    }

    if (!puzzle.title || !puzzle.book || !puzzle.words) {
      throw new Error(`Kethaneum puzzle at index ${state.nextKethaneumIndex} is missing required fields`);
    }

    console.log(`[Kethaneum] Selecting puzzle ${state.nextKethaneumIndex + 1}/${kethaneumPuzzles.length}: "${puzzle.title}"`);

    const newState = { ...state };

    // Update state for next selection
    newState.nextKethaneumIndex += 1;
    newState.puzzlesSinceLastKethaneum = 0;
    newState.nextKethaneumInterval = getRandomKethaneumInterval(config);
    newState.currentGenre = config.kethaneumGenreName;
    newState.currentBook = puzzle.book;
    newState.currentStoryPart = puzzle.storyPart ?? 0;
    newState.genreExhausted = false;

    // Reveal Kethaneum genre after first encounter
    if (!newState.kethaneumRevealed) {
      newState.kethaneumRevealed = true;
    }

    // Store the index we just used (before we incremented nextKethaneumIndex)
    newState.currentPuzzleIndex = state.nextKethaneumIndex;

    const kethaneumExhausted = newState.nextKethaneumIndex >= kethaneumPuzzles.length;

    return {
      puzzle,
      newState,
      isKethaneum: true,
      genreExhausted: false,
      kethaneumExhausted,
    };
  } catch (error) {
    console.error('[PuzzleSelector] Error in selectKethaneumPuzzle:', error);
    return {
      puzzle: null,
      newState: state,
      isKethaneum: false,
      genreExhausted: false,
      kethaneumExhausted: true,
      message: `Kethaneum puzzle selection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Select a puzzle from the player's chosen genre
 */
function selectGenrePuzzle(
  state: GameState,
  config: PuzzleSelectionConfig
): PuzzleSelectionResult {
  try {
    const selectedGenre = state.selectedGenre;

    if (!selectedGenre || typeof selectedGenre !== 'string') {
      throw new Error('Invalid selected genre');
    }

    const genrePuzzles = state.puzzles[selectedGenre];

    if (!genrePuzzles || genrePuzzles.length === 0) {
      return {
        puzzle: null,
        newState: state,
        isKethaneum: false,
        genreExhausted: true,
        kethaneumExhausted: false,
        message: `No puzzles found in genre: ${selectedGenre}`,
      };
    }

    // Initialize completed set for this genre if needed
    if (!state.completedPuzzlesByGenre[selectedGenre]) {
      state.completedPuzzlesByGenre[selectedGenre] = new Set();
    }

    const completedSet = state.completedPuzzlesByGenre[selectedGenre];

    // Find uncompleted puzzles
    const uncompletedPuzzles = genrePuzzles.filter(
      (puzzle) => puzzle && puzzle.title && !completedSet.has(puzzle.title)
    );

    let puzzle: PuzzleData;
    let genreExhausted = false;

    if (uncompletedPuzzles.length > 0) {
      // For Story Mode: Group by book and select lowest uncompleted storyPart per book
      // This ensures narrative order within books while allowing variety between books
      const bookStartPoints: { [book: string]: PuzzleData } = {};

      for (const p of uncompletedPuzzles) {
        if (!p.book) continue;

        const storyPart = p.storyPart ?? 0;
        const existingPart = bookStartPoints[p.book];

        if (!existingPart || storyPart < (existingPart.storyPart ?? 0)) {
          bookStartPoints[p.book] = p;
        }
      }

      // Randomly select from these starting points
      const startingPuzzles = Object.values(bookStartPoints);
      const randomIndex = Math.floor(Math.random() * startingPuzzles.length);
      puzzle = startingPuzzles[randomIndex];
      console.log(`[Genre: ${selectedGenre}] Selected puzzle from ${startingPuzzles.length} books: "${puzzle.title}" (Part ${puzzle.storyPart ?? 0})`);
    } else {
      // All puzzles in this genre have been completed
      // Reset and start over, but notify the player
      genreExhausted = true;
      state.completedPuzzlesByGenre[selectedGenre] = new Set();

      // Select a random puzzle
      const randomIndex = Math.floor(Math.random() * genrePuzzles.length);
      puzzle = genrePuzzles[randomIndex];
      console.log(`[Genre: ${selectedGenre}] Genre exhausted! Restarting with puzzle: "${puzzle.title}"`);
    }

    // Validate puzzle has required fields
    if (!puzzle || !puzzle.title || !puzzle.book || !puzzle.words) {
      throw new Error(`Selected puzzle from genre "${selectedGenre}" is missing required fields`);
    }

    const newState = { ...state };

    // Update state
    newState.puzzlesSinceLastKethaneum += 1;
    newState.currentGenre = selectedGenre;
    newState.currentBook = puzzle.book;
    newState.currentStoryPart = puzzle.storyPart ?? 0;
    newState.currentPuzzleIndex = genrePuzzles.indexOf(puzzle);
    newState.genreExhausted = genreExhausted;

    const message = genreExhausted
      ? `You've completed all puzzles in the ${selectedGenre} genre! Starting over, or select a new genre from the library.`
      : undefined;

    return {
      puzzle,
      newState,
      isKethaneum: false,
      genreExhausted,
      kethaneumExhausted: false,
      message,
    };
  } catch (error) {
    console.error('[PuzzleSelector] Error in selectGenrePuzzle:', error);
    return {
      puzzle: null,
      newState: state,
      isKethaneum: false,
      genreExhausted: true,
      kethaneumExhausted: false,
      message: `Genre puzzle selection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Mark a puzzle as completed
 */
export function markPuzzleCompleted(
  state: GameState,
  puzzle: PuzzleData
): GameState {
  try {
    if (!puzzle || !puzzle.title) {
      throw new Error('Invalid puzzle: missing title');
    }

    const newState = { ...state };

    // Ensure completedPuzzlesByGenre is initialized
    if (!newState.completedPuzzlesByGenre) {
      newState.completedPuzzlesByGenre = {};
    }

    // Get the genre from the puzzle
    const genre = puzzle.genre || newState.currentGenre;

    if (!genre || typeof genre !== 'string') {
      throw new Error('Cannot determine genre for puzzle completion');
    }

    // Initialize the set for this genre if needed
    if (!newState.completedPuzzlesByGenre[genre]) {
      newState.completedPuzzlesByGenre[genre] = new Set();
    }

    // Mark this puzzle as completed
    newState.completedPuzzlesByGenre[genre].add(puzzle.title);
    console.log(`[PuzzleSelector] Marked puzzle "${puzzle.title}" as completed in genre "${genre}"`);

    // Increment global completed counter
    newState.completedPuzzles += 1;

    return newState;
  } catch (error) {
    console.error('[PuzzleSelector] Error in markPuzzleCompleted:', error);
    // Return original state unchanged on error
    return state;
  }
}

/**
 * Handle genre selection by the player
 */
export function selectGenre(
  state: GameState,
  genre: string,
  config: PuzzleSelectionConfig = defaultPuzzleSelectionConfig
): GameState {
  const newState = { ...state };

  // Set the selected genre
  newState.selectedGenre = genre;

  // Reset the pattern counter to ensure first puzzle is from chosen genre
  // By setting puzzlesSinceLastKethaneum to 0, we ensure that the first puzzle
  // will be from the selected genre (since we need to reach the interval before Kethaneum)
  newState.puzzlesSinceLastKethaneum = 0;

  // Set a new random interval if not already set
  if (newState.nextKethaneumInterval <= 0) {
    newState.nextKethaneumInterval = getRandomKethaneumInterval(config);
  }

  // Clear the genre exhausted flag
  newState.genreExhausted = false;

  return newState;
}

/**
 * Initialize the puzzle selection system for a new game
 */
export function initializePuzzleSelection(
  state: GameState,
  config: PuzzleSelectionConfig = defaultPuzzleSelectionConfig
): GameState {
  const newState = { ...state };

  // Initialize tracking fields if not present
  if (newState.nextKethaneumIndex === undefined) {
    newState.nextKethaneumIndex = 0;
  }

  if (newState.puzzlesSinceLastKethaneum === undefined) {
    newState.puzzlesSinceLastKethaneum = 0;
  }

  if (newState.nextKethaneumInterval === undefined || newState.nextKethaneumInterval <= 0) {
    newState.nextKethaneumInterval = getRandomKethaneumInterval(config);
  }

  if (!newState.completedPuzzlesByGenre) {
    newState.completedPuzzlesByGenre = {};
  }

  if (newState.kethaneumRevealed === undefined) {
    newState.kethaneumRevealed = false;
  }

  if (newState.selectedGenre === undefined) {
    newState.selectedGenre = '';
  }

  if (newState.genreExhausted === undefined) {
    newState.genreExhausted = false;
  }

  return newState;
}
