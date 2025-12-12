/**
 * Story System Integration Hook
 *
 * Coordinates the two story systems:
 * 1. StoryProgressionManager - Advances storybeats based on game metrics
 * 2. StoryBlurbManager - Displays narrative blurbs based on triggers
 *
 * This hook ensures that when storybeats advance, the blurb system
 * is notified so it can show appropriate narrative moments.
 */

import { useEffect, useCallback, useRef } from 'react';
import { storyBlurbManager } from '@/lib/story';
import type { GameState } from '@/lib/game/state';
import type { StoryBeat } from '@/lib/story/types';

interface UseStorySystemIntegrationOptions {
  /** Current game state */
  state: GameState;

  /** Callback when a new story blurb should be shown */
  onBlurbTriggered?: (blurbId: string, trigger: string) => void;

  /** Whether to enable automatic integration (default: true) */
  enabled?: boolean;
}

/**
 * Hook to integrate StoryProgressionManager with StoryBlurbManager
 */
export function useStorySystemIntegration({
  state,
  onBlurbTriggered,
  enabled = true,
}: UseStorySystemIntegrationOptions) {
  const stateRef = useRef(state);

  // Keep state ref up to date
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Handle storybeat advancement
   * When StoryProgressionManager advances a beat, check if any blurbs should trigger
   */
  const handleBeatAdvanced = useCallback((event: CustomEvent) => {
    if (!enabled) return;

    const { beat, trigger } = event.detail;
    const currentState = stateRef.current;
    const storyProgress = currentState.storyProgress;

    if (!storyProgress) {
      console.warn('[StorySystemIntegration] No story progress in game state');
      return;
    }

    // Check if this trigger should fire a blurb
    const blurb = storyBlurbManager.getBlurbForTrigger(
      trigger,
      beat,
      storyProgress.firedTriggers
    );

    if (blurb && onBlurbTriggered) {
      onBlurbTriggered(blurb.id, trigger);
    }
  }, [enabled, onBlurbTriggered]);

  /**
   * Handle general story progression changes
   * This fires for any beat change, not just specific triggers
   */
  const handleProgressionChanged = useCallback((event: CustomEvent) => {
    if (!enabled) return;

    const { previousBeat, newBeat } = event.detail;
    // Place for additional UI/state updates if needed when beats change
    void previousBeat;
    void newBeat;
  }, [enabled]);

  /**
   * Set up event listeners for story system coordination
   */
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    // Listen for beat trigger events from StoryProgressionManager
    document.addEventListener('storyProgression:beatTrigger', handleBeatAdvanced as EventListener);

    // Listen for general progression changes
    document.addEventListener('storyProgression:storyProgressionChanged', handleProgressionChanged as EventListener);

    return () => {
      document.removeEventListener('storyProgression:beatTrigger', handleBeatAdvanced as EventListener);
      document.removeEventListener('storyProgression:storyProgressionChanged', handleProgressionChanged as EventListener);
    };
  }, [enabled, handleBeatAdvanced, handleProgressionChanged]);

  // No return value needed - this is a coordination hook
  return null;
}
