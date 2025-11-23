/**
 * Book Registry Manager for Chronicles of the Kethaneum
 *
 * Provides efficient access to book metadata through a centralized registry.
 * Uses compact IDs (e.g., "K001") instead of full titles to minimize storage.
 */

import { fetchAsset } from '@/lib/utils/assetPath';

// ============================================================================
// Types
// ============================================================================

export interface BookMetadata {
  title: string;
  genre: string;
  parts: number;
  order: number;
}

export interface GenreMetadata {
  name: string;
  description?: string;
  bookCount: number;
}

export interface BookRegistry {
  version: number;
  books: { [bookId: string]: BookMetadata };
  genres: { [genreId: string]: GenreMetadata };
}

export interface BookWithId extends BookMetadata {
  bookId: string;
}

// ============================================================================
// BookRegistryManager - Singleton for registry access
// ============================================================================

class BookRegistryManager {
  private static instance: BookRegistryManager;
  private registry: BookRegistry | null = null;
  private cache: Map<string, BookMetadata> = new Map();
  private titleToIdMap: Map<string, string> = new Map();
  private isLoading: boolean = false;
  private loadPromise: Promise<BookRegistry> | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): BookRegistryManager {
    if (!BookRegistryManager.instance) {
      BookRegistryManager.instance = new BookRegistryManager();
    }
    return BookRegistryManager.instance;
  }

  /**
   * Load the registry from the JSON file
   * Uses a promise cache to prevent duplicate fetches
   */
  async loadRegistry(): Promise<BookRegistry> {
    // Return cached registry if available
    if (this.registry) {
      return this.registry;
    }

    // If already loading, wait for the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.fetchRegistry();

    try {
      this.registry = await this.loadPromise;
      this.buildCaches();
      return this.registry;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Fetch the registry from the server
   */
  private async fetchRegistry(): Promise<BookRegistry> {
    const response = await fetchAsset('/data/bookRegistry.json');
    if (!response.ok) {
      throw new Error(`Failed to load book registry: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Build internal caches for fast lookups
   */
  private buildCaches(): void {
    if (!this.registry) return;

    this.cache.clear();
    this.titleToIdMap.clear();

    for (const [bookId, book] of Object.entries(this.registry.books)) {
      this.cache.set(bookId, book);
      this.titleToIdMap.set(book.title.toLowerCase(), bookId);
    }
  }

  /**
   * Get book metadata by ID
   */
  async getBook(bookId: string): Promise<BookMetadata | null> {
    // Check cache first
    if (this.cache.has(bookId)) {
      return this.cache.get(bookId)!;
    }

    // Load registry if not loaded
    const registry = await this.loadRegistry();
    return registry.books[bookId] || null;
  }

  /**
   * Get book metadata by ID (synchronous - requires registry to be loaded)
   */
  getBookSync(bookId: string): BookMetadata | null {
    return this.cache.get(bookId) || null;
  }

  /**
   * Get book ID by title (case-insensitive)
   */
  async getBookIdByTitle(title: string): Promise<string | null> {
    await this.loadRegistry();
    return this.titleToIdMap.get(title.toLowerCase()) || null;
  }

  /**
   * Get book ID by title (synchronous - requires registry to be loaded)
   */
  getBookIdByTitleSync(title: string): string | null {
    return this.titleToIdMap.get(title.toLowerCase()) || null;
  }

  /**
   * Get all books in a genre, sorted by order
   */
  async getBooksByGenre(genre: string): Promise<BookWithId[]> {
    const registry = await this.loadRegistry();
    const genreLower = genre.toLowerCase();

    return Object.entries(registry.books)
      .filter(([_, book]) => book.genre.toLowerCase() === genreLower)
      .map(([bookId, book]) => ({ bookId, ...book }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get all available genres
   */
  async getAllGenres(): Promise<{ id: string; metadata: GenreMetadata }[]> {
    const registry = await this.loadRegistry();
    return Object.entries(registry.genres).map(([id, metadata]) => ({
      id,
      metadata,
    }));
  }

  /**
   * Get genre metadata by ID
   */
  async getGenre(genreId: string): Promise<GenreMetadata | null> {
    const registry = await this.loadRegistry();
    return registry.genres[genreId.toLowerCase()] || null;
  }

  /**
   * Get all books as an array with IDs
   */
  async getAllBooks(): Promise<BookWithId[]> {
    const registry = await this.loadRegistry();
    return Object.entries(registry.books).map(([bookId, book]) => ({
      bookId,
      ...book,
    }));
  }

  /**
   * Get the total number of books in the registry
   */
  async getBookCount(): Promise<number> {
    const registry = await this.loadRegistry();
    return Object.keys(registry.books).length;
  }

  /**
   * Get the total number of parts across all books
   */
  async getTotalParts(): Promise<number> {
    const registry = await this.loadRegistry();
    return Object.values(registry.books).reduce(
      (total, book) => total + book.parts,
      0
    );
  }

  /**
   * Generate the next book ID for a genre
   */
  async getNextBookId(genre: string): Promise<string> {
    const registry = await this.loadRegistry();
    const prefix = genre.charAt(0).toUpperCase();

    // Find highest existing ID for this genre prefix
    const existingIds = Object.keys(registry.books)
      .filter((id) => id.startsWith(prefix))
      .map((id) => parseInt(id.slice(1), 10))
      .filter((num) => !isNaN(num));

    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Check if the registry is loaded
   */
  isLoaded(): boolean {
    return this.registry !== null;
  }

  /**
   * Get the registry version
   */
  async getVersion(): Promise<number> {
    const registry = await this.loadRegistry();
    return registry.version;
  }

  /**
   * Clear all caches (useful for testing or hot-reloading)
   */
  clearCache(): void {
    this.registry = null;
    this.cache.clear();
    this.titleToIdMap.clear();
    this.loadPromise = null;
  }

  /**
   * Check if a book ID exists
   */
  async bookExists(bookId: string): Promise<boolean> {
    const registry = await this.loadRegistry();
    return bookId in registry.books;
  }

  /**
   * Check if a book title exists (case-insensitive)
   */
  async titleExists(title: string): Promise<boolean> {
    await this.loadRegistry();
    return this.titleToIdMap.has(title.toLowerCase());
  }
}

// Export singleton instance
export const bookRegistry = BookRegistryManager.getInstance();

// Export class for testing purposes
export { BookRegistryManager };
