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
import { audioManager } from '@/lib/audio/audioManager';

export function useGameState() {
  const [state, setState] = useState<GameState>(() => initializeGameState());
  const [isReady, setIsReady] = useState(false);
  // Track if we're currently saving to prevent save loops
  const isSaving = useRef(false);
  // Track the last saved state to avoid unnecessary saves
  const lastSavedState = useRef<string>('');

  // Load saved progress on mount (async)
  useEffect(() => {
    async function loadSavedProgress() {
      try {
        cleanupLegacyKeys();
        const result = await loadProgress();

        if (result.data) {
          setState(prevState => restoreGameState(prevState, result.data as Partial<GameState>));
          
          // Apply audio settings if loaded
          if (result.audioSettings) {
            audioManager.updateSettings(result.audioSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load game progress:', error);
        // Continue with fresh state
      }

      setIsReady(true);
    }

    loadSavedProgress();
  }, []);

  // Save progress whenever state changes (debounced, after initial load)
  useEffect(() => {
    if (!isReady || isSaving.current) return;

    // Create a simple hash of the state to detect actual changes
    const dialogueState = state.dialogue ? {
      completedStoryEvents: state.dialogue.completedStoryEvents || [],
      hasVisitedLibrary: state.dialogue.hasVisitedLibrary || false,
    } : undefined;

    const stateHash = JSON.stringify({
      books: state.books,
      discoveredBooks: Array.from(state.discoveredBooks || []),
      completedPuzzles: state.completedPuzzles,
      currentBook: state.currentBook,
      currentStoryPart: state.currentStoryPart,
      gameMode: state.gameMode,
      selectedGenre: state.selectedGenre,
      completedPuzzlesByGenre: state.completedPuzzlesByGenre
        ? Object.fromEntries(
            Object.entries(state.completedPuzzlesByGenre).map(([k, v]) => [k, Array.from(v)])
          )
        : {},
      // Include story progress in save detection
      storyProgress: state.storyProgress,
      // Include dialogue state (completed story events) in save detection
      dialogue: dialogueState,
    });

    // Skip if nothing meaningful changed
    if (stateHash === lastSavedState.current) {
      return;
    }

    // Debounce saves
    const saveTimeout = setTimeout(async () => {
      isSaving.current = true;
      try {
        await saveProgress(state);
        lastSavedState.current = stateHash;
      } catch (error) {
        console.error('[useGameState] Failed to save progress:', error);
      } finally {
        isSaving.current = false;
      }
    }, 100); // Small debounce to batch rapid changes

    return () => clearTimeout(saveTimeout);
  }, [state, isReady, state.dialogue?.completedStoryEvents, state.dialogue?.hasVisitedLibrary]);

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
        if (result.audioSettings) {
          audioManager.updateSettings(result.audioSettings);
        }
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
