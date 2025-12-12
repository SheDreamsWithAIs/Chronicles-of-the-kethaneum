/**
 * Save Data Migration Utilities for Chronicles of the Kethaneum
 *
 * Handles migration from old save format (v1) to optimized format (v2).
 * Includes backup creation and rollback capabilities.
 */

import { bookRegistry } from '../book/bookRegistry';
import { encodeParts } from '../book/progressBitmap';
import type { SavedProgress } from './saveSystem';
import type { OptimizedProgress } from './optimizedSaveSystem';

// ============================================================================
// Types
// ============================================================================

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  data: OptimizedProgress | null;
  error?: string;
  stats?: MigrationStats;
}

export interface MigrationStats {
  booksConverted: number;
  booksFailed: number;
  puzzlesConverted: number;
  originalSize: number;
  newSize: number;
  savedBytes: number;
  savedPercentage: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kethaneumProgress';
const BACKUP_KEY = 'kethaneumProgress_backup_v1';
const CURRENT_VERSION = 2;

// ============================================================================
// Migration Detection
// ============================================================================

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const data = JSON.parse(saved);

    // Version 2+ = already migrated
    if ('v' in data && data.v >= 2) {
      return false;
    }

    // Old format detected (no version or version 1)
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current save format version
 */
export function getCurrentVersion(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 0;

    const data = JSON.parse(saved);
    return data.v || 1;
  } catch {
    return 0;
  }
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migrate from v1 (original) to v2 (optimized) format
 */
export async function migrateV1toV2(
  oldData: SavedProgress
): Promise<MigrationResult> {
  const stats: MigrationStats = {
    booksConverted: 0,
    booksFailed: 0,
    puzzlesConverted: 0,
    originalSize: 0,
    newSize: 0,
    savedBytes: 0,
    savedPercentage: 0,
  };

  try {
    // Load the registry for title-to-ID conversion
    await bookRegistry.loadRegistry();

    // Track discovered book IDs and their progress
    const discoveredIds: string[] = [];
    const progressMap: { [bookId: string]: number } = {};

    // Convert discovered books
    for (const title of oldData.discoveredBooks || []) {
      const bookId = bookRegistry.getBookIdByTitleSync(title);

      if (!bookId) {
        // Book not in registry - skip but count as failed
        console.warn(`Migration: Book "${title}" not found in registry`);
        stats.booksFailed++;
        continue;
      }

      discoveredIds.push(bookId);
      stats.booksConverted++;

      // Convert progress to bitmap
      const bookData = oldData.books[title];
      if (Array.isArray(bookData)) {
        progressMap[bookId] = encodeParts(bookData);
      } else if (bookData && typeof bookData === 'object' && 'complete' in bookData && bookData.complete) {
        // Book marked complete - get total parts and set all bits
        const book = bookRegistry.getBookSync(bookId);
        if (book) {
          progressMap[bookId] = (1 << book.parts) - 1;
        }
      }
    }

    // Convert completed puzzles by genre
    const completedByGenre: { [genre: string]: string[] } = {};

    if (oldData.completedPuzzlesByGenre) {
      for (const [genre, titles] of Object.entries(oldData.completedPuzzlesByGenre)) {
        const ids: string[] = [];

        for (const title of titles) {
          const bookId = bookRegistry.getBookIdByTitleSync(title);
          // Keep ID if found, otherwise keep original title
          ids.push(bookId || title);
          stats.puzzlesConverted++;
        }

        if (ids.length > 0) {
          completedByGenre[genre] = ids;
        }
      }
    }

    // Map game mode
    const gameModeMap: { [key: string]: string } = {
      story: 's',
      'puzzle-only': 'p',
      'beat-the-clock': 'b',
    };

    // Build optimized progress object
    const optimized: OptimizedProgress = {
      v: CURRENT_VERSION,
      d: discoveredIds.join(','),
      p: progressMap,
      g: completedByGenre,
      m: gameModeMap[oldData.gameMode || 'story'] || 's',
      n: oldData.completedPuzzles || 0,
    };

    // Add current state if present
    if (oldData.currentBook && oldData.currentStoryPart !== undefined) {
      const currentBookId = bookRegistry.getBookIdByTitleSync(oldData.currentBook);
      if (currentBookId) {
        optimized.c = {
          g: oldData.currentGenre || '',
          b: currentBookId,
          p: oldData.currentStoryPart,
          i: oldData.currentPuzzleIndex || 0,
        };
      }
    }

    // Add selection state if present
    if (
      oldData.selectedGenre ||
      oldData.nextKethaneumIndex !== undefined ||
      oldData.kethaneumRevealed
    ) {
      optimized.s = {
        g: oldData.selectedGenre || '',
        k: oldData.nextKethaneumIndex || 0,
        p: oldData.puzzlesSinceLastKethaneum || 0,
        i: oldData.nextKethaneumInterval || 3,
        r: oldData.kethaneumRevealed || false,
        e: oldData.genreExhausted || false,
      };
    }

    // Calculate size savings
    const originalJson = JSON.stringify(oldData);
    const newJson = JSON.stringify(optimized);
    stats.originalSize = new Blob([originalJson]).size;
    stats.newSize = new Blob([newJson]).size;
    stats.savedBytes = stats.originalSize - stats.newSize;
    stats.savedPercentage = Math.round((stats.savedBytes / stats.originalSize) * 100);

    return {
      success: true,
      fromVersion: 1,
      toVersion: CURRENT_VERSION,
      data: optimized,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      fromVersion: 1,
      toVersion: CURRENT_VERSION,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown migration error',
      stats,
    };
  }
}

// ============================================================================
// Backup Functions
// ============================================================================

/**
 * Create a backup of the current save before migration
 */
export function createBackup(): boolean {
  try {
    const currentSave = localStorage.getItem(STORAGE_KEY);
    if (!currentSave) return false;

    localStorage.setItem(BACKUP_KEY, currentSave);
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
}

/**
 * Check if a backup exists
 */
export function hasBackup(): boolean {
  return localStorage.getItem(BACKUP_KEY) !== null;
}

/**
 * Restore from backup (rollback migration)
 */
export function restoreFromBackup(): boolean {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) {
      console.warn('No backup found to restore');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, backup);
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

/**
 * Delete the backup after successful migration verification
 */
export function deleteBackup(): void {
  localStorage.removeItem(BACKUP_KEY);
}

/**
 * Get backup data (for inspection)
 */
export function getBackupData(): SavedProgress | null {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return null;
    return JSON.parse(backup);
  } catch {
    return null;
  }
}

// ============================================================================
// Main Migration Entry Point
// ============================================================================

/**
 * Automatically detect and run migration if needed
 * Returns the migrated data or null if no migration needed/failed
 */
export async function autoMigrate(): Promise<MigrationResult | null> {
  // Check if migration is needed
  if (!needsMigration()) {
    return null;
  }


  // Load old data
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  let oldData: SavedProgress;
  try {
    oldData = JSON.parse(saved);
  } catch (error) {
    console.error('Failed to parse save data for migration:', error);
    return {
      success: false,
      fromVersion: 1,
      toVersion: CURRENT_VERSION,
      data: null,
      error: 'Failed to parse save data',
    };
  }

  // Create backup before migration
  const backupCreated = createBackup();
  if (!backupCreated) {
    console.warn('Could not create backup - proceeding with migration anyway');
  }

  // Run migration
  const result = await migrateV1toV2(oldData);

  if (result.success && result.data) {
    // Save migrated data
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
    } catch (error) {
      // Rollback on save failure
      if (backupCreated) {
        restoreFromBackup();
      }
      return {
        ...result,
        success: false,
        error: 'Failed to save migrated data',
      };
    }
  } else if (backupCreated) {
    // Rollback on migration failure
    restoreFromBackup();
  }

  return result;
}

// ============================================================================
// Utility: Manual Migration Trigger
// ============================================================================

/**
 * Force migration even if already migrated (useful for testing)
 * WARNING: This will overwrite current save!
 */
export async function forceMigration(
  oldData: SavedProgress
): Promise<MigrationResult> {
  createBackup();
  const result = await migrateV1toV2(oldData);

  if (result.success && result.data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
  }

  return result;
}

/**
 * Get migration status info
 */
export function getMigrationStatus(): {
  currentVersion: number;
  needsMigration: boolean;
  hasBackup: boolean;
  targetVersion: number;
} {
  return {
    currentVersion: getCurrentVersion(),
    needsMigration: needsMigration(),
    hasBackup: hasBackup(),
    targetVersion: CURRENT_VERSION,
  };
}
