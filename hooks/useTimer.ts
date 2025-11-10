/**
 * Mode-specific timer hooks
 * Separates timer logic by game mode to prevent coupling with word selection
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState } from '@/lib/game/state';
import { startTimer, pauseGame, resumeGame, endGame } from '@/lib/game/logic';
import { getConfig } from '@/lib/core/config';

/**
 * Story Mode Timer - Decorative only, no active timer
 * Returns static time display with no state updates
 */
export function useStoryTimer(
  state: GameState,
  setState: (state: GameState) => void
) {
  const config = getConfig();
  const stateRef = useRef(state);
  
  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize time display (decorative only)
  const initialize = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.timer && currentState.grid && currentState.grid.length > 0) {
      const { newState } = startTimer(
        currentState,
        config,
        undefined, // No tick callback needed for story mode
        undefined, // No time up callback needed
        () => currentState.paused
      );
      setState(newState);
    }
  }, [setState, config]);

  // Pause (no-op for story mode, but keep interface consistent)
  const pause = useCallback(() => {
    const currentState = stateRef.current;
    const newState = pauseGame(currentState);
    setState(newState);
  }, [setState]);

  // Resume (no-op for story mode, but keep interface consistent)
  const resume = useCallback(() => {
    const currentState = stateRef.current;
    const newState = resumeGame(currentState);
    setState(newState);
  }, [setState]);

  // Clear timer (no-op for story mode)
  const clear = useCallback(() => {
    // Story mode doesn't have active timers, nothing to clear
  }, []);

  return {
    initialize,
    pause,
    resume,
    clear,
  };
}

/**
 * Puzzle-Only Mode Timer - Simple countdown timer per puzzle
 */
export function usePuzzleOnlyTimer(
  state: GameState,
  setState: (state: GameState) => void,
  onTimeUp?: () => void
) {
  const config = getConfig();
  const stateRef = useRef(state);
  const pausedRef = useRef(state.paused);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    stateRef.current = state;
    pausedRef.current = state.paused;
    // If state.timer is null but timerRef still has a value, clear it
    if (!state.timer && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else {
      timerRef.current = state.timer;
    }
  }, [state]);

  // Start timer
  const start = useCallback(() => {
    const currentState = stateRef.current;
    const { newState, timer } = startTimer(
      currentState,
      config,
      (timeRemaining) => {
        // Get current timer ref - if null, timer was cleared, ignore callback
        const currentTimerRef = timerRef.current;
        if (!currentTimerRef) {
          return;
        }
        
        // Get current state from ref
        const currentState = stateRef.current;
        
        // Check if timer was cleared
        if (currentTimerRef !== currentState.timer) {
          return;
        }
        
        // Update timeRemaining
        setState({
          ...currentState,
          timeRemaining,
          timer: currentTimerRef,
        });
      },
      () => {
        // Get current state from ref
        const currentState = stateRef.current;
        const currentTimerRef = timerRef.current;
        
        // Check if timer was cleared
        if (currentTimerRef !== currentState.timer || !currentTimerRef) {
          return;
        }
        
        // Clear timer ref
        timerRef.current = null;
        
        const loseResult = endGame(currentState, false);
        setState(loseResult.newState);
        // Call onTimeUp after state update
        setTimeout(() => {
          if (onTimeUp) onTimeUp();
        }, 0);
      },
      () => pausedRef.current // Pass function to check current paused state
    );
    
    // Update timerRef with the new timer
    timerRef.current = timer;
    setState(newState);
  }, [setState, config, onTimeUp]);

  // Pause timer
  const pause = useCallback(() => {
    const currentState = stateRef.current;
    const newState = pauseGame(currentState);
    // Clear timerRef when pausing
    if (timerRef.current) {
      timerRef.current = null;
    }
    setState(newState);
  }, [setState]);

  // Resume timer
  const resume = useCallback(() => {
    const currentState = stateRef.current;
    const newState = resumeGame(currentState);
    setState(newState);
    // Restart timer after resume
    start();
  }, [setState, start]);

  // Clear timer
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    start,
    pause,
    resume,
    clear,
  };
}

/**
 * Beat-the-Clock Mode Timer - Complex run timer + puzzle timer
 * Currently disabled but structure ready for future
 */
export function useBeatTheClockTimer(
  state: GameState,
  setState: (state: GameState) => void,
  onTimeUp?: () => void,
  onRunTimerExpired?: () => void
) {
  const config = getConfig();
  const stateRef = useRef(state);
  const pausedRef = useRef(state.paused);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    stateRef.current = state;
    pausedRef.current = state.paused;
    // If state.timer is null but timerRef still has a value, clear it
    if (!state.timer && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else {
      timerRef.current = state.timer;
    }
  }, [state]);

  // Start timer
  const start = useCallback(() => {
    const currentState = stateRef.current;
    const { newState, timer } = startTimer(
      currentState,
      config,
      (timeRemaining) => {
        // Get current timer ref - if null, timer was cleared, ignore callback
        const currentTimerRef = timerRef.current;
        if (!currentTimerRef) {
          return;
        }
        
        // Get current state from ref
        const currentState = stateRef.current;
        
        // Check if timer was cleared
        if (currentTimerRef !== currentState.timer) {
          return;
        }
        
        // Update timeRemaining
        setState({
          ...currentState,
          timeRemaining,
          timer: currentTimerRef,
        });
        
        // Check if run timer has expired for beat-the-clock mode
        if (currentState.gameMode === 'beat-the-clock' && currentState.runStartTime && onRunTimerExpired && !currentState.gameOver) {
          const runTimeElapsed = Math.floor((Date.now() - currentState.runStartTime) / 1000);
          const runTimeRemaining = currentState.runDuration - runTimeElapsed;
          
          if (runTimeRemaining <= 0) {
            // Run timer expired, properly end the game
            if (currentTimerRef) {
              clearInterval(currentTimerRef);
              timerRef.current = null;
            }
            const endResult = endGame(currentState, true);
            setState({
              ...endResult.newState,
              timeRemaining,
              timer: null,
            });
            // Trigger end of run callback to show modal
            if (onRunTimerExpired) {
              onRunTimerExpired();
            }
          }
        }
      },
      () => {
        // Get current state from ref
        const currentState = stateRef.current;
        const currentTimerRef = timerRef.current;
        
        // Check if timer was cleared
        if (currentTimerRef !== currentState.timer || !currentTimerRef) {
          return;
        }
        
        // Clear timer ref
        timerRef.current = null;
        
        const loseResult = endGame(currentState, false);
        setState(loseResult.newState);
        // Call onTimeUp after state update
        setTimeout(() => {
          if (onTimeUp) onTimeUp();
        }, 0);
      },
      () => pausedRef.current // Pass function to check current paused state
    );
    
    // Update timerRef with the new timer
    timerRef.current = timer;
    setState(newState);
  }, [setState, config, onTimeUp, onRunTimerExpired]);

  // Pause timer
  const pause = useCallback(() => {
    const currentState = stateRef.current;
    const newState = pauseGame(currentState);
    // Clear timerRef when pausing
    if (timerRef.current) {
      timerRef.current = null;
    }
    setState(newState);
  }, [setState]);

  // Resume timer
  const resume = useCallback(() => {
    const currentState = stateRef.current;
    const newState = resumeGame(currentState);
    setState(newState);
    // Restart timer after resume
    start();
  }, [setState, start]);

  // Clear timer
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    start,
    pause,
    resume,
    clear,
  };
}

