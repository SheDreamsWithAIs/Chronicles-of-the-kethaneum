'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { FormattedBackstory } from '@/components/shared/FormattedBackstory';
import { loadFormattedContent, type FormattedContent } from '@/lib/utils/formattedContentLoader';
import styles from './story-end.module.css';

export default function StoryEndScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [storyEndContent, setStoryEndContent] = useState<FormattedContent | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load story end content
    loadFormattedContent('story-end').then((content) => {
      if (content) {
        setStoryEndContent(content);
      } else {
        console.error('Failed to load story end content, using fallback');
      }
    });
  }, []);

  const handlePlayAgain = () => {
    router.push('/backstory');
  };

  const handleReturnHome = () => {
    router.push('/');
  };

  const starSymbols = ['✦', '✧', '★', '☆'];

  return (
    <div className={`${styles.storyEndContainer} ${isVisible ? styles.visible : ''}`} data-testid="story-end-screen">
      <CosmicBackground variant="backstory" starCount={200} particleCount={60} />

      <div className={styles.storyEndScreen}>
        <div className={styles.bookContainer}>
          <div className={styles.bookSpine}></div>

          <div className={styles.bookContent}>
            <div className={styles.pageDecoration}>✦</div>

            <h1 className={styles.chapterTitle}>
              {storyEndContent?.title || 'Journey Complete'}
            </h1>

            <div className={styles.storyContent} data-testid="story-end-content">
              {storyEndContent ? (
                <FormattedBackstory content={storyEndContent} />
              ) : (
                // Fallback content in case loading fails
                <>
                  <p>Congratulations, <em>Archivist</em>.</p>

                  <p>You have proven yourself worthy of the Kethaneum&apos;s sacred trust. Through countless puzzles and ancient texts, you have demonstrated not just intellect, but patience, perseverance, and a genuine love for knowledge.</p>

                  <p>Your <em>Book of Passage</em> now brims with the chronicles of your journey—each chapter a testament to the challenges you&apos;ve overcome and the wisdom you&apos;ve gained.</p>

                  <p>But remember: in the Kethaneum, every ending is merely a new beginning.</p>

                  <p><em>Until we meet again among the stars and stories...</em></p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <div className={styles.buttonOrnament}>
          <div className={styles.ornamentContainer}>
            <div className={styles.starSymbols}>
              {starSymbols.slice(0, 2).map((star, index) => (
                <div key={index} className={styles.starSymbol}>{star}</div>
              ))}
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.playAgainButton} onClick={handlePlayAgain} data-testid="play-again-btn">
                Play Again
              </button>
              <button className={styles.homeButton} onClick={handleReturnHome} data-testid="return-home-btn">
                Return Home
              </button>
            </div>

            <div className={styles.starSymbols}>
              {starSymbols.slice(2, 4).map((star, index) => (
                <div key={index + 2} className={styles.starSymbol}>{star}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
