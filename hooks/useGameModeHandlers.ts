/**
 * React hook for managing game mode-specific win/lose handlers
 * Separates mode-specific logic from the main puzzle component
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState } from '@/lib/game/state';
import { recordPuzzleStats, incrementTotalWords } from '@/lib/game/stats';

interface UseGameModeHandlersProps {
  state: GameState;
  setState: (state: GameState) => void;
  puzzleStartTime: number | null;
  loadBeatTheClock: () => Promise<boolean>;
  setPuzzleStartTime: (time: number) => void;
  setStatsModalIsWin: (isWin: boolean) => void;
  setShowStatsModal: (show: boolean) => void;
}

export function useGameModeHandlers({
  state,
  setState,
  puzzleStartTime,
  loadBeatTheClock,
  setPuzzleStartTime,
  setStatsModalIsWin,
  setShowStatsModal,
}: UseGameModeHandlersProps) {
  // Use ref to track current state for callbacks
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // Expose function to update stateRef synchronously (needed when state is updated synchronously)
  const updateStateRef = useCallback((newState: GameState) => {
    stateRef.current = newState;
  }, []);
  
  const handleWin = useCallback(() => {
    console.log('[useGameModeHandlers.handleWin] Win handler called');
    
    // Use stateRef.current instead of state prop to get the latest state
    // This is updated synchronously in checkWord before calling onWin
    const currentState = stateRef.current;
    
    const timeTaken = puzzleStartTime ? Math.floor((Date.now() - puzzleStartTime) / 1000) : 0;
    const wordsFound = currentState.wordList.filter((w: { found: boolean }) => w.found).length;
    const totalWords = currentState.wordList.length;
    
    console.log('[useGameModeHandlers.handleWin] Current state - gameMode:', currentState.gameMode, 'runStartTime:', currentState.runStartTime, 'runDuration:', currentState.runDuration, 'gameOver:', currentState.gameOver, 'timer:', currentState.timer ? 'exists' : 'null');
    
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
      
      console.log('[useGameModeHandlers.handleWin] Beat-the-clock - runTimeElapsed:', runTimeElapsed, 'runTimeRemaining:', runTimeRemaining, 'runStartTime:', currentState.runStartTime, 'runDuration:', currentState.runDuration);
      
      // Update stats first
      setState({
        ...currentState,
        sessionStats: updatedStats,
      });
      
      // Check if run time is still remaining
      // Note: gameOver won't be set for puzzle completion in beat-the-clock mode
      // It's only set when the run timer expires
      if (currentState.runStartTime && runTimeRemaining > 0) {
        console.log('[useGameModeHandlers.handleWin] Run time remaining (' + runTimeRemaining + 's), loading next puzzle');
        // Load next puzzle immediately
        // Note: We need to set a flag to prevent timer restart during transition
        // This will be handled by the parent component's isTransitioningRef
        loadBeatTheClock().then(() => {
          console.log('[useGameModeHandlers.handleWin] Next puzzle loaded, resetting puzzle start time');
          setPuzzleStartTime(Date.now());
        });
      } else {
        console.log('[useGameModeHandlers.handleWin] Run time expired or no runStartTime, showing modal. runTimeRemaining:', runTimeRemaining);
        // Run ended (time expired), show stats modal
        setStatsModalIsWin(true);
        setShowStatsModal(true);
      }
    } else {
      // Story Mode: Show win modal to let player choose when to continue
      console.log('[useGameModeHandlers.handleWin] Story mode - showing win modal');
      setStatsModalIsWin(true);
      setShowStatsModal(true);
    }
  }, [state, setState, puzzleStartTime, loadBeatTheClock, setPuzzleStartTime, setStatsModalIsWin, setShowStatsModal]);
  
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
    console.log('[useGameModeHandlers.handleRunTimerExpired] Run timer expired callback called');
    
    // Get current state - use the state prop directly to avoid stale ref issues
    stateRef.current = state;
    const currentState = state;
    
    console.log('[useGameModeHandlers.handleRunTimerExpired] Current state - gameMode:', currentState.gameMode, 'gameOver:', currentState.gameOver);
    
    if (currentState.gameMode === 'beat-the-clock') {
      console.log('[useGameModeHandlers.handleRunTimerExpired] Showing win modal');
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

