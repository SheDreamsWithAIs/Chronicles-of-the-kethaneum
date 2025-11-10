/**
 * Puzzle Generator for Chronicles of the Kethaneum
 * This module handles creating word search puzzles and placing words
 */

import { createSeededRandom } from '../utils/mathUtils';
import type { Config } from '../core/config';
import type { GameState, WordData, PuzzleData } from './state';

/**
 * Generate word search grid
 */
export function generateGrid(
  words: string[],
  config: Config,
  state: GameState
): { grid: string[][]; wordList: WordData[] } {
  // Create a seeded random generator
  const projectSeed = "Kethaneum".split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = createSeededRandom(projectSeed + Date.now() % 10000);
  
  // Get grid size from config
  const gridSize = config.gridSize || 10;
  
  // Validate directions array
  const validDirections = verifyDirections(config.directions);
  
  // Ensure valid words array
  const validWords = words
    .filter(word => word && typeof word === 'string' && word.length > 0)
    .map(word => word.toUpperCase());
  
  if (validWords.length === 0) {
    throw new Error("No valid words provided for grid generation");
  }
  
  // Sort words by length (longest first for easier placement)
  const sortedWords = [...validWords].sort((a, b) => b.length - a.length);

  // Create empty grid filled with empty spaces
  const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));

  // Track word placements for state
  const placements: WordData[] = [];

  // Try to place each word
  for (const word of sortedWords) {
    let placed = false;
    let attempts = 0;
    const maxRandomAttempts = 100;

    // PHASE 1: Try random placement
    while (!placed && attempts < maxRandomAttempts) {
      attempts++;

      // Random starting position using seeded random
      const row = Math.floor(seededRandom() * gridSize);
      const col = Math.floor(seededRandom() * gridSize);

      // Random direction
      const dirIndex = Math.floor(seededRandom() * validDirections.length);
      const [dRow, dCol] = validDirections[dirIndex];

      // Check if word fits in this position and direction
      if (canPlaceWord(grid, word, row, col, dRow, dCol, gridSize)) {
        // Place the word
        placeWord(grid, word, row, col, dRow, dCol);

        // Track placement for game state
        placements.push({
          word,
          found: false,
          row,
          col,
          direction: [dRow, dCol]
        });

        placed = true;
      }
    }
    
    // PHASE 2: If random placement failed, try systematic placement
    if (!placed) {
      console.warn(`Random placement failed for "${word}" - trying systematic placement`);
      
      // Try each position and direction systematically
      for (let r = 0; r < gridSize && !placed; r++) {
        for (let c = 0; c < gridSize && !placed; c++) {
          for (const [dRow, dCol] of validDirections) {
            if (canPlaceWord(grid, word, r, c, dRow, dCol, gridSize)) {
              placeWord(grid, word, r, c, dRow, dCol);
              placements.push({
                word,
                found: false,
                row: r,
                col: c,
                direction: [dRow, dCol]
              });
              placed = true;
              break;
            }
          }
        }
      }
    }

    // If still not placed after both attempts, throw error
    if (!placed) {
      throw new Error(`Could not place word: ${word} after random and systematic attempts`);
    }
  }

  // Fill remaining empty cells with random letters
  fillEmptyCells(grid);
  
  return { grid, wordList: placements };
}

/**
 * Helper function to verify directions array integrity
 */
export function verifyDirections(directions: number[][]): number[][] {
  // Default directions if missing or invalid
  const defaultDirections = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [0, -1],  // left
    [-1, 0],  // up
    [-1, -1], // diagonal up-left
    [1, -1],  // diagonal down-left
    [-1, 1]   // diagonal up-right
  ];
  
  // Verify directions array is valid
  if (!Array.isArray(directions) || directions.length === 0) {
    console.warn('Invalid directions array, using defaults');
    return defaultDirections;
  }
  
  // Verify each direction is valid
  const validDirections = directions.filter(dir => 
    Array.isArray(dir) && dir.length === 2 && 
    Number.isInteger(dir[0]) && Number.isInteger(dir[1]) &&
    (dir[0] !== 0 || dir[1] !== 0) // Prevent [0,0] direction
  );
  
  if (validDirections.length === 0) {
    console.warn('No valid directions found, using defaults');
    return defaultDirections;
  }
  
  return validDirections;
}

/**
 * Check if a word can be placed at the given position and direction
 */
export function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  gridSize: number
): boolean {
  const length = word.length;

  // Check if word goes out of bounds
  const endRow = row + (length - 1) * dRow;
  const endCol = col + (length - 1) * dCol;

  if (
    endRow < 0 || endRow >= gridSize ||
    endCol < 0 || endCol >= gridSize
  ) {
    return false;
  }

  // Check if cells are empty or match the word's letters
  for (let i = 0; i < length; i++) {
    const r = row + i * dRow;
    const c = col + i * dCol;

    if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Place a word on the grid
 */
export function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number
): void {
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dRow;
    const c = col + i * dCol;
    grid[r][c] = word[i];
  }
}

/**
 * Fill empty cells with random letters
 */
export function fillEmptyCells(grid: string[][]): void {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const gridSize = grid.length;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === '') {
        const randomIndex = Math.floor(Math.random() * letters.length);
        grid[row][col] = letters[randomIndex];
      }
    }
  }
}

/**
 * Get distinctive patterns for a word that a human might notice
 */
export function getDistinctivePatterns(word: string): string[] {
  const patterns: string[] = [];
  const length = word.length;
  
  // Add distinctive consonant clusters
  const clusters = ['TH', 'CH', 'SH', 'PH', 'WH', 'GH', 'CK', 'NG', 'QU', 'SP', 'ST', 'TR', 'PL', 'CR'];
  for (const cluster of clusters) {
    const index = word.toUpperCase().indexOf(cluster);
    if (index !== -1) {
      const startIdx = Math.max(0, index - 1);
      const endIdx = Math.min(length, index + cluster.length + 1);
      patterns.push(word.substring(startIdx, endIdx));
    }
  }
  
  // Look for unusual letters
  const unusualLetters = ['Q', 'Z', 'X', 'J', 'K'];
  for (const letter of unusualLetters) {
    const index = word.toUpperCase().indexOf(letter);
    if (index !== -1) {
      const startIdx = Math.max(0, index - 1);
      const endIdx = Math.min(length, index + 2);
      patterns.push(word.substring(startIdx, endIdx));
    }
  }
  
  // Add end of word
  if (length >= 3) {
    patterns.push(word.substring(length - 3));
  }
  if (length >= 2) {
    patterns.push(word.substring(length - 2));
  }
  
  // Add beginning of word
  if (length >= 3) {
    patterns.push(word.substring(0, 3));
  }
  if (length >= 2) {
    patterns.push(word.substring(0, 2));
  }
  
  // Add middle section if word is long enough
  if (length >= 5) {
    const middleStart = Math.floor(length / 2) - 1;
    patterns.push(word.substring(middleStart, middleStart + 3));
  }
  
  // If word is very short, just use the whole word
  if (length <= 3) {
    patterns.push(word);
  }
  
  // If no patterns were found, use single letters
  if (patterns.length === 0) {
    for (let i = 0; i < length; i++) {
      patterns.push(word[i]);
    }
  }
  
  // Prioritize longer patterns first
  patterns.sort((a, b) => b.length - a.length);
  
  // Remove duplicates
  return [...new Set(patterns)];
}

/**
 * Get the name of a story part from its index
 */
export function getStoryPartName(value: number): string {
  switch (value) {
    case 0: return "The Hook/Introduction";
    case 1: return "Rising Action/Complication";
    case 2: return "Midpoint Twist";
    case 3: return "Climactic Moment";
    case 4: return "Resolution/Epilogue";
    default: return "Unknown";
  }
}

/**
 * Initialize a puzzle with the provided data
 */
export function initializePuzzle(
  puzzleData: PuzzleData,
  config: Config,
  state: GameState
): { success: boolean; newState: GameState } {
  // Basic validation
  if (!puzzleData) {
    throw new Error("Cannot initialize puzzle with null data");
  }
  
  if (!puzzleData.words || !Array.isArray(puzzleData.words) || puzzleData.words.length === 0) {
    throw new Error("Puzzle has no words to find");
  }

  // Create new state with reset values
  // Preserve currentGenre and currentPuzzleIndex from state (they should be set by caller)
  let newState: GameState = {
    ...state,
    wordList: [],
    selectedCells: [],
    startCell: null,
    currentCell: null,
    timeRemaining: config.timeLimit,
    paused: true,
    gameOver: false,
    // Preserve genre and puzzle index - they should already be set by the caller
    // currentGenre: state.currentGenre, // Already preserved by spread
    // currentPuzzleIndex: state.currentPuzzleIndex, // Already preserved by spread
  };

  // Set current book and story part
  newState.currentBook = puzzleData.book || puzzleData.title;
  newState.currentStoryPart = puzzleData.storyPart !== undefined ? puzzleData.storyPart : 0;
  
  // Note: currentPuzzleIndex should be set by the caller (puzzleLoader) 
  // since it knows the index in the puzzles array

  // Ensure discoveredBooks is initialized
  if (!newState.discoveredBooks || !(newState.discoveredBooks instanceof Set)) {
    newState.discoveredBooks = new Set();
  }
  
  // Check if this book is already discovered
  const bookAlreadyDiscovered = newState.discoveredBooks.has(newState.currentBook);
  
  // If not already discovered, add it and update count
  if (!bookAlreadyDiscovered) {
    newState.discoveredBooks.add(newState.currentBook);
    newState.completedBooks = newState.discoveredBooks.size;
  }

  // Filter and prepare words - preserve original order
  const originalWords = puzzleData.words
    .filter(word => word.length >= config.minWordLength && word.length <= config.maxWordLength)
    .map(word => word.toUpperCase());
  
  // Remove duplicates while preserving order
  const validWords: string[] = [];
  const seenWords = new Set<string>();
  for (const word of originalWords) {
    if (!seenWords.has(word)) {
      seenWords.add(word);
      validWords.push(word);
    }
  }
  
  // Limit to maxWords if needed
  const finalWords = validWords.slice(0, config.maxWords);

  if (finalWords.length === 0) {
    throw new Error('No valid words provided after filtering');
  }

  // Generate grid with words (will sort internally for placement)
  const { grid, wordList } = generateGrid(finalWords, config, newState);
  
  // Reorder wordList to match original word order from puzzle data
  const orderedWordList: typeof wordList = [];
  const wordListMap = new Map(wordList.map(w => [w.word, w]));
  
  for (const word of finalWords) {
    const wordData = wordListMap.get(word);
    if (wordData) {
      orderedWordList.push(wordData);
    }
  }
  
  newState.grid = grid;
  newState.wordList = orderedWordList;
  
  return { success: true, newState };
}

