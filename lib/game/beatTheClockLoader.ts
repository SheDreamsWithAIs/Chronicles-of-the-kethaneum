/**
 * Puzzle loader for Beat the Clock Mode
 * Loads random puzzles from beatTheClockPuzzles.json
 */

import type { GameState, PuzzleData } from './state';
import { initializePuzzle } from './puzzleGenerator';
import type { Config } from '../core/config';
import { fetchAsset } from '../utils/assetPath';

/**
 * Load a random puzzle for Beat the Clock Mode
 * Loads from beatTheClockPuzzles.json if not already loaded, then selects random puzzle
 */
export async function loadBeatTheClockPuzzle(
  state: GameState,
  config: Config
): Promise<{ success: boolean; newState: GameState }> {
  console.log('[loadBeatTheClockPuzzle] Loading puzzle, current timer:', state.timer ? 'exists' : 'null', 'gameOver:', state.gameOver);
  
  try {
    // Clear any existing timer before loading new puzzle
    if (state.timer) {
      console.log('[loadBeatTheClockPuzzle] Clearing existing timer');
      clearInterval(state.timer);
    }
    
    // Load Beat the Clock puzzles if not already loaded
    if (!state.puzzles || !state.puzzles['Beat the Clock'] || state.puzzles['Beat the Clock'].length === 0) {
      const response = await fetchAsset('/data/beatTheClockPuzzles.json');
      if (!response.ok) {
        throw new Error('Failed to load Beat the Clock puzzles');
      }
      const puzzleData: PuzzleData[] = await response.json();
      
      // Add genre field to puzzles
      const puzzlesWithGenre = puzzleData.map(p => ({
        ...p,
        genre: 'Beat the Clock',
      }));
      
      const newState: GameState = {
        ...state,
        puzzles: {
          ...state.puzzles,
          'Beat the Clock': puzzlesWithGenre,
        },
      };
      
      // Select random puzzle
      const randomIndex = Math.floor(Math.random() * puzzlesWithGenre.length);
      const puzzleToLoad = puzzlesWithGenre[randomIndex];
      
      // Update state - preserve runStartTime and runDuration for Beat the Clock mode
      const updatedState: GameState = {
        ...newState,
        currentGenre: 'Beat the Clock',
        currentPuzzleIndex: randomIndex,
        currentBook: puzzleToLoad.book,
        currentStoryPart: puzzleToLoad.storyPart || 0,
        // Preserve run timer state
        runStartTime: state.runStartTime,
        runDuration: state.runDuration,
        // Reset gameOver so new puzzle can start
        gameOver: false,
      };
      
      // Initialize the puzzle
      const initResult = initializePuzzle(puzzleToLoad, config, updatedState);
      
      if (!initResult.success) {
        throw new Error('Puzzle initialization failed');
      }
      
      console.log('[loadBeatTheClockPuzzle] Puzzle initialized (first load), new timer:', initResult.newState.timer ? 'exists' : 'null', 'gameOver:', initResult.newState.gameOver);
      
      return { success: true, newState: initResult.newState };
    } else {
      // Puzzles already loaded, select random one
      const puzzles = state.puzzles['Beat the Clock'];
      const randomIndex = Math.floor(Math.random() * puzzles.length);
      const puzzleToLoad = puzzles[randomIndex];
      
      // Update state - preserve runStartTime and runDuration for Beat the Clock mode
      const updatedState: GameState = {
        ...state,
        currentGenre: 'Beat the Clock',
        currentPuzzleIndex: randomIndex,
        currentBook: puzzleToLoad.book,
        currentStoryPart: puzzleToLoad.storyPart || 0,
        // Preserve run timer state
        runStartTime: state.runStartTime,
        runDuration: state.runDuration,
        // Reset gameOver so new puzzle can start
        gameOver: false,
      };
      
      // Initialize the puzzle
      const initResult = initializePuzzle(puzzleToLoad, config, updatedState);
      
      if (!initResult.success) {
        throw new Error('Puzzle initialization failed');
      }
      
      console.log('[loadBeatTheClockPuzzle] Puzzle initialized (already loaded), new timer:', initResult.newState.timer ? 'exists' : 'null', 'gameOver:', initResult.newState.gameOver);
      
      return { success: true, newState: initResult.newState };
    }
  } catch (error) {
    console.error('[loadBeatTheClockPuzzle] Error loading Beat the Clock puzzle:', error);
    return { success: false, newState: state };
  }
}

