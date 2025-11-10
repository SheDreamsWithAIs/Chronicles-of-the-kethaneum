/**
 * React hook for managing game state
 */

import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '@/lib/game/state';
import { initializeGameState, restoreGameState } from '@/lib/game/state';
import { loadGameProgress, saveGameProgress } from '@/lib/save/saveSystem';

export function useGameState() {
  const [state, setState] = useState<GameState>(() => initializeGameState());
  const [isReady, setIsReady] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = loadGameProgress();
    if (savedProgress) {
      // Convert SavedProgress to Partial<GameState> format
      const progressState: Partial<GameState> = {
        ...savedProgress,
        discoveredBooks: new Set(savedProgress.discoveredBooks),
        gameMode: (savedProgress.gameMode as GameState['gameMode']) || 'story',
      };
      setState(prevState => restoreGameState(prevState, progressState));
    }
    // Mark as ready after initial load (whether or not we had saved progress)
    setIsReady(true);
  }, []);

  // Save progress whenever state changes (but only after initial load)
  useEffect(() => {
    if (isReady) {
      saveGameProgress(state);
    }
  }, [state, isReady]);

  // Update state helper
  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Initialize game
  const initialize = useCallback(async () => {
    const newState = initializeGameState();
    const savedProgress = loadGameProgress();
    
    if (savedProgress) {
      // Convert SavedProgress to Partial<GameState> format
      const progressState: Partial<GameState> = {
        ...savedProgress,
        discoveredBooks: new Set(savedProgress.discoveredBooks),
        gameMode: (savedProgress.gameMode as GameState['gameMode']) || 'story',
      };
      const restored = restoreGameState(newState, progressState);
      setState(restored);
    } else {
      setState(newState);
    }
    
    setIsReady(true);
  }, []);

  return {
    state,
    setState,
    updateState,
    initialize,
    isReady,
  };
}

