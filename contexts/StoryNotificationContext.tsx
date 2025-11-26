/**
 * Story Notification Context
 *
 * Manages the "new story available" state to show visual indicators
 * when a new story blurb has been unlocked.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface StoryNotificationContextType {
  /** Whether a new story moment is available to read */
  hasNewStory: boolean;

  /** Set that a new story moment is available */
  setNewStoryAvailable: () => void;

  /** Clear the new story notification (called when Book of Passage is visited) */
  clearNewStory: () => void;
}

const StoryNotificationContext = createContext<StoryNotificationContextType | undefined>(undefined);

export function StoryNotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewStory, setHasNewStory] = useState(false);

  const setNewStoryAvailable = useCallback(() => {
    setHasNewStory(true);
    console.log('[StoryNotification] New story moment available!');
  }, []);

  const clearNewStory = useCallback(() => {
    setHasNewStory(false);
    console.log('[StoryNotification] Story notification cleared');
  }, []);

  return (
    <StoryNotificationContext.Provider
      value={{
        hasNewStory,
        setNewStoryAvailable,
        clearNewStory,
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
