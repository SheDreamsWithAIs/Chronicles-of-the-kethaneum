/**
 * Book Module for Chronicles of the Kethaneum
 *
 * This module provides:
 * - BookRegistryManager: Centralized access to book metadata
 * - Progress Bitmap utilities: Compact storage for part completion
 */

// Book Registry
export {
  bookRegistry,
  BookRegistryManager,
  type BookMetadata,
  type GenreMetadata,
  type BookRegistry,
  type BookWithId,
} from './bookRegistry';

// Progress Bitmap utilities
export {
  // Encoding/Decoding
  encodeParts,
  decodeParts,
  // Part manipulation
  completePart,
  uncompletePart,
  togglePart,
  // Query functions
  isPartCompleted,
  getCompletedCount,
  isBookCompleted,
  getCompletionPercentage,
  getCompletedPartIndices,
  getIncompletePartIndices,
  getNextIncompletePart,
  // Bulk operations
  createCompletedBitmap,
  createEmptyBitmap,
  mergeBitmaps,
  // Validation
  isValidBitmap,
  sanitizeBitmap,
  isValidPartCount,
  MAX_PARTS,
} from './progressBitmap';
