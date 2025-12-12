/**
 * React hook for managing mode-specific puzzle loading logic
 * Separates loading orchestration from the main puzzle component
 */

import { useCallback } from 'react';
import type { GameState } from '@/lib/game/state';
import { startBeatTheClockRun } from '@/lib/game/logic';

interface UsePuzzleLoadingProps {
  state: GameState;
  setState: (state: GameState | ((prevState: GameState) => GameState)) => void;
  isReady: boolean;
  loadAll: () => Promise<{ [genre: string]: any[] }>;
  loadBeatTheClock: () => Promise<boolean>;
  loadRandom: () => boolean;
  restorePuzzleOnly: (genre: string, puzzleIndex: number) => boolean;
  loadSequential: (genre: string | null, book: string | null, allowReplay?: boolean) => { success: boolean; genreComplete?: boolean };
  loadWithSelection: () => { success: boolean; isKethaneum?: boolean; message?: string };
  initialize: (puzzleData: any) => boolean;
  setPuzzleStartTime: (time: number) => void;
  router: { push: (path: string) => void };
}

export function usePuzzleLoading({
  state,
  setState,
  isReady,
  loadAll,
  loadBeatTheClock,
  loadRandom,
  restorePuzzleOnly,
  loadSequential,
  loadWithSelection,
  initialize,
  setPuzzleStartTime,
  router,
}: UsePuzzleLoadingProps) {
  
  const loadPuzzleForMode = useCallback(async (): Promise<{ genreComplete?: boolean } | void> => {
    // Don't try to load until state restoration is complete
    if (!isReady) return;

    if (state.grid && state.grid.length > 0) return; // Already loaded

    // Wait a moment to ensure state restoration from localStorage has completed
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Preserve current genre/book before any operations that might clear them
    const savedGenre = state.currentGenre;
    const savedBook = state.currentBook;
    const savedPuzzleIndex = state.currentPuzzleIndex;
    const savedStoryPart = state.currentStoryPart;
    
    // Ensure puzzles are loaded first
    if (!state.puzzles || Object.keys(state.puzzles).length === 0) {
      await loadAll();
      // Wait for state to update after loadAll
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Use saved values as fallback if state was cleared during loadAll
    // Check state first, then fall back to saved values
    const genreToLoad = (state.currentGenre && state.currentGenre.trim() !== '') 
      ? state.currentGenre 
      : (savedGenre && savedGenre.trim() !== '' ? savedGenre : null);
    const bookToLoad = (state.currentBook && state.currentBook.trim() !== '') 
      ? state.currentBook 
      : (savedBook && savedBook.trim() !== '' ? savedBook : null);
    const puzzleIndex = (state.currentPuzzleIndex !== undefined && state.currentPuzzleIndex >= 0) 
      ? state.currentPuzzleIndex 
      : (savedPuzzleIndex !== undefined && savedPuzzleIndex >= 0 ? savedPuzzleIndex : undefined);
    
    // Handle different game modes
    if (state.gameMode === 'beat-the-clock') {
      // Beat the Clock: Load random puzzle from beatTheClockPuzzles.json
      let stateToUse = state;
      if (!state.runStartTime) {
        // Initialize run timer on first puzzle
        // Create updated state with runStartTime
        stateToUse = startBeatTheClockRun(state);
        // Update state - this will trigger useEffect to update stateRef in usePuzzle
        setState(stateToUse);
        // Wait a tick to ensure stateRef is updated in usePuzzle hook
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      const success = await loadBeatTheClock();
      if (!success) {
        console.warn('Failed to load Beat the Clock puzzle');
      } else {
        setPuzzleStartTime(Date.now());
      }
    } else if (state.gameMode === 'puzzle-only') {
      // Puzzle Only: Restore current puzzle on refresh, or load random puzzle
      if (!state.puzzles || Object.keys(state.puzzles).length === 0) {
        await loadAll();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Check if we have a saved puzzle to restore (on refresh)
      if (genreToLoad && puzzleIndex !== undefined && puzzleIndex >= 0 && 
          state.puzzles && state.puzzles[genreToLoad] && 
          state.puzzles[genreToLoad][puzzleIndex]) {
        // Restore the exact puzzle we were on
        const success = restorePuzzleOnly(genreToLoad, puzzleIndex);
        if (success) {
          setPuzzleStartTime(Date.now());
          return;
        }
      }
      
      // No saved puzzle or restore failed - load a new random puzzle
      const success = loadRandom();
      if (success) {
        setPuzzleStartTime(Date.now());
      }
    } else {
      // Story Mode: Use new puzzle selection system with Kethaneum weaving

      // Determine if we should restore the same puzzle
      // Restore if:
      // 1. We have a valid currentGenre/puzzleIndex (saved state)
      // 2. selectedGenre matches currentGenre (same genre)
      // 3. The puzzle at that index is NOT completed (incomplete puzzle - user wants to continue)
      const shouldRestore = genreToLoad &&
                            puzzleIndex !== undefined &&
                            puzzleIndex >= 0 &&
                            state.selectedGenre === genreToLoad &&
                            state.puzzles &&
                            state.puzzles[genreToLoad] &&
                            state.puzzles[genreToLoad][puzzleIndex];

      if (shouldRestore) {
        const puzzleToRestore = state.puzzles[genreToLoad][puzzleIndex];
        const completedSet = state.completedPuzzlesByGenre?.[genreToLoad];
        const isCompleted = completedSet && completedSet.has(puzzleToRestore.title);

        // Only restore if puzzle is NOT completed (user wants to continue same puzzle)
        if (!isCompleted) {
          // Verify it matches the saved book and story part
          if ((!bookToLoad || puzzleToRestore.book === bookToLoad) &&
              (state.currentStoryPart === undefined || puzzleToRestore.storyPart === state.currentStoryPart)) {
            setState(prevState => ({
              ...prevState,
              currentGenre: genreToLoad,
              currentPuzzleIndex: puzzleIndex,
              currentBook: puzzleToRestore.book,
              currentStoryPart: puzzleToRestore.storyPart !== undefined ? puzzleToRestore.storyPart : 0
            }));

            await new Promise(resolve => setTimeout(resolve, 0));

            const success = initialize(puzzleToRestore);
            if (success) {
              return;
            }
          }
        }
      }

      // Load new puzzle using the selection system
      // Check if we have a selected genre
      if (!state.selectedGenre || state.selectedGenre.trim() === '') {
        console.warn('No genre selected, redirecting to library');
        router.push('/library');
        return;
      }

      if (!state.puzzles || !state.puzzles[state.selectedGenre]) {
        console.warn(`Selected genre "${state.selectedGenre}" not found in puzzles. Available:`, Object.keys(state.puzzles || {}));
        router.push('/library');
        return;
      }

      // Use the new selection system
      const result = loadWithSelection();

      if (!result.success) {
        console.warn('Failed to load puzzle:', result.message);
        if (result.message && result.message.includes('No genre selected')) {
          router.push('/library');
        }
      } else {
        // Show a notification if genre is exhausted
        if (result.message) {
          // Check if genre is exhausted and signal to caller
          if (result.message.includes('completed all puzzles')) {
            return { genreComplete: true };
          }
        }
      }
    }
  }, [
    isReady,
    state,
    setState,
    loadAll,
    loadBeatTheClock,
    loadRandom,
    restorePuzzleOnly,
    loadSequential,
    loadWithSelection,
    initialize,
    setPuzzleStartTime,
    router,
  ]);

  return {
    loadPuzzleForMode,
  };
}
