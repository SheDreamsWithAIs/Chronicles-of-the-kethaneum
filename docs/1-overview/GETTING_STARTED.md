# Getting Started with Chronicles of the Kethaneum

This guide will help you set up the development environment and make your first contribution to Chronicles of the Kethaneum.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control
- **Code Editor**: VS Code recommended (for TypeScript support)

### Optional Tools
- **Cypress**: For running E2E tests (installed via npm)

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SheDreamsWithAIs/Chronicles-of-the-kethaneum.git
cd Chronicles-of-the-kethaneum
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Cypress (testing)
- Development tools

### 3. Run the Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:3000**

### 4. Verify Installation

Open your browser and navigate to `http://localhost:3000`. You should see:
- The Chronicles of the Kethaneum title screen
- Cosmic background animation
- "Start New Adventure" or "Continue" buttons

## Project Structure Overview

```
Chronicles-of-the-kethaneum/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Title screen
│   ├── puzzle/page.tsx     # Main puzzle game
│   ├── library/page.tsx    # Progress tracking
│   └── backstory/page.tsx  # Story introduction
│
├── lib/                    # Game engine & logic
│   ├── game/               # Core game mechanics
│   ├── dialogue/           # Character dialogue system
│   ├── audio/              # Audio management
│   ├── save/               # Persistence system
│   └── utils/              # Utilities
│
├── components/             # React UI components
│   ├── shared/             # Shared components
│   └── *.tsx               # Game-specific components
│
├── hooks/                  # Custom React hooks
│   ├── useGameState.ts     # State management
│   ├── useGameLogic.ts     # Game logic
│   └── usePuzzle.ts        # Puzzle loading
│
├── public/                 # Static assets
│   ├── data/               # Game content (JSON)
│   ├── audio/              # Audio files
│   └── images/             # Images
│
├── docs/                   # Documentation
│   └── README.md           # Documentation hub
│
├── cypress/                # E2E tests
│
└── package.json            # Dependencies
```

## Understanding the Codebase

### Core Concepts

#### 1. Game State
The entire game is managed through a centralized `GameState` object:

```typescript
// lib/game/state.ts
interface GameState {
  grid: string[][];              // Puzzle grid
  wordList: WordData[];          // Words to find
  currentPuzzleIndex: number;    // Current puzzle
  gameMode: 'story' | 'puzzle-only' | 'beat-the-clock';
  // ... 80+ more properties
}
```

#### 2. Game Modes
Three distinct modes:

- **Story Mode**: Narrative-driven puzzle progression
- **Puzzle-Only Mode**: Random puzzles with timer
- **Beat-the-Clock Mode**: 5-minute challenge runs

#### 3. Systems
Seven major systems work together:

1. **Game Logic** (`lib/game/logic.ts`) - Core mechanics
2. **Puzzle System** (`lib/game/puzzleLoader.ts`) - Puzzle loading/generation
3. **Audio System** (`lib/audio/audioManager.ts`) - Sound management
4. **Dialogue System** (`lib/dialogue/DialogueManager.ts`) - Character interactions
5. **Save System** (`lib/save/saveSystem.ts`) - Persistence
6. **Configuration** (`lib/core/config.ts`) - Settings
7. **Timer System** (`hooks/useTimer.ts`) - Time management

### Key Files to Know

| File | Purpose | Lines |
|------|---------|-------|
| `app/puzzle/page.tsx` | Main game interface | ~450 |
| `lib/game/logic.ts` | Core game mechanics | 380 |
| `lib/game/puzzleLoader.ts` | Puzzle data loading | 617 |
| `lib/audio/audioManager.ts` | Audio system | 800+ |
| `lib/dialogue/DialogueManager.ts` | Dialogue system | 605 |
| `lib/core/config.ts` | Configuration | 282 |

## Common Development Tasks

### Running the Development Server

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Running Tests

```bash
# Run Cypress E2E tests (headless)
npm run test

# Open Cypress interactive mode
npx cypress open
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix lint issues
npm run lint -- --fix
```

### Development Tools

The project includes built-in development tools:

1. **Genre Builder** - `http://localhost:3000/tools/genre-builder`
   - Create and edit puzzle genres
   - Preview puzzles
   - Export to JSON

2. **Manifest Manager** - `http://localhost:3000/tools/manifest-manager`
   - Manage puzzle file lists
   - Update genre manifest

**Note**: These tools are excluded from production builds via `scripts/build-production.js`

## Making Your First Change

### Example: Adding a Simple Puzzle

1. **Navigate to puzzle data**:
   ```bash
   cd public/data
   ```

2. **Edit a puzzle file** (e.g., `testPuzzles.json`):
   ```json
   [
     {
       "title": "My First Puzzle",
       "book": "Test Book",
       "genre": "Test",
       "storyPart": 0,
       "words": ["HELLO", "WORLD", "PUZZLE", "GAME"]
     }
   ]
   ```

3. **Save and refresh** the browser
4. **Select Puzzle-Only mode** to test your puzzle

For a complete guide, see **[Adding Puzzles Guide](../5-guides/ADDING_PUZZLES.md)**.

### Example: Changing Difficulty Settings

1. **Open configuration file**:
   ```bash
   code lib/core/config.ts
   ```

2. **Modify difficulty** (around line 50):
   ```typescript
   easy: {
     gridSize: 8,      // Change from 8 to 10
     timeLimit: 240,   // 4 minutes
     maxWords: 6,
     // ...
   }
   ```

3. **Save and test** in development mode

### Example: Modifying UI Text

1. **Find the component** (e.g., title screen):
   ```bash
   code app/page.tsx
   ```

2. **Change the text**:
   ```tsx
   <h1 className="text-6xl font-bold">
     Chronicles of the Kethaneum  {/* Change this text */}
   </h1>
   ```

3. **View changes** automatically via hot reload

## Understanding the Development Workflow

### 1. Local Development
```mermaid
Edit Code → Hot Reload → Test in Browser → Iterate
```

### 2. Adding Features
```
1. Create feature branch
2. Modify code
3. Test locally
4. Run Cypress tests
5. Commit changes
6. Create pull request
```

### 3. Data Changes
```
Edit JSON → Verify format → Test in game → Commit
```

## Debugging Tips

### Common Issues

#### Issue: Port 3000 Already in Use
```bash
# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

#### Issue: Module Not Found
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: TypeScript Errors
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Development Tools

#### React DevTools
Install the React DevTools browser extension to inspect:
- Component hierarchy
- Props and state
- Performance profiling

#### Next.js DevTools
Built into the development server:
- Automatic error overlay
- Fast refresh
- Build indicators

#### Browser Console
Use browser console for debugging:
```typescript
// Add console logs
console.log('Game state:', gameState);
console.log('Current puzzle:', currentPuzzle);

// Breakpoints in browser DevTools
debugger; // Execution will pause here
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all files
- Define interfaces for all data structures
- Avoid `any` type
- Use strict mode

```typescript
// Good
interface PuzzleData {
  title: string;
  words: string[];
}

// Avoid
let puzzle: any = { title: "...", words: [...] };
```

### React Components
- Use functional components
- Use hooks for state management
- Keep components focused and small
- Extract reusable logic to custom hooks

```typescript
// Good
export default function PuzzleGrid({ grid }: { grid: string[][] }) {
  return <div>...</div>;
}

// Use custom hooks
const { gameState, updateGameState } = useGameState();
```

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts` or `types.ts`

### Import Organization
```typescript
// 1. React imports
import { useState, useCallback } from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';

// 3. Third-party imports
import someLibrary from 'some-library';

// 4. Local imports
import { GameState } from '@/lib/game/state';
import { useGameLogic } from '@/hooks/useGameLogic';

// 5. Type imports (at the end)
import type { PuzzleData } from '@/lib/game/state';
```

## Next Steps

### For Content Creators
- **[Adding Puzzles](../5-guides/ADDING_PUZZLES.md)** - Create word search puzzles
- **[Puzzle System](../3-systems/PUZZLE_SYSTEM.md)** - Understand puzzle format
- **[Adding Characters](../5-guides/ADDING_CHARACTERS.md)** - Create dialogue characters

### For Developers
- **[Game Overview](GAME_OVERVIEW.md)** - Understand game mechanics
- **[Architecture Summary](ARCHITECTURE_SUMMARY.md)** - High-level architecture
- **[System Documentation](../3-systems/)** - Deep dive into systems
- **[API Reference](../4-api-reference/)** - Function references

### For Architects
- **[Comprehensive Architecture](../2-architecture/CODEBASE_ARCHITECTURE.md)** - Full analysis
- **[Game Engine Vision](../2-architecture/GAME_ENGINE_VISION.md)** - Future design
- **[Refactoring Roadmap](../7-refactoring/REFACTORING_ROADMAP.md)** - Transformation plan

## Getting Help

### Documentation
- Check the **[docs/](../README.md)** folder for comprehensive guides
- Use your editor's search to find specific topics

### Code Comments
- Most complex functions have detailed comments
- Check file headers for overviews

### Testing
- Run existing tests to understand expected behavior
- Check `cypress/e2e/` for usage examples

### Community
- Create an issue for bugs or unclear documentation
- Submit pull requests for improvements

---

**Welcome to Chronicles of the Kethaneum development!** Start with a simple change, explore the codebase, and gradually dive deeper into the systems.

**Recommended First Task**: Add a custom puzzle to `testPuzzles.json` and play it in Puzzle-Only mode.

For more detailed information, continue to **[Game Overview](GAME_OVERVIEW.md)**.
