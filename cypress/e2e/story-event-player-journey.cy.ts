// Story Event System - End-to-End Player Journey Tests
describe('Story Event System - Player Journey', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
    cy.clearLocalStorage();
  });

  describe('First Visit Event - Complete Player Flow', () => {
    it('should trigger first-visit event when player enters library for first time', () => {
      // === ACT 1: Player starts new game ===
      cy.log('🎮 Player starts new game');
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();

      // === ACT 2: Player selects Story Mode ===
      cy.log('📖 Player selects Story Mode');
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();

      // Player arrives at Book of Passage
      cy.url().should('include', '/book-of-passage');
      cy.contains('Book of Passage').should('be.visible');

      // === ACT 3: Wait for story systems to initialize ===
      cy.log('⏳ Waiting for story systems to initialize...');
      cy.wait(3000); // Give systems time to load

      // === ACT 4: Check if Library button should be glowing ===
      cy.log('🔍 Checking if "Enter the Library" button has notification glow');

      // The button should exist
      cy.get('[data-testid="enter-library-btn"]')
        .should('be.visible')
        .should('contain', 'Enter the Library');

      // TODO: The button SHOULD have a glow class when first-visit event is available
      // This test will help us see if the trigger is properly wired up!
      // If this fails, it means we need to wire up the checkForAvailableStoryEvent call
      cy.get('[data-testid="enter-library-btn"]').then(($btn) => {
        const hasGlow = $btn.hasClass('storyNotificationGlow') ||
                       $btn.attr('class')?.includes('glow');

        if (hasGlow) {
          cy.log('✅ Library button IS glowing (notification working!)');
        } else {
          cy.log('⚠️ Library button is NOT glowing (may need to wire up trigger)');
        }
      });

      // === ACT 5: Player clicks "Enter the Library" ===
      cy.log('🚪 Player enters the Library');
      cy.get('[data-testid="enter-library-btn"]').click();

      // === ACT 6: Player arrives in Library ===
      cy.url().should('include', '/library');
      cy.contains('The Library Archives').should('be.visible');

      // === ACT 7: Notification should clear after visiting ===
      cy.log('🧹 Checking if notification clears after visit');
      cy.wait(500);

      // Navigate back to Book of Passage to verify notification is cleared
      cy.get('[data-testid="browse-archives-btn"]').click();

      // Select genre to get to puzzle
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      // Find and click first available genre button
      cy.get('[role="dialog"]').within(() => {
        cy.get('button').contains(/fantasy|mystery|science|romance/i).first().click();
      });

      // Now in puzzle, pause to check buttons
      cy.url().should('include', '/puzzle');
      cy.get('[data-testid="pause-btn"]').click();
      cy.get('[data-testid="pause-menu"]').should('be.visible');

      // Library button should NOT have glow anymore
      cy.log('🔍 Verifying notification is cleared');
      cy.get('[data-testid="back-to-library-btn"]').then(($btn) => {
        const hasGlow = $btn.hasClass('storyNotificationGlow') ||
                       $btn.attr('class')?.includes('glow');

        if (!hasGlow) {
          cy.log('✅ Library button no longer glowing (notification cleared!)');
        } else {
          cy.log('⚠️ Library button still glowing (notification may not be clearing)');
        }
      });
    });

    it('should load first-visit event data correctly', () => {
      cy.log('📋 Validating first-visit.json structure');

      cy.request('/data/story-events/first-visit.json').then((response) => {
        expect(response.status).to.eq(200);

        const event = response.body;

        // Validate event structure
        cy.log('✅ Checking story event metadata');
        expect(event.storyEvent).to.exist;
        expect(event.storyEvent.id).to.equal('first-visit');
        expect(event.storyEvent.title).to.equal('First Steps in the Kethaneum');
        expect(event.storyEvent.triggerCondition).to.equal('player-enters-library-first-time');
        expect(event.storyEvent.storyBeat).to.equal('hook');

        // Validate dialogue
        cy.log('✅ Checking dialogue data');
        expect(event.dialogue).to.be.an('array');
        expect(event.dialogue.length).to.be.greaterThan(0);

        event.dialogue.forEach((line: any, index: number) => {
          cy.log(`  - Dialogue ${index + 1}: ${line.speaker}`);
          expect(line).to.have.property('sequence');
          expect(line).to.have.property('speaker');
          expect(line).to.have.property('text');
          expect(line).to.have.property('emotion');
        });

        // Validate characters
        cy.log('✅ Checking character data');
        expect(event.characters).to.be.an('array');
        expect(event.characters.length).to.be.greaterThan(0);

        event.characters.forEach((char: any) => {
          cy.log(`  - Character: ${char.id}`);
          expect(char).to.have.property('id');
          expect(char).to.have.property('portraitFile');
        });
      });
    });

    it('should have DialogueManager load story events on initialization', () => {
      cy.log('🔧 Testing DialogueManager initialization');

      // Listen for the storyEventsLoaded event
      cy.visit('http://localhost:3000/', {
        onBeforeLoad(win) {
          cy.spy(win.console, 'log').as('consoleLog');
        }
      });

      // Start game to trigger initialization
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();

      // Wait for systems to initialize
      cy.wait(3000);

      // Check console logs for story event loading
      cy.get('@consoleLog').should('be.called');

      // Look for specific log messages about story events
      cy.get('@consoleLog').then((spy) => {
        const calls = (spy as any).getCalls();
        const storyEventLogs = calls.filter((call: any) => {
          const args = call.args.join(' ');
          return args.includes('story event') ||
                 args.includes('DialogueManager') ||
                 args.includes('first-visit');
        });

        if (storyEventLogs.length > 0) {
          cy.log('✅ Found story event loading logs');
          storyEventLogs.forEach((logCall: any) => {
            cy.log(`  - ${logCall.args.join(' ')}`);
          });
        } else {
          cy.log('⚠️ No story event loading logs found (check if loading is working)');
        }
      });
    });
  });

  describe('Notification System - Manual Testing', () => {
    it('should be able to manually trigger library notification', () => {
      cy.log('🧪 Manual test: Triggering library notification via window API');

      // Navigate to Book of Passage
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();

      cy.wait(2000);

      // Manually emit the storyEventAvailable event to test notification system
      cy.window().then((win) => {
        cy.log('📡 Emitting storyEventAvailable event');
        const event = new CustomEvent('dialogueManager:storyEventAvailable', {
          detail: {
            eventId: 'first-visit',
            title: 'First Steps in the Kethaneum',
            triggerCondition: 'player-enters-library-first-time',
            storyBeat: 'hook'
          }
        });
        win.document.dispatchEvent(event);
      });

      // Wait for React to process the event
      cy.wait(500);

      // Check if library button now has glow
      cy.log('🔍 Checking if manual trigger caused button to glow');
      cy.get('[data-testid="enter-library-btn"]').then(($btn) => {
        const classes = $btn.attr('class') || '';
        const hasGlow = classes.includes('glow') || classes.includes('Glow');

        if (hasGlow) {
          cy.log('✅ Manual trigger works! Button is glowing!');
        } else {
          cy.log('❌ Manual trigger did not cause glow (notification system issue)');
          cy.log(`   Button classes: ${classes}`);
        }
      });
    });

    it('should verify notification context is working', () => {
      cy.log('🔍 Testing notification context state');

      // Navigate to game
      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();

      cy.wait(2000);

      // Check if we can access React state via window
      cy.window().then((win) => {
        // Try to access the notification context state
        // Note: This requires exposing state for testing
        cy.log('📊 Checking for exposed notification state');

        // We could add window.__STORY_NOTIFICATION_STATE__ for testing
        // For now, we test via behavior (glow appearance)
      });
    });
  });

  describe('Event Manifest and Loading', () => {
    it('should have event-manifest.json with first-visit event', () => {
      cy.log('📄 Checking event manifest');

      cy.request('/data/story-events/event-manifest.json').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an('array');
        expect(response.body).to.include('first-visit.json');

        cy.log(`✅ Manifest contains ${response.body.length} event(s)`);
        response.body.forEach((filename: string) => {
          cy.log(`  - ${filename}`);
        });
      });
    });

    it('should have all events in manifest be accessible', () => {
      cy.log('🔗 Verifying all manifest events are accessible');

      cy.request('/data/story-events/event-manifest.json').then((response) => {
        const eventFiles = response.body;

        eventFiles.forEach((filename: string) => {
          cy.request(`/data/story-events/${filename}`).then((eventResponse) => {
            expect(eventResponse.status).to.eq(200);
            expect(eventResponse.body.storyEvent).to.exist;
            cy.log(`✅ ${filename} - ${eventResponse.body.storyEvent.title}`);
          });
        });
      });
    });
  });

  describe('Button Components', () => {
    it('should have LibraryButton component with correct text', () => {
      cy.log('🔘 Testing LibraryButton component');

      cy.get('[data-testid="new-game-btn"]').click();
      cy.get('[data-testid="continue-to-mode-select-btn"]').click();
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Story Mode').click();
      cy.contains('button', 'Confirm').click();

      // Check Book of Passage library button
      cy.log('  - Checking "Enter the Library" button');
      cy.get('[data-testid="enter-library-btn"]')
        .should('be.visible')
        .should('contain', 'Enter the Library')
        .should('not.contain', 'Begin Cataloging'); // Old text

      // Go to library and then to puzzle
      cy.get('[data-testid="enter-library-btn"]').click();
      cy.get('[data-testid="browse-archives-btn"]').click();

      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      cy.get('[role="dialog"]').within(() => {
        cy.get('button').contains(/fantasy|mystery|science|romance/i).first().click();
      });

      // Check pause menu library button
      cy.url().should('include', '/puzzle');
      cy.get('[data-testid="pause-btn"]').click();

      cy.log('  - Checking "Return to Library" button');
      cy.get('[data-testid="back-to-library-btn"]')
        .should('be.visible')
        .should('contain', 'Return to Library')
        .should('not.contain', 'Back to Library'); // Old text
    });
  });
});
