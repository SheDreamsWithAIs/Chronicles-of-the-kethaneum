/**
 * React hook for managing game state
 *
 * Uses the unified save system which:
 * - Automatically migrates old saves to optimized format
 * - Uses compact storage (70-80% smaller)
 * - Maintains backward compatibility
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState } from '@/lib/game/state';
import { initializeGameState, restoreGameState } from '@/lib/game/state';
import {
  loadProgress,
  saveProgress,
  cleanupLegacyKeys,
} from '@/lib/save';

export function useGameState() {
  const [state, setState] = useState<GameState>(() => initializeGameState());
  const [isReady, setIsReady] = useState(false);
  // Track if we're currently saving to prevent save loops
  const isSaving = useRef(false);
  // Track the last saved state to avoid unnecessary saves
  const lastSavedState = useRef<string>('');
  // Track if initial load has completed to prevent auto-save from overwriting loaded data
  const hasCompletedInitialLoad = useRef(false);

  // Helper function to calculate state hash (used for change detection)
  const calculateStateHash = useCallback((gameState: GameState) => {
    const dialogueState = gameState.dialogue ? {
      completedStoryEvents: gameState.dialogue.completedStoryEvents || [],
      hasVisitedLibrary: gameState.dialogue.hasVisitedLibrary || false,
    } : undefined;

    return JSON.stringify({
      books: gameState.books,
      discoveredBooks: Array.from(gameState.discoveredBooks || []),
      completedPuzzles: gameState.completedPuzzles,
      currentBook: gameState.currentBook,
      currentStoryPart: gameState.currentStoryPart,
      gameMode: gameState.gameMode,
      selectedGenre: gameState.selectedGenre,
      completedPuzzlesByGenre: gameState.completedPuzzlesByGenre
        ? Object.fromEntries(
            Object.entries(gameState.completedPuzzlesByGenre).map(([k, v]) => [k, Array.from(v)])
          )
        : {},
      storyProgress: gameState.storyProgress,
      dialogue: dialogueState,
      narrativeOrchestration: gameState.narrativeOrchestration,
    });
  }, []);

  // Load saved progress on mount (async)
  useEffect(() => {
    async function loadSavedProgress() {
      try {
        cleanupLegacyKeys();
        const result = await loadProgress();

        if (result.data) {
          console.log('[useGameState] Loaded data from storage:', result.data);
          const initialState = initializeGameState();
          const restoredState = restoreGameState(initialState, result.data as Partial<GameState>);

          // Calculate hash of the loaded data BEFORE putting it in state
          // This ensures lastSavedState reflects the loaded data, not empty state
          const loadedHash = calculateStateHash(restoredState);
          lastSavedState.current = loadedHash;
          console.log('[useGameState] Set baseline hash from loaded data, hash:', loadedHash.substring(0, 100));

          // Now update state with loaded data
          setState(restoredState);
          console.log('[useGameState] Called setState with restored state');

          // Audio settings removed - audio system has been removed
          // Audio settings will be handled when audio system is rebuilt
        } else {
          console.log('[useGameState] No saved data found, using fresh state');
        }
      } catch (error) {
        console.error('Failed to load game progress:', error);
        // Continue with fresh state
      }

      // Mark initialization complete and ready
      console.log('[useGameState] Marking initialization complete');
      hasCompletedInitialLoad.current = true;
      setIsReady(true);
    }

    loadSavedProgress();
  }, [calculateStateHash]);

  // Save progress whenever state changes (debounced, after initial load)
  useEffect(() => {
    console.log('[useGameState] Auto-save effect triggered, isReady:', isReady, 'hasCompletedInitialLoad:', hasCompletedInitialLoad.current);

    if (!isReady || isSaving.current || !hasCompletedInitialLoad.current) return;

    // Calculate hash of current state to detect actual changes
    const stateHash = calculateStateHash(state);
    const hashesMatch = stateHash === lastSavedState.current;

    console.log('[useGameState] Checking for changes...');
    console.log('  Current hash:', stateHash.substring(0, 100));
    console.log('  Baseline hash:', lastSavedState.current.substring(0, 100));
    console.log('  Hashes match:', hashesMatch);
    console.log('  completedPuzzles:', state.completedPuzzles);
    console.log('  debt:', state.narrativeOrchestration?.debt);

    // Skip if nothing meaningful changed
    if (hashesMatch) {
      console.log('[useGameState] No changes detected, skipping save');
      return;
    }

    console.log('[useGameState] Changes detected, saving in 100ms...');

    // Debounce saves
    const saveTimeout = setTimeout(async () => {
      console.log('[useGameState] Executing auto-save...');
      isSaving.current = true;
      try {
        await saveProgress(state);
        lastSavedState.current = stateHash;
        console.log('[useGameState] Auto-save completed');
      } catch (error) {
        console.error('[useGameState] Failed to save progress:', error);
      } finally {
        isSaving.current = false;
      }
    }, 100); // Small debounce to batch rapid changes

    return () => clearTimeout(saveTimeout);
  }, [state, isReady, calculateStateHash]);

  // Update state helper
  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Initialize game (can be called to reload)
  const initialize = useCallback(async () => {
    const newState = initializeGameState();

    try {
      const result = await loadProgress();

      if (result.data) {
        const restored = restoreGameState(newState, result.data as Partial<GameState>);
        setState(restored);
        // Audio settings removed - audio system has been removed
        // Audio settings will be handled when audio system is rebuilt
      } else {
        setState(newState);
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
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
