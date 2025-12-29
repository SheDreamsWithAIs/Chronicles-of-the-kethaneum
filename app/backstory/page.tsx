'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { GameModeModal, type GameMode } from '@/components/GameModeModal';
import { FormattedBackstory } from '@/components/shared/FormattedBackstory';
import { useGameState } from '@/hooks/useGameState';
import { loadProgress, cleanupLegacyKeys } from '@/lib/save';
import { loadBackstoryContent, type BackstoryContent } from '@/lib/utils/backstoryLoader';
import styles from './backstory.module.css';

export default function BackstoryScreen() {
  const router = useRouter();
  const { state, setState } = useGameState();
  const [isVisible, setIsVisible] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [backstoryContent, setBackstoryContent] = useState<BackstoryContent | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load backstory content
    loadBackstoryContent().then((content) => {
      if (content) {
        setBackstoryContent(content);
      } else {
        console.error('Failed to load backstory content, using fallback');
      }
    });
  }, []);

  useEffect(() => {
    // Check for existing progress
    cleanupLegacyKeys();
    loadProgress()
      .then(result => {
        const savedProgress = result.data;
        if (savedProgress && ((savedProgress as any).completedPuzzles > 0 || (savedProgress as any).currentGenre)) {
          setHasExistingProgress(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleContinue();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContinue = () => {
    setShowModeModal(true);
  };

  const handleModeSelect = (mode: GameMode) => {
    // Update game state with selected mode
    setState({
      ...state,
      gameMode: mode,
      // Clear mode-specific stats when switching modes
      sessionStats: null,
      runStartTime: null,
    });

    // Navigate based on mode
    if (mode === 'story') {
      // Route Story mode players to the Receiving Room entry screen
      router.push('/receiving-room');
    } else {
      // Puzzle Only or Beat the Clock - go directly to puzzle screen
      router.push('/puzzle');
    }
  };

  const moonPhases = [
    { type: 'new' },
    { type: 'waxing' },
    { type: 'full' },
    { type: 'waning' }
  ];

  return (
    <div className={`${styles.backstoryContainer} ${isVisible ? styles.visible : ''}`} data-testid="backstory-screen">
      <CosmicBackground variant="backstory" starCount={150} particleCount={40} />

      <div className={styles.backstoryScreen}>
        <div className={styles.bookContainer}>
          <div className={styles.bookSpine}></div>
          
          <div className={styles.bookContent}>
            <div className={styles.pageDecoration}>✦</div>

            <h1 className={styles.chapterTitle}>
              {backstoryContent?.title || 'The Kethaneum'}
            </h1>

            <div className={styles.storyContent} data-testid="backstory-content">
              {backstoryContent ? (
                <FormattedBackstory content={backstoryContent} />
              ) : (
                // Fallback content in case loading fails
                <>
                  <p>The Kethaneum exists in the spaces between worlds—a vast library stretching across dimensions, accessible only to those deemed worthy by its mysterious custodians. Neither fully physical nor entirely ethereal, this repository houses knowledge from countless civilizations, epochs, and realities.</p>

                  <p>For millennia, brilliant minds across the multiverse have sought entry to this hallowed space. Few succeed. The journey requires years of dedicated study and the completion of increasingly complex trials that test not just intellect, but character and perseverance. Those who prove themselves receive a <em>Book of Passage</em>—a living artifact that serves as both key and chronicle.</p>

                  <p>Your Book of Passage now rests in your hands, its pages initially blank except for your name. Unlike ordinary books, it observes and records your journey, adding new chapters as you explore the Kethaneum's infinite collections. Every discovery, every challenge overcome, every insight gained—all become part of your unique narrative, preserved within its pages.</p>

                  <p><em>Today marks your first day as Assistant Archivist. The cosmic catalog awaits your careful hand, and ancient knowledge stirs in anticipation of your touch. Step forward, seeker, and let your story begin...</em></p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.continueContainer}>
        <div className={styles.continueOrnament}>
          <div className={styles.ornamentContainer}>
            <div className={styles.moonPhases}>
              {moonPhases.slice(0, 2).map((moon, index) => (
                <div key={index} className={`${styles.moonPhase} ${styles[moon.type]}`}></div>
              ))}
            </div>
            
            <button className={styles.continueButton} onClick={handleContinue} data-testid="continue-to-mode-select-btn">
              Continue
            </button>
            
            <div className={styles.moonPhases}>
              {moonPhases.slice(2, 4).map((moon, index) => (
                <div key={index + 2} className={`${styles.moonPhase} ${styles[moon.type]}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GameModeModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={handleModeSelect}
        hasExistingProgress={hasExistingProgress}
      />
    </div>
  );
}
