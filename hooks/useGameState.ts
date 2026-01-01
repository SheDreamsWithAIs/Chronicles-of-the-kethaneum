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
import { debugLog } from '@/lib/debugLogger';

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
      debugLog.log('=== LOAD EFFECT START ===');
      try {
        cleanupLegacyKeys();
        const result = await loadProgress();

        if (result.data) {
          debugLog.log('Loaded data from storage', result.data);
          const initialState = initializeGameState();
          const restoredState = restoreGameState(initialState, result.data as Partial<GameState>);

          debugLog.log('Restored state details', {
            completedPuzzles: restoredState.completedPuzzles,
            debt: restoredState.narrativeOrchestration?.debt,
            unlockedEvents: restoredState.narrativeOrchestration?.unlockedStoryEvents,
            completedEvents: restoredState.dialogue?.completedStoryEvents,
          });

          // Calculate hash of the loaded data BEFORE putting it in state
          // This ensures lastSavedState reflects the loaded data, not empty state
          const loadedHash = calculateStateHash(restoredState);
          lastSavedState.current = loadedHash;
          debugLog.log('Set baseline hash from loaded data', {
            hashPreview: loadedHash.substring(0, 100),
            hashLength: loadedHash.length,
          });

          // Now update state with loaded data
          setState(restoredState);
          debugLog.log('Called setState with restored state');

          // Audio settings removed - audio system has been removed
          // Audio settings will be handled when audio system is rebuilt
        } else {
          debugLog.log('No saved data found, using fresh state');
        }
      } catch (error) {
        debugLog.log('Failed to load game progress', { error: String(error) });
        console.error('Failed to load game progress:', error);
        // Continue with fresh state
      }

      // Mark initialization complete and ready
      debugLog.log('Marking initialization complete');
      hasCompletedInitialLoad.current = true;
      setIsReady(true);
      debugLog.log('=== LOAD EFFECT END ===');
    }

    loadSavedProgress();
  }, [calculateStateHash]);

  // Save progress whenever state changes (debounced, after initial load)
  useEffect(() => {
    debugLog.log('--- AUTO-SAVE EFFECT TRIGGERED ---', {
      isReady,
      isSaving: isSaving.current,
      hasCompletedInitialLoad: hasCompletedInitialLoad.current,
    });

    if (!isReady || isSaving.current || !hasCompletedInitialLoad.current) {
      debugLog.log('Auto-save skipped (not ready)');
      return;
    }

    // Calculate hash of current state to detect actual changes
    const stateHash = calculateStateHash(state);
    const hashesMatch = stateHash === lastSavedState.current;

    debugLog.log('Checking for changes', {
      currentHashPreview: stateHash.substring(0, 100),
      baselineHashPreview: lastSavedState.current.substring(0, 100),
      hashesMatch,
      currentState: {
        completedPuzzles: state.completedPuzzles,
        debt: state.narrativeOrchestration?.debt,
        unlockedEvents: state.narrativeOrchestration?.unlockedStoryEvents,
        completedEvents: state.dialogue?.completedStoryEvents,
      }
    });

    // Skip if nothing meaningful changed
    if (hashesMatch) {
      debugLog.log('No changes detected, skipping save');
      return;
    }

    debugLog.log('Changes detected! Scheduling save in 100ms...');

    // Debounce saves
    const saveTimeout = setTimeout(async () => {
      debugLog.log('Executing auto-save NOW');
      isSaving.current = true;
      try {
        await saveProgress(state);
        lastSavedState.current = stateHash;
        debugLog.log('Auto-save completed successfully');
      } catch (error) {
        debugLog.log('Auto-save FAILED', { error: String(error) });
        console.error('[useGameState] Failed to save progress:', error);
      } finally {
        isSaving.current = false;
      }
    }, 100); // Small debounce to batch rapid changes

    return () => {
      clearTimeout(saveTimeout);
      debugLog.log('Auto-save timeout cleared (effect cleanup)');
    };
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
