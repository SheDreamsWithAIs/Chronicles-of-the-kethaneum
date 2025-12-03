/**
 * React hook for managing game mode-specific win/lose handlers
 * Separates mode-specific logic from the main puzzle component
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState, PuzzleData } from '@/lib/game/state';
import { recordPuzzleStats, incrementTotalWords } from '@/lib/game/stats';
import { storyBlurbManager } from '@/lib/story';
import { markPuzzleCompleted } from '@/lib/game/puzzleSelector';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import { StoryEventTriggerChecker } from '@/lib/dialogue/StoryEventTriggerChecker';

interface UseGameModeHandlersProps {
  state: GameState;
  setState: (state: GameState) => void;
  puzzleStartTime: number | null;
  loadBeatTheClock: () => Promise<boolean>;
  setPuzzleStartTime: (time: number) => void;
  setStatsModalIsWin: (isWin: boolean) => void;
  setShowStatsModal: (show: boolean) => void;
  markCompleted?: (puzzle: PuzzleData) => void; // Optional callback to mark puzzle as completed
}


export function useGameModeHandlers({
  state,
  setState,
  puzzleStartTime,
  loadBeatTheClock,
  setPuzzleStartTime,
  setStatsModalIsWin,
  setShowStatsModal,
  markCompleted,
}: UseGameModeHandlersProps) {
  // Use ref to track current state for callbacks
  const stateRef = useRef(state);
  const previousStateRef = useRef(state);

  useEffect(() => {
    previousStateRef.current = stateRef.current;
    stateRef.current = state;
  }, [state]);
  
  // Expose function to update stateRef synchronously (needed when state is updated synchronously)
  const updateStateRef = useCallback((newState: GameState) => {
    stateRef.current = newState;
  }, []);
  
  const handleWin = useCallback(() => {
    // Use stateRef.current instead of state prop to get the latest state
    // This is updated synchronously in checkWord before calling onWin
    const currentState = stateRef.current;
    // Get previous state for trigger checking
    const previousState = previousStateRef.current;

    const timeTaken = puzzleStartTime ? Math.floor((Date.now() - puzzleStartTime) / 1000) : 0;
    const wordsFound = currentState.wordList.filter((w: { found: boolean }) => w.found).length;
    const totalWords = currentState.wordList.length;

    // If runStartTime is null but we're in beat-the-clock mode, log warning
    if (currentState.gameMode === 'beat-the-clock' && !currentState.runStartTime) {
      console.warn('[useGameModeHandlers.handleWin] runStartTime is null in beat-the-clock mode - this should not happen. State:', currentState);
    }
    
    if (currentState.gameMode === 'puzzle-only') {
      // Update session stats
      const updatedStats = recordPuzzleStats(
        currentState.currentPuzzleIndex || 0,
        timeTaken,
        wordsFound,
        totalWords,
        currentState.sessionStats
      );
      
      // Increment total words found
      const finalStats = incrementTotalWords(updatedStats, wordsFound);
      
      setState({
        ...currentState,
        sessionStats: finalStats,
      });
      
      setStatsModalIsWin(true);
      setShowStatsModal(true);
    } else if (currentState.gameMode === 'beat-the-clock') {
      // Record stats and check if run should continue
      const updatedStats = recordPuzzleStats(
        currentState.currentPuzzleIndex || 0,
        timeTaken,
        wordsFound,
        totalWords,
        currentState.sessionStats
      );
      
      // Calculate run time remaining (not puzzle time)
      const runTimeElapsed = currentState.runStartTime
        ? Math.floor((Date.now() - currentState.runStartTime) / 1000)
        : 0;
      const runTimeRemaining = currentState.runDuration - runTimeElapsed;

      // Update stats first
      setState({
        ...currentState,
        sessionStats: updatedStats,
      });

      // Check if run time is still remaining
      // Note: gameOver won't be set for puzzle completion in beat-the-clock mode
      // It's only set when the run timer expires
      if (currentState.runStartTime && runTimeRemaining > 0) {
        // Load next puzzle immediately
        // Note: We need to set a flag to prevent timer restart during transition
        // This will be handled by the parent component's isTransitioningRef
        loadBeatTheClock().then(() => {
          setPuzzleStartTime(Date.now());
        });
      } else {
        // Run ended (time expired), show stats modal
        setStatsModalIsWin(true);
        setShowStatsModal(true);
      }
    } else {
      // Story Mode: Show win modal to let player choose when to continue
      try {
        // Start with current state
        let updatedState = currentState;

        // Mark the puzzle as completed for the new selection system
        if (currentState.currentGenre && currentState.puzzles[currentState.currentGenre]) {
          const currentPuzzle = currentState.puzzles[currentState.currentGenre][currentState.currentPuzzleIndex];

          if (currentPuzzle) {
            updatedState = markPuzzleCompleted(updatedState, currentPuzzle);
          }
        }

        // Check for story progress triggers
        // Pass previous state to detect transitions (e.g., 0 → 1 books discovered)
        if (storyBlurbManager.isLoaded()) {
          const triggerResult = storyBlurbManager.checkTriggerConditions(updatedState, previousState);

          if (triggerResult.shouldTrigger && triggerResult.blurb) {
            const updatedProgress = storyBlurbManager.unlockBlurb(
              triggerResult.blurb.id,
              updatedState.storyProgress
            );
            updatedState = {
              ...updatedState,
              storyProgress: updatedProgress,
            };
          }
        }

        // Check for story event dialogue triggers after puzzle completion
        // Centralized check based on game state (not location-specific)
        if (dialogueManager.getInitialized()) {
          const triggeredEventIds = StoryEventTriggerChecker.checkAvailableEvents(
            updatedState,
            previousState
          );
          
          // Trigger each available event
          for (const eventId of triggeredEventIds) {
            const currentBeat = updatedState.storyProgress?.currentStoryBeat;
            const eventData = dialogueManager.getStoryEvent(eventId);
            if (eventData?.storyEvent?.triggerCondition) {
              dialogueManager.checkForAvailableStoryEvent(
                eventData.storyEvent.triggerCondition,
                currentBeat
              );
            }
          }
        }

        // Apply all state updates in a single setState call
        if (updatedState !== currentState) {
          setState(updatedState);
        }
      } catch (error) {
        console.error('[useGameModeHandlers.handleWin] ERROR in Story Mode win handling:', error);
      }

      setStatsModalIsWin(true);
      setShowStatsModal(true);
    }
  }, [state, setState, puzzleStartTime, loadBeatTheClock, setPuzzleStartTime, setStatsModalIsWin, setShowStatsModal, markCompleted]);
  
  const handleLose = useCallback(() => {
    // Get current state - use the state prop directly to avoid stale ref issues
    stateRef.current = state;
    const currentState = state;
    
    if (currentState.gameMode === 'puzzle-only') {
      setStatsModalIsWin(false);
      setShowStatsModal(true);
    } else if (currentState.gameMode === 'beat-the-clock') {
      // Calculate run time remaining
      const runTimeElapsed = currentState.runStartTime 
        ? Math.floor((Date.now() - currentState.runStartTime) / 1000)
        : 0;
      const runTimeRemaining = currentState.runDuration - runTimeElapsed;
      
      // Check if run time is still remaining
      if (currentState.runStartTime && runTimeRemaining > 0) {
        // Puzzle timer ran out but run time remains - load next puzzle
        setTimeout(() => {
          loadBeatTheClock();
          setPuzzleStartTime(Date.now()); // Reset puzzle start time for next puzzle
        }, 0);
      } else {
        // Run ended (either puzzle timer or run timer expired), show lose modal
        setStatsModalIsWin(false);
        setShowStatsModal(true);
      }
    } else {
      // Story Mode: Handle lose (existing flow)
    }
  }, [state, loadBeatTheClock, setPuzzleStartTime, setStatsModalIsWin, setShowStatsModal]);
  
  // Handle run timer expiration for beat-the-clock mode
  const handleRunTimerExpired = useCallback(() => {
    // Get current state - use the state prop directly to avoid stale ref issues
    stateRef.current = state;
    const currentState = state;

    if (currentState.gameMode === 'beat-the-clock') {
      // Run timer expired - show win modal with final stats
      setStatsModalIsWin(true);
      setShowStatsModal(true);
    }
  }, [state, setStatsModalIsWin, setShowStatsModal]);

  return {
    handleWin,
    handleLose,
    handleRunTimerExpired,
    updateStateRef,
  };
}

