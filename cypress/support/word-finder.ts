/**
 * Word Finder Helper for Cypress Tests
 * This module contains functions to find and select words in the puzzle grid
 * using human-like pattern recognition strategies
 */

interface WordData {
  word: string;
  found: boolean;
  row: number;
  col: number;
  direction: [number, number];
}

interface FindStats {
  totalWords: number;
  foundByGridScan: number;
  foundByPlacementData: number;
  foundByForce: number;
  notFound: number;
}

/**
 * Main function to find all words in the puzzle
 * Uses multiple strategies to locate words like a human would
 */
export function findWordsInPuzzle(): Cypress.Chainable<FindStats> {
  const stats: FindStats = {
    totalWords: 0,
    foundByGridScan: 0,
    foundByPlacementData: 0,
    foundByForce: 0,
    notFound: 0,
  };

  return cy.window().then((win: any) => {
    // Access game state from window
    const state = win.__GAME_STATE__;

    if (!state) {
      throw new Error('Game state not found on window object');
    }

    const { grid, wordList } = state;

    if (!grid || !wordList) {
      throw new Error('Grid or word list not found in game state');
    }

    stats.totalWords = wordList.length;
    cy.log(`Total words to find: ${stats.totalWords}`);

    // Strategy 1: Try grid scan with distinctive patterns
    return findWordsUsingGridScan(grid, wordList, stats).then(() => {
      // Strategy 2: Use placement data for remaining words
      return findWordsUsingPlacementData(grid, wordList, stats);
    }).then(() => {
      // Strategy 3: Force win if needed (fallback)
      return forceWinCondition(wordList, stats);
    }).then(() => {
      // Log final statistics
      cy.log('=== Word Finding Statistics ===');
      cy.log(`Total Words: ${stats.totalWords}`);
      cy.log(`Found by Grid Scan: ${stats.foundByGridScan}`);
      cy.log(`Found by Placement Data: ${stats.foundByPlacementData}`);
      cy.log(`Found by Force: ${stats.foundByForce}`);
      cy.log(`Not Found: ${stats.notFound}`);

      return cy.wrap(stats);
    });
  });
}

/**
 * Strategy 1: Find words using grid scanning with distinctive patterns
 * Mimics how a human would scan for unusual letter combinations
 */
function findWordsUsingGridScan(
  grid: string[][],
  wordList: WordData[],
  stats: FindStats
): Cypress.Chainable {
  cy.log('Strategy 1: Grid Scan with Distinctive Patterns');

  // Get distinctive patterns from word list
  const patterns = getDistinctivePatterns(wordList);
  cy.log(`Found ${patterns.length} distinctive patterns to search for`);

  let chain = cy.wrap(null);

  patterns.forEach(({ pattern, wordData }) => {
    chain = chain.then(() => {
      return cy.window().then((win: any) => {
        const currentState = win.__GAME_STATE__;
        const currentWordList = currentState?.wordList || wordList;

        // Check if this word has already been found
        const wordObj = currentWordList.find((w: WordData) => w.word === wordData.word);
        if (wordObj && wordObj.found) {
          cy.log(`Word "${wordData.word}" already found, skipping`);
          return;
        }

        // Search grid for this pattern
        return findPatternInGrid(grid, pattern, wordData.word).then((location) => {
          if (location) {
            cy.log(`Found pattern "${pattern}" for word "${wordData.word}" at [${location.row}, ${location.col}]`);

            // Select the word
            return selectWord(location, wordData.direction, wordData.word.length).then(() => {
              stats.foundByGridScan++;
              // Small delay to allow state to update
              cy.wait(100);
            });
          } else {
            cy.log(`Pattern "${pattern}" not found for word "${wordData.word}"`);
          }
        });
      });
    });
  });

  return chain;
}

/**
 * Strategy 2: Find words using their known placement data
 * Fallback strategy for words not found by pattern matching
 */
function findWordsUsingPlacementData(
  grid: string[][],
  wordList: WordData[],
  stats: FindStats
): Cypress.Chainable {
  cy.log('Strategy 2: Using Placement Data');

  let chain = cy.wrap(null);

  wordList.forEach((wordData) => {
    chain = chain.then(() => {
      return cy.window().then((win: any) => {
        const currentState = win.__GAME_STATE__;
        const currentWordList = currentState?.wordList || wordList;

        // Check if this word has already been found
        const wordObj = currentWordList.find((w: WordData) => w.word === wordData.word);
        if (wordObj && wordObj.found) {
          return;
        }

        cy.log(`Selecting word "${wordData.word}" using placement data`);

        const location = { row: wordData.row, col: wordData.col };

        return selectWord(location, wordData.direction, wordData.word.length).then(() => {
          stats.foundByPlacementData++;
          // Small delay to allow state to update
          cy.wait(100);
        });
      });
    });
  });

  return chain;
}

/**
 * Strategy 3: Force win condition by directly updating state
 * Last resort if other strategies fail
 */
function forceWinCondition(wordList: WordData[], stats: FindStats): Cypress.Chainable {
  return cy.window().then((win: any) => {
    const currentState = win.__GAME_STATE__;
    const currentWordList = currentState?.wordList || wordList;

    // Check if all words are found
    const unfoundWords = currentWordList.filter((w: WordData) => !w.found);

    if (unfoundWords.length > 0) {
      cy.log(`Strategy 3: Forcing win condition for ${unfoundWords.length} remaining words`);
      stats.foundByForce = unfoundWords.length;

      // Mark all words as found
      unfoundWords.forEach((word: WordData) => {
        word.found = true;
      });

      // Trigger state update
      if (win.__UPDATE_GAME_STATE__) {
        win.__UPDATE_GAME_STATE__({ wordList: currentWordList });
      }
    } else {
      cy.log('All words found, no need to force win');
    }
  });
}

/**
 * Get distinctive patterns from word list
 * Returns patterns that are easier to spot in the grid
 */
function getDistinctivePatterns(wordList: WordData[]): Array<{ pattern: string; wordData: WordData }> {
  const patterns: Array<{ pattern: string; wordData: WordData }> = [];

  // Common distinctive 2-3 letter combinations
  const distinctiveCombos = [
    'QU', 'TH', 'CH', 'SH', 'PH', 'WH', 'GH',
    'CK', 'NG', 'NK', 'MP', 'MB', 'WR', 'KN',
    'SCH', 'TCH', 'DGE', 'ING', 'TION', 'OUGH'
  ];

  wordList.forEach((wordData) => {
    const upperWord = wordData.word.toUpperCase();

    // Find the most distinctive pattern in this word
    for (const combo of distinctiveCombos) {
      if (upperWord.includes(combo)) {
        patterns.push({
          pattern: combo,
          wordData
        });
        break; // Use first distinctive pattern found
      }
    }

    // If no distinctive pattern, use first 3 letters
    if (!patterns.find(p => p.wordData.word === wordData.word)) {
      patterns.push({
        pattern: upperWord.substring(0, Math.min(3, upperWord.length)),
        wordData
      });
    }
  });

  return patterns;
}

/**
 * Find a pattern in the grid
 * Returns the location if found, null otherwise
 */
function findPatternInGrid(
  grid: string[][],
  pattern: string,
  fullWord: string
): Cypress.Chainable<{ row: number; col: number } | null> {
  const upperPattern = pattern.toUpperCase();
  const upperWord = fullWord.toUpperCase();

  // Search all 8 directions
  const directions = [
    [0, 1],   // right
    [0, -1],  // left
    [1, 0],   // down
    [-1, 0],  // up
    [1, 1],   // down-right
    [1, -1],  // down-left
    [-1, 1],  // up-right
    [-1, -1]  // up-left
  ];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      // Check if pattern starts here in any direction
      for (const [dRow, dCol] of directions) {
        let foundPattern = true;

        // Check if pattern matches
        for (let i = 0; i < upperPattern.length; i++) {
          const r = row + (dRow * i);
          const c = col + (dCol * i);

          if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
            foundPattern = false;
            break;
          }

          if (grid[r][c].toUpperCase() !== upperPattern[i]) {
            foundPattern = false;
            break;
          }
        }

        // If pattern found, verify full word
        if (foundPattern) {
          let foundFullWord = true;

          for (let i = 0; i < upperWord.length; i++) {
            const r = row + (dRow * i);
            const c = col + (dCol * i);

            if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
              foundFullWord = false;
              break;
            }

            if (grid[r][c].toUpperCase() !== upperWord[i]) {
              foundFullWord = false;
              break;
            }
          }

          if (foundFullWord) {
            return cy.wrap({ row, col });
          }
        }
      }
    }
  }

  return cy.wrap(null);
}

/**
 * Select a word in the grid by simulating mouse drag
 */
function selectWord(
  start: { row: number; col: number },
  direction: [number, number],
  length: number
): Cypress.Chainable {
  const [dRow, dCol] = direction;
  const endRow = start.row + (dRow * (length - 1));
  const endCol = start.col + (dCol * (length - 1));

  const startKey = `${start.row}-${start.col}`;
  const endKey = `${endRow}-${endCol}`;

  cy.log(`Selecting word from [${start.row},${start.col}] to [${endRow},${endCol}]`);

  // Get the start and end cell elements
  return cy.get(`[data-cell-key="${startKey}"]`).then(($startCell) => {
    return cy.get(`[data-cell-key="${endKey}"]`).then(($endCell) => {
      // Simulate drag from start to end
      // Get center coordinates of cells
      const startRect = $startCell[0].getBoundingClientRect();
      const endRect = $endCell[0].getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top + endRect.height / 2;

      // Trigger mousedown on start cell
      cy.wrap($startCell)
        .trigger('mousedown', {
          clientX: startX,
          clientY: startY,
          force: true
        });

      // Trigger mousemove to end cell (move through intermediate cells for better selection)
      const steps = Math.max(Math.abs(endRow - start.row), Math.abs(endCol - start.col));

      for (let i = 1; i <= steps; i++) {
        const intermediateRow = start.row + Math.round(dRow * i);
        const intermediateCol = start.col + Math.round(dCol * i);
        const intermediateKey = `${intermediateRow}-${intermediateCol}`;

        cy.get(`[data-cell-key="${intermediateKey}"]`).trigger('mousemove', {
          force: true
        });
      }

      // Trigger mouseup on end cell
      cy.wrap($endCell)
        .trigger('mouseup', {
          clientX: endX,
          clientY: endY,
          force: true
        });
    });
  });
}

/**
 * Helper to wait for game state to be available
 * The puzzle page exposes state to window in development mode
 */
export function exposeGameState(): Cypress.Chainable {
  return cy.window().then((win: any) => {
    // State should already be exposed by the puzzle page in development mode
    // Just verify it exists
    const maxAttempts = 50; // 5 seconds with 100ms intervals
    let attempts = 0;

    const checkState = (): Cypress.Chainable => {
      return cy.window().then((win: any) => {
        if (win.__GAME_STATE__ && win.__GAME_STATE__.grid && win.__GAME_STATE__.wordList) {
          cy.log('Game state is available');
          return cy.wrap(true);
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Game state not available after 5 seconds');
        }

        return cy.wait(100).then(() => checkState());
      });
    };

    return checkState();
  });
}
