// Dialogue System Test for Chronicles of the Kethaneum
describe('Dialogue System', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
    cy.clearLocalStorage();
  });

  it('should navigate to Library in Story Mode', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();

    // Select Story Mode
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Begin Cataloging
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Verify we're in the library
    cy.url().should('include', '/library');
    cy.contains('The Library Archives').should('be.visible');
  });

  it('should display the Start a Conversation button in Library', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Verify conversation button exists
    cy.contains('button', 'Start a Conversation').should('be.visible');
  });

  it('should show dialogue panel when clicking Start a Conversation', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Click to start conversation
    cy.contains('button', 'Start a Conversation').click();

    // Verify dialogue panel appears
    cy.get('[class*="dialogueOverlay"]', { timeout: 5000 }).should('be.visible');
    cy.get('[class*="dialoguePanel"]').should('be.visible');
  });

  it('should display character name and dialogue text', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Click to start conversation
    cy.contains('button', 'Start a Conversation').click();

    // Verify dialogue content
    cy.get('[class*="characterName"]').should('be.visible').and('not.be.empty');
    cy.get('[class*="dialogueText"]').should('be.visible').and('not.be.empty');
  });

  it('should close dialogue when clicking the close button', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Open dialogue
    cy.contains('button', 'Start a Conversation').click();
    cy.get('[class*="dialogueOverlay"]').should('be.visible');

    // Close dialogue using the X button
    cy.get('[class*="dialogueClose"]').click();

    // Verify dialogue is closed
    cy.get('[class*="dialogueOverlay"]').should('not.exist');
  });

  it('should close dialogue when clicking the Continue button', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Open dialogue
    cy.contains('button', 'Start a Conversation').click();
    cy.get('[class*="dialogueOverlay"]').should('be.visible');

    // Close dialogue using the Continue button
    cy.get('[class*="dialogueControls"]').contains('button', 'Continue').click();

    // Verify dialogue is closed
    cy.get('[class*="dialogueOverlay"]').should('not.exist');
  });

  it('should close dialogue when clicking the overlay background', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Open dialogue
    cy.contains('button', 'Start a Conversation').click();
    cy.get('[class*="dialogueOverlay"]').should('be.visible');

    // Click overlay (not the panel itself)
    // Force click to bypass actionability checks since we're clicking the overlay
    cy.get('[class*="dialogueOverlay"]').click('topLeft', { force: true });

    // Verify dialogue is closed
    cy.get('[class*="dialogueOverlay"]').should('not.exist');
  });

  it('should be able to open dialogue multiple times', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Open dialogue first time
    cy.contains('button', 'Start a Conversation').click();
    cy.get('[class*="dialogueOverlay"]').should('be.visible');

    // Close dialogue
    cy.get('[class*="dialogueClose"]').click();
    cy.get('[class*="dialogueOverlay"]').should('not.exist');

    // Open dialogue second time
    cy.contains('button', 'Start a Conversation').click();
    cy.get('[class*="dialogueOverlay"]').should('be.visible');
    cy.get('[class*="characterName"]').should('be.visible');

    // Close again
    cy.get('[class*="dialogueClose"]').click();
    cy.get('[class*="dialogueOverlay"]').should('not.exist');
  });

  it('should display character portrait placeholder', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Open dialogue
    cy.contains('button', 'Start a Conversation').click();

    // Verify portrait element exists
    cy.get('[class*="characterPortrait"]').should('be.visible');
  });

  it('should prevent interaction with library content while dialogue is open', () => {
    // Navigate to Library
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();
    cy.get('[data-testid="begin-cataloging-btn"]').click();

    // Open dialogue
    cy.contains('button', 'Start a Conversation').click();
    cy.get('[class*="dialogueOverlay"]').should('be.visible');

    // Verify overlay blocks interaction with background elements
    // The dialogue overlay should be on top
    cy.get('[class*="dialogueOverlay"]').should('have.css', 'position', 'fixed');
  });
});
