// Basic Game Flow Test for Chronicles of the Kethaneum - Next.js Version
describe('Basic Game Flow', () => {
  beforeEach(() => {
    // Visit the game URL (Next.js dev server)
    cy.visit('http://localhost:3000/');

    // Clear localStorage to ensure clean state
    cy.clearLocalStorage();
  });

  it('should display the title screen correctly', () => {
    // Verify title screen elements
    cy.get('[data-testid="title-screen"]').should('be.visible');
    cy.get('[data-testid="game-title"]').should('be.visible');
    cy.get('[data-testid="game-subtitle"]').should('be.visible');
    cy.get('[data-testid="new-game-btn"]').should('be.visible');
    cy.get('[data-testid="continue-btn"]').should('be.visible');
  });

  it('should navigate from title screen to backstory', () => {
    // Click new game button
    cy.get('[data-testid="new-game-btn"]').click();

    // Verify backstory screen is visible
    cy.get('[data-testid="backstory-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="backstory-content"]').should('be.visible');
    cy.get('[data-testid="continue-to-mode-select-btn"]').should('be.visible');
  });

  it('should navigate from backstory to mode selection', () => {
    // Navigate to backstory
    cy.get('[data-testid="new-game-btn"]').click();

    // Continue to mode selection
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Verify mode selection modal is visible
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
  });

  it('should navigate to Book of Passage in Story Mode', () => {
    // Navigate to backstory
    cy.get('[data-testid="new-game-btn"]').click();

    // Continue to mode selection
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Verify Book of Passage screen is visible
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="begin-cataloging-btn"]').should('be.visible');
  });

  it('should navigate from Book of Passage to Library', () => {
    // Navigate to Book of Passage
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });

    // Start cataloging
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Verify Library screen is visible (checking for library-specific elements)
    cy.url().should('include', '/library');
    cy.contains('The Library Archives').should('be.visible');
    cy.contains('button', 'Browse the Archives').should('be.visible');
  });

  it('should navigate from Library to Puzzle screen', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Browse the archives
    cy.contains('button', 'Browse the Archives').click();

    // Select a genre (wait for modal to appear)
    cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
      // Click the first available genre button
      cy.get('button').first().click();
    });

    // Verify puzzle screen is visible
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="word-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="pause-btn"]').should('be.visible');
  });

  it('should pause and resume the game', () => {
    // Navigate to active puzzle
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();
    cy.get('[role="dialog"]').within(() => {
      cy.get('button').first().click();
    });

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Click pause button
    cy.get('[data-testid="pause-btn"]').click();

    // Verify pause menu appears
    cy.get('[data-testid="pause-menu"]').should('be.visible');
    cy.get('[data-testid="resume-btn"]').should('be.visible');

    // Resume the game
    cy.get('[data-testid="resume-btn"]').click();

    // Verify pause menu is closed
    cy.get('[data-testid="pause-menu"]').should('not.exist');
  });

  it('should return to Book of Passage from pause menu', () => {
    // Navigate to active puzzle
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();
    cy.get('[role="dialog"]').within(() => {
      cy.get('button').first().click();
    });

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Pause the game
    cy.get('[data-testid="pause-btn"]').click();

    // Click go to Book of Passage button
    cy.get('[data-testid="back-to-book-btn"]').click();

    // Verify Book of Passage screen is visible
    cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');
  });

  it('should return to Library from pause menu', () => {
    // Navigate to active puzzle
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /story/i).click();
    });
    cy.get('[data-testid="begin-cataloging-btn"]').click();
    cy.contains('button', 'Browse the Archives').click();
    cy.get('[role="dialog"]').within(() => {
      cy.get('button').first().click();
    });

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

    // Pause the game
    cy.get('[data-testid="pause-btn"]').click();

    // Click go to Library button
    cy.get('[data-testid="back-to-library-btn"]').click();

    // Verify Library screen is visible
    cy.url().should('include', '/library');
    cy.contains('The Library Archives').should('be.visible');
  });

  it('should navigate directly to puzzle in Puzzle Only mode', () => {
    // Navigate to backstory
    cy.get('[data-testid="new-game-btn"]').click();

    // Continue to mode selection
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Puzzle Only Mode
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /puzzle.*only|only.*puzzle/i).click();
    });

    // Verify puzzle screen is visible (skipping Book of Passage and Library)
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="word-list"]', { timeout: 10000 }).should('be.visible');
  });

  it('should navigate directly to puzzle in Beat the Clock mode', () => {
    // Navigate to backstory
    cy.get('[data-testid="new-game-btn"]').click();

    // Continue to mode selection
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Beat the Clock Mode
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /beat.*clock|clock.*beat/i).click();
    });

    // Verify puzzle screen is visible (skipping Book of Passage and Library)
    cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="word-list"]', { timeout: 10000 }).should('be.visible');
  });

  // Note: Win condition test would require either:
  // 1. Finding and selecting all words (complex and time-consuming)
  // 2. Direct state manipulation via cy.window() (may not work with Next.js app router)
  // 3. A special test mode that auto-completes puzzles
  // This can be added later if needed
});
