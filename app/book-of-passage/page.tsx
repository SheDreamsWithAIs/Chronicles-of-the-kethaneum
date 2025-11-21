'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { useGameState } from '@/hooks/useGameState';
import { bookRegistry } from '@/lib/book/bookRegistry';
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

// ============================================================================
// Component
// ============================================================================

export default function BookOfPassageScreen() {
  const router = useRouter();
  const { state } = useGameState();
  const [activeTab, setActiveTab] = useState('book-of-passage');

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
    let filtered = processedBooks;

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

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.progressPercent - a.progressPercent;
        case 'genre':
          return a.genre.localeCompare(b.genre) || a.title.localeCompare(b.title);
        case 'recent':
          // For now, reverse order (most recently added last in set)
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
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

  // Calculate stats
  const stats = useMemo(() => {
    const total = processedBooks.length;
    const completed = processedBooks.filter(b => b.isComplete).length;
    const inProgress = total - completed;
    return { total, completed, inProgress };
  }, [processedBooks]);

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
                Discovered Books ({stats.total})
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
