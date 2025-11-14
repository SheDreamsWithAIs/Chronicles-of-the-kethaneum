'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { AudioSettingsModal } from '@/components/AudioSettingsModal';
import { loadGameProgress } from '@/lib/save/saveSystem';
import styles from './title-screen.module.css';

export default function TitleScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameMode, setSavedGameMode] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 20
    }));
  }, []);

  useEffect(() => {
    const savedProgress = loadGameProgress();
    if (savedProgress) {
      setHasSavedGame(true);
      setSavedGameMode(savedProgress.gameMode || null);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const focusedButton = document.activeElement;
        if (focusedButton && focusedButton.classList.contains('game-button') && !focusedButton.classList.contains('disabled')) {
          (focusedButton as HTMLButtonElement).click();
        } else {
          handleNewGame();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewGame = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/backstory');
      setIsLoading(false);
    }, 500);
  };

  const handleContinue = () => {
    if (hasSavedGame) {
      // Navigate based on saved game mode
      if (savedGameMode === 'story') {
        router.push('/book-of-passage');
      } else {
        // Puzzle Only or Beat the Clock - go directly to puzzle screen
        router.push('/puzzle');
      }
    }
  };

  return (
    <>
      <div className={`${styles.titleContainer} ${isLoading ? styles.loading : ''}`}>
        <CosmicBackground variant="title" starCount={100} particleCount={30} />

        <div className={styles.titleScreen}>
          <div className={styles.titleLayout}>
            <div className={styles.logoContainer}>
              <div className={styles.logoWrapper}>
                <img
                  src="/images/logo-glow.png"
                  alt="Chronicles of the Kethaneum Logo"
                  className={styles.logoGlow}
                />
              </div>
            </div>

            <div className={styles.titleContent}>
              <h1 className={styles.gameTitle}>Chronicles of the Kethaneum</h1>
              <h2 className={styles.gameSubtitle}>Searching the Cosmic Catalog</h2>

              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.gameButton} ${styles.primary}`}
                  onClick={handleNewGame}
                >
                  New Game
                </button>

                <button
                  className={`${styles.gameButton} ${styles.secondary} ${!hasSavedGame ? styles.disabled : ''}`}
                  onClick={handleContinue}
                  disabled={!hasSavedGame}
                >
                  Continue
                </button>

                <button
                  className={`${styles.gameButton} ${styles.secondary}`}
                  onClick={() => setShowSettings(true)}
                >
                  Settings
                </button>

                <button
                  className={`${styles.gameButton} ${styles.secondary} ${styles.disabled}`}
                  disabled
                >
                  Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AudioSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
