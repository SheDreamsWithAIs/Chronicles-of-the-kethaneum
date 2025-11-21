/**
 * Unified Save System for Chronicles of the Kethaneum
 *
 * Provides backward-compatible save/load operations that:
 * - Automatically detect save format version
 * - Migrate old saves to optimized format on load
 * - Always save in optimized format
 * - Return data in format compatible with existing game code
 *
 * This is the recommended entry point for all save operations.
 */

import type { GameState } from '../game/state';
import type { SavedProgress } from './saveSystem';
import {
  saveOptimizedProgress,
  loadOptimizedProgress,
  convertToGameStateFormat,
  isOptimizedFormat,
  getStorageSize,
  clearOptimizedProgress,
} from './optimizedSaveSystem';
import {
  autoMigrate,
  needsMigration,
  getMigrationStatus,
  hasBackup,
  restoreFromBackup,
  deleteBackup,
} from './migrations';
import { loadGameProgress as loadLegacyProgress } from './saveSystem';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedLoadResult {
  success: boolean;
  data: Partial<GameState> | null;
  wasMigrated: boolean;
  version: number;
  error?: string;
}

export interface SaveSystemInfo {
  version: number;
  isOptimized: boolean;
  needsMigration: boolean;
  hasBackup: boolean;
  storageSize: { bytes: number; formatted: string };
}

// ============================================================================
// Main Save/Load Functions
// ============================================================================

/**
 * Save game progress using the optimized format
 * This is the primary save function to use throughout the app
 */
export async function saveProgress(state: GameState): Promise<void> {
  await saveOptimizedProgress(state);
}

/**
 * Load game progress with automatic migration
 * Returns data in GameState-compatible format
 */
export async function loadProgress(): Promise<UnifiedLoadResult> {
  try {
    // Check if migration is needed
    if (needsMigration()) {
      console.log('Unified Save: Old format detected, running migration...');

      const migrationResult = await autoMigrate();

      if (migrationResult && migrationResult.success) {
        console.log('Unified Save: Migration successful', migrationResult.stats);

        // Load the freshly migrated data
        const decoded = await loadOptimizedProgress();
        if (decoded) {
          const gameStateData = await convertToGameStateFormat(decoded);
          return {
            success: true,
            data: gameStateData,
            wasMigrated: true,
            version: 2,
          };
        }
      } else {
        // Migration failed - try loading legacy format as fallback
        console.warn('Unified Save: Migration failed, falling back to legacy load');
        const legacyData = loadLegacyProgress();

        if (legacyData) {
          return {
            success: true,
            data: convertLegacyToGameState(legacyData),
            wasMigrated: false,
            version: 1,
            error: migrationResult?.error,
          };
        }
      }
    }

    // Try loading optimized format
    const decoded = await loadOptimizedProgress();

    if (decoded) {
      const gameStateData = await convertToGameStateFormat(decoded);
      return {
        success: true,
        data: gameStateData,
        wasMigrated: false,
        version: 2,
      };
    }

    // Try legacy format as final fallback
    const legacyData = loadLegacyProgress();
    if (legacyData) {
      return {
        success: true,
        data: convertLegacyToGameState(legacyData),
        wasMigrated: false,
        version: 1,
      };
    }

    // No save data found
    return {
      success: true,
      data: null,
      wasMigrated: false,
      version: 0,
    };
  } catch (error) {
    console.error('Unified Save: Load failed', error);
    return {
      success: false,
      data: null,
      wasMigrated: false,
      version: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert legacy SavedProgress to GameState-compatible format
 */
function convertLegacyToGameState(legacy: SavedProgress): Partial<GameState> {
  // Convert completedPuzzlesByGenre arrays to Sets
  const completedPuzzlesByGenre: { [genre: string]: Set<string> } = {};
  if (legacy.completedPuzzlesByGenre) {
    for (const [genre, titles] of Object.entries(legacy.completedPuzzlesByGenre)) {
      completedPuzzlesByGenre[genre] = new Set(titles);
    }
  }

  return {
    books: legacy.books,
    discoveredBooks: new Set(legacy.discoveredBooks),
    bookProgress: legacy.bookProgress,
    completedPuzzlesByGenre,
    completedBooks: legacy.completedBooks,
    completedPuzzles: legacy.completedPuzzles,
    currentGenre: legacy.currentGenre || '',
    currentBook: legacy.currentBook || '',
    currentStoryPart: legacy.currentStoryPart ?? -1,
    currentPuzzleIndex: legacy.currentPuzzleIndex ?? -1,
    gameMode: (legacy.gameMode as 'story' | 'puzzle-only' | 'beat-the-clock') || 'story',
    selectedGenre: legacy.selectedGenre || '',
    nextKethaneumIndex: legacy.nextKethaneumIndex || 0,
    puzzlesSinceLastKethaneum: legacy.puzzlesSinceLastKethaneum || 0,
    nextKethaneumInterval: legacy.nextKethaneumInterval || 3,
    kethaneumRevealed: legacy.kethaneumRevealed || false,
    genreExhausted: legacy.genreExhausted || false,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get information about the current save system state
 */
export function getSaveSystemInfo(): SaveSystemInfo {
  const status = getMigrationStatus();
  return {
    version: status.currentVersion,
    isOptimized: isOptimizedFormat(),
    needsMigration: status.needsMigration,
    hasBackup: status.hasBackup,
    storageSize: getStorageSize(),
  };
}

/**
 * Clear all save data
 */
export function clearAllProgress(): void {
  clearOptimizedProgress();
  deleteBackup();
}

/**
 * Rollback to backup if available
 */
export function rollbackToBackup(): boolean {
  if (!hasBackup()) {
    console.warn('No backup available for rollback');
    return false;
  }
  return restoreFromBackup();
}

/**
 * Delete the migration backup (call after verifying migration success)
 */
export function clearMigrationBackup(): void {
  deleteBackup();
}

/**
 * Check if any save data exists
 */
export function hasSaveData(): boolean {
  return localStorage.getItem('kethaneumProgress') !== null;
}

// ============================================================================
// Debug/Development Utilities
// ============================================================================

/**
 * Force re-migration (for development/testing)
 * WARNING: This will restore from backup and re-migrate
 */
export async function forceRemigration(): Promise<UnifiedLoadResult> {
  if (hasBackup()) {
    restoreFromBackup();
    return loadProgress();
  }
  return {
    success: false,
    data: null,
    wasMigrated: false,
    version: 0,
    error: 'No backup available for re-migration',
  };
}

/**
 * Get detailed save data for debugging
 */
export function getDebugInfo(): {
  systemInfo: SaveSystemInfo;
  rawData: unknown;
  backupData: unknown;
} {
  const systemInfo = getSaveSystemInfo();

  let rawData: unknown = null;
  let backupData: unknown = null;

  try {
    const saved = localStorage.getItem('kethaneumProgress');
    if (saved) rawData = JSON.parse(saved);
  } catch {
    rawData = 'Failed to parse';
  }

  try {
    const backup = localStorage.getItem('kethaneumProgress_backup_v1');
    if (backup) backupData = JSON.parse(backup);
  } catch {
    backupData = 'Failed to parse';
  }

  return { systemInfo, rawData, backupData };
}
