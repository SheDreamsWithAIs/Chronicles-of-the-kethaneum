'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { PageLoader } from '@/components/shared/PageLoader';
import { SettingsMenu } from '@/components/SettingsMenu';
import { loadProgress, cleanupLegacyKeys } from '@/lib/save';
import { useGameState } from '@/contexts/GameStateContext';
import { getRoutePath } from '@/lib/utils/navigation';
import styles from './title-screen.module.css';

export default function TitleScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameMode, setSavedGameMode] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { resetProgress } = useGameState();

  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 20
    }));
  }, []);

  useEffect(() => {
    cleanupLegacyKeys();
    loadProgress().then(result => {
      if (result.data) {
        setHasSavedGame(true);
        setSavedGameMode((result.data as any).gameMode || null);
      }
    }).catch(() => {});
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

  const handleNewGame = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await resetProgress();
    } catch (e) {
      console.error('Failed to clear progress on New Game', e);
    }

    // Use client-side navigation to preserve audio playback
    // clearProgress() clears state without needing a reload
    router.push('/backstory');
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
      <PageLoader
        isLoading={isLoading}
        variant="title"
        message="Preparing a new journey..."
      />
      <div className={`${styles.titleContainer} ${isLoading ? styles.loading : ''}`} data-testid="title-screen">
        <CosmicBackground variant="title" starCount={100} particleCount={30} />

        <div className={styles.titleScreen}>
          <div className={styles.titleLayout}>
            <div className={styles.logoContainer}>
              <div className={styles.logoWrapper}>
                <img
                  src={getRoutePath('/images/logo-glow.png')}
                  alt="Chronicles of the Kethaneum Logo"
                  className={styles.logoGlow}
                />
              </div>
            </div>

            <div className={styles.titleContent}>
              <h1 className={styles.gameTitle} data-testid="game-title">Chronicles of the Kethaneum</h1>
              <h2 className={styles.gameSubtitle} data-testid="game-subtitle">Searching the Cosmic Catalog</h2>

              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.gameButton} ${styles.primary} ${isLoading ? styles.disabled : ''}`}
                  onClick={handleNewGame}
                  disabled={isLoading}
                  data-testid="new-game-btn"
                >
                  New Game
                </button>

                <button
                  className={`${styles.gameButton} ${styles.secondary} ${!hasSavedGame ? styles.disabled : ''}`}
                  onClick={handleContinue}
                  disabled={!hasSavedGame || isLoading}
                  data-testid="continue-btn"
                >
                  Continue
                </button>

                <button
                  className={`${styles.gameButton} ${styles.secondary}`}
                  onClick={() => setShowSettings(true)}
                  disabled={isLoading}
                  data-testid="settings-btn"
                >
                  Settings
                </button>

                <button
                  className={`${styles.gameButton} ${styles.secondary}`}
                  onClick={() => router.push('/credits')}
                  disabled={isLoading}
                  data-testid="credits-btn"
                >
                  Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onNavigateToTitle={() => setShowSettings(false)}
        context="title"
      />
    </>
  );
}
