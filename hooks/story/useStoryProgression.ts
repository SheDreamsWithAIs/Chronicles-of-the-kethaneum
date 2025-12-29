/**
 * React hook for Story Progression System integration
 * Provides easy access to story progression functionality in React components
 */

import { useState, useCallback, useEffect } from 'react';
import { storyProgressionManager } from '@/lib/story/StoryProgressionManager';
import type { StoryBeat } from '@/lib/dialogue/types';
import type { StoryProgressionStatus, ProgressionMetrics } from '@/lib/story/types';

interface UseStoryProgressionReturn {
  isInitialized: boolean;
  isLoading: boolean;
  currentBeat: StoryBeat;
  status: StoryProgressionStatus | null;
  error: string | null;
  initialize: () => Promise<boolean>;
  checkAndAdvanceStory: (metrics: ProgressionMetrics) => void;
  setStorybeat: (beat: StoryBeat) => boolean;
  setAutoProgression: (enabled: boolean) => void;
}

/**
 * Hook for managing story progression system
 */
export function useStoryProgression(): UseStoryProgressionReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<StoryBeat>('hook');
  const [status, setStatus] = useState<StoryProgressionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize the story progression manager
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await storyProgressionManager.initialize();
      setIsInitialized(success);

      if (success) {
        const newStatus = storyProgressionManager.getStatus();
        setStatus(newStatus);
        setCurrentBeat(newStatus.currentBeat);
      } else {
        setError('Failed to initialize story progression system');
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check game state and potentially advance story
   */
  const checkAndAdvanceStory = useCallback((metrics: ProgressionMetrics): void => {
    if (!isInitialized) {
      console.warn('Story progression manager not initialized');
      return;
    }

    try {
      const result = storyProgressionManager.checkAndAdvanceStory(metrics);

      if (result.shouldAdvance) {
        const newStatus = storyProgressionManager.getStatus();
        setStatus(newStatus);
        setCurrentBeat(newStatus.currentBeat);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [isInitialized]);

  /**
   * Manually set storybeat
   */
  const setStorybeat = useCallback((beat: StoryBeat): boolean => {
    if (!isInitialized) {
      setError('Story progression manager not initialized');
      return false;
    }

    try {
      const success = storyProgressionManager.setStorybeat(beat);

      if (success) {
        const newStatus = storyProgressionManager.getStatus();
        setStatus(newStatus);
        setCurrentBeat(newStatus.currentBeat);
      } else {
        setError(`Failed to set storybeat: ${beat}`);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  }, [isInitialized]);

  /**
   * Enable or disable auto-progression
   */
  const setAutoProgressionCallback = useCallback((enabled: boolean): void => {
    if (!isInitialized) {
      setError('Story progression manager not initialized');
      return;
    }

    try {
      storyProgressionManager.setAutoProgression(enabled);
      const newStatus = storyProgressionManager.getStatus();
      setStatus(newStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [isInitialized]);

  /**
   * Listen for story progression events
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleProgressionChange = ((event: CustomEvent) => {
      const { newBeat } = event.detail;
      setCurrentBeat(newBeat);
      setStatus(storyProgressionManager.getStatus());
    }) as EventListener;

    const handleStoryEvent = ((event: CustomEvent) => {
    }) as EventListener;

    document.addEventListener('storyProgression:storyProgressionChanged', handleProgressionChange);
    document.addEventListener('storyProgression:storyEventTriggered', handleStoryEvent);

    return () => {
      document.removeEventListener(
        'storyProgression:storyProgressionChanged',
        handleProgressionChange
      );
      document.removeEventListener('storyProgression:storyEventTriggered', handleStoryEvent);
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    currentBeat,
    status,
    error,
    initialize,
    checkAndAdvanceStory,
    setStorybeat,
    setAutoProgression: setAutoProgressionCallback,
  };
}
