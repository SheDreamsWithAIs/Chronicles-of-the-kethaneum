// Word Search Completion Test for Chronicles of the Kethaneum
// This test simulates human-like puzzle solving using pattern recognition

import { findWordsInPuzzle, exposeGameState } from '../support/word-finder';

describe('Word Search Puzzle Completion', () => {
  beforeEach(() => {
    // Visit the game URL
    cy.visit('http://localhost:3000/');

    // Clear localStorage to ensure clean state
    cy.clearLocalStorage();
  });

  it('should complete a single puzzle by finding all words', () => {
    // Navigate to puzzle screen
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Navigate to puzzle
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();

    // Select the nature genre
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Natural Wisdom').click();

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="word-list"]', { timeout: 10000 }).should('be.visible');

    // Expose game state for word finder
    exposeGameState();

    // Wait for state to be exposed
    cy.wait(500);

    // Find and select all words
    findWordsInPuzzle().then((stats) => {
      // Verify statistics
      expect(stats.totalWords).to.be.greaterThan(0);
      expect(stats.notFound).to.equal(0, 'All words should be found');
      expect(stats.foundByForce).to.equal(0, 'Should not need to force win');
      cy.log(`Completed puzzle with ${stats.totalWords} words`);
      cy.log(`Grid scan found: ${stats.foundByGridScan}, Placement data found: ${stats.foundByPlacementData}`);

      // Verify all words are found (CSS modules hash the class name)
      cy.get('[data-testid="word-list"] li').each(($li) => {
        cy.wrap($li).should('have.attr', 'class').and('match', /found/);
      });

      // Win modal should appear
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      cy.contains('Puzzle Complete').should('be.visible');
    });
  });

  it('should complete multiple puzzles in succession', () => {
    // Navigate to puzzle screen
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Navigate to puzzle
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();

    // Select the nature genre
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Natural Wisdom').click();

    // Complete first puzzle
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    exposeGameState();
    cy.wait(500);

    findWordsInPuzzle().then((stats) => {
      expect(stats.notFound).to.equal(0, 'All words in first puzzle should be found');
      cy.log(`Completed first puzzle with ${stats.totalWords} words`);

      // Click Next Puzzle button
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      cy.contains('button', 'Next Puzzle').click();

      // Wait for new puzzle to load
      cy.wait(1000);
      cy.get('[data-testid="puzzle-screen"]').should('be.visible');

      // Complete second puzzle
      exposeGameState();
      cy.wait(500);

      findWordsInPuzzle().then((stats2) => {
        expect(stats2.notFound).to.equal(0, 'All words in second puzzle should be found');
        cy.log(`Completed second puzzle with ${stats2.totalWords} words`);

        // Verify win modal appears again
        cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
        cy.contains('Puzzle Complete').should('be.visible');
      });
    });
  });

  it('should correctly identify found vs unfound words', () => {
    // Navigate to puzzle screen
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Navigate to puzzle
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();

    // Select the nature genre
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Natural Wisdom').click();

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="word-list"]', { timeout: 10000 }).should('be.visible');

    // Initially, no words should be found (CSS modules hash class names)
    cy.get('[data-testid="word-list"] li[class*="found"]').should('not.exist');

    // Expose game state
    exposeGameState();
    cy.wait(500);

    // Find first word only
    cy.window().then((win: any) => {
      const state = win.__GAME_STATE__;
      expect(state).to.exist;
      expect(state.wordList).to.exist;
      expect(state.wordList.length).to.be.greaterThan(0);

      const firstWord = state.wordList[0];
      const [dRow, dCol] = firstWord.direction;
      const startRow = firstWord.row;
      const startCol = firstWord.col;
      const endRow = startRow + (dRow * (firstWord.word.length - 1));
      const endCol = startCol + (dCol * (firstWord.word.length - 1));

      const startKey = `${startRow}-${startCol}`;
      const endKey = `${endRow}-${endCol}`;

      // Select first word
      cy.get(`[data-cell-key="${startKey}"]`).trigger('mousedown', { force: true });

      // Move through all cells
      for (let i = 0; i < firstWord.word.length; i++) {
        const r = startRow + (dRow * i);
        const c = startCol + (dCol * i);
        cy.get(`[data-cell-key="${r}-${c}"]`).trigger('mousemove', { force: true });
      }

      cy.get(`[data-cell-key="${endKey}"]`).trigger('mouseup', { force: true });

      // Wait for state update
      cy.wait(200);

      // Verify exactly one word is found (CSS modules hash class names)
      cy.get('[data-testid="word-list"] li[class*="found"]').should('have.length', 1);
      cy.get('[data-testid="word-list"] li[class*="found"]').should('contain', firstWord.word);
    });
  });

  it('should handle word selection mechanism correctly', () => {
    // Navigate to puzzle screen
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Navigate to puzzle
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();

    // Select the nature genre
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Natural Wisdom').click();

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Expose game state
    exposeGameState();
    cy.wait(500);

    cy.window().then((win: any) => {
      const state = win.__GAME_STATE__;

      // Test selecting a word in all 8 directions
      // For now, just test the first word
      const testWord = state.wordList[0];
      const [dRow, dCol] = testWord.direction;

      cy.log(`Testing word "${testWord.word}" in direction [${dRow}, ${dCol}]`);

      const startRow = testWord.row;
      const startCol = testWord.col;
      const endRow = startRow + (dRow * (testWord.word.length - 1));
      const endCol = startCol + (dCol * (testWord.word.length - 1));

      // Verify cells highlight during drag
      cy.get(`[data-cell-key="${startRow}-${startCol}"]`).trigger('mousedown', { force: true });

      // Cells should be selected as we drag
      for (let i = 0; i < testWord.word.length; i++) {
        const r = startRow + (dRow * i);
        const c = startCol + (dCol * i);
        cy.get(`[data-cell-key="${r}-${c}"]`).trigger('mousemove', { force: true });
      }

      cy.get(`[data-cell-key="${endRow}-${endCol}"]`).trigger('mouseup', { force: true });

      // Verify word is marked as found (CSS modules hash class names)
      cy.wait(200);
      cy.get('[data-testid="word-list"] li').contains(testWord.word).parent()
        .should('have.attr', 'class').and('match', /found/);
    });
  });

  it.skip('should track time and performance metrics', () => {
    // This test would track puzzle completion time
    // Skipped for now as it requires more complex state management
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Navigate to puzzle
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();

    // Select the nature genre
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Natural Wisdom').click();

    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    const startTime = Date.now();

    exposeGameState();
    cy.wait(500);

    findWordsInPuzzle().then(() => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      cy.log(`Puzzle completed in ${duration.toFixed(2)} seconds`);

      // Verify stats modal shows completion time
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      // Add assertions for time display when implemented
    });
  });
});
