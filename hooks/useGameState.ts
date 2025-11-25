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
  getSaveSystemInfo,
} from '@/lib/save/unifiedSaveSystem';
// Keep legacy import as fallback
import { loadGameProgress as loadLegacyProgress } from '@/lib/save/saveSystem';

export function useGameState() {
  const [state, setState] = useState<GameState>(() => initializeGameState());
  const [isReady, setIsReady] = useState(false);
  const [migrationInfo, setMigrationInfo] = useState<{
    wasMigrated: boolean;
    version: number;
  } | null>(null);

  // Track if we're currently saving to prevent save loops
  const isSaving = useRef(false);
  // Track the last saved state to avoid unnecessary saves
  const lastSavedState = useRef<string>('');

  // Load saved progress on mount (async)
  useEffect(() => {
    async function loadSavedProgress() {
      try {
        const result = await loadProgress();

        if (result.success && result.data) {
          // Store migration info for debugging/display
          setMigrationInfo({
            wasMigrated: result.wasMigrated,
            version: result.version,
          });

          if (result.wasMigrated) {
            console.log('Save data migrated to optimized format (v2)');
            const info = getSaveSystemInfo();
            console.log(`Storage size: ${info.storageSize.formatted}`);
          }

          setState(prevState => restoreGameState(prevState, result.data as Partial<GameState>));
        } else if (!result.success) {
          // If unified load failed, try legacy as last resort
          console.warn('Unified load failed, trying legacy...', result.error);
          const legacyData = loadLegacyProgress();
          if (legacyData) {
            // Convert completedPuzzlesByGenre from arrays to Sets if present
            const completedPuzzlesByGenre = legacyData.completedPuzzlesByGenre
              ? Object.fromEntries(
                  Object.entries(legacyData.completedPuzzlesByGenre).map(([genre, titles]) => [
                    genre,
                    new Set(titles),
                  ])
                )
              : undefined;

            const progressState: Partial<GameState> = {
              ...legacyData,
              discoveredBooks: new Set(legacyData.discoveredBooks),
              gameMode: (legacyData.gameMode as GameState['gameMode']) || 'story',
              completedPuzzlesByGenre,
            };
            setState(prevState => restoreGameState(prevState, progressState));
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
    });

    // Skip if nothing meaningful changed
    if (stateHash === lastSavedState.current) return;

    // Debounce saves
    const saveTimeout = setTimeout(async () => {
      isSaving.current = true;
      try {
        await saveProgress(state);
        lastSavedState.current = stateHash;
      } catch (error) {
        console.error('Failed to save progress:', error);
      } finally {
        isSaving.current = false;
      }
    }, 100); // Small debounce to batch rapid changes

    return () => clearTimeout(saveTimeout);
  }, [state, isReady]);

  // Update state helper
  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Initialize game (can be called to reload)
  const initialize = useCallback(async () => {
    const newState = initializeGameState();

    try {
      const result = await loadProgress();

      if (result.success && result.data) {
        const restored = restoreGameState(newState, result.data as Partial<GameState>);
        setState(restored);
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
    // Expose migration info for debugging/UI
    migrationInfo,
  };
}
