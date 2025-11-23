'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { useGameState } from '@/hooks/useGameState';
import { useStoryProgress, useInitializeStoryProgress } from '@/hooks/useStoryProgress';
import { bookRegistry } from '@/lib/book/bookRegistry';
import { storyProgressManager } from '@/lib/story';
import styles from './book-of-passage.module.css';

// ============================================================================
// Constants
// ============================================================================

const BOOKS_PER_PAGE = 10;

// ============================================================================
// Types
// ============================================================================

interface BookDisplayData {
  id: string;
  title: string;
  genre: string;
  totalParts: number;
  completedParts: number;
  progressPercent: number;
  partsStatus: boolean[];
  isComplete: boolean;
}

type SortOption = 'title' | 'progress' | 'genre' | 'recent';
type TabOption = 'current-journey' | 'story-history' | 'discovered-books';

// ============================================================================
// Component
// ============================================================================

export default function BookOfPassageScreen() {
  const router = useRouter();
  const { state, setState } = useGameState();
  const [activeTab, setActiveTab] = useState<TabOption>('current-journey');

  // Story progress hook
  const {
    isReady: storyReady,
    currentBlurb,
    storyHistory,
    hasHistory,
    currentStoryBeat,
  } = useStoryProgress(state.storyProgress);

  // Initialize story progress hook
  const { initializeWithFirstBlurb } = useInitializeStoryProgress();

  // Initialize story progress with first blurb if not already done
  useEffect(() => {
    if (!storyReady || !storyProgressManager.isLoaded()) return;

    // Check if story progress needs initialization (no blurbs unlocked yet)
    if (state.storyProgress && state.storyProgress.unlockedBlurbs.length === 0) {
      const updatedProgress = initializeWithFirstBlurb(state.storyProgress);
      if (updatedProgress.unlockedBlurbs.length > 0) {
        console.log('[BookOfPassage] Initialized story progress with first blurb');
        setState({ ...state, storyProgress: updatedProgress });
      }
    }
  }, [storyReady, state, setState, initializeWithFirstBlurb]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [currentPage, setCurrentPage] = useState(1);

  // Registry state
  const [registryLoaded, setRegistryLoaded] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  // Restrict access to Story Mode only
  useEffect(() => {
    if (state.gameMode !== 'story') {
      router.push('/puzzle');
    }
  }, [state.gameMode, router]);

  // Load registry for genre information
  useEffect(() => {
    async function loadRegistry() {
      try {
        await bookRegistry.loadRegistry();
        const genres = await bookRegistry.getAllGenres();
        setAvailableGenres(genres.map(g => g.id));
        setRegistryLoaded(true);
      } catch (error) {
        console.warn('Could not load book registry:', error);
        setRegistryLoaded(true); // Continue without registry
      }
    }
    loadRegistry();
  }, []);

  // Process discovered books into display format
  const processedBooks = useMemo((): BookDisplayData[] => {
    if (!state.discoveredBooks || state.discoveredBooks.size === 0) {
      return [];
    }

    const books: BookDisplayData[] = [];

    for (const bookTitle of state.discoveredBooks) {
      const bookData = state.books[bookTitle];
      const partsMap = state.bookPartsMap[bookTitle] || [];

      let completedParts = 0;
      let totalParts = 0;
      let partsStatus: boolean[] = [];

      if (Array.isArray(bookData)) {
        partsStatus = bookData;
        completedParts = bookData.filter(c => c === true).length;
        totalParts = partsMap.length || bookData.length;
      } else if (bookData && typeof bookData === 'object' && bookData.complete) {
        totalParts = partsMap.length || 1;
        completedParts = totalParts;
        partsStatus = Array(totalParts).fill(true);
      }

      const progressPercent = totalParts > 0
        ? Math.round((completedParts / totalParts) * 100)
        : 0;

      // Try to get genre from registry
      let genre = 'unknown';
      const bookId = bookRegistry.getBookIdByTitleSync(bookTitle);
      if (bookId) {
        const bookMeta = bookRegistry.getBookSync(bookId);
        if (bookMeta) {
          genre = bookMeta.genre;
        }
      }

      books.push({
        id: bookId || bookTitle,
        title: bookTitle,
        genre,
        totalParts,
        completedParts,
        progressPercent,
        partsStatus,
        isComplete: completedParts === totalParts && totalParts > 0,
      });
    }

    return books;
  }, [state.discoveredBooks, state.books, state.bookPartsMap]);

  // Get unique genres from discovered books
  const discoveredGenres = useMemo(() => {
    const genres = new Set(processedBooks.map(b => b.genre));
    return Array.from(genres).filter(g => g !== 'unknown').sort();
  }, [processedBooks]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = [...processedBooks]; // Create copy to avoid mutation

    // Genre filter
    if (filterGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === filterGenre);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query)
      );
    }

    // Sort - create new sorted array
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          // Sort by progress descending, then by title for ties
          if (b.progressPercent !== a.progressPercent) {
            return b.progressPercent - a.progressPercent;
          }
          return a.title.localeCompare(b.title);
        case 'genre':
          // Sort by genre, then by title within genre
          const genreCompare = a.genre.localeCompare(b.genre);
          if (genreCompare !== 0) return genreCompare;
          return a.title.localeCompare(b.title);
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [processedBooks, filterGenre, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGenre, sortBy]);

  // Handlers
  const handleBeginCataloging = () => {
    router.push('/library');
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleGenreChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterGenre(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const handleReadStory = useCallback((bookId: string, bookTitle: string) => {
    // TODO: Open story reader modal when implemented
    // For now, show placeholder - will be replaced with modal
    console.log(`[Book of Passage] Opening story reader for: ${bookTitle} (${bookId})`);
    alert(`Story Reader coming soon!\n\nBook: ${bookTitle}\n\nThis will open a modal to read completed story excerpts.`);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = processedBooks.length;
    const completed = processedBooks.filter(b => b.isComplete).length;
    const inProgress = total - completed;
    return { total, completed, inProgress };
  }, [processedBooks]);

  // Format story beat for display
  const formatStoryBeat = (beat: string): string => {
    return beat
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
                className={`${styles.bookTab} ${activeTab === 'current-journey' ? styles.active : ''}`}
                onClick={() => setActiveTab('current-journey')}
              >
                Current Story
              </button>
              {/* Story History tab - only visible when there's history */}
              {hasHistory && storyHistory.length > 1 && (
                <button
                  className={`${styles.bookTab} ${activeTab === 'story-history' ? styles.active : ''}`}
                  onClick={() => setActiveTab('story-history')}
                >
                  Story History ({storyHistory.length})
                </button>
              )}
              <button
                className={`${styles.bookTab} ${activeTab === 'discovered-books' ? styles.active : ''}`}
                onClick={() => setActiveTab('discovered-books')}
              >
                Discovered Books ({stats.total})
              </button>
            </div>

            <div className={styles.pageContent}>
              {/* Current Journey Tab */}
              {activeTab === 'current-journey' && (
                <div className={styles.pageSection}>
                  <h2 className={styles.pageTitle}>Book of Passage</h2>
                  <p className={styles.pageSubtitle}>Your Current Journey</p>

                  <div className={styles.storyContent}>
                    {storyReady && currentBlurb ? (
                      <>
                        <h3 className={styles.blurbTitle}>{currentBlurb.title}</h3>
                        <p><em>{currentBlurb.text}</em></p>
                        <div className={styles.storyBeatIndicator}>
                          {formatStoryBeat(currentBlurb.storyBeat)}
                        </div>
                      </>
                    ) : (
                      <>
                        <p><em>The pages of your Book of Passage shimmer as new words appear...</em></p>
                        <p>Today marks your first day as Assistant Archivist in the vast expanse of the Kethaneum. The cosmic library stretches before you, its infinite shelves holding knowledge from countless worlds and civilizations.</p>
                      </>
                    )}
                  </div>

                  {/* Stats Summary */}
                  {stats.total > 0 && (
                    <div className={styles.statsSummary}>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.total}</span>
                        <span className={styles.statLabel}>Books Discovered</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.completed}</span>
                        <span className={styles.statLabel}>Completed</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.inProgress}</span>
                        <span className={styles.statLabel}>In Progress</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Story History Tab */}
              {activeTab === 'story-history' && (
                <div className={styles.pageSection}>
                  <h2 className={styles.pageTitle}>Story History</h2>
                  <p className={styles.pageSubtitle}>Your Journey Through the Kethaneum</p>

                  {storyHistory.length > 0 ? (
                    <div className={styles.storyHistoryList}>
                      {storyHistory.map((blurb, index) => (
                        <div key={blurb.id} className={styles.historyEntry}>
                          <div className={styles.historyEntryHeader}>
                            <span className={styles.historyEntryNumber}>{index + 1}</span>
                            <h3 className={styles.historyEntryTitle}>{blurb.title}</h3>
                          </div>
                          <p className={styles.historyEntryText}>{blurb.text}</p>
                          <div className={styles.historyEntryMeta}>
                            <span className={styles.historyEntryBeat}>
                              {formatStoryBeat(blurb.storyBeat)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noHistory}>
                      Your story has just begun. Continue your journey to fill these pages.
                    </p>
                  )}
                </div>
              )}

              {/* Discovered Books Tab */}
              {activeTab === 'discovered-books' && (
                <div className={styles.pageSection}>
                  <h2 className={styles.pageTitle}>Discovered Books</h2>
                  <p className={styles.pageSubtitle}>Chronicles You Have Indexed</p>

                  {processedBooks.length > 0 ? (
                    <>
                      {/* Search and Filter Controls */}
                      <div className={styles.filterControls}>
                        <div className={styles.searchBox}>
                          <input
                            type="text"
                            placeholder="Search books..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                            aria-label="Search books"
                          />
                        </div>

                        <div className={styles.filterGroup}>
                          <select
                            value={filterGenre}
                            onChange={handleGenreChange}
                            className={styles.filterSelect}
                            aria-label="Filter by genre"
                          >
                            <option value="all">All Genres</option>
                            {discoveredGenres.map(genre => (
                              <option key={genre} value={genre}>
                                {genre.charAt(0).toUpperCase() + genre.slice(1)}
                              </option>
                            ))}
                          </select>

                          <select
                            value={sortBy}
                            onChange={handleSortChange}
                            className={styles.filterSelect}
                            aria-label="Sort by"
                          >
                            <option value="title">Sort: Title</option>
                            <option value="progress">Sort: Progress</option>
                            <option value="genre">Sort: Genre</option>
                          </select>
                        </div>
                      </div>

                      {/* Results Info */}
                      <div className={styles.resultsInfo}>
                        Showing {paginatedBooks.length} of {filteredBooks.length} books
                        {filterGenre !== 'all' && ` in ${filterGenre}`}
                        {searchQuery && ` matching "${searchQuery}"`}
                      </div>

                      {/* Books List */}
                      <div className={styles.booksList}>
                        {paginatedBooks.map((book) => (
                          <div key={book.id} className={styles.bookEntry}>
                            <div className={styles.bookHeader}>
                              <div className={styles.bookTitleRow}>
                                <h3 className={styles.bookTitle}>{book.title}</h3>
                                <span className={styles.bookGenre}>{book.genre}</span>
                              </div>
                              {book.totalParts > 0 && (
                                <span className={styles.bookProgress}>
                                  {book.completedParts}/{book.totalParts} parts ({book.progressPercent}%)
                                </span>
                              )}
                            </div>

                            {book.totalParts > 0 && (
                              <div className={styles.progressBar}>
                                <div
                                  className={styles.progressFill}
                                  style={{ width: `${book.progressPercent}%` }}
                                />
                              </div>
                            )}

                            {book.totalParts > 1 && (
                              <div className={styles.partsList}>
                                {book.partsStatus.map((completed, idx) => (
                                  <span
                                    key={idx}
                                    className={`${styles.partIndicator} ${completed ? styles.completed : ''}`}
                                    title={`Part ${idx + 1}${completed ? ' (completed)' : ''}`}
                                  >
                                    {idx + 1}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Read Story Button - only show if there's progress */}
                            {book.completedParts > 0 && (
                              <div className={styles.bookActions}>
                                <button
                                  className={styles.readStoryButton}
                                  onClick={() => handleReadStory(book.id, book.title)}
                                  aria-label={`Read story for ${book.title}`}
                                >
                                  Read Story
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className={styles.pagination}>
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={styles.pageButton}
                            aria-label="Previous page"
                          >
                            &larr; Prev
                          </button>

                          <span className={styles.pageInfo}>
                            Page {currentPage} of {totalPages}
                          </span>

                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={styles.pageButton}
                            aria-label="Next page"
                          >
                            Next &rarr;
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className={styles.noBooks}>
                      No books discovered yet. Begin cataloging to discover new knowledge constructs!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomNav}>
        <div className={styles.navOrnament}>
          <button
            className={styles.navButton}
            onClick={handleBeginCataloging}
            data-testid="begin-cataloging-btn"
          >
            Begin Cataloging
          </button>
        </div>
      </div>
    </div>
  );
}
