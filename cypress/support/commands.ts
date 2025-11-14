/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to clear game progress from localStorage
       * @example cy.clearGameProgress()
       */
      clearGameProgress(): Chainable<void>;

      /**
       * Custom command to navigate through the initial game flow
       * @example cy.startNewGame()
       */
      startNewGame(): Chainable<void>;

      /**
       * Custom command to select a game mode
       * @param mode - The game mode to select ('story', 'puzzle-only', 'beat-the-clock')
       * @example cy.selectGameMode('story')
       */
      selectGameMode(mode: 'story' | 'puzzle-only' | 'beat-the-clock'): Chainable<void>;

      /**
       * Custom command to navigate to the puzzle screen
       * @example cy.navigateToPuzzle()
       */
      navigateToPuzzle(): Chainable<void>;
    }
  }
}

// Clear all game progress from localStorage
Cypress.Commands.add('clearGameProgress', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});

// Start a new game from the title screen
Cypress.Commands.add('startNewGame', () => {
  cy.visit('/');
  cy.clearGameProgress();
  cy.contains('button', 'New Game').click();
});

// Select a game mode in the modal
Cypress.Commands.add('selectGameMode', (mode: 'story' | 'puzzle-only' | 'beat-the-clock') => {
  // Wait for the modal to appear
  cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');

  // Click the appropriate mode button based on the mode parameter
  if (mode === 'story') {
    cy.contains('button', /Story Mode|story/i).click();
  } else if (mode === 'puzzle-only') {
    cy.contains('button', /Puzzle Only|puzzle/i).click();
  } else if (mode === 'beat-the-clock') {
    cy.contains('button', /Beat the Clock|beat/i).click();
  }
});

// Navigate to the puzzle screen (assumes you're in story mode)
Cypress.Commands.add('navigateToPuzzle', () => {
  // From backstory, click continue
  cy.contains('button', 'Continue').click();

  // Select story mode
  cy.selectGameMode('story');

  // From Book of Passage, click Begin Cataloging
  cy.contains('button', 'Begin Cataloging').click();

  // From Library, click Browse the Archives
  cy.contains('button', 'Browse the Archives').click();

  // Select a genre (assuming at least one is available)
  cy.get('[role="dialog"]').within(() => {
    cy.get('button').contains(/fantasy|sci-fi|mystery|horror|romance/i).first().click();
  });
});

export {};
