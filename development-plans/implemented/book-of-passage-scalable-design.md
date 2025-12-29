# Book of Passage - Scalable Design for 2500+ Puzzles

## Overview

This document outlines a scalable system for tracking hundreds to thousands of discovered books and puzzles in Chronicles of the Kethaneum, designed to:
- Support 2500+ puzzles (10 genres × 50 books × 5 parts each)
- Minimize localStorage usage (target: 70-80% reduction)
- Enable easy addition of new books/puzzles
- Provide efficient UI rendering with pagination
- Maintain backward compatibility with existing saves

## Current System Analysis

### Storage Overhead Issues

**Current structure stores:**
```typescript
{
  books: {
    "The Chronicles of Ancient Earth": [true, false, true, false],
    "Mysteries of the Deep": { complete: true }
  },
  discoveredBooks: ["The Chronicles of Ancient Earth", "Mysteries..."],
  bookPartsMap: { "The Chronicles of Ancient Earth": [0, 1, 2, 3] },
  completedPuzzlesByGenre: {
    "nature": ["Forest Secrets", "Ocean Depths", ...]
  }
}
```

**Problems at scale:**
- Full book titles repeated multiple times (3+ locations)
- Boolean arrays for each book's parts
- No data compression
- All books loaded into UI at once
- ~150-200 bytes per book = **375-500 KB for 2500 books**

---

## Optimized Design

### 1. Book Registry System

Create a centralized registry that maps short IDs to book metadata.

**File: `/public/data/bookRegistry.json`**
```json
{
  "version": 1,
  "books": {
    "K001": {
      "title": "The Chronicles of Ancient Earth",
      "genre": "kethaneum",
      "parts": 5,
      "order": 1
    },
    "K002": {
      "title": "Mysteries of the Deep",
      "genre": "kethaneum",
      "parts": 4,
      "order": 2
    },
    "N001": {
      "title": "Forest Secrets",
      "genre": "nature",
      "parts": 3,
      "order": 1
    }
  },
  "genres": {
    "kethaneum": { "name": "Kethaneum", "bookCount": 50 },
    "nature": { "name": "Nature", "bookCount": 50 },
    "science": { "name": "Science", "bookCount": 50 }
  }
}
```

**Benefits:**
- Books referenced by short ID (4 chars vs 20-40 chars)
- Single source of truth for book metadata
- Easy to add new books (just append to registry)
- Supports versioning for migrations

---

### 2. Compact Progress Storage

Use bitwise operations and compact encoding for progress tracking.

**Optimized localStorage structure:**
```typescript
interface OptimizedProgress {
  v: number;                    // Version (for migrations)
  b: string;                    // Discovered books (bit-packed)
  p: { [bookId: string]: number }; // Progress bitmap per book
  g: { [genre: string]: string[] }; // Completed puzzle IDs by genre
  m: string;                    // Game mode
  c?: CompactCurrentState;      // Current puzzle state
}

interface CompactCurrentState {
  g: string;  // Current genre
  b: string;  // Current book ID
  p: number;  // Current part
  i: number;  // Current puzzle index
}
```

**Example:**
```json
{
  "v": 1,
  "b": "K001,K002,N001,N003",
  "p": {
    "K001": 21,
    "K002": 15,
    "N001": 7
  },
  "g": {
    "nature": ["N001", "N003", "N005"],
    "kethaneum": ["K001"]
  },
  "m": "story",
  "c": { "g": "nature", "b": "N003", "p": 2, "i": 5 }
}
```

**Storage savings:**
- Book IDs: 4 bytes vs 20-40 bytes (80-90% reduction)
- Progress bitmap: 1-2 bytes vs array of booleans (75% reduction)
- **Estimated: 20-40 bytes per book = 50-100 KB for 2500 books**

---

### 3. Progress Bitmap Encoding

Store part completion as a single number using bit flags.

**Encoding system:**
```typescript
// Each bit represents a part's completion status
// Part 0 = bit 0, Part 1 = bit 1, etc.

// Example: Book with 5 parts, parts 0, 2, 4 completed
// Binary: 0b10101 = 21
// Progress: [true, false, true, false, true]

function encodeParts(completed: boolean[]): number {
  return completed.reduce((acc, val, idx) =>
    acc | (val ? (1 << idx) : 0), 0
  );
}

function decodeParts(bitmap: number, totalParts: number): boolean[] {
  return Array.from({ length: totalParts }, (_, i) =>
    Boolean(bitmap & (1 << i))
  );
}

function isPartCompleted(bitmap: number, partIndex: number): boolean {
  return Boolean(bitmap & (1 << partIndex));
}

function completePartOptimized(bitmap: number, partIndex: number): number {
  return bitmap | (1 << partIndex);
}

function getCompletedCount(bitmap: number): number {
  let count = 0;
  while (bitmap) {
    count += bitmap & 1;
    bitmap >>= 1;
  }
  return count;
}
```

**Benefits:**
- Supports up to 32 parts per book (JavaScript bitwise limit)
- Instant part completion checks
- Minimal storage (1-2 bytes vs 3-32 bytes)
- Fast completion percentage calculation

---

### 4. Lazy Loading & Registry Management

Load book metadata on-demand and cache in memory.

**File: `/lib/book/bookRegistry.ts`**
```typescript
interface BookMetadata {
  title: string;
  genre: string;
  parts: number;
  order: number;
}

interface BookRegistry {
  version: number;
  books: { [bookId: string]: BookMetadata };
  genres: { [genreId: string]: { name: string; bookCount: number } };
}

class BookRegistryManager {
  private static instance: BookRegistryManager;
  private registry: BookRegistry | null = null;
  private cache: Map<string, BookMetadata> = new Map();

  static getInstance(): BookRegistryManager {
    if (!this.instance) {
      this.instance = new BookRegistryManager();
    }
    return this.instance;
  }

  async loadRegistry(): Promise<BookRegistry> {
    if (this.registry) return this.registry;

    const response = await fetch('/data/bookRegistry.json');
    this.registry = await response.json();
    return this.registry;
  }

  async getBook(bookId: string): Promise<BookMetadata | null> {
    if (this.cache.has(bookId)) {
      return this.cache.get(bookId)!;
    }

    const registry = await this.loadRegistry();
    const book = registry.books[bookId];

    if (book) {
      this.cache.set(bookId, book);
    }

    return book || null;
  }

  async getBooksByGenre(genre: string): Promise<[string, BookMetadata][]> {
    const registry = await this.loadRegistry();
    return Object.entries(registry.books)
      .filter(([_, book]) => book.genre === genre)
      .sort((a, b) => a[1].order - b[1].order);
  }

  async getAllGenres(): Promise<string[]> {
    const registry = await this.loadRegistry();
    return Object.keys(registry.genres);
  }

  getNextBookId(genre: string, currentHighest: number): string {
    const prefix = genre.charAt(0).toUpperCase();
    const num = String(currentHighest + 1).padStart(3, '0');
    return `${prefix}${num}`;
  }
}

export const bookRegistry = BookRegistryManager.getInstance();
```

---

### 5. Migration System

Handle version upgrades seamlessly.

**File: `/lib/save/migrations.ts`**
```typescript
import type { SavedProgress } from './saveSystem';
import type { OptimizedProgress } from './optimizedSaveSystem';
import { bookRegistry } from '../book/bookRegistry';

interface MigrationResult {
  success: boolean;
  data: OptimizedProgress | null;
  error?: string;
}

export async function migrateToV1(
  oldData: SavedProgress
): Promise<MigrationResult> {
  try {
    await bookRegistry.loadRegistry();

    // Build book ID map
    const titleToIdMap = new Map<string, string>();
    const registry = await bookRegistry.loadRegistry();

    for (const [id, book] of Object.entries(registry.books)) {
      titleToIdMap.set(book.title, id);
    }

    // Convert discovered books to compact IDs
    const discoveredIds: string[] = [];
    const progressMap: { [bookId: string]: number } = {};

    for (const title of oldData.discoveredBooks || []) {
      const bookId = titleToIdMap.get(title);
      if (!bookId) continue;

      discoveredIds.push(bookId);

      // Convert progress array to bitmap
      const bookData = oldData.books[title];
      if (Array.isArray(bookData)) {
        progressMap[bookId] = encodeParts(bookData);
      } else if (bookData?.complete) {
        // All parts completed
        const book = await bookRegistry.getBook(bookId);
        if (book) {
          progressMap[bookId] = (1 << book.parts) - 1;
        }
      }
    }

    // Convert completed puzzles to IDs
    const completedByGenre: { [genre: string]: string[] } = {};

    for (const [genre, titles] of Object.entries(
      oldData.completedPuzzlesByGenre || {}
    )) {
      completedByGenre[genre] = titles
        .map(title => titleToIdMap.get(title))
        .filter(Boolean) as string[];
    }

    const optimized: OptimizedProgress = {
      v: 1,
      b: discoveredIds.join(','),
      p: progressMap,
      g: completedByGenre,
      m: oldData.gameMode || 'story',
    };

    if (oldData.currentBook && oldData.currentStoryPart !== undefined) {
      const currentId = titleToIdMap.get(oldData.currentBook);
      if (currentId) {
        optimized.c = {
          g: oldData.currentGenre || '',
          b: currentId,
          p: oldData.currentStoryPart,
          i: oldData.currentPuzzleIndex || 0,
        };
      }
    }

    return { success: true, data: optimized };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function encodeParts(completed: boolean[]): number {
  return completed.reduce((acc, val, idx) =>
    acc | (val ? (1 << idx) : 0), 0
  );
}

export async function detectAndMigrate(): Promise<OptimizedProgress | null> {
  const oldData = localStorage.getItem('kethaneumProgress');
  if (!oldData) return null;

  try {
    const parsed = JSON.parse(oldData);

    // Check if already migrated
    if ('v' in parsed && parsed.v === 1) {
      return parsed as OptimizedProgress;
    }

    // Migrate from old format
    const result = await migrateToV1(parsed);

    if (result.success && result.data) {
      // Backup old data
      localStorage.setItem(
        'kethaneumProgress_backup',
        oldData
      );

      // Save migrated data
      localStorage.setItem(
        'kethaneumProgress',
        JSON.stringify(result.data)
      );

      return result.data;
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }

  return null;
}
```

---

### 6. Optimized Save/Load System

**File: `/lib/save/optimizedSaveSystem.ts`**
```typescript
import { bookRegistry } from '../book/bookRegistry';

export interface OptimizedProgress {
  v: number;
  b: string;
  p: { [bookId: string]: number };
  g: { [genre: string]: string[] };
  m: string;
  c?: {
    g: string;
    b: string;
    p: number;
    i: number;
  };
}

export interface DecodedProgress {
  discoveredBooks: Map<string, BookProgress>;
  completedByGenre: Map<string, Set<string>>;
  gameMode: string;
  currentState?: {
    genre: string;
    bookId: string;
    part: number;
    puzzleIndex: number;
  };
}

export interface BookProgress {
  bookId: string;
  title: string;
  genre: string;
  totalParts: number;
  completedParts: boolean[];
  progressBitmap: number;
}

export async function saveOptimizedProgress(
  progress: OptimizedProgress
): Promise<void> {
  try {
    localStorage.setItem('kethaneumProgress', JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save optimized progress:', error);
    throw error;
  }
}

export async function loadOptimizedProgress(): Promise<DecodedProgress | null> {
  try {
    const saved = localStorage.getItem('kethaneumProgress');
    if (!saved) return null;

    const data: OptimizedProgress = JSON.parse(saved);

    // Decode progress
    const discoveredBooks = new Map<string, BookProgress>();
    const bookIds = data.b ? data.b.split(',').filter(Boolean) : [];

    for (const bookId of bookIds) {
      const book = await bookRegistry.getBook(bookId);
      if (!book) continue;

      const bitmap = data.p[bookId] || 0;
      const completedParts = decodeParts(bitmap, book.parts);

      discoveredBooks.set(bookId, {
        bookId,
        title: book.title,
        genre: book.genre,
        totalParts: book.parts,
        completedParts,
        progressBitmap: bitmap,
      });
    }

    // Decode completed puzzles
    const completedByGenre = new Map<string, Set<string>>();
    for (const [genre, ids] of Object.entries(data.g || {})) {
      completedByGenre.set(genre, new Set(ids));
    }

    return {
      discoveredBooks,
      completedByGenre,
      gameMode: data.m,
      currentState: data.c ? {
        genre: data.c.g,
        bookId: data.c.b,
        part: data.c.p,
        puzzleIndex: data.c.i,
      } : undefined,
    };
  } catch (error) {
    console.error('Failed to load optimized progress:', error);
    return null;
  }
}

export function decodeParts(bitmap: number, totalParts: number): boolean[] {
  return Array.from({ length: totalParts }, (_, i) =>
    Boolean(bitmap & (1 << i))
  );
}

export function encodeParts(completed: boolean[]): number {
  return completed.reduce((acc, val, idx) =>
    acc | (val ? (1 << idx) : 0), 0
  );
}

export function completePart(bitmap: number, partIndex: number): number {
  return bitmap | (1 << partIndex);
}

export function isPartCompleted(bitmap: number, partIndex: number): boolean {
  return Boolean(bitmap & (1 << partIndex));
}

export function getCompletedCount(bitmap: number): number {
  let count = 0;
  let n = bitmap;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

export function isBookCompleted(bitmap: number, totalParts: number): boolean {
  const allCompleted = (1 << totalParts) - 1;
  return bitmap === allCompleted;
}
```

---

### 7. Paginated Book of Passage UI

Update the UI to handle thousands of books with pagination.

**File: `/app/book-of-passage/page.tsx` (Enhanced)**
```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadOptimizedProgress, type BookProgress } from '@/lib/save/optimizedSaveSystem';

const BOOKS_PER_PAGE = 20;

export default function BookOfPassageScreen() {
  const [books, setBooks] = useState<BookProgress[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'progress'>('title');

  useEffect(() => {
    async function loadBooks() {
      const progress = await loadOptimizedProgress();
      if (!progress) return;

      const bookList = Array.from(progress.discoveredBooks.values());
      setBooks(bookList);
    }
    loadBooks();
  }, []);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Genre filter
    if (filterGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === filterGenre);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        const aProgress = a.completedParts.filter(Boolean).length / a.totalParts;
        const bProgress = b.completedParts.filter(Boolean).length / b.totalParts;
        return bProgress - aProgress;
      }
    });

    return filtered;
  }, [books, filterGenre, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  // Get unique genres
  const genres = useMemo(() => {
    const genreSet = new Set(books.map(book => book.genre));
    return ['all', ...Array.from(genreSet).sort()];
  }, [books]);

  return (
    <div className={styles.bookPassageContainer}>
      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />

        <select
          value={filterGenre}
          onChange={(e) => {
            setFilterGenre(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.genreFilter}
        >
          {genres.map(genre => (
            <option key={genre} value={genre}>
              {genre === 'all' ? 'All Genres' : genre}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'title' | 'progress')}
          className={styles.sortSelect}
        >
          <option value="title">Sort by Title</option>
          <option value="progress">Sort by Progress</option>
        </select>
      </div>

      {/* Books List */}
      <div className={styles.booksList}>
        {paginatedBooks.map((book) => {
          const completed = book.completedParts.filter(Boolean).length;
          const progressPercent = Math.round(
            (completed / book.totalParts) * 100
          );

          return (
            <div key={book.bookId} className={styles.bookEntry}>
              <div className={styles.bookHeader}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                <span className={styles.bookGenre}>{book.genre}</span>
                <span className={styles.bookProgress}>
                  {completed}/{book.totalParts} ({progressPercent}%)
                </span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {book.totalParts > 1 && (
                <div className={styles.partsList}>
                  {book.completedParts.map((completed, idx) => (
                    <span
                      key={idx}
                      className={`${styles.partIndicator} ${
                        completed ? styles.completed : ''
                      }`}
                      title={`Part ${idx + 1}${completed ? ' (completed)' : ''}`}
                    >
                      {idx + 1}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Previous
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages} ({filteredBooks.length} books)
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 8. Easy Book Addition System

Create a simple tool for adding new books to the registry.

**File: `/scripts/addBook.js`**
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function addBook() {
  console.log('\n=== Add New Book to Registry ===\n');

  const title = await question('Book title: ');
  const genre = await question('Genre: ');
  const parts = parseInt(await question('Number of parts: '), 10);

  const registryPath = path.join(__dirname, '../public/data/bookRegistry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  // Generate book ID
  const prefix = genre.charAt(0).toUpperCase();
  const genreBooks = Object.keys(registry.books)
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.slice(1), 10))
    .sort((a, b) => b - a);

  const nextNum = genreBooks.length > 0 ? genreBooks[0] + 1 : 1;
  const bookId = `${prefix}${String(nextNum).padStart(3, '0')}`;

  // Get order
  const genreBookCount = Object.values(registry.books)
    .filter(b => b.genre === genre).length;

  registry.books[bookId] = {
    title,
    genre,
    parts,
    order: genreBookCount + 1
  };

  // Update genre count
  if (!registry.genres[genre]) {
    registry.genres[genre] = { name: genre, bookCount: 0 };
  }
  registry.genres[genre].bookCount++;

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

  console.log(`\n✓ Book added successfully!`);
  console.log(`  ID: ${bookId}`);
  console.log(`  Title: ${title}`);
  console.log(`  Genre: ${genre}`);
  console.log(`  Parts: ${parts}\n`);

  rl.close();
}

addBook().catch(console.error);
```

**Usage:**
```bash
node scripts/addBook.js
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create book registry JSON structure
- [ ] Implement BookRegistryManager
- [ ] Add bitmap encoding/decoding utilities
- [ ] Write unit tests for encoding functions

### Phase 2: Storage Migration
- [ ] Implement optimized save/load system
- [ ] Create migration utilities
- [ ] Add backward compatibility layer
- [ ] Test migration with sample data

### Phase 3: UI Updates
- [ ] Add pagination to Book of Passage
- [ ] Implement search and filtering
- [ ] Add genre-based navigation
- [ ] Optimize rendering performance

### Phase 4: Developer Tools
- [ ] Create addBook.js script
- [ ] Add bulk import tool
- [ ] Create validation utilities
- [ ] Write documentation

### Phase 5: Testing & Deployment
- [ ] Test with 2500+ books
- [ ] Measure storage savings
- [ ] Performance benchmarking
- [ ] Deploy with migration support

---

## Performance Metrics

### Storage Comparison

| Books | Current | Optimized | Savings |
|-------|---------|-----------|---------|
| 100   | 15-20 KB| 4-5 KB    | 75%     |
| 500   | 75-100 KB| 15-20 KB | 80%     |
| 2500  | 375-500 KB| 75-100 KB| 80%    |

### Benefits

1. **Storage**: 70-80% reduction in localStorage usage
2. **Performance**: Faster load times with lazy loading
3. **Scalability**: Supports 10,000+ books with same system
4. **Flexibility**: Add books with single JSON entry
5. **UX**: Pagination prevents UI lag with thousands of books

---

## Future Enhancements

1. **Compression**: Use LZ-string for further compression
2. **Cloud Sync**: Store progress in cloud with sync
3. **Analytics**: Track popular books and completion rates
4. **Export**: Allow players to export their progress
5. **Search**: Full-text search across book content
6. **Collections**: Group books into player-defined collections

---

## Conclusion

This design provides a robust, scalable foundation for tracking thousands of puzzles while maintaining excellent performance and developer experience. The system can easily scale beyond 2500 books if needed, and the migration system ensures existing players won't lose progress.
