'use client';

import { useRouter } from 'next/navigation';
import { BookOfPassageButton } from '@/components/BookOfPassageButton';
import { LibraryButton } from '@/components/LibraryButton';
import type { SessionStats, NarrativeOrchestrationState } from '@/lib/game/state';
import { DEFAULT_NARRATIVE_CONFIG } from '@/lib/narrative/storyEventConfig';
import styles from './GameStatsModal.module.css';

export type GameMode = 'story' | 'puzzle-only' | 'beat-the-clock';

interface GameStatsModalProps {
  isOpen: boolean;
  mode: GameMode;
  isWin: boolean;
  sessionStats: SessionStats | null;
  narrativeOrchestration?: NarrativeOrchestrationState;
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
  narrativeOrchestration,
  onNextPuzzle,
  onRestartPuzzle,
  onStartFreshRun,
  onMainMenu,
  onBackToLibrary,
  onBackToBookOfPassage,
}: GameStatsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // Determine narrative message based on debt level (only for story mode wins)
  const narrativeMessage = mode === 'story' && isWin && narrativeOrchestration
    ? (() => {
        const debt = narrativeOrchestration.storyEventDebt;
        const config = DEFAULT_NARRATIVE_CONFIG;

        if (!config.enableMessaging) return null;

        if (debt >= config.storyEventDebtThreshold) {
          // Debt threshold reached (Kethaneum blocked)
          return config.messageTypes.debtThreshold;
        } else if (debt === 1) {
          // One uncompleted story event
          return config.messageTypes.debtOne;
        }
        return null;
      })()
    : null;

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

        {/* Narrative Debt Message - only shown in story mode on wins */}
        {narrativeMessage && (
          <div className={styles.narrativeMessage}>
            <div className={styles.narrativeIcon}>📖</div>
            <p className={styles.narrativeText}>{narrativeMessage}</p>
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
                <LibraryButton
                  className={styles.secondaryButton}
                  onClick={onBackToLibrary}
                >
                  Return to Library
                </LibraryButton>
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

