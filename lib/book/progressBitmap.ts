/**
 * Progress Bitmap Utilities for Chronicles of the Kethaneum
 *
 * Provides compact storage for book part completion using bitwise operations.
 * Each bit represents a part's completion status (1 = completed, 0 = incomplete).
 *
 * Example:
 * - 5-part book with parts 0, 2, 4 completed:
 * - Binary: 0b10101 = 21
 * - Decoded: [true, false, true, false, true]
 *
 * Benefits:
 * - Storage: 1-2 bytes per book vs 3-32 bytes for boolean arrays
 * - Speed: Instant bit operations for completion checks
 * - Supports up to 32 parts per book (JavaScript bitwise limit)
 */

// ============================================================================
// Encoding Functions
// ============================================================================

/**
 * Encode a boolean array of part completions into a bitmap number
 *
 * @param completed - Array of boolean values (true = completed)
 * @returns A number where each bit represents a part's completion status
 *
 * @example
 * encodeParts([true, false, true]) // Returns 5 (binary: 101)
 * encodeParts([true, true, true, true]) // Returns 15 (binary: 1111)
 */
export function encodeParts(completed: boolean[]): number {
  return completed.reduce(
    (bitmap, isCompleted, partIndex) =>
      bitmap | (isCompleted ? 1 << partIndex : 0),
    0
  );
}

/**
 * Decode a bitmap number into an array of part completion statuses
 *
 * @param bitmap - The encoded bitmap number
 * @param totalParts - The total number of parts in the book
 * @returns Array of boolean values indicating completion status
 *
 * @example
 * decodeParts(5, 3) // Returns [true, false, true]
 * decodeParts(15, 4) // Returns [true, true, true, true]
 */
export function decodeParts(bitmap: number, totalParts: number): boolean[] {
  return Array.from({ length: totalParts }, (_, partIndex) =>
    Boolean(bitmap & (1 << partIndex))
  );
}

// ============================================================================
// Part Manipulation Functions
// ============================================================================

/**
 * Mark a specific part as completed in the bitmap
 *
 * @param bitmap - The current bitmap value
 * @param partIndex - The index of the part to mark as completed (0-based)
 * @returns The updated bitmap with the part marked as completed
 *
 * @example
 * completePart(0, 0) // Returns 1 (first part completed)
 * completePart(1, 2) // Returns 5 (parts 0 and 2 completed)
 */
export function completePart(bitmap: number, partIndex: number): number {
  return bitmap | (1 << partIndex);
}

/**
 * Mark a specific part as incomplete in the bitmap
 *
 * @param bitmap - The current bitmap value
 * @param partIndex - The index of the part to mark as incomplete (0-based)
 * @returns The updated bitmap with the part marked as incomplete
 *
 * @example
 * uncompletePart(7, 1) // Returns 5 (parts 0 and 2 remain completed)
 */
export function uncompletePart(bitmap: number, partIndex: number): number {
  return bitmap & ~(1 << partIndex);
}

/**
 * Toggle a part's completion status
 *
 * @param bitmap - The current bitmap value
 * @param partIndex - The index of the part to toggle (0-based)
 * @returns The updated bitmap with the part toggled
 *
 * @example
 * togglePart(5, 1) // Returns 7 (adds part 1)
 * togglePart(7, 1) // Returns 5 (removes part 1)
 */
export function togglePart(bitmap: number, partIndex: number): number {
  return bitmap ^ (1 << partIndex);
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Check if a specific part is completed
 *
 * @param bitmap - The bitmap value to check
 * @param partIndex - The index of the part to check (0-based)
 * @returns True if the part is completed, false otherwise
 *
 * @example
 * isPartCompleted(5, 0) // Returns true (part 0 is completed)
 * isPartCompleted(5, 1) // Returns false (part 1 is not completed)
 */
export function isPartCompleted(bitmap: number, partIndex: number): boolean {
  return Boolean(bitmap & (1 << partIndex));
}

/**
 * Count the number of completed parts
 *
 * @param bitmap - The bitmap value to count
 * @returns The number of bits set to 1 (completed parts)
 *
 * @example
 * getCompletedCount(5) // Returns 2 (binary 101 has 2 ones)
 * getCompletedCount(15) // Returns 4 (binary 1111 has 4 ones)
 */
export function getCompletedCount(bitmap: number): number {
  let count = 0;
  let n = bitmap;
  while (n) {
    count += n & 1;
    n >>>= 1; // Use unsigned right shift for safety
  }
  return count;
}

/**
 * Check if all parts of a book are completed
 *
 * @param bitmap - The bitmap value to check
 * @param totalParts - The total number of parts in the book
 * @returns True if all parts are completed, false otherwise
 *
 * @example
 * isBookCompleted(7, 3) // Returns true (binary 111, 3 parts all done)
 * isBookCompleted(5, 3) // Returns false (binary 101, part 1 missing)
 */
export function isBookCompleted(bitmap: number, totalParts: number): boolean {
  const allCompleted = (1 << totalParts) - 1;
  return bitmap === allCompleted;
}

/**
 * Calculate the completion percentage
 *
 * @param bitmap - The bitmap value to check
 * @param totalParts - The total number of parts in the book
 * @returns Percentage of completion (0-100)
 *
 * @example
 * getCompletionPercentage(5, 4) // Returns 50 (2 of 4 parts)
 * getCompletionPercentage(15, 4) // Returns 100 (4 of 4 parts)
 */
export function getCompletionPercentage(
  bitmap: number,
  totalParts: number
): number {
  if (totalParts === 0) return 0;
  const completed = getCompletedCount(bitmap);
  return Math.round((completed / totalParts) * 100);
}

/**
 * Get the indices of completed parts
 *
 * @param bitmap - The bitmap value to check
 * @param totalParts - The total number of parts in the book
 * @returns Array of indices for completed parts
 *
 * @example
 * getCompletedPartIndices(5, 4) // Returns [0, 2]
 * getCompletedPartIndices(15, 4) // Returns [0, 1, 2, 3]
 */
export function getCompletedPartIndices(
  bitmap: number,
  totalParts: number
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < totalParts; i++) {
    if (bitmap & (1 << i)) {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * Get the indices of incomplete parts
 *
 * @param bitmap - The bitmap value to check
 * @param totalParts - The total number of parts in the book
 * @returns Array of indices for incomplete parts
 *
 * @example
 * getIncompletePartIndices(5, 4) // Returns [1, 3]
 * getIncompletePartIndices(15, 4) // Returns []
 */
export function getIncompletePartIndices(
  bitmap: number,
  totalParts: number
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < totalParts; i++) {
    if (!(bitmap & (1 << i))) {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * Get the next incomplete part index (useful for continuing progress)
 *
 * @param bitmap - The bitmap value to check
 * @param totalParts - The total number of parts in the book
 * @returns The index of the next incomplete part, or -1 if all completed
 *
 * @example
 * getNextIncompletePart(5, 4) // Returns 1 (first incomplete)
 * getNextIncompletePart(15, 4) // Returns -1 (all completed)
 */
export function getNextIncompletePart(
  bitmap: number,
  totalParts: number
): number {
  for (let i = 0; i < totalParts; i++) {
    if (!(bitmap & (1 << i))) {
      return i;
    }
  }
  return -1;
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Create a bitmap with all parts completed
 *
 * @param totalParts - The number of parts to mark as completed
 * @returns A bitmap with all bits set for the given number of parts
 *
 * @example
 * createCompletedBitmap(4) // Returns 15 (binary 1111)
 * createCompletedBitmap(3) // Returns 7 (binary 111)
 */
export function createCompletedBitmap(totalParts: number): number {
  return (1 << totalParts) - 1;
}

/**
 * Create an empty bitmap (no parts completed)
 *
 * @returns 0 (no bits set)
 */
export function createEmptyBitmap(): number {
  return 0;
}

/**
 * Merge two bitmaps (combine completions from both)
 *
 * @param bitmap1 - First bitmap
 * @param bitmap2 - Second bitmap
 * @returns A bitmap with all completed parts from both inputs
 *
 * @example
 * mergeBitmaps(5, 2) // Returns 7 (combines 101 and 010)
 */
export function mergeBitmaps(bitmap1: number, bitmap2: number): number {
  return bitmap1 | bitmap2;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that a bitmap is valid for a given number of parts
 *
 * @param bitmap - The bitmap to validate
 * @param totalParts - The maximum number of parts
 * @returns True if the bitmap only has bits set within the valid range
 *
 * @example
 * isValidBitmap(5, 4) // Returns true (bits 0, 2 within range)
 * isValidBitmap(16, 4) // Returns false (bit 4 is out of range)
 */
export function isValidBitmap(bitmap: number, totalParts: number): boolean {
  const maxValue = (1 << totalParts) - 1;
  return bitmap >= 0 && bitmap <= maxValue;
}

/**
 * Sanitize a bitmap to ensure it's valid for a given number of parts
 *
 * @param bitmap - The bitmap to sanitize
 * @param totalParts - The maximum number of parts
 * @returns A sanitized bitmap with out-of-range bits cleared
 *
 * @example
 * sanitizeBitmap(31, 4) // Returns 15 (clears bit 4)
 */
export function sanitizeBitmap(bitmap: number, totalParts: number): number {
  const mask = (1 << totalParts) - 1;
  return bitmap & mask;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of parts supported (JavaScript bitwise limit)
 */
export const MAX_PARTS = 32;

/**
 * Check if a part count is within the supported range
 */
export function isValidPartCount(partCount: number): boolean {
  return partCount > 0 && partCount <= MAX_PARTS;
}
