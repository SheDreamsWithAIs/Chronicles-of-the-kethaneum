// Mobile Viewport and Touch Interaction Tests for Chronicles of the Kethaneum
describe('Mobile Viewport and Touch Interactions', () => {
  // Test with common mobile viewport sizes
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12/13', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 },
  ];

  const desktopViewport = { name: 'Desktop', width: 1280, height: 720 };

  describe('Title Screen - Mobile Responsiveness', () => {
    mobileViewports.forEach(({ name, width, height }) => {
      it(`should display correctly on ${name} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.visit('http://localhost:3000/');
        cy.clearLocalStorage();

        // Verify title screen elements are visible and accessible
        cy.get('[data-testid="title-screen"]').should('be.visible');
        cy.get('[data-testid="game-title"]').should('be.visible');
        cy.get('[data-testid="new-game-btn"]').should('be.visible');
        cy.get('[data-testid="continue-btn"]').should('be.visible');

        // Verify buttons are tappable (not too small)
        cy.get('[data-testid="new-game-btn"]').then(($btn) => {
          const height = $btn.height();
          // Minimum touch target size should be 44px (iOS guidelines)
          expect(height).to.be.at.least(40);
        });
      });
    });
  });

  describe('Puzzle Screen - Word List Responsiveness', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();
    });

    it('should show mobile word list on mobile viewport', () => {
      // Set mobile viewport
      cy.viewport(390, 844); // iPhone 12/13

      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();

      // Wait for puzzle to load
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Verify mobile word list is visible
      cy.get('[data-testid="mobile-word-list"]').should('be.visible');

      // Verify desktop word list is hidden (md:block class means hidden on mobile)
      cy.get('[data-testid="word-list"]').should('not.be.visible');
    });

    it('should show desktop word list on desktop viewport', () => {
      // Set desktop viewport
      cy.viewport(1280, 720);

      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();

      // Wait for puzzle to load
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Verify desktop word list is visible
      cy.get('[data-testid="word-list"]').should('be.visible');

      // Verify mobile word list is hidden
      cy.get('[data-testid="mobile-word-list"]').should('not.be.visible');
    });

    it('should display all words in mobile word list', () => {
      cy.viewport(390, 844); // iPhone 12/13

      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();

      // Wait for puzzle to load
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Get word list from game state
      cy.window().then((win) => {
        const gameState = (win as any).__GAME_STATE__;
        expect(gameState).to.exist;
        expect(gameState.wordList).to.exist;
        expect(gameState.wordList.length).to.be.greaterThan(0);

        // Verify mobile word list has same number of words
        cy.get('[data-testid="mobile-word-list"] li').should('have.length', gameState.wordList.length);
      });
    });
  });

  describe('Mobile Navigation and Touch Interactions', () => {
    beforeEach(() => {
      cy.viewport(390, 844); // iPhone 12/13
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();
    });

    it('should navigate through game flow on mobile', () => {
      // Title to Backstory
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="backstory-screen"]', { timeout: 10000 }).should('be.visible');

      // Backstory to Mode Selection
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');

      // Mode Selection to Book of Passage
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="book-of-passage-screen"]', { timeout: 10000 }).should('be.visible');

      // Book of Passage to Library
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.url().should('include', '/library');

      // Library to Puzzle
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');
    });

    it('should open and close pause menu on mobile', () => {
      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Open pause menu
      cy.get('[data-testid="pause-btn"]').click();
      cy.get('[data-testid="pause-menu"]').should('be.visible');

      // Verify pause menu buttons are accessible
      cy.get('[data-testid="resume-btn"]').should('be.visible');
      cy.get('[data-testid="back-to-book-btn"]').should('be.visible');
      cy.get('[data-testid="back-to-library-btn"]').should('be.visible');

      // Close pause menu
      cy.get('[data-testid="resume-btn"]').click();
      cy.get('[data-testid="pause-menu"]').should('not.exist');
    });

    it('should handle modal interactions on mobile', () => {
      // Navigate to mode selection modal
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');

      // Verify modal is properly displayed on mobile
      cy.get('[role="dialog"]').then(($modal) => {
        const width = $modal.width();
        const viewportWidth = Cypress.config('viewportWidth');
        // Modal should not exceed viewport width
        expect(width).to.be.at.most(viewportWidth);
      });

      // Select mode
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();

      // Navigate to genre selection modal
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');

      // Verify genre modal is properly displayed
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Natural Wisdom').should('be.visible');
    });

    it('should handle touch interactions on puzzle grid', () => {
      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Wait for grid to render
      cy.get('[class*="puzzleGrid"]').should('be.visible');

      // Verify grid cells are rendered
      cy.get('[class*="puzzleGrid"]').find('[class*="gridCell"]').should('have.length.greaterThan', 0);

      // Test touch interaction on a grid cell (Cypress simulates this as a click)
      cy.get('[class*="gridCell"]').first().click();
    });
  });

  describe('Tablet Viewport Tests', () => {
    it('should display correctly on iPad (768x1024)', () => {
      cy.viewport(768, 1024);
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();

      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // At 768px, the breakpoint is md: (TailwindCSS default is 768px)
      // Check which word list is visible (this will depend on your TailwindCSS config)
      cy.get('[data-testid="word-list"]').should('exist');
    });

    it('should display correctly on iPad Pro (1024x1366)', () => {
      cy.viewport(1024, 1366);
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();

      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Desktop word list should be visible on larger tablets
      cy.get('[data-testid="word-list"]').should('be.visible');
    });
  });

  describe('Responsive Layout Tests', () => {
    it('should handle viewport rotation (portrait to landscape)', () => {
      // Start in portrait
      cy.viewport(390, 844); // iPhone 12/13 portrait
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();

      cy.get('[data-testid="title-screen"]').should('be.visible');

      // Rotate to landscape
      cy.viewport(844, 390); // iPhone 12/13 landscape

      // Verify content still displays
      cy.get('[data-testid="title-screen"]').should('be.visible');
      cy.get('[data-testid="new-game-btn"]').should('be.visible');
    });

    it('should maintain game state when resizing viewport', () => {
      cy.viewport(390, 844); // Start mobile
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();

      // Navigate to puzzle
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();
      cy.get('[data-testid="begin-cataloging-btn"]').click();
      cy.contains('button', 'Browse the Archives').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Natural Wisdom').click();
      cy.get('[data-testid="puzzle-screen"]', { timeout: 15000 }).should('be.visible');

      // Verify mobile word list
      cy.get('[data-testid="mobile-word-list"]').should('be.visible');

      // Resize to desktop
      cy.viewport(1280, 720);

      // Verify puzzle screen is still visible
      cy.get('[data-testid="puzzle-screen"]').should('be.visible');

      // Verify desktop word list is now visible
      cy.get('[data-testid="word-list"]').should('be.visible');
      cy.get('[data-testid="mobile-word-list"]').should('not.be.visible');
    });
  });

  describe('Touch Target Size Compliance', () => {
    it('should have appropriately sized touch targets on mobile', () => {
      cy.viewport(390, 844);
      cy.visit('http://localhost:3000/');
      cy.clearLocalStorage();

      // Check title screen buttons
      const buttons = [
        '[data-testid="new-game-btn"]',
        '[data-testid="continue-btn"]',
      ];

      buttons.forEach((selector) => {
        cy.get(selector).then(($btn) => {
          const height = $btn.height() || 0;
          const width = $btn.width() || 0;
          // WCAG 2.1 recommends minimum 44x44px touch targets
          expect(height).to.be.at.least(40, `${selector} height should be at least 40px`);
          expect(width).to.be.at.least(40, `${selector} width should be at least 40px`);
        });
      });
    });
  });
});
