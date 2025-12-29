/**
 * React hook for managing game logic (word selection only)
 * Timer logic has been moved to mode-specific hooks in useTimer.ts
 */

import { useCallback, useRef, useEffect } from 'react';
import type { GameState, Cell } from '@/lib/game/state';
import { checkForWord, markWordAsFound, checkWinCondition, endGame, clearPuzzleTimer } from '@/lib/game/logic';
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
  
  // Use ref to track current state for word selection callbacks
  const stateRef = useRef(state);
  
  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Check for word in selection
  const checkWord = useCallback((selectedCells: Cell[]) => {
    // Use stateRef.current to get the latest state, avoiding stale closures
    const currentState = stateRef.current;
    const result = checkForWord(selectedCells, currentState.wordList, config);
    
    if (result.found && result.wordData) {
      const { newState, allWordsFound } = markWordAsFound(currentState, result.wordData);
      setState(newState);

      if (allWordsFound) {
        // For beat-the-clock mode, don't call endGame (which sets gameOver: true)
        // Clear the timer and call onWin directly - it will handle puzzle completion and loading next puzzle
        // Timer clearing is handled by the timer hook, but we need to clear it from state
        if (currentState.gameMode === 'beat-the-clock') {
          // Clear timer from current state (not newState, as timer is in state)
          const clearedState = clearPuzzleTimer(currentState);
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
          }
          if (onWin) {
            onWin();
          }
        } else {
          // For other modes, use the standard endGame flow
          // endGame will handle timer clearing
          const winResult = endGame(newState, true);
          setState(winResult.newState);
          // Update stateRef synchronously before calling onWin
          if (updateStateRef) {
            updateStateRef(winResult.newState);
          }
          if (onWin) onWin();
        }
      }
      
      return true;
    }
    
    return false;
  }, [setState, config, onWin, updateStateRef]);


  // Check win condition
  const checkWin = useCallback(() => {
    const currentState = stateRef.current;
    if (checkWinCondition(currentState)) {
      // For beat-the-clock mode, don't call endGame (which sets gameOver: true)
      // Clear the timer and call onWin directly - it will handle puzzle completion and loading next puzzle
      // Timer clearing is handled by the timer hook, but we need to clear it from state
      if (currentState.gameMode === 'beat-the-clock') {
        const clearedState = clearPuzzleTimer(currentState);
        setState(clearedState);
        // Update stateRef synchronously before calling onWin so handleWin has latest state
        if (updateStateRef) {
          updateStateRef(clearedState);
        }
        if (onWin) {
          onWin();
        }
      } else {
        // For other modes, use the standard endGame flow
        // endGame will handle timer clearing
        const winResult = endGame(currentState, true);
        setState(winResult.newState);
        // Update stateRef synchronously before calling onWin
        if (updateStateRef) {
          updateStateRef(winResult.newState);
        }
        if (onWin) onWin();
      }
      return true;
    }
    return false;
  }, [setState, onWin, updateStateRef]);

  return {
    checkWord,
    checkWin,
  };
}

