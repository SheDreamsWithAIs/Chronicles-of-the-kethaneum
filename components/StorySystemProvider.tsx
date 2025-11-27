'use client';

/**
 * Story System Provider
 *
 * Initializes and coordinates the story systems:
 * - StoryProgressionManager (advances storybeats)
 * - StoryBlurbManager (displays narrative moments)
 * - Integration between the two systems
 */

import { useEffect, ReactNode } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useStorySystemIntegration } from '@/hooks/story/useStorySystemIntegration';
import { useStoryNotification } from '@/contexts/StoryNotificationContext';
import { storyBlurbManager, storyProgressionManager } from '@/lib/story';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import { initializeAudioSystem } from '@/lib/audio/initializeAudio';

export function StorySystemProvider({ children }: { children: ReactNode }) {
  const { state } = useGameState();
  const { setNewStoryAvailable, setNewDialogueAvailable } = useStoryNotification();

  // Initialize all story systems on mount
  useEffect(() => {
    async function initializeSystems() {
      try {
        console.log('[StorySystem] Initializing all story systems...');

        // 1. Initialize audio system (playlists)
        await initializeAudioSystem();
        console.log('[StorySystem] ✅ Audio system initialized');

        // 2. Initialize dialogue manager (characters)
        await dialogueManager.initialize();
        console.log('[StorySystem] ✅ Dialogue manager initialized');

        // 3. Initialize story blurb manager (narrative moments)
        await storyBlurbManager.loadBlurbs();
        console.log('[StorySystem] ✅ Story blurb manager initialized');

        // 4. Initialize story progression manager (beat advancement)
        await storyProgressionManager.initialize();
        console.log('[StorySystem] ✅ Story progression manager initialized');

        console.log('[StorySystem] 🎉 All story systems ready!');
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
      console.log(`[StorySystem] 🎭 New story moment unlocked: ${blurbId} (trigger: ${trigger})`);
      // Set flag to show glow/pulse on Book of Passage buttons
      setNewStoryAvailable();
    },
  });

  // Listen for story event dialogue that should trigger library notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStoryEventAvailable = (event: CustomEvent) => {
      console.log(`[StorySystem] 📚 New story event dialogue available:`, event.detail);
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

  return <>{children}</>;
}
