/**
 * React hook for dialogue system integration
 * Provides easy access to dialogue functionality in React components
 */

import { useState, useCallback } from 'react';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import type { BanterResult, StoryBeat, DialogueManagerStatus } from '@/lib/dialogue/types';

interface UseDialogueReturn {
  isInitialized: boolean;
  isLoading: boolean;
  currentDialogue: BanterResult | null;
  error: string | null;
  status: DialogueManagerStatus | null;
  initialize: () => Promise<boolean>;
  getRandomBanter: (storyBeat?: StoryBeat) => BanterResult | null;
  setStoryBeat: (beat: StoryBeat) => boolean;
  clearCurrentDialogue: () => void;
}

/**
 * Hook for managing dialogue system
 */
export function useDialogue(): UseDialogueReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDialogue, setCurrentDialogue] = useState<BanterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DialogueManagerStatus | null>(null);

  /**
   * Initialize the dialogue manager
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await dialogueManager.initialize();
      setIsInitialized(success);

      if (success) {
        setStatus(dialogueManager.getStatus());
      } else {
        setError('Failed to initialize dialogue system');
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
   * Get random banter dialogue
   */
  const getRandomBanter = useCallback((storyBeat?: StoryBeat): BanterResult | null => {
    if (!isInitialized) {
      setError('Dialogue manager not initialized');
      return null;
    }

    try {
      const result = dialogueManager.getRandomBanter(storyBeat || null);
      setCurrentDialogue(result);
      setStatus(dialogueManager.getStatus());

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    }
  }, [isInitialized]);

  /**
   * Set current story beat
   */
  const setStoryBeat = useCallback((beat: StoryBeat): boolean => {
    if (!isInitialized) {
      setError('Dialogue manager not initialized');
      return false;
    }

    try {
      const success = dialogueManager.setStoryBeat(beat);
      setStatus(dialogueManager.getStatus());

      if (!success) {
        setError(`Failed to set story beat: ${beat}`);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  }, [isInitialized]);

  /**
   * Clear current dialogue
   */
  const clearCurrentDialogue = useCallback(() => {
    setCurrentDialogue(null);
    setError(null);
  }, []);

  return {
    isInitialized,
    isLoading,
    currentDialogue,
    error,
    status,
    initialize,
    getRandomBanter,
    setStoryBeat,
    clearCurrentDialogue,
  };
}
