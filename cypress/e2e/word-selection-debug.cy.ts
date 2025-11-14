// Debug test for word selection mechanism
// This test helps diagnose why word selection might not be working

import { exposeGameState } from '../support/word-finder';

describe('Word Selection Debug', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
    cy.clearLocalStorage();
  });

  it('should manually select a single word with detailed logging', () => {
    // Navigate to puzzle
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Natural Wisdom').click();
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Wait for state
    exposeGameState();
    cy.wait(500);

    // Get first word from state
    cy.window().then((win: any) => {
      const state = win.__GAME_STATE__;
      expect(state).to.exist;
      expect(state.wordList).to.exist;
      expect(state.wordList.length).to.be.greaterThan(0);

      const firstWord = state.wordList[0];
      cy.log(`=== Attempting to select: ${firstWord.word} ===`);
      cy.log(`Position: [${firstWord.row}, ${firstWord.col}]`);
      cy.log(`Direction: [${firstWord.direction[0]}, ${firstWord.direction[1]}]`);

      const [dRow, dCol] = firstWord.direction;
      const startRow = firstWord.row;
      const startCol = firstWord.col;
      const endRow = startRow + (dRow * (firstWord.word.length - 1));
      const endCol = startCol + (dCol * (firstWord.word.length - 1));

      const startKey = `${startRow}-${startCol}`;
      const endKey = `${endRow}-${endCol}`;

      cy.log(`Start cell: [${startRow},${startCol}] key: ${startKey}`);
      cy.log(`End cell: [${endRow},${endCol}] key: ${endKey}`);

      // Verify cells exist
      cy.get(`[data-cell-key="${startKey}"]`).should('be.visible').then(($cell) => {
        cy.log(`Start cell text: ${$cell.text()}`);
      });

      cy.get(`[data-cell-key="${endKey}"]`).should('be.visible').then(($cell) => {
        cy.log(`End cell text: ${$cell.text()}`);
      });

      // Try selection
      cy.get(`[data-cell-key="${startKey}"]`).then(($startCell) => {
        cy.get(`[data-cell-key="${endKey}"]`).then(($endCell) => {
          const startRect = $startCell[0].getBoundingClientRect();
          const endRect = $endCell[0].getBoundingClientRect();

          const startX = startRect.left + startRect.width / 2;
          const startY = startRect.top + startRect.height / 2;
          const endX = endRect.left + endRect.width / 2;
          const endY = endRect.top + endRect.height / 2;

          cy.log(`Start coordinates: (${startX}, ${startY})`);
          cy.log(`End coordinates: (${endX}, ${endY})`);

          // Trigger mousedown
          cy.log('Triggering mousedown...');
          cy.wrap($startCell).trigger('mousedown', {
            clientX: startX,
            clientY: startY,
            button: 0,
            buttons: 1,
            bubbles: true,
            force: true
          });

          cy.wait(50);

          // Build cell path
          const steps = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol));
          cy.log(`Moving through ${steps} cells...`);

          let chain = cy.wrap(null);
          for (let i = 1; i <= steps; i++) {
            const r = startRow + Math.round(dRow * i);
            const c = startCol + Math.round(dCol * i);
            const key = `${r}-${c}`;

            const progress = i / steps;
            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;

            chain = chain.then(() => {
              cy.log(`  Step ${i}/${steps}: cell [${r},${c}] at (${currentX.toFixed(0)}, ${currentY.toFixed(0)})`);
              return cy.get(`[data-cell-key="${key}"]`).trigger('mousemove', {
                clientX: currentX,
                clientY: currentY,
                buttons: 1,
                bubbles: true,
                force: true
              });
            });
          }

          chain.then(() => {
            cy.wait(50);
            cy.log('Triggering mouseup...');
            return cy.get('[data-testid="puzzle-screen"]').trigger('mouseup', {
              clientX: endX,
              clientY: endY,
              button: 0,
              buttons: 0,
              bubbles: true,
              force: true
            });
          }).then(() => {
            cy.wait(500);
            cy.log('Checking if word was found...');

            // Check state
            cy.window().then((win: any) => {
              const updatedState = win.__GAME_STATE__;
              const updatedWord = updatedState.wordList.find((w: any) => w.word === firstWord.word);

              cy.log(`Word "${firstWord.word}" found status: ${updatedWord?.found}`);

              if (updatedWord?.found) {
                cy.log('✅ SUCCESS: Word was selected!');
              } else {
                cy.log('❌ FAILED: Word was not selected');
                cy.log('This might be a Cypress event simulation issue');
              }

              // Check DOM
              cy.get('[data-testid="word-list"] li')
                .contains(firstWord.word)
                .parent()
                .then(($li) => {
                  const hasFoundClass = $li.hasClass('found');
                  cy.log(`Word list DOM has "found" class: ${hasFoundClass}`);
                });
            });
          });
        });
      });
    });
  });
});
