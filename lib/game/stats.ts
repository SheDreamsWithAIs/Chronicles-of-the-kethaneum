/**
 * Stats tracking system for game modes
 */

import type { PuzzleStats, SessionStats } from './state';

/**
 * Record stats for a completed puzzle
 */
export function recordPuzzleStats(
  puzzleIndex: number,
  timeTaken: number,
  wordsFound: number,
  totalWords: number,
  currentStats: SessionStats | null
): SessionStats {
  const accuracy = totalWords > 0 ? (wordsFound / totalWords) * 100 : 0;
  
  const puzzleStat: PuzzleStats = {
    puzzleIndex,
    timeTaken,
    wordsFound,
    accuracy,
  };

  if (!currentStats) {
    return {
      puzzlesCompleted: 1,
      totalTime: timeTaken,
      averageTime: timeTaken,
      totalWordsFound: wordsFound,
      puzzles: [puzzleStat],
    };
  }

  const updatedPuzzles = [...currentStats.puzzles, puzzleStat];
  const newTotalTime = currentStats.totalTime + timeTaken;
  const newPuzzlesCompleted = currentStats.puzzlesCompleted + 1;

  return {
    puzzlesCompleted: newPuzzlesCompleted,
    totalTime: newTotalTime,
    averageTime: newTotalTime / newPuzzlesCompleted,
    totalWordsFound: currentStats.totalWordsFound + wordsFound,
    puzzles: updatedPuzzles,
  };
}

/**
 * Get current session stats
 */
export function getSessionStats(stats: SessionStats | null): SessionStats | null {
  return stats;
}

/**
 * Reset session stats
 */
export function resetSessionStats(): SessionStats | null {
  return null;
}

/**
 * Increment total words found (for Puzzle Only Mode)
 */
export function incrementTotalWords(
  currentStats: SessionStats | null,
  wordsFound: number
): SessionStats {
  if (!currentStats) {
    return {
      puzzlesCompleted: 0,
      totalTime: 0,
      averageTime: 0,
      totalWordsFound: wordsFound,
      puzzles: [],
    };
  }

  return {
    ...currentStats,
    totalWordsFound: currentStats.totalWordsFound + wordsFound,
  };
}

