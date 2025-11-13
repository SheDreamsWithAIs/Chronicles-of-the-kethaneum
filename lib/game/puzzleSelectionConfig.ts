/**
 * Configuration for puzzle selection and Kethaneum weaving system
 * Chronicles of the Kethaneum
 */

export interface PuzzleSelectionConfig {
  /**
   * Minimum number of regular genre puzzles before inserting a Kethaneum puzzle
   */
  minPuzzlesBeforeKethaneum: number;

  /**
   * Maximum number of regular genre puzzles before inserting a Kethaneum puzzle
   */
  maxPuzzlesBeforeKethaneum: number;

  /**
   * Name of the special Kethaneum genre
   */
  kethaneumGenreName: string;
}

/**
 * Default configuration for puzzle selection
 *
 * Adjust these values to control how frequently Kethaneum narrative books
 * are woven into the regular puzzle flow.
 */
export const defaultPuzzleSelectionConfig: PuzzleSelectionConfig = {
  // Insert a Kethaneum book every 2-5 regular puzzles
  minPuzzlesBeforeKethaneum: 2,
  maxPuzzlesBeforeKethaneum: 5,

  // The genre name for Kethaneum narrative books
  kethaneumGenreName: 'Kethaneum',
};

/**
 * Get a random interval within the configured range for next Kethaneum insertion
 */
export function getRandomKethaneumInterval(config: PuzzleSelectionConfig = defaultPuzzleSelectionConfig): number {
  const min = config.minPuzzlesBeforeKethaneum;
  const max = config.maxPuzzlesBeforeKethaneum;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
