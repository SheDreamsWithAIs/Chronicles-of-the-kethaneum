/**
 * React hook for managing game mode-specific win/lose handlers
 * Separates mode-specific logic from the main puzzle component
 */

import { useCallback } from 'react';
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
  
  const handleWin = useCallback(() => {
    const timeTaken = puzzleStartTime ? Math.floor((Date.now() - puzzleStartTime) / 1000) : 0;
    const wordsFound = state.wordList.filter(w => w.found).length;
    const totalWords = state.wordList.length;
    
    if (state.gameMode === 'puzzle-only') {
      // Update session stats
      const updatedStats = recordPuzzleStats(
        state.currentPuzzleIndex || 0,
        timeTaken,
        wordsFound,
        totalWords,
        state.sessionStats
      );
      
      // Increment total words found
      const finalStats = incrementTotalWords(updatedStats, wordsFound);
      
      setState({
        ...state,
        sessionStats: finalStats,
      });
      
      setStatsModalIsWin(true);
      setShowStatsModal(true);
    } else if (state.gameMode === 'beat-the-clock') {
      // Record stats and check if run should continue
      const updatedStats = recordPuzzleStats(
        state.currentPuzzleIndex || 0,
        timeTaken,
        wordsFound,
        totalWords,
        state.sessionStats
      );
      
      setState({
        ...state,
        sessionStats: updatedStats,
      });
      
      // Calculate run time remaining (not puzzle time)
      const runTimeElapsed = state.runStartTime 
        ? Math.floor((Date.now() - state.runStartTime) / 1000)
        : 0;
      const runTimeRemaining = state.runDuration - runTimeElapsed;
      
      // Check if run time is still remaining
      if (state.runStartTime && runTimeRemaining > 0) {
        // Load next puzzle automatically - don't show modal
        loadBeatTheClock();
        setPuzzleStartTime(Date.now()); // Reset puzzle start time for next puzzle
      } else {
        // Run ended, show stats modal
        setStatsModalIsWin(true);
        setShowStatsModal(true);
      }
    } else {
      // Story Mode: Continue to next puzzle (existing flow)
      // TODO: Navigate to next story puzzle
    }
  }, [state, setState, puzzleStartTime, loadBeatTheClock, setPuzzleStartTime, setStatsModalIsWin, setShowStatsModal]);
  
  const handleLose = useCallback(() => {
    if (state.gameMode === 'puzzle-only') {
      setStatsModalIsWin(false);
      setShowStatsModal(true);
    } else if (state.gameMode === 'beat-the-clock') {
      // Calculate run time remaining
      const runTimeElapsed = state.runStartTime 
        ? Math.floor((Date.now() - state.runStartTime) / 1000)
        : 0;
      const runTimeRemaining = state.runDuration - runTimeElapsed;
      
      // Check if run time is still remaining
      if (state.runStartTime && runTimeRemaining > 0) {
        // Puzzle timer ran out but run time remains - load next puzzle
        loadBeatTheClock();
        setPuzzleStartTime(Date.now()); // Reset puzzle start time for next puzzle
      } else {
        // Run ended (either puzzle timer or run timer expired), show lose modal
        setStatsModalIsWin(false);
        setShowStatsModal(true);
      }
    } else {
      // Story Mode: Handle lose (existing flow)
    }
  }, [state.gameMode, state.runStartTime, state.runDuration, loadBeatTheClock, setPuzzleStartTime, setStatsModalIsWin, setShowStatsModal]);
  
  // Handle run timer expiration for beat-the-clock mode
  const handleRunTimerExpired = useCallback(() => {
    if (state.gameMode === 'beat-the-clock') {
      // Run timer expired - show win modal with final stats
      setStatsModalIsWin(true);
      setShowStatsModal(true);
    }
  }, [state.gameMode, setStatsModalIsWin, setShowStatsModal]);

  return {
    handleWin,
    handleLose,
    handleRunTimerExpired,
  };
}

