# Cypress E2E Tests for Chronicles of the Kethaneum

This directory contains end-to-end (E2E) tests for the Chronicles of the Kethaneum game, converted from the original Cypress tests to work with the new Next.js version.

## Setup

First, install the dependencies (including Cypress):

```bash
npm install
```

## Running Tests

### Interactive Mode (Recommended for Development)

To open the Cypress Test Runner with a GUI:

```bash
npm run cypress
```

This will open the Cypress app where you can select and run individual tests while watching them execute in a browser.

### Headless Mode (For CI/CD)

To run all tests in headless mode:

```bash
npm run cypress:headless
```

### With Dev Server Auto-Start

To automatically start the Next.js dev server and run tests:

```bash
# Interactive mode
npm run test:e2e

# Headless mode
npm run test:e2e:headless
```

## Test Files

- **`basic-game-flow.cy.ts`**: Tests the main game flow including:
  - Title screen display
  - Navigation between screens (Title → Backstory → Mode Selection → Book of Passage/Puzzle)
  - Different game modes (Story Mode, Puzzle Only, Beat the Clock)
  - Pause and resume functionality
  - Navigation from pause menu

- **`game-saving.cy.ts`**: Tests game save/load functionality including:
  - Continue button state based on save data
  - Saving and restoring progress for each game mode
  - Persistence across page reloads
  - localStorage data integrity
  - Handling corrupted save data

## Test Structure

All tests:
1. Start with a clean state (cleared localStorage)
2. Use `data-testid` attributes for reliable element selection
3. Include appropriate timeouts for async operations
4. Test the actual user flow through the application

## Custom Commands

Custom Cypress commands are defined in `cypress/support/commands.ts`:

- `cy.clearGameProgress()` - Clears all game progress from localStorage
- `cy.startNewGame()` - Starts a new game from the title screen
- `cy.selectGameMode(mode)` - Selects a specific game mode
- `cy.navigateToPuzzle()` - Navigates to the puzzle screen in Story Mode

## Configuration

Cypress configuration is in `cypress.config.ts`:
- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Video recording: Disabled by default
- Screenshots: Enabled on failure

## Notes

- The tests expect the Next.js dev server to be running on port 3000
- Tests use the new app structure which differs from the original game:
  - Story Mode: Title → Backstory → Mode Selection → Book of Passage → Library → Puzzle
  - Other Modes: Title → Backstory → Mode Selection → Puzzle
- Win condition tests are not included yet as they require either:
  - Complex word-finding logic
  - Direct state manipulation (may not work with Next.js App Router)
  - A test mode that auto-completes puzzles

## Differences from Original Tests

The original tests were for a static HTML version. Key changes:

1. **URLs**: Tests now navigate between Next.js routes (`/`, `/backstory`, `/book-of-passage`, etc.)
2. **Flow**: Added mode selection step that wasn't in the original
3. **Selectors**: Uses `data-testid` attributes instead of IDs for better reliability
4. **Timeouts**: Increased timeouts for Next.js page transitions and data loading
5. **Game Modes**: Tests cover three different game modes (Story, Puzzle Only, Beat the Clock)

## Troubleshooting

### Tests failing to find elements

- Make sure the dev server is running: `npm run dev`
- Check that all `data-testid` attributes are present in the components
- Increase timeouts if elements are taking longer to load

### localStorage not clearing

- Ensure no browser extensions are interfering with Cypress
- Try running in headless mode: `npm run cypress:headless`

### Network request failures

- Verify the dev server is accessible at `http://localhost:3000`
- Check that all puzzle data files are properly loaded
- Look for console errors in the Cypress browser

## Future Improvements

- Add tests for word-finding mechanics
- Add tests for win/lose conditions
- Add tests for audio settings
- Add tests for the genre builder tool
- Add visual regression testing
- Add accessibility (a11y) testing
