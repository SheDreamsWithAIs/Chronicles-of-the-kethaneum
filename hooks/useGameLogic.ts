/**
 * React hook for managing game logic
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState, Cell } from '@/lib/game/state';
import { checkForWord, markWordAsFound, checkWinCondition, endGame, startTimer, pauseGame, resumeGame, clearPuzzleTimer } from '@/lib/game/logic';
import { getConfig } from '@/lib/core/config';

export function useGameLogic(
  state: GameState,
  setState: (state: GameState) => void,
  onWin?: () => void,
  onLose?: () => void,
  onRunTimerExpired?: () => void,
  updateStateRef?: (state: GameState) => void
) {
  const config = getConfig();
  
  // Use ref to track paused state so timer can access current value
  const pausedRef = useRef(state.paused);
  
  // Use ref to track current state for timer callbacks
  const stateRef = useRef(state);
  
  // Use ref to track the actual timer interval reference
  // This prevents stale timer references in callbacks
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    pausedRef.current = state.paused;
    stateRef.current = state;
    // Sync timerRef with state.timer
    timerRef.current = state.timer;
  }, [state]);

  // Check for word in selection
  const checkWord = useCallback((selectedCells: Cell[]) => {
    const result = checkForWord(selectedCells, state.wordList, config);
    
    if (result.found && result.wordData) {
      const { newState, allWordsFound } = markWordAsFound(state, result.wordData);
      setState(newState);
      
      if (allWordsFound) {
        console.log('[useGameLogic.checkWord] All words found! gameMode:', state.gameMode, 'timer:', state.timer ? 'exists' : 'null');
        
        // For beat-the-clock mode, don't call endGame (which sets gameOver: true)
        // Clear the timer and call onWin directly - it will handle puzzle completion and loading next puzzle
        if (state.gameMode === 'beat-the-clock') {
          console.log('[useGameLogic.checkWord] Beat-the-clock mode - clearing timer and calling onWin');
          // Clear timer from current state (not newState, as timer is in state)
          const clearedState = clearPuzzleTimer(state);
          // Clear timerRef as well
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            console.log('[useGameLogic.checkWord] Timer ref cleared');
          }
          // Merge with newState to preserve word found state
          const finalState = {
            ...clearedState,
            ...newState,
            timer: null, // Ensure timer is null
          };
          setState(finalState);
          // Update stateRef synchronously before calling onWin so handleWin has latest state
          if (updateStateRef) {
            updateStateRef(finalState);
            console.log('[useGameLogic.checkWord] Updated stateRef synchronously, runStartTime:', finalState.runStartTime);
          }
          if (onWin) {
            console.log('[useGameLogic.checkWord] Calling onWin callback');
            onWin();
          }
        } else {
          // For other modes, use the standard endGame flow
          console.log('[useGameLogic.checkWord] Other mode - calling endGame');
          const winResult = endGame(newState, true);
          setState(winResult.newState);
          if (onWin) onWin();
        }
      }
      
      return true;
    }
    
    return false;
  }, [state, setState, config, onWin, updateStateRef]);

  // Start timer
  const start = useCallback(() => {
    const { newState, timer } = startTimer(
      state,
      config,
      (timeRemaining) => {
        // Get current timer ref FIRST - if it's null, timer was cleared, ignore callback
        const currentTimerRef = timerRef.current;
        if (!currentTimerRef) {
          console.log('[useGameLogic.timerTick] Timer ref is null, ignoring callback');
          return;
        }
        
        // Get current state from ref to avoid stale closures
        const currentState = stateRef.current;
        
        // Check if timer was cleared - if timerRef doesn't match state.timer, timer was cleared
        if (currentTimerRef !== currentState.timer) {
          console.log('[useGameLogic.timerTick] Timer was cleared (ref !== state.timer), ignoring callback. ref:', currentTimerRef, 'state.timer:', currentState.timer);
          return;
        }
        
        // Update timeRemaining without preserving stale timer reference
        setState({
          ...currentState,
          timeRemaining,
          timer: currentTimerRef, // Use the ref value, not state.timer
        });
        
        // Check if run timer has expired for beat-the-clock mode
        if (currentState.gameMode === 'beat-the-clock' && currentState.runStartTime && onRunTimerExpired && !currentState.gameOver) {
          const runTimeElapsed = Math.floor((Date.now() - currentState.runStartTime) / 1000);
          const runTimeRemaining = currentState.runDuration - runTimeElapsed;
          
          console.log('[useGameLogic.timerTick] Beat-the-clock check - runTimeElapsed:', runTimeElapsed, 'runTimeRemaining:', runTimeRemaining, 'gameOver:', currentState.gameOver);
          
          if (runTimeRemaining <= 0) {
            console.log('[useGameLogic.timerTick] Run timer expired! Ending game and showing modal');
            // Run timer expired, properly end the game
            // Clear the timer first
            if (currentTimerRef) {
              clearInterval(currentTimerRef);
              timerRef.current = null; // Clear the ref
              console.log('[useGameLogic.timerTick] Timer cleared');
            }
            // Call endGame to properly set gameOver and update state
            const endResult = endGame(currentState, true);
            setState({
              ...endResult.newState,
              timeRemaining,
              timer: null,
            });
            // Trigger end of run callback to show modal
            if (onRunTimerExpired) {
              console.log('[useGameLogic.timerTick] Calling onRunTimerExpired');
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
          console.log('[useGameLogic.timerTick] Timer was cleared, ignoring time up callback');
          return;
        }
        
        // Clear timer ref
        timerRef.current = null;
        
        const loseResult = endGame(currentState, false);
        setState(loseResult.newState);
        // Call onLose after state update
        setTimeout(() => {
          if (onLose) onLose();
        }, 0);
      },
      () => pausedRef.current // Pass function to check current paused state
    );
    
    // Update timerRef with the new timer
    timerRef.current = timer;
    
    setState(newState);
  }, [state, setState, config, onLose, onRunTimerExpired]);

  // Pause game
  const pause = useCallback(() => {
    const newState = pauseGame(state);
    // Clear timerRef when pausing
    if (timerRef.current) {
      timerRef.current = null;
    }
    setState(newState);
  }, [state, setState]);

  // Resume game
  const resume = useCallback(() => {
    const newState = resumeGame(state);
    setState(newState);
  }, [state, setState]);

  // Check win condition
  const checkWin = useCallback(() => {
    if (checkWinCondition(state)) {
      console.log('[useGameLogic.checkWin] Win condition met! gameMode:', state.gameMode, 'timer:', state.timer ? 'exists' : 'null');
      
      // For beat-the-clock mode, don't call endGame (which sets gameOver: true)
      // Clear the timer and call onWin directly - it will handle puzzle completion and loading next puzzle
      if (state.gameMode === 'beat-the-clock') {
        console.log('[useGameLogic.checkWin] Beat-the-clock mode - clearing timer and calling onWin');
        const clearedState = clearPuzzleTimer(state);
        // Clear timerRef as well
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          console.log('[useGameLogic.checkWin] Timer ref cleared');
        }
        setState(clearedState);
        // Update stateRef synchronously before calling onWin so handleWin has latest state
        if (updateStateRef) {
          updateStateRef(clearedState);
          console.log('[useGameLogic.checkWin] Updated stateRef synchronously, runStartTime:', clearedState.runStartTime);
        }
        if (onWin) {
          console.log('[useGameLogic.checkWin] Calling onWin callback');
          onWin();
        }
      } else {
        // For other modes, use the standard endGame flow
        console.log('[useGameLogic.checkWin] Other mode - calling endGame');
        const winResult = endGame(state, true);
        setState(winResult.newState);
        if (onWin) onWin();
      }
      return true;
    }
    return false;
  }, [state, setState, onWin, updateStateRef]);

  // Expose function to clear timer ref (needed when loading new puzzle)
  const clearTimerRef = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('[useGameLogic.clearTimerRef] Timer ref cleared');
    }
  }, []);

  return {
    checkWord,
    start,
    pause,
    resume,
    checkWin,
    clearTimerRef,
  };
}

