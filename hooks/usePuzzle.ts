/**
 * React hook for managing puzzle loading and generation
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState, PuzzleData } from '@/lib/game/state';
import { loadAllPuzzles, loadSequentialPuzzle } from '@/lib/game/puzzleLoader';
import { loadRandomPuzzle, restorePuzzleOnlyPuzzle } from '@/lib/game/puzzleOnlyLoader';
import { loadBeatTheClockPuzzle } from '@/lib/game/beatTheClockLoader';
import { initializePuzzle } from '@/lib/game/puzzleGenerator';
import { getConfig } from '@/lib/core/config';
import { selectNextPuzzle, initializePuzzleSelection, markPuzzleCompleted } from '@/lib/game/puzzleSelector';

export function usePuzzle(state: GameState, setState: (state: GameState) => void) {
  const config = getConfig();
  // Use ref to always have latest state in callbacks
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load all puzzles
  const loadAll = useCallback(async () => {
    try {
      const { puzzles, newState } = await loadAllPuzzles(stateRef.current, config);
      setState(newState);
      return puzzles;
    } catch (error) {
      console.error('Error loading puzzles:', error);
      return {};
    }
  }, [setState, config]);

  // Load sequential puzzle
  const loadSequential = useCallback((
    genre: string | null = null,
    book: string | null = null,
    allowReplay: boolean = false
  ): { success: boolean; genreComplete?: boolean } => {
    try {
      // Use ref to get latest state
      const currentState = stateRef.current;
      const { success, newState, genreComplete } = loadSequentialPuzzle(
        genre,
        book,
        currentState,
        config,
        allowReplay
      );
      if (success) {
        setState(newState);
      }
      return { success, genreComplete };
    } catch (error) {
      console.error('Error loading sequential puzzle:', error);
      return { success: false };
    }
  }, [setState, config]);

  // Initialize a specific puzzle
  const initialize = useCallback((puzzleData: PuzzleData) => {
    try {
      const { success, newState } = initializePuzzle(puzzleData, config, stateRef.current);
      if (success) {
        setState(newState);
      }
      return success;
    } catch (error) {
      console.error('Error initializing puzzle:', error);
      return false;
    }
  }, [setState, config]);

  // Load random puzzle for Puzzle Only Mode
  const loadRandom = useCallback(() => {
    try {
      const currentState = stateRef.current;
      const { success, newState } = loadRandomPuzzle(currentState, config);
      if (success) {
        setState(newState);
      }
      return success;
    } catch (error) {
      console.error('Error loading random puzzle:', error);
      return false;
    }
  }, [setState, config]);

  // Restore puzzle for Puzzle Only Mode (on refresh)
  const restorePuzzleOnly = useCallback((genre: string, puzzleIndex: number) => {
    try {
      const currentState = stateRef.current;
      const { success, newState } = restorePuzzleOnlyPuzzle(genre, puzzleIndex, currentState, config);
      if (success) {
        setState(newState);
      }
      return success;
    } catch (error) {
      console.error('Error restoring Puzzle Only puzzle:', error);
      return false;
    }
  }, [setState, config]);

  // Load Beat the Clock puzzle
  const loadBeatTheClock = useCallback(async () => {
    try {
      const currentState = stateRef.current;
      console.log('[usePuzzle.loadBeatTheClock] Starting to load puzzle, current timer:', currentState.timer ? 'exists' : 'null');
      const { success, newState } = await loadBeatTheClockPuzzle(currentState, config);
      if (success) {
        console.log('[usePuzzle.loadBeatTheClock] Puzzle loaded successfully, new timer:', newState.timer ? 'exists' : 'null', 'gameOver:', newState.gameOver);
        setState(newState);
      } else {
        console.log('[usePuzzle.loadBeatTheClock] Puzzle load failed');
      }
      return success;
    } catch (error) {
      console.error('[usePuzzle.loadBeatTheClock] Error loading Beat the Clock puzzle:', error);
      return false;
    }
  }, [setState, config]);

  // Load puzzle using the new selection system (with Kethaneum weaving)
  const loadWithSelection = useCallback(() => {
    try {
      const currentState = stateRef.current;

      // Initialize puzzle selection system if needed
      const initializedState = initializePuzzleSelection(currentState);

      // Select the next puzzle
      const { puzzle, newState, isKethaneum, message } = selectNextPuzzle(initializedState);

      if (!puzzle) {
        console.error('No puzzle selected:', message);
        return { success: false, message };
      }

      // Initialize the selected puzzle
      const { success, newState: finalState } = initializePuzzle(puzzle, config, newState);

      if (success) {
        setState(finalState);
        return { success: true, isKethaneum, message };
      }

      return { success: false, message: 'Failed to initialize puzzle' };
    } catch (error) {
      console.error('Error loading puzzle with selection:', error);
      return { success: false, message: 'Error loading puzzle' };
    }
  }, [setState, config]);

  // Mark the current puzzle as completed
  const markCompleted = useCallback((puzzle: PuzzleData) => {
    try {
      const currentState = stateRef.current;
      const newState = markPuzzleCompleted(currentState, puzzle);
      setState(newState);
      return true;
    } catch (error) {
      console.error('Error marking puzzle as completed:', error);
      return false;
    }
  }, [setState]);

  return {
    loadAll,
    loadSequential,
    initialize,
    loadRandom,
    restorePuzzleOnly,
    loadBeatTheClock,
    loadWithSelection,
    markCompleted,
  };
}

