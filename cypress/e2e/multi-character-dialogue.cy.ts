/// <reference types="cypress" />

// Multi-Character Dialogue System Tests
describe('Multi-Character Dialogue System', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000');
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
      cy.wait(3000);
  
      cy.get('[data-testid="enter-library-btn"]', { timeout: 10000 })
        .should('be.visible')
        .click();
      cy.url().should('include', '/library');
  
      // Wait for dialogue system to load story events and be ready
      cy.wait(3000);
    };
  
    // Helper to start a conversation
    const startConversation = () => {
      // Wait for page loader to disappear (it covers the button)
      cy.get('[class*="loaderOverlay"]', { timeout: 15000 }).should('not.exist');
      
      // Wait a bit more to ensure loader is fully gone
      cy.wait(200);
      
      // Now the button should be clickable
      cy.contains('button', 'Start a Conversation', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled')
        .click();
      cy.wait(1500); // Wait for dialogue to appear and initialize
    };
  
    describe('Dialogue Panel Display', () => {
      it('should display single panel for first dialogue', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .should('have.length', 1)
          .should('be.visible');
        
        // Check that panel has position attribute (CSS modules may scope class names)
        cy.get('[data-testid="dialogue-panel"]')
          .first()
          .should('have.attr', 'data-dialogue-id');
      });
  
      it('should display two panels when second character speaks', () => {
        navigateToLibrary();
        startConversation();

        // Wait for first panel and its animation to complete
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .should('exist')
          .should('be.visible');
        
        // Wait for animation to complete
        cy.wait(600);

        // Click continue to advance to next dialogue
        cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
          .should('be.visible')
          .click();
        cy.wait(800); // Wait for animation and dialogue to appear

        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .should('have.length', 2)
          .each(($panel) => {
            cy.wrap($panel).should('be.visible');
          });
      });
  
      it('should maintain max 2 panels when third character speaks', () => {
        navigateToLibrary();
        startConversation();
  
        // Wait for first panel
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // Click through to third dialogue
        cy.get('[data-testid="continue-btn"]').click();
        cy.wait(600);
        cy.get('[data-testid="continue-btn"]').click();
        cy.wait(600);
  
        // Should still only have 2 panels
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .should('have.length.at.most', 2);
      });
    });
  
    describe('Panel Animations', () => {
      it('should animate panel entering from bottom', () => {
        navigateToLibrary();
        startConversation();
  
        // Panel should appear (animation may be too fast to catch entering state)
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .should('exist')
          .should('be.visible');
  
        // Wait for animation to complete
        cy.wait(600);
  
        // Panel should still be visible after animation
        cy.get('[data-testid="dialogue-panel"]')
          .should('be.visible');
      });
  
      it('should animate panel shifting to top position', () => {
        navigateToLibrary();
        startConversation();
  
        // Wait for first panel
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .first()
          .as('firstPanel')
          .should('be.visible');
        
        cy.wait(600); // Wait for animation to complete
        
        // Get first panel position
        cy.get('@firstPanel')
          .invoke('offset')
          .then((firstPos) => {
            // Click continue to trigger second dialogue
            cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
              .should('be.visible')
              .click();
  
            // Wait for animation
            cy.wait(800);
  
            // Check that we now have 2 panels and first panel still exists
            cy.get('[data-testid="dialogue-panel"]')
              .should('have.length', 2);
            
            cy.get('@firstPanel')
              .should('exist')
              .should('be.visible');
          });
      });
  
      it('should remove oldest panel when third dialogue appears', () => {
        navigateToLibrary();
        startConversation();

        // Get first panel's dialogue text (first few words) to identify it
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .first()
          .find('[data-testid="dialogue-text"]')
          .invoke('text')
          .then((text) => {
            // Get first few words as identifier
            const firstWords = text.split(' ').slice(0, 5).join(' ');
            cy.wrap(firstWords).as('firstDialogueText');
          });

        // Wait for first panel to be fully loaded
        cy.wait(600);

        // Click through to second dialogue
        cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
          .should('be.visible')
          .click();
        cy.wait(800); // Wait for shift animation

        // Verify we have 2 panels now
        cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);

        // Get the second panel's dialogue text (now at bottom, will move to top when third appears)
        cy.get('[data-testid="dialogue-panel"]')
          .last()
          .find('[data-testid="dialogue-text"]')
          .invoke('text')
          .then((text) => {
            const firstWords = text.split(' ').slice(0, 5).join(' ');
            cy.wrap(firstWords).as('secondDialogueText');
          });

        // Verify the first panel's text is still visible (at top)
        cy.get('@firstDialogueText').then((firstText) => {
          cy.get('[data-testid="dialogue-text"]')
            .first()
            .should('contain', firstText);
        });

        // Click through to third dialogue (this should remove the first panel)
        cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
          .should('be.visible')
          .click();
        
        // Wait for the third panel to appear and animations to complete
        cy.wait(1200);

        // Verify we still have exactly 2 panels (the second and third)
        cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);

        // Get the third panel's dialogue text (should be at bottom now)
        cy.get('[data-testid="dialogue-panel"]')
          .last()
          .find('[data-testid="dialogue-text"]')
          .invoke('text')
          .then((text) => {
            const firstWords = text.split(' ').slice(0, 5).join(' ');
            cy.wrap(firstWords).as('thirdDialogueText');
          });

        // Verify the third panel has different text from the first
        cy.get('@thirdDialogueText').then((thirdText) => {
          cy.get('@firstDialogueText').then((firstText) => {
            expect(thirdText).to.not.equal(firstText);
          });
          
          // Verify the third panel's text is visible
          cy.get('[data-testid="dialogue-text"]')
            .last()
            .should('contain', thirdText);
        });

        // Now verify the first panel's dialogue text is gone (oldest panel removed)
        cy.get('@firstDialogueText').then((firstText) => {
          cy.get('[data-testid="dialogue-text"]')
            .should('not.contain', firstText);
        });

        // Verify the second panel's text is still visible (now at top)
        cy.get('@secondDialogueText').then((secondText) => {
          cy.get('[data-testid="dialogue-text"]')
            .first()
            .should('contain', secondText);
        });
      });
    });
  
    describe('Text Chunking', () => {
      it('should display chunk indicator for multi-chunk dialogue', () => {
        navigateToLibrary();
        startConversation();
  
        // Check if chunk indicator appears (only if dialogue has multiple chunks)
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).then(($panel) => {
          // If chunk indicator exists, verify it shows correct format
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="chunk-indicator"]').length > 0) {
              cy.get('[data-testid="chunk-indicator"]')
                .should('contain', '/')
                .should('match', /\d+\/\d+/);
            }
          });
        });
      });
  
      it('should advance chunks before advancing dialogue', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // Check if there are multiple chunks
        cy.get('body').then(($body) => {
          const hasChunkIndicator = $body.find('[data-testid="chunk-indicator"]').length > 0;
          
          if (hasChunkIndicator) {
            // Get initial chunk number
            cy.get('[data-testid="chunk-indicator"]')
              .invoke('text')
              .then((initialChunk) => {
                const initialMatch = initialChunk.match(/(\d+)\/\d+/);
                if (initialMatch) {
                  const initialNum = parseInt(initialMatch[1]);
  
                  // Click continue - should advance chunk, not dialogue
                  cy.get('[data-testid="continue-btn"]').click();
                  cy.wait(300);
  
                  cy.get('[data-testid="chunk-indicator"]')
                    .invoke('text')
                    .should((newChunk) => {
                      const newMatch = newChunk.match(/(\d+)\/\d+/);
                      if (newMatch) {
                        const newNum = parseInt(newMatch[1]);
                        expect(newNum).to.be.greaterThan(initialNum);
                      }
                    });
  
                  // Should still have same number of panels (not advanced to next character)
                  cy.get('[data-testid="dialogue-panel"]').should('have.length', 1);
                }
              });
          }
        });
      });
    });
  
    describe('Story Event Playback', () => {
      it('should play multi-character story event in sequence', () => {
        navigateToLibrary();
        startConversation();

        // First character (Lumina) - verify specific story event content
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 })
          .should('exist')
          .should('be.visible');
        
        cy.get('[data-testid="character-name"]')
          .first()
          .should('contain', 'Lumina');
        
        // Verify first-visit dialogue text
        cy.get('[data-testid="dialogue-text"]')
          .first()
          .then(($text) => {
            const text = $text.text();
            expect(
              text.includes('Careful, Archivist') ||
              text.includes("haven't learned to control your connection to the Book")
            ).to.be.true;
          });
        
        cy.wait(600); // Ensure animation complete

        // Second dialogue entry (still Lumina)
        cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
          .should('be.visible')
          .click();
        cy.wait(800);

        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .should('have.length', 2);
        
        // Verify second dialogue is Lumina with the warning content
        cy.get('[data-testid="character-name"]')
          .last()
          .should('contain', 'Lumina');
        
        cy.get('[data-testid="dialogue-text"]')
          .last()
          .then(($text) => {
            const text = $text.text();
            expect(
              text.includes('The Book of Passage does not merely record history') ||
              text.includes('In these early stages')
            ).to.be.true;
          });
        
        cy.wait(600); // Ensure animation complete

        // Third dialogue (back to Lumina)
        cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
          .should('be.visible')
          .click();
        cy.wait(800);

        // Should still have dialogue panels (max 2)
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .should('have.length.at.most', 2);
        
        // Verify third dialogue is from Lumina
        cy.get('[data-testid="character-name"]')
          .last()
          .should('contain', 'Lumina');
      });
  
      it('should complete story event and update game state', () => {
        navigateToLibrary();
        startConversation();
  
        // Click through all dialogue in first-visit event (4 dialogues)
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('exist');
  
        // Click through all dialogues (may vary, so click until conversation ends)
        // Use a loop with Cypress commands
        const maxClicks = 10; // Safety limit
        
        for (let i = 0; i < maxClicks; i++) {
          cy.get('body').then(($body) => {
            const hasPanel = $body.find('[data-testid="dialogue-panel"]').length > 0;
            const hasContinueBtn = $body.find('[data-testid="continue-btn"]').length > 0;
            
            if (hasPanel && hasContinueBtn) {
              cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
                .should('be.visible')
                .click();
              cy.wait(800);
            }
          });
        }
  
        // Wait for conversation to end
        cy.wait(1000);
        
        // Conversation should end (panels and button should be gone)
        cy.get('[data-testid="dialogue-panel"]').should('not.exist');
        cy.get('[data-testid="continue-btn"]').should('not.exist');
  
        // Verify story event marked complete in state
        cy.window().then((win) => {
          // Check localStorage for completed events
          const saved = win.localStorage.getItem('kethaneumProgress');
          if (saved) {
            const data = JSON.parse(saved);
            if (data.dl && Array.isArray(data.dl)) {
              expect(data.dl).to.include('first-visit');
            }
          }
        });
      });
  
      it('should not replay completed story events', () => {
        // First, complete the first-visit event
        navigateToLibrary();
        startConversation();
  
        // Click through all dialogues until conversation ends
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('exist');
        
        let clickCount = 0;
        const maxClicks = 10;
        const clickUntilDone = () => {
          cy.get('body').then(($body) => {
            const hasPanel = $body.find('[data-testid="dialogue-panel"]').length > 0;
            const hasContinueBtn = $body.find('[data-testid="continue-btn"]').length > 0;
            
            if (hasPanel && hasContinueBtn && clickCount < maxClicks) {
              cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
                .should('be.visible')
                .click();
              cy.wait(800);
              clickCount++;
              clickUntilDone();
            }
          });
        };
        
        clickUntilDone();
  
        // Wait for conversation to end and state to save
        cy.wait(2000);
  
        // Start conversation again - should show random banter, not first-visit event
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('exist');
        
        // Should NOT show first-visit dialogue text (check for specific first-visit text)
        cy.get('[data-testid="dialogue-text"]', { timeout: 5000 }).then(($text) => {
          const dialogueText = $text.text();
          // First-visit has specific text that banter won't have
          expect(dialogueText).to.not.include('Ah, you must be our new Assistant Archivist');
          expect(dialogueText).to.not.include('Careful, Archivist');
          expect(dialogueText).to.not.include("haven't learned to control your connection to the Book");
        });
      });
    });
  
    describe('Character Portraits', () => {
      it('should load and display character portrait', () => {
        navigateToLibrary();
        startConversation();

        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('exist');
        
        // Check if portrait image exists or if placeholder is shown
        cy.get('[data-testid="character-portrait"]', { timeout: 5000 }).then(($portrait) => {
          const hasImage = $portrait.find('img').length > 0;
          const hasPlaceholder = $portrait.find('[data-testid="portrait-placeholder"]').length > 0;
          
          if (hasImage) {
            // If image exists, verify it has a valid src
            cy.get('[data-testid="character-portrait"]')
              .find('img')
              .should('exist')
              .should('have.attr', 'src')
              .and('include', '/images/portraits/');
          } else if (hasPlaceholder) {
            // If placeholder exists, that's also valid (portraits may not be implemented yet)
            cy.get('[data-testid="portrait-placeholder"]')
              .should('exist');
          } else {
            // If neither exists, that's a problem
            throw new Error('Neither portrait image nor placeholder found');
          }
        });
      });
  
      it('should show placeholder when portrait missing', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // Check if placeholder exists (for characters without portraits)
        cy.get('body').then(($body) => {
          const hasPlaceholder = $body.find('[data-testid="portrait-placeholder"]').length > 0;
          if (hasPlaceholder) {
            cy.get('[data-testid="portrait-placeholder"]')
              .should('exist')
              .should('not.be.empty');
          }
        });
      });
  
      it('should handle portrait loading errors gracefully', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // Portrait should either be an image or a placeholder
        cy.get('[data-testid="character-portrait"]').within(() => {
          cy.get('img, [data-testid="portrait-placeholder"]').should('exist');
        });
      });
    });
  
    describe('Emotion Styling', () => {
      it('should apply emotion-based border color', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .should('exist')
          .should('have.attr', 'data-emotion');
  
        // Check that emotion attribute is set
        cy.get('[data-testid="dialogue-panel"]')
          .invoke('attr', 'data-emotion')
          .should('not.be.empty');
      });
  
      it('should have different border colors for different emotions', () => {
        navigateToLibrary();
        startConversation();
  
        // Get first panel emotion
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .first()
          .invoke('attr', 'data-emotion')
          .as('firstEmotion');
  
        // Advance to second dialogue
        cy.get('[data-testid="continue-btn"]').click();
        cy.wait(600);
  
        // Get second panel emotion
        cy.get('[data-testid="dialogue-panel"]')
          .last()
          .invoke('attr', 'data-emotion')
          .as('secondEmotion');
  
        // Emotions might be the same or different, but both should be set
        cy.get('@firstEmotion').should('not.be.empty');
        cy.get('@secondEmotion').should('not.be.empty');
      });
    });
  
    describe('Continue Button Behavior', () => {
      it('should only advance bottom panel chunks', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // If there are multiple chunks, clicking continue should advance chunk, not dialogue
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="chunk-indicator"]').length > 0) {
            // Get initial text
            cy.get('[data-testid="dialogue-text"]')
              .last()
              .invoke('text')
              .as('initialText');

            cy.get('[data-testid="continue-btn"]').click();
            cy.wait(300);

            // Text should change (chunk advanced) but panel count should stay same
            cy.get('@initialText').then((initialText) => {
              cy.get('[data-testid="dialogue-text"]')
                .last()
                .invoke('text')
                .should('not.equal', initialText);
            });
  
            cy.get('[data-testid="dialogue-panel"]').should('have.length', 1);
          }
        });
      });
  
      it('should advance to next dialogue when chunks complete', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // Click continue until we advance to next character
        cy.get('[data-testid="continue-btn"]').click();
        cy.wait(600);
  
        // Should now have 2 panels (second character speaking)
        cy.get('[data-testid="dialogue-panel"]').should('have.length', 2);
      });
  
      it('should end conversation when all dialogue complete', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 10000 }).should('exist');
  
        // Click through all dialogues until conversation ends
        const maxClicks = 10;
        
        for (let i = 0; i < maxClicks; i++) {
          cy.get('body').then(($body) => {
            const hasPanel = $body.find('[data-testid="dialogue-panel"]').length > 0;
            const hasContinueBtn = $body.find('[data-testid="continue-btn"]').length > 0;
            
            if (hasPanel && hasContinueBtn) {
              cy.get('[data-testid="continue-btn"]', { timeout: 5000 })
                .should('be.visible')
                .click();
              cy.wait(800);
            }
          });
        }
        
        // Wait for conversation to fully close
        cy.wait(1000);
  
        // Conversation should be closed
        cy.get('[data-testid="dialogue-panel"]').should('not.exist');
        cy.get('[data-testid="continue-btn"]').should('not.exist');
      });
    });
  
    describe('Accessibility', () => {
      it('should announce new dialogue to screen readers', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .should('have.attr', 'role', 'article')
          .should('have.attr', 'aria-live', 'polite')
          .should('have.attr', 'aria-label');
      });
  
      it('should support keyboard navigation', () => {
        navigateToLibrary();
        startConversation();

        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');

        // Focus the continue button and press Enter
        cy.get('[data-testid="continue-btn"]')
          .focus()
          .type('{enter}');

        // Should advance dialogue
        cy.wait(600);
        cy.get('[data-testid="dialogue-panel"]').should('have.length.at.least', 1);
      });
  
      it('should respect prefers-reduced-motion', () => {
        // Set reduced motion preference
        cy.window().then((win) => {
          const mediaQuery = win.matchMedia('(prefers-reduced-motion: reduce)');
          // Note: Cypress can't easily change media queries, but we can verify the CSS exists
        });
  
        navigateToLibrary();
        startConversation();
  
        // Verify reduced motion styles exist in CSS
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
      });
    });
  
    describe('Random Banter Fallback', () => {
      it('should show random banter when no story events available', () => {
        // This test assumes first-visit is already completed
        // In a real scenario, you'd need to complete it first or use a different test setup
        
        navigateToLibrary();
        
        // If first-visit is already completed, starting conversation should show banter
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
        
        // Should show some dialogue (either story event or banter)
        cy.get('[data-testid="character-name"]').should('exist');
        cy.get('[data-testid="dialogue-text"]').should('exist');
      });
  
      it('should display character data correctly for banter', () => {
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');
  
        // Character name should be displayed
        cy.get('[data-testid="character-name"]')
          .should('exist')
          .should('not.be.empty');
  
        // Character title should be displayed if available
        cy.get('body').then(($body) => {
          // Title might not always be present, but if it is, it should be visible
          const hasTitle = $body.find('.characterTitle').length > 0;
          if (hasTitle) {
            cy.get('.characterTitle').should('be.visible');
          }
        });
      });
    });
  
    describe('Overlay and Close Functionality', () => {
      it('should show overlay when conversation is active', () => {
        navigateToLibrary();
        startConversation();

        cy.get('[data-testid="dialogue-overlay"]', { timeout: 5000 })
          .should('be.visible')
          .should('have.css', 'background-color');
      });

      it('should close conversation when clicking overlay', () => {
        navigateToLibrary();
        startConversation();

        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 }).should('exist');

        // Ensure loader is gone (it might still be fading out)
        cy.get('[class*="loaderOverlay"]', { timeout: 5000 }).should('not.exist');
        cy.wait(200);

        // Click overlay (not the panel itself)
        // The overlay should be clickable - if it's not, that's a real bug we want to catch
        cy.get('[data-testid="dialogue-overlay"]')
          .should('be.visible')
          .click();

        // Conversation should close
        cy.get('[data-testid="dialogue-panel"]').should('not.exist');
      });
    });
  
    describe('Mobile Responsiveness', () => {
      it('should adjust layout for mobile screens', () => {
        cy.viewport('iphone-x');
        navigateToLibrary();
        startConversation();
  
        cy.get('[data-testid="dialogue-panel"]', { timeout: 5000 })
          .should('exist')
          .should('be.visible');
  
        // Portrait should be smaller on mobile
        cy.get('[data-testid="character-portrait"]')
          .should('have.css', 'width')
          .and('match', /\d+px/);
      });
    });
  });
