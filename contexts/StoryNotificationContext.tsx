'use client';

/**
 * Story Notification Context
 *
 * Manages notification state for story content and dialogue events,
 * showing visual indicators when new content is available.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface StoryNotificationContextType {
  /** Whether a new story moment is available to read */
  hasNewStory: boolean;

  /** Set that a new story moment is available */
  setNewStoryAvailable: () => void;

  /** Clear the new story notification (called when Book of Passage is visited) */
  clearNewStory: () => void;

  /** Whether a new dialogue event is waiting in the library */
  hasNewDialogue: boolean;

  /** Set that a new dialogue event is available */
  setNewDialogueAvailable: () => void;

  /** Clear the dialogue notification (called when Library is visited) */
  clearNewDialogue: () => void;
}

const StoryNotificationContext = createContext<StoryNotificationContextType | undefined>(undefined);

export function StoryNotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewStory, setHasNewStory] = useState(false);
  const [hasNewDialogue, setHasNewDialogue] = useState(false);

  const setNewStoryAvailable = useCallback(() => {
    setHasNewStory(true);
    console.log('[StoryNotification] New story moment available!');
  }, []);

  const clearNewStory = useCallback(() => {
    setHasNewStory(false);
    console.log('[StoryNotification] Story notification cleared');
  }, []);

  const setNewDialogueAvailable = useCallback(() => {
    setHasNewDialogue(true);
    console.log('[StoryNotification] New dialogue event available!');
  }, []);

  const clearNewDialogue = useCallback(() => {
    setHasNewDialogue(false);
    console.log('[StoryNotification] Dialogue notification cleared');
  }, []);

  return (
    <StoryNotificationContext.Provider
      value={{
        hasNewStory,
        setNewStoryAvailable,
        clearNewStory,
        hasNewDialogue,
        setNewDialogueAvailable,
        clearNewDialogue,
      }}
    >
      {children}
    </StoryNotificationContext.Provider>
  );
}

/**
 * Hook to access story notification state
 */
export function useStoryNotification() {
  const context = useContext(StoryNotificationContext);
  if (!context) {
    throw new Error('useStoryNotification must be used within StoryNotificationProvider');
  }
  return context;
}
