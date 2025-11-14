// Game Saving and Loading Tests for Chronicles of the Kethaneum
describe('Game Saving and Loading', () => {
  beforeEach(() => {
    // Visit the game URL
    cy.visit('http://localhost:3000/');

    // Clear localStorage to ensure clean state
    cy.clearLocalStorage();
  });

  it('should disable the Continue button when no save data exists', () => {
    // Verify the continue button is disabled
    cy.get('[data-testid="continue-btn"]')
      .should('be.visible')
      .and('be.disabled');
  });

  it('should enable Continue button after starting a new game', () => {
    // Start a new game to create save data
    cy.get('[data-testid="new-game-btn"]').click();

    // Wait for backstory to load
    cy.get('[data-testid="backstory-screen"]', { timeout: 10000 }).should('be.visible');

    // Select a game mode to ensure save data is created
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Wait for Book of Passage to load
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');

    // Return to title screen
    cy.visit('http://localhost:3000/');

    // Verify the continue button is now enabled
    cy.get('[data-testid="continue-btn"]')
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('should save and restore Story Mode progress', () => {
    // Start a new game in Story Mode
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Wait for Book of Passage
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');

    // Return to title screen and continue
    cy.visit('http://localhost:3000/');
    cy.get('[data-testid="continue-btn"]').click();

    // Should return to Book of Passage (Story Mode continues from here)
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
  });

  it('should save and restore Puzzle Only Mode progress', () => {
    // Start a new game in Puzzle Only Mode
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /puzzle.*only|only.*puzzle/i).click();
    });

    // Wait for puzzle screen
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Return to title screen and continue
    cy.visit('http://localhost:3000/');
    cy.get('[data-testid="continue-btn"]').click();

    // Should return directly to puzzle screen (Puzzle Only Mode skips Book of Passage)
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
  });

  it('should save and restore Beat the Clock Mode progress', () => {
    // Start a new game in Beat the Clock Mode
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /beat.*clock|clock.*beat/i).click();
    });

    // Wait for puzzle screen
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Return to title screen and continue
    cy.visit('http://localhost:3000/');
    cy.get('[data-testid="continue-btn"]').click();

    // Should return directly to puzzle screen (Beat the Clock Mode skips Book of Passage)
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
  });

  it('should persist game state across page reloads', () => {
    // Start a new game
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Navigate to Library
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('The Library Archives').should('be.visible');

    // Reload the page
    cy.reload();

    // Should still be on the same page or return to title with Continue enabled
    cy.get('[data-testid="continue-btn"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('should preserve localStorage save data', () => {
    // Start a new game and create save data
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Wait for Book of Passage
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');

    // Check that localStorage has save data
    cy.window().then((win) => {
      const saveData = win.localStorage.getItem('chronicles-game-progress');
      expect(saveData).to.exist;
      expect(saveData).to.not.be.null;

      // Parse and verify it contains expected data
      const parsed = JSON.parse(saveData!);
      expect(parsed).to.have.property('gameMode', 'story');
    });
  });

  it('should clear save data when starting a new game', () => {
    // Create initial save data
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');

    // Return to title and start a new game
    cy.visit('http://localhost:3000/');
    cy.get('[data-testid="new-game-btn"]').click();

    // Should be on backstory screen (starting fresh)
    cy.get('[data-testid="backstory-screen"]', { timeout: 10000 }).should('be.visible');

    // Select a different mode
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /puzzle.*only|only.*puzzle/i).click();
    });

    // Should be on puzzle screen
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Return to title and verify Continue button reflects new save
    cy.visit('http://localhost:3000/');
    cy.get('[data-testid="continue-btn"]').click();

    // Should go to puzzle screen (Puzzle Only mode)
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
  });

  it('should handle missing or corrupted save data gracefully', () => {
    // Manually set corrupted save data
    cy.window().then((win) => {
      win.localStorage.setItem('chronicles-game-progress', 'corrupted-data-{invalid-json}');
    });

    // Reload the page
    cy.reload();

    // Continue button should be disabled or game should handle gracefully
    cy.get('[data-testid="title-screen"]').should('be.visible');
    cy.get('[data-testid="new-game-btn"]').should('be.visible');
  });

  it('should save progress when navigating between screens', () => {
    // Start a new game
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Navigate through multiple screens
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('The Library Archives').should('be.visible');

    // Return to title screen
    cy.visit('http://localhost:3000/');

    // Continue should work and restore progress
    cy.get('[data-testid="continue-btn"]').should('not.be.disabled');
    cy.get('[data-testid="continue-btn"]').click();

    // Should be restored to Book of Passage (Story Mode entry point)
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
  });
});
