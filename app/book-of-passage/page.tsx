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

                  {state.discoveredBooks && state.discoveredBooks.size > 0 ? (
                    <div className={styles.booksList}>
                      {Array.from(state.discoveredBooks).sort().map((bookTitle) => {
                        // Get progress for this book
                        const bookData = state.books[bookTitle];
                        const partsMap = state.bookPartsMap[bookTitle] || [];

                        let completedParts = 0;
                        let totalParts = 0;

                        if (Array.isArray(bookData)) {
                          // Count completed parts
                          completedParts = bookData.filter(completed => completed === true).length;
                          totalParts = partsMap.length || bookData.length;
                        } else if (bookData && typeof bookData === 'object' && bookData.complete) {
                          // Book marked as complete
                          totalParts = partsMap.length || 1;
                          completedParts = totalParts;
                        }

                        const progressPercent = totalParts > 0
                          ? Math.round((completedParts / totalParts) * 100)
                          : 0;

                        return (
                          <div key={bookTitle} className={styles.bookEntry}>
                            <div className={styles.bookHeader}>
                              <h3 className={styles.bookTitle}>{bookTitle}</h3>
                              {totalParts > 0 && (
                                <span className={styles.bookProgress}>
                                  {completedParts}/{totalParts} parts ({progressPercent}%)
                                </span>
                              )}
                            </div>

                            {totalParts > 0 && (
                              <div className={styles.progressBar}>
                                <div
                                  className={styles.progressFill}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            )}

                            {/* Show which parts are completed */}
                            {Array.isArray(bookData) && totalParts > 1 && (
                              <div className={styles.partsList}>
                                {partsMap.map((partIndex, idx) => {
                                  const isCompleted = bookData[partIndex] === true;
                                  return (
                                    <span
                                      key={idx}
                                      className={`${styles.partIndicator} ${isCompleted ? styles.completed : ''}`}
                                      title={`Part ${partIndex + 1}${isCompleted ? ' (completed)' : ''}`}
                                    >
                                      {partIndex + 1}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.noBooks}>No books discovered yet. Begin cataloging to discover new knowledge constructs!</p>
                  )}
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

