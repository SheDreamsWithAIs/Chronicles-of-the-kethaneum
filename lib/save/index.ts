/**
 * Save System Module for Chronicles of the Kethaneum
 *
 * This module provides:
 * - Unified save/load with automatic migration (recommended)
 * - Optimized storage format for scalability
 * - Migration utilities for legacy save data
 * - Legacy save system (for reference/fallback)
 */

// ============================================================================
// Recommended: Unified Save System
// ============================================================================
// Use these functions for all save/load operations in the app.
// They handle format detection, migration, and backward compatibility.

export {
  saveProgress,
  loadProgress,
  getSaveSystemInfo,
  clearAllProgress,
  rollbackToBackup,
  clearMigrationBackup,
  hasSaveData,
  getDebugInfo,
  type UnifiedLoadResult,
  type SaveSystemInfo,
} from './unifiedSaveSystem';

// ============================================================================
// Optimized Save System (Internal)
// ============================================================================
// Direct access to optimized format. Use unified system instead.

export {
  saveOptimizedProgress,
  loadOptimizedProgress,
  decodeOptimizedProgress,
  convertToGameStateFormat,
  isOptimizedFormat,
  getSaveVersion,
  getStorageSize,
  clearOptimizedProgress,
  getRawSavedData,
  type OptimizedProgress,
  type OptimizedCurrentState,
  type OptimizedSelectionState,
  type DecodedBookProgress,
  type DecodedProgress,
} from './optimizedSaveSystem';

// ============================================================================
// Migration Utilities
// ============================================================================
// For manual migration control or debugging.

export {
  needsMigration,
  getCurrentVersion,
  migrateV1toV2,
  autoMigrate,
  createBackup,
  hasBackup,
  restoreFromBackup,
  deleteBackup,
  getBackupData,
  forceMigration,
  getMigrationStatus,
  type MigrationResult,
  type MigrationStats,
} from './migrations';

// ============================================================================
// Legacy Save System
// ============================================================================
// Original save system. Kept for reference and fallback.

export {
  saveGameProgress,
  loadGameProgress,
  resetGameState,
  clearGameProgress,
  saveAudioSettings,
  loadAudioSettings,
  clearAudioSettings,
  type SavedProgress,
} from './saveSystem';
