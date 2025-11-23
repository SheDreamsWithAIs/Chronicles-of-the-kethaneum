/**
 * useStoryProgress Hook
 *
 * React hook for managing story progression in the Book of Passage.
 * Handles loading blurbs, checking triggers, and providing story history.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  storyProgressManager,
  StoryBlurb,
  StoryProgressState,
  DEFAULT_STORY_PROGRESS,
  StoryBeat,
} from '@/lib/story';
import { GameState } from '@/lib/game/state';

export interface UseStoryProgressOptions {
  /** Whether to auto-check triggers when state changes */
  autoCheckTriggers?: boolean;
}

export interface UseStoryProgressResult {
  /** Whether story data is loaded and ready */
  isReady: boolean;

  /** Current journey blurb to display */
  currentBlurb: StoryBlurb | null;

  /** All unlocked blurbs in order (story history) */
  storyHistory: StoryBlurb[];

  /** Whether there's any story history to show */
  hasHistory: boolean;

  /** Current story beat */
  currentStoryBeat: StoryBeat;

  /** Manually check for trigger conditions */
  checkTriggers: (state: GameState, previousState?: GameState) => StoryProgressState | null;

  /** Manually unlock a specific blurb by ID */
  unlockBlurb: (blurbId: string, currentProgress: StoryProgressState) => StoryProgressState;

  /** Advance to a new story beat */
  advanceStoryBeat: (currentProgress: StoryProgressState, newBeat: StoryBeat) => StoryProgressState;

  /** Initialize fresh story progress */
  initializeProgress: () => StoryProgressState;

  /** Get a blurb by ID */
  getBlurbById: (id: string) => StoryBlurb | null;
}

/**
 * Hook for managing story progression
 */
export function useStoryProgress(
  storyProgress: StoryProgressState | undefined,
  options: UseStoryProgressOptions = {}
): UseStoryProgressResult {
  const [isReady, setIsReady] = useState(false);
  const loadingRef = useRef(false);

  // Use provided progress or default
  const progress = storyProgress || DEFAULT_STORY_PROGRESS;

  // Load story blurbs on mount
  useEffect(() => {
    if (loadingRef.current || storyProgressManager.isLoaded()) {
      setIsReady(true);
      return;
    }

    loadingRef.current = true;

    storyProgressManager
      .loadBlurbs()
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        console.error('[useStoryProgress] Failed to load blurbs:', error);
        setIsReady(true); // Still mark ready to prevent blocking
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, []);

  // Memoize current blurb
  const currentBlurb = useMemo(() => {
    if (!isReady) return null;
    return storyProgressManager.getCurrentBlurb(progress);
  }, [isReady, progress]);

  // Memoize story history
  const storyHistory = useMemo(() => {
    if (!isReady) return [];
    return storyProgressManager.getStoryHistory(progress);
  }, [isReady, progress]);

  // Check if there's any history
  const hasHistory = useMemo(() => {
    return storyProgressManager.hasStoryHistory(progress);
  }, [progress]);

  // Check triggers and return updated progress if a trigger fired
  const checkTriggers = useCallback(
    (state: GameState, previousState?: GameState): StoryProgressState | null => {
      if (!isReady) return null;

      const result = storyProgressManager.checkTriggerConditions(state, previousState);

      if (result.shouldTrigger && result.blurb) {
        const currentProgress = state.storyProgress || DEFAULT_STORY_PROGRESS;
        return storyProgressManager.unlockBlurb(result.blurb.id, currentProgress);
      }

      return null;
    },
    [isReady]
  );

  // Unlock a specific blurb
  const unlockBlurb = useCallback(
    (blurbId: string, currentProgress: StoryProgressState): StoryProgressState => {
      return storyProgressManager.unlockBlurb(blurbId, currentProgress);
    },
    []
  );

  // Advance story beat
  const advanceStoryBeat = useCallback(
    (currentProgress: StoryProgressState, newBeat: StoryBeat): StoryProgressState => {
      return storyProgressManager.advanceStoryBeat(currentProgress, newBeat);
    },
    []
  );

  // Initialize progress
  const initializeProgress = useCallback((): StoryProgressState => {
    return storyProgressManager.initializeProgress();
  }, []);

  // Get blurb by ID
  const getBlurbById = useCallback(
    (id: string): StoryBlurb | null => {
      if (!isReady) return null;
      return storyProgressManager.getBlurbById(id);
    },
    [isReady]
  );

  return {
    isReady,
    currentBlurb,
    storyHistory,
    hasHistory,
    currentStoryBeat: progress.currentStoryBeat,
    checkTriggers,
    unlockBlurb,
    advanceStoryBeat,
    initializeProgress,
    getBlurbById,
  };
}

/**
 * Hook for initializing story progress on game start
 * Call this when starting a new game to set up initial blurb
 */
export function useInitializeStoryProgress(): {
  initializeWithFirstBlurb: (currentProgress: StoryProgressState) => StoryProgressState;
} {
  const initializeWithFirstBlurb = useCallback(
    (currentProgress: StoryProgressState): StoryProgressState => {
      // If already initialized, return as-is
      if (currentProgress.unlockedBlurbs.length > 0) {
        return currentProgress;
      }

      // Trigger game_start to unlock first blurb
      const blurb = storyProgressManager.getBlurbForTrigger(
        'game_start',
        currentProgress.currentStoryBeat,
        currentProgress.firedTriggers
      );

      if (blurb) {
        return storyProgressManager.unlockBlurb(blurb.id, currentProgress);
      }

      return currentProgress;
    },
    []
  );

  return { initializeWithFirstBlurb };
}
