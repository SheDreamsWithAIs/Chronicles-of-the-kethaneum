/**
 * Puzzle loader for Puzzle Only Mode
 * Loads random puzzles from any genre without story progression
 */

import type { GameState, PuzzleData } from './state';
import { initializePuzzle } from './puzzleGenerator';
import type { Config } from '../core/config';

/**
 * Load a random puzzle for Puzzle Only Mode
 * Selects a random genre and random puzzle from that genre
 */
export function loadRandomPuzzle(
  state: GameState,
  config: Config
): { success: boolean; newState: GameState } {
  try {
    // Clear any existing timer before loading new puzzle
    if (state.timer) {
      clearInterval(state.timer);
    }
    
    const allGenres = Object.keys(state.puzzles || {});
    if (allGenres.length === 0) {
      throw new Error('No puzzles loaded');
    }
    
    // Select random genre
    const selectedGenre = allGenres[Math.floor(Math.random() * allGenres.length)];
    if (!state.puzzles[selectedGenre] || state.puzzles[selectedGenre].length === 0) {
      throw new Error(`No puzzles found for genre: ${selectedGenre}`);
    }
    
    // Select random puzzle from genre
    const puzzles = state.puzzles[selectedGenre];
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    const puzzleToLoad = puzzles[randomIndex];
    
    // Update state with random puzzle
    const updatedState: GameState = {
      ...state,
      currentGenre: selectedGenre,
      currentPuzzleIndex: randomIndex,
      currentBook: puzzleToLoad.book,
      currentStoryPart: puzzleToLoad.storyPart || 0,
      // Reset gameOver so new puzzle can start
      gameOver: false,
    };
    
    // Initialize the puzzle
    const initResult = initializePuzzle(puzzleToLoad, config, updatedState);
    
    if (!initResult.success) {
      throw new Error('Puzzle initialization failed');
    }
    
    return { success: true, newState: initResult.newState };
  } catch (error) {
    console.error('Error loading random puzzle for Puzzle Only Mode:', error);
    return { success: false, newState: state };
  }
}

/**
 * Restore a specific puzzle for Puzzle Only Mode (used on refresh)
 */
export function restorePuzzleOnlyPuzzle(
  genre: string,
  puzzleIndex: number,
  state: GameState,
  config: Config
): { success: boolean; newState: GameState } {
  // Clear any existing timer before loading puzzle
  if (state.timer) {
    clearInterval(state.timer);
  }
  try {
    if (!state.puzzles || !state.puzzles[genre] || !state.puzzles[genre][puzzleIndex]) {
      throw new Error(`Puzzle not found: genre="${genre}", index=${puzzleIndex}`);
    }
    
    const puzzleToRestore = state.puzzles[genre][puzzleIndex];
    
    // Update state with saved puzzle
    const updatedState: GameState = {
      ...state,
      currentGenre: genre,
      currentPuzzleIndex: puzzleIndex,
      currentBook: puzzleToRestore.book,
      currentStoryPart: puzzleToRestore.storyPart !== undefined ? puzzleToRestore.storyPart : 0,
      // Reset gameOver so puzzle can start
      gameOver: false,
    };
    
    // Initialize the puzzle
    const initResult = initializePuzzle(puzzleToRestore, config, updatedState);
    
    if (!initResult.success) {
      throw new Error('Puzzle initialization failed');
    }
    
    return { success: true, newState: initResult.newState };
  } catch (error) {
    console.error('Error restoring Puzzle Only Mode puzzle:', error);
    return { success: false, newState: state };
  }
}

