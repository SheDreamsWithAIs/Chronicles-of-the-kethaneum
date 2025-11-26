'use client';

import { useRouter } from 'next/navigation';
import { BookOfPassageButton } from '@/components/BookOfPassageButton';
import type { SessionStats } from '@/lib/game/state';
import styles from './GameStatsModal.module.css';

export type GameMode = 'story' | 'puzzle-only' | 'beat-the-clock';

interface GameStatsModalProps {
  isOpen: boolean;
  mode: GameMode;
  isWin: boolean;
  sessionStats: SessionStats | null;
  onNextPuzzle?: () => void;
  onRestartPuzzle?: () => void;
  onStartFreshRun?: () => void;
  onMainMenu?: () => void;
  onBackToLibrary?: () => void;
  onBackToBookOfPassage?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameStatsModal({
  isOpen,
  mode,
  isWin,
  sessionStats,
  onNextPuzzle,
  onRestartPuzzle,
  onStartFreshRun,
  onMainMenu,
  onBackToLibrary,
  onBackToBookOfPassage,
}: GameStatsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleMainMenu = () => {
    if (onMainMenu) {
      onMainMenu();
    } else {
      router.push('/');
    }
  };

  return (
    <div className={styles.overlay} onClick={handleMainMenu}>
      <div className={styles.panelContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="stats-modal-title">
        <div className={styles.header}>
          <h2 className={styles.title} id="stats-modal-title">
            {isWin ? '✓ Puzzle Complete!' : '✗ Time\'s Up!'}
          </h2>
          <div className={`${styles.statusBadge} ${isWin ? styles.win : styles.lose}`}>
            {isWin ? 'Win' : 'Lose'}
          </div>
        </div>

        {sessionStats && (
          <div className={styles.statsContainer}>
            {mode === 'puzzle-only' && (
              <>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Puzzles Completed:</span>
                  <span className={styles.statValue}>{sessionStats.puzzlesCompleted}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Words Found:</span>
                  <span className={styles.statValue}>{sessionStats.totalWordsFound}</span>
                </div>
              </>
            )}

            {mode === 'beat-the-clock' && (
              <>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Puzzles Completed:</span>
                  <span className={styles.statValue}>{sessionStats.puzzlesCompleted}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Time:</span>
                  <span className={styles.statValue}>{formatTime(sessionStats.totalTime)}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Average Time per Puzzle:</span>
                  <span className={styles.statValue}>
                    {sessionStats.puzzlesCompleted > 0
                      ? formatTime(Math.floor(sessionStats.averageTime))
                      : '0:00'}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Words Found:</span>
                  <span className={styles.statValue}>{sessionStats.totalWordsFound}</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.buttonContainer}>
          {mode === 'puzzle-only' && (
            <>
              {isWin && onNextPuzzle && (
                <button className={styles.primaryButton} onClick={onNextPuzzle}>
                  Next Puzzle
                </button>
              )}
              {!isWin && onRestartPuzzle && (
                <button className={styles.primaryButton} onClick={onRestartPuzzle}>
                  Restart Puzzle
                </button>
              )}
            </>
          )}

          {mode === 'beat-the-clock' && (
            <>
              {onStartFreshRun && (
                <button className={styles.primaryButton} onClick={onStartFreshRun}>
                  Start Fresh Run
                </button>
              )}
              {!isWin && onRestartPuzzle && (
                <button className={styles.secondaryButton} onClick={onRestartPuzzle}>
                  Restart Puzzle
                </button>
              )}
            </>
          )}

          {mode === 'story' && (
            <>
              {isWin && onNextPuzzle && (
                <button className={styles.primaryButton} onClick={onNextPuzzle}>
                  Next Puzzle
                </button>
              )}
              {!isWin && onRestartPuzzle && (
                <button className={styles.primaryButton} onClick={onRestartPuzzle}>
                  Restart Puzzle
                </button>
              )}
              {onBackToBookOfPassage && (
                <BookOfPassageButton
                  className={styles.secondaryButton}
                  onClick={onBackToBookOfPassage}
                />
              )}
              {onBackToLibrary && (
                <button className={styles.secondaryButton} onClick={onBackToLibrary}>
                  Back to Library
                </button>
              )}
            </>
          )}

          <button className={styles.secondaryButton} onClick={handleMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

