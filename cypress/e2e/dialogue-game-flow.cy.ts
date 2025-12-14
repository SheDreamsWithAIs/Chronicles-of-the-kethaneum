describe('Dialogue Game Flow', () => {
    beforeEach(() => {
        // Clear any existing state to ensure a fresh start for "New Game"
        cy.clearLocalStorage();
        cy.visit('/');
    });

    const advanceThroughReceivingRoom = () => {
        // Helper to advance through the Receiving Room
        // Triggers "Long Press" on the action button until navigation occurs

        const clickAction = () => {
            cy.document().then((doc) => {
                const actionBtn = doc.querySelector('[data-testid="action-button"]');
                if (actionBtn) {
                    cy.wrap(actionBtn).trigger('mousedown');
                    cy.wait(2000); // Hold for 2 seconds (exceeds 1750ms)
                    cy.wrap(actionBtn).trigger('mouseup');

                    // Wait a bit for transition or content update
                    cy.wait(1000);

                    // check if we are still on the receiving room page
                    cy.url().then(url => {
                        if (url.includes('/receiving-room')) {
                            clickAction();
                        }
                    })
                }
            })
        }

        // Initial wait for content
        cy.get('[data-testid="receiving-room-screen"]', { timeout: 10000 }).should('be.visible');
        clickAction();

        // Verify we eventually left the room
        cy.url({ timeout: 60000 }).should('include', '/book-of-passage');
    };

    it('should complete the full game flow from Title to Dialogue', () => {
        // 1. Title Screen: Click "New Game"
        cy.get('[data-testid="title-screen"]').should('be.visible');
        cy.get('[data-testid="new-game-btn"]').click();

        // 2. Backstory Screen
        cy.url().should('include', '/backstory');
        cy.get('[data-testid="backstory-screen"]').should('be.visible');
        // Wait for content (sometimes fades in)
        cy.wait(1000);
        cy.get('[data-testid="continue-to-mode-select-btn"]').click();

        // Mode Selection
        cy.get('[role="dialog"]').should('be.visible'); // Assuming modal has role="dialog" or similar
        cy.contains('Story Mode').click();
        cy.contains('button', 'Confirm').click(); // Adjust selector if needed based on Modal implementation

        // 3. Receiving Room
        cy.url().should('include', '/receiving-room');
        advanceThroughReceivingRoom();

        // 4. Book of Passage
        cy.url().should('include', '/book-of-passage');
        cy.get('[data-testid="enter-library-btn"]').click();

        // 5. Library - Story Event (Two Panel Dialogue)
        cy.url().should('include', '/library');
        cy.contains('The Library Archives').should('be.visible');

        // Click "Start a Conversation"
        cy.get('[data-testid="start-conversation-btn"]').click();

        // Verify Dialogue Panel Appears
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('be.visible');

        // Check for story event characteristics (e.g., specific character "Lumina" or 2 panels eventually)
        // Advancing through dialogue
        // We'll advance a few times to ensure we hit the 2-panel state and complete it

        const advanceDialogue = () => {
            cy.get('body').then($body => {
                if ($body.find('[data-testid="continue-btn"]').length > 0) {
                    cy.get('[data-testid="continue-btn"]').click();
                    cy.wait(800); // animation wait
                    advanceDialogue();
                }
            });
        }
        advanceDialogue();

        // Verify conversation ended (panel gone)
        cy.get('[data-testid="dialogue-panel"]').should('not.exist');

        // 6. Library (Post-Event) - Banter (Single Panel)
        // Click "Start a Conversation" again
        cy.get('[data-testid="start-conversation-btn"]').should('be.visible').click();
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('be.visible');

        // Verify it's a single panel (Banter)
        // Start with 1 panel
        cy.get('[data-testid="dialogue-panel"]').should('have.length', 1);

        // Advance once to ensure it stays single panel (or closes if short)
        cy.get('[data-testid="continue-btn"]').click();
        cy.wait(500);

        // If it's still open, it should ideally still be 1 panel for basic banter, 
        // but verifying "Banter" specifically might depend on text content. 
        // For now, ensuring it opened and we can interact is the key verification.
    });
});
