'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { useGameState } from '@/hooks/useGameState';
import styles from './book-of-passage.module.css';

export default function BookOfPassageScreen() {
  const router = useRouter();
  const { state } = useGameState();
  const [activeTab, setActiveTab] = useState('book-of-passage');

  // Restrict access to Story Mode only
  useEffect(() => {
    if (state.gameMode !== 'story') {
      // Redirect to puzzle screen for non-story modes
      router.push('/puzzle');
    }
  }, [state.gameMode, router]);

  const handleBeginCataloging = () => {
    router.push('/library');
  };

  return (
    <div className={styles.bookPassageContainer} data-testid="book-of-passage-screen">
      <CosmicBackground variant="book" starCount={200} particleCount={30} />

      <div className={styles.bookPassageScreen}>
        <div className={styles.bookContainer}>
          <div className={styles.bookSpine}>
            <div className={styles.spineTitle}>Book of Passage</div>
          </div>
          
          <div className={styles.bookContent}>
            <div className={styles.bookTabs}>
              <button 
                className={`${styles.bookTab} ${activeTab === 'book-of-passage' ? styles.active : ''}`}
                onClick={() => setActiveTab('book-of-passage')}
              >
                Current Story
              </button>
              <button 
                className={`${styles.bookTab} ${activeTab === 'discovered-books' ? styles.active : ''}`}
                onClick={() => setActiveTab('discovered-books')}
              >
                Discovered Books
              </button>
            </div>

            <div className={styles.pageContent}>
              {activeTab === 'book-of-passage' && (
                <div className={styles.pageSection}>
                  <h2 className={styles.pageTitle}>Book of Passage</h2>
                  <p className={styles.pageSubtitle}>Your Current Journey</p>
                  
                  <div className={styles.storyContent}>
                    <p><em>The pages of your Book of Passage shimmer as new words appear...</em></p>
                    <p>Today marks your first day as Assistant Archivist in the vast expanse of the Kethaneum. The cosmic library stretches before you, its infinite shelves holding knowledge from countless worlds and civilizations.</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'discovered-books' && (
                <div className={styles.pageSection}>
                  <h2 className={styles.pageTitle}>Discovered Books</h2>
                  <p className={styles.pageSubtitle}>Chronicles You Have Indexed</p>
                  <p>No books discovered yet. Begin cataloging to discover new knowledge constructs!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomNav}>
        <div className={styles.navOrnament}>
          <button className={styles.navButton} onClick={handleBeginCataloging} data-testid="begin-cataloging-btn">
            Begin Cataloging
          </button>
        </div>
      </div>
    </div>
  );
}

