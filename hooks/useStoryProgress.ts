/**
 * useStoryProgress Hook
 *
 * React hook for managing story progression in the Book of Passage.
 * Handles loading blurbs, checking triggers, and providing story history.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  storyBlurbManager,
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
    if (loadingRef.current || storyBlurbManager.isLoaded()) {
      setIsReady(true);
      return;
    }

    loadingRef.current = true;

    storyBlurbManager
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
    return storyBlurbManager.getCurrentBlurb(progress);
  }, [isReady, progress]);

  // Memoize story history
  const storyHistory = useMemo(() => {
    if (!isReady) return [];
    return storyBlurbManager.getStoryHistory(progress);
  }, [isReady, progress]);

  // Check if there's any history
  const hasHistory = useMemo(() => {
    return storyBlurbManager.hasStoryHistory(progress);
  }, [progress]);

  // Check triggers and return updated progress if a trigger fired
  const checkTriggers = useCallback(
    (state: GameState, previousState?: GameState): StoryProgressState | null => {
      if (!isReady) return null;

      const result = storyBlurbManager.checkTriggerConditions(state, previousState);

      if (result.shouldTrigger && result.blurb) {
        const currentProgress = state.storyProgress || DEFAULT_STORY_PROGRESS;
        return storyBlurbManager.unlockBlurb(result.blurb.id, currentProgress);
      }

      return null;
    },
    [isReady]
  );

  // Unlock a specific blurb
  const unlockBlurb = useCallback(
    (blurbId: string, currentProgress: StoryProgressState): StoryProgressState => {
      return storyBlurbManager.unlockBlurb(blurbId, currentProgress);
    },
    []
  );

  // Advance story beat
  const advanceStoryBeat = useCallback(
    (currentProgress: StoryProgressState, newBeat: StoryBeat): StoryProgressState => {
      return storyBlurbManager.advanceStoryBeat(currentProgress, newBeat);
    },
    []
  );

  // Initialize progress
  const initializeProgress = useCallback((): StoryProgressState => {
    return storyBlurbManager.initializeProgress();
  }, []);

  // Get blurb by ID
  const getBlurbById = useCallback(
    (id: string): StoryBlurb | null => {
      if (!isReady) return null;
      return storyBlurbManager.getBlurbById(id);
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
      const blurb = storyBlurbManager.getBlurbForTrigger(
        'game_start',
        currentProgress.currentStoryBeat,
        currentProgress.firedTriggers
      );

      if (blurb) {
        return storyBlurbManager.unlockBlurb(blurb.id, currentProgress);
      }

      return currentProgress;
    },
    []
  );

  return { initializeWithFirstBlurb };
}
