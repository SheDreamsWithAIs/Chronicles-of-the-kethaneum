'use client';

/**
 * Story System Provider
 *
 * Initializes and coordinates the story systems:
 * - StoryProgressionManager (advances storybeats)
 * - StoryBlurbManager (displays narrative moments)
 * - Integration between the two systems
 */

import { useEffect, ReactNode, useRef } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useStorySystemIntegration } from '@/hooks/story/useStorySystemIntegration';
import { useStoryNotification } from '@/contexts/StoryNotificationContext';
import { storyBlurbManager, storyProgressionManager } from '@/lib/story';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';

export function StorySystemProvider({ children }: { children: ReactNode }) {
  const { state } = useGameState();
  const { setNewStoryAvailable, setNewDialogueAvailable } = useStoryNotification();
  const lastUnlockedBlurbCountRef = useRef(0);
  const lastAvailableEventCountRef = useRef(0);

  // Initialize all story systems on mount
  useEffect(() => {
    async function initializeSystems() {
      try {
        // 1. Initialize dialogue manager (characters)
        await dialogueManager.initialize();

        // 2. Initialize story blurb manager (narrative moments)
        await storyBlurbManager.loadBlurbs();

        // 3. Initialize story progression manager (beat advancement)
        await storyProgressionManager.initialize();
      } catch (error) {
        console.error('[StorySystem] Failed to initialize story systems:', error);
      }
    }

    initializeSystems();
  }, []);

  // Coordinate both story systems
  useStorySystemIntegration({
    state,
    onBlurbTriggered: (blurbId, trigger) => {
      // Set flag to show glow/pulse on Book of Passage buttons
      setNewStoryAvailable();
    },
  });

  // Listen for story event dialogue that should trigger library notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStoryEventAvailable = (event: CustomEvent) => {
      // Set flag to show glow/pulse on Library buttons
      setNewDialogueAvailable();
    };

    // Listen for story event availability from DialogueManager
    // This fires when checkForAvailableStoryEvent() finds a matching event
    document.addEventListener('dialogueManager:storyEventAvailable', handleStoryEventAvailable as EventListener);

    return () => {
      document.removeEventListener('dialogueManager:storyEventAvailable', handleStoryEventAvailable as EventListener);
    };
  }, [setNewDialogueAvailable]);

  // Sync notifications from current state (set-only; no clearing)
  useEffect(() => {
    const unlockedBlurbs = state.storyProgress?.unlockedBlurbs || [];
    const unlockedBlurbCount = unlockedBlurbs.length;
    if (unlockedBlurbCount > lastUnlockedBlurbCountRef.current) {
      setNewStoryAvailable();
    }
    lastUnlockedBlurbCountRef.current = unlockedBlurbCount;

    const unlockedEvents = state.narrativeOrchestration?.unlockedStoryEvents || [];
    const completedEvents = state.dialogue?.completedStoryEvents || [];
    const availableEventCount = unlockedEvents.filter(eventId => !completedEvents.includes(eventId)).length;
    if (availableEventCount > lastAvailableEventCountRef.current) {
      setNewDialogueAvailable();
    }
    lastAvailableEventCountRef.current = availableEventCount;
  }, [
    state.storyProgress?.unlockedBlurbs,
    state.narrativeOrchestration?.unlockedStoryEvents,
    state.dialogue?.completedStoryEvents,
    setNewStoryAvailable,
    setNewDialogueAvailable,
  ]);

  return <>{children}</>;
}
