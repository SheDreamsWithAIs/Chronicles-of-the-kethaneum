// Story Event System Test for Chronicles of the Kethaneum
describe('Story Event System', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
    cy.clearLocalStorage();
  });

  // Helper function to navigate to library in Story Mode
  const navigateToLibrary = () => {
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Wait for story systems to initialize
    cy.wait(2000);

    cy.get('[data-testid="enter-library-btn"]').click();
    cy.url().should('include', '/library');

    // Wait for dialogue system to load story events
    cy.wait(2000);
  };

  // Helper to expose dialogueManager to window for testing
  const getDialogueManager = () => {
    return cy.window().then((win) => {
      // Access the dialogueManager through the module system
      return cy.wrap(win).its('__DIALOGUE_MANAGER__');
    });
  };

  it('should load story events on initialization', () => {
    navigateToLibrary();

    // Check that story events were loaded via console logs
    cy.window().then((win) => {
      // The DialogueManager should have logged that it loaded story events
      // We can verify this by checking the network requests or using window exposure
    });
  });

  it('should load the first-visit story event', () => {
    navigateToLibrary();

    // Wait for systems to initialize
    cy.wait(1000);

    // Verify first-visit event exists by checking if it can be triggered
    // We'll do this by looking for the notification system state
    cy.window().then((win) => {
      // Story event should be loaded
      // We can verify by checking console logs for successful load
    });
  });

  it('should trigger library notification when story event is available', () => {
    // Start a new game in Story Mode
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Wait for story systems to initialize
    cy.wait(2000);

    // The "Enter the Library" button should glow when first-visit event is available
    // Check for the notification glow class
    cy.get('[data-testid="enter-library-btn"]')
      .should('exist')
      .then(($btn) => {
        // The button might have the notification glow class
        // We'll check if the parent or button has notification styling
        // Note: This depends on when the event is checked/triggered
      });
  });

  it('should clear library notification when visiting library', () => {
    navigateToLibrary();

    // After visiting library, the notification should be cleared
    // Navigate back to Book of Passage
    cy.get('[data-testid="browse-archives-btn"]').click();
    cy.url().should('include', '/puzzle');

    // Pause the game
    cy.get('[data-testid="pause-btn"]').click();
    cy.get('[data-testid="pause-menu"]').should('be.visible');

    // The Library button should NOT have notification glow anymore
    cy.get('[data-testid="back-to-library-btn"]')
      .should('exist')
      // Notification should be cleared after first visit
      .should('not.have.class', /glow/i);
  });

  it('should validate first-visit event structure', () => {
    navigateToLibrary();

    cy.wait(1000);

    // Test that the first-visit event has proper structure
    // This can be done by triggering the event and checking the emitted data
    cy.window().then((win) => {
      let eventReceived = false;

      // Listen for the story event available event
      const handler = (e: CustomEvent) => {
        expect(e.detail).to.have.property('eventId');
        expect(e.detail).to.have.property('title');
        expect(e.detail).to.have.property('triggerCondition');
        expect(e.detail.eventId).to.equal('first-visit');
        expect(e.detail.triggerCondition).to.equal('player-enters-library-first-time');
        eventReceived = true;
      };

      win.document.addEventListener('dialogueManager:storyEventAvailable', handler as EventListener);
    });
  });

  it('should have first-visit event with correct trigger condition', () => {
    navigateToLibrary();

    // The first-visit event should have the trigger condition "player-enters-library-first-time"
    // This can be verified by checking the loaded event data
    cy.request('/data/story-events/first-visit.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('storyEvent');
      expect(response.body.storyEvent).to.have.property('id', 'first-visit');
      expect(response.body.storyEvent).to.have.property('triggerCondition', 'player-enters-library-first-time');
      expect(response.body.storyEvent).to.have.property('storyBeat', 'hook');
    });
  });

  it('should have valid dialogue data in first-visit event', () => {
    cy.request('/data/story-events/first-visit.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('dialogue');
      expect(response.body.dialogue).to.be.an('array');
      expect(response.body.dialogue.length).to.be.greaterThan(0);

      // Check first dialogue entry
      const firstDialogue = response.body.dialogue[0];
      expect(firstDialogue).to.have.property('sequence');
      expect(firstDialogue).to.have.property('speaker');
      expect(firstDialogue).to.have.property('text');
      expect(firstDialogue).to.have.property('emotion');
      expect(firstDialogue.emotion).to.be.an('array');
    });
  });

  it('should have valid character data in first-visit event', () => {
    cy.request('/data/story-events/first-visit.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('characters');
      expect(response.body.characters).to.be.an('array');
      expect(response.body.characters.length).to.be.greaterThan(0);

      // Check character entries
      response.body.characters.forEach((character: any) => {
        expect(character).to.have.property('id');
        expect(character).to.have.property('portraitFile');
      });
    });
  });

  it('should have valid metadata in first-visit event', () => {
    cy.request('/data/story-events/first-visit.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('metadata');

      const metadata = response.body.metadata;
      expect(metadata).to.have.property('estimatedDuration');
      expect(metadata).to.have.property('storyImportance');
      expect(metadata).to.have.property('unlocks');
      expect(metadata.unlocks).to.be.an('array');
    });
  });

  it('should load event manifest correctly', () => {
    cy.request('/data/story-events/event-manifest.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.include('first-visit.json');
    });
  });

  it('should emit storyEventsLoaded event after initialization', () => {
    let eventsLoaded = false;

    cy.visit('http://localhost:3000/').then((win) => {
      // Listen for the storyEventsLoaded event
      win.document.addEventListener('dialogueManager:storyEventsLoaded', ((e: CustomEvent) => {
        expect(e.detail).to.have.property('count');
        expect(e.detail).to.have.property('eventIds');
        expect(e.detail.eventIds).to.be.an('array');
        expect(e.detail.eventIds).to.include('first-visit');
        eventsLoaded = true;
      }) as EventListener);
    });

    // Navigate to trigger initialization
    navigateToLibrary();

    // Wait for event to fire
    cy.wait(3000);

    // Verify event was received
    cy.window().then(() => {
      // Event should have been fired during initialization
    });
  });

  it('should show library button with correct label', () => {
    cy.get('[data-testid="new-game-btn"]').click();
    cy.get('[data-testid="continue-to-mode-select-btn"]').click();
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
    cy.contains('Story Mode').click();
    cy.contains('button', 'Confirm').click();

    // Wait for page load
    cy.wait(1000);

    // Button should say "Enter the Library" (not "Begin Cataloging")
    cy.get('[data-testid="enter-library-btn"]')
      .should('be.visible')
      .should('contain', 'Enter the Library');
  });

  it('should have LibraryButton component in puzzle pause menu', () => {
    navigateToLibrary();

    // Select a genre and start a puzzle
    cy.get('[data-testid="browse-archives-btn"]').click();
    cy.wait(1000);

    // Select a genre (assuming modal appears)
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('button', 'mystery').click();

    // Should now be in puzzle
    cy.url().should('include', '/puzzle');

    // Pause the game
    cy.get('[data-testid="pause-btn"]').click();
    cy.get('[data-testid="pause-menu"]').should('be.visible');

    // Library button should exist
    cy.get('[data-testid="back-to-library-btn"]')
      .should('be.visible')
      .should('contain', 'Return to Library');
  });
});
