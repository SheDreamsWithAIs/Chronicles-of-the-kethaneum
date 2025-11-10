/**
 * React hook for managing game logic
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState, Cell } from '@/lib/game/state';
import { checkForWord, markWordAsFound, checkWinCondition, endGame, startTimer, pauseGame, resumeGame } from '@/lib/game/logic';
import { getConfig } from '@/lib/core/config';

export function useGameLogic(
  state: GameState,
  setState: (state: GameState) => void,
  onWin?: () => void,
  onLose?: () => void,
  onRunTimerExpired?: () => void
) {
  const config = getConfig();
  
  // Use ref to track paused state so timer can access current value
  const pausedRef = useRef(state.paused);
  
  // Update ref when paused state changes
  useEffect(() => {
    pausedRef.current = state.paused;
  }, [state.paused]);

  // Check for word in selection
  const checkWord = useCallback((selectedCells: Cell[]) => {
    const result = checkForWord(selectedCells, state.wordList, config);
    
    if (result.found && result.wordData) {
      const { newState, allWordsFound } = markWordAsFound(state, result.wordData);
      setState(newState);
      
      if (allWordsFound) {
        const winResult = endGame(newState, true);
        setState(winResult.newState);
        if (onWin) onWin();
      }
      
      return true;
    }
    
    return false;
  }, [state, setState, config, onWin]);

  // Start timer
  const start = useCallback(() => {
    const { newState, timer } = startTimer(
      state,
      config,
      (timeRemaining) => {
        // Use functional update to avoid stale closure
        setState(prevState => {
          // Check if run timer has expired for beat-the-clock mode
          if (prevState.gameMode === 'beat-the-clock' && prevState.runStartTime && onRunTimerExpired) {
            const runTimeElapsed = Math.floor((Date.now() - prevState.runStartTime) / 1000);
            const runTimeRemaining = prevState.runDuration - runTimeElapsed;
            if (runTimeRemaining <= 0) {
              // Run timer expired, trigger end of run
              setTimeout(() => {
                if (onRunTimerExpired) onRunTimerExpired();
              }, 0);
            }
          }
          return { ...prevState, timeRemaining };
        });
      },
      () => {
        // Use functional update to get current state
        setState(prevState => {
          const loseResult = endGame(prevState, false);
          return loseResult.newState;
        });
        // Call onLose after state update
        setTimeout(() => {
          if (onLose) onLose();
        }, 0);
      },
      () => pausedRef.current // Pass function to check current paused state
    );
    setState(newState);
  }, [state, setState, config, onLose, onRunTimerExpired]);

  // Pause game
  const pause = useCallback(() => {
    const newState = pauseGame(state);
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
      const winResult = endGame(state, true);
      setState(winResult.newState);
      if (onWin) onWin();
      return true;
    }
    return false;
  }, [state, setState, onWin]);

  return {
    checkWord,
    start,
    pause,
    resume,
    checkWin,
  };
}

