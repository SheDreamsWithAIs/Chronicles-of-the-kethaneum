# Refactoring Roadmap - Step-by-Step Engine Transformation

## Executive Summary

This document provides a **detailed, actionable roadmap** for transforming Chronicles of the Kethaneum from a single-purpose game into a reusable game engine. The refactoring is organized into **three major phases** spanning **4-6 weeks** of development time.

**Goal:** Transform 40% reusable codebase into 100% reusable engine

**Approach:** Incremental refactoring with continuous testing

**Timeline:** 4-6 weeks (assumes 2-3 developers)

**Risk Level:** Medium (mitigated by incremental approach)

---

## Overview of Phases

### Phase 1: Foundation (2 weeks)
Create engine abstraction layer and define plugin interfaces

**Key Deliverables:**
- Engine directory structure
- Core plugin interfaces
- Generic state management
- Initial documentation

### Phase 2: Extraction (3 weeks)
Move game-specific logic to Kethaneum plugin implementation

**Key Deliverables:**
- Kethaneum implemented as plugin
- All game-specific code separated
- Updated imports throughout codebase
- Backward compatibility maintained

### Phase 3: Validation (1 week)
Prove engine works by creating second game

**Key Deliverables:**
- Proof-of-concept game ("Simple Word Search")
- Developer documentation
- Migration guide
- Success metrics validation

---

## Phase 1: Foundation (2 Weeks)

### Goals
- Create engine directory structure
- Define plugin interfaces
- Extract core generic code
- Establish patterns for future work

### Week 1: Directory Structure & Interfaces

#### Task 1.1: Create Engine Directory Structure

**Estimated Time:** 2 hours

**Steps:**
```bash
# Create engine directories
mkdir -p engine/core
mkdir -p engine/plugins
mkdir -p engine/systems
mkdir -p engine/components
mkdir -p engine/types
mkdir -p engine/utils

# Create games directory
mkdir -p games/kethaneum
mkdir -p games/kethaneum/plugins
mkdir -p games/kethaneum/config
mkdir -p games/kethaneum/types
```

**Files to create:**
```
engine/
├── core/
│   ├── PuzzleEngine.ts          # Main engine class
│   ├── EngineState.ts           # Generic state interface
│   └── GameLoop.ts              # Core game loop logic
├── plugins/
│   ├── IPuzzleLoader.ts         # Puzzle loader interface
│   ├── IPuzzleSelector.ts       # Selection strategy interface
│   ├── IProgressionSystem.ts    # Progression interface
│   ├── IUIRenderer.ts           # UI renderer interface
│   └── index.ts                 # Export all interfaces
├── systems/
│   ├── GridGenerator.ts         # Generic grid generation
│   ├── WordValidator.ts         # Generic word checking
│   └── TimerSystem.ts           # Generic timer logic
├── components/
│   ├── GameScreen.tsx           # Generic game screen
│   └── PuzzleGrid.tsx           # Generic grid component
└── types/
    ├── Puzzle.ts                # Generic puzzle interface
    ├── Grid.ts                  # Grid types
    └── index.ts                 # Export all types
```

**Success Criteria:**
- [ ] All directories created
- [ ] Placeholder files created with basic structure
- [ ] TypeScript compiles without errors

#### Task 1.2: Define Plugin Interfaces

**Estimated Time:** 8 hours

**Create: `engine/plugins/IPuzzleLoader.ts`**

```typescript
/**
 * Interface for loading puzzles from data sources
 */
export interface IPuzzleLoader {
  /**
   * Load all puzzles from data source
   * @returns Promise resolving to array of puzzles
   */
  loadPuzzles(): Promise<Puzzle[]>;

  /**
   * Load available categories/genres
   * @returns Promise resolving to array of category names
   */
  loadCategories(): Promise<string[]>;

  /**
   * Load a specific category
   * @param category - Category name
   * @returns Promise resolving to puzzles in category
   */
  loadCategory(category: string): Promise<Puzzle[]>;
}
```

**Create: `engine/plugins/IPuzzleSelector.ts`**

```typescript
/**
 * Interface for puzzle selection strategies
 */
export interface IPuzzleSelector {
  /**
   * Select next puzzle based on current state
   * @param state - Current engine state
   * @param puzzles - Available puzzles
   * @returns Selected puzzle or null if none available
   */
  selectNext(state: EngineState, puzzles: Puzzle[]): Puzzle | null;

  /**
   * Check if a puzzle can be selected
   * @param puzzle - Puzzle to check
   * @param state - Current engine state
   * @returns True if puzzle is eligible
   */
  canSelect(puzzle: Puzzle, state: EngineState): boolean;

  /**
   * Reset selection state
   * @param state - Current engine state
   */
  reset(state: EngineState): void;

  /**
   * Handle puzzle completion
   * @param puzzle - Completed puzzle
   * @param state - Current engine state
   * @returns Updated state
   */
  onPuzzleComplete(puzzle: Puzzle, state: EngineState): EngineState;
}
```

**Create: `engine/plugins/IProgressionSystem.ts`**

```typescript
/**
 * Interface for progression tracking systems
 */
export interface IProgressionSystem {
  /**
   * Get current progression data
   * @param state - Current engine state
   * @returns Progression information
   */
  getProgress(state: EngineState): ProgressData;

  /**
   * Mark puzzle as completed
   * @param puzzle - Completed puzzle
   * @param state - Current engine state
   * @returns Updated state
   */
  markCompleted(puzzle: Puzzle, state: EngineState): EngineState;

  /**
   * Check if milestone reached
   * @param state - Current engine state
   * @returns Milestone data or null
   */
  checkMilestone(state: EngineState): Milestone | null;

  /**
   * Initialize progression state
   * @param state - Current engine state
   * @returns Initialized state
   */
  initialize(state: EngineState): EngineState;
}
```

**Create: `engine/plugins/IUIRenderer.ts`**

```typescript
/**
 * Interface for UI rendering
 */
export interface IUIRenderer {
  /**
   * Render puzzle grid
   * @param grid - Grid data
   * @param wordList - Words to find
   * @param onCellClick - Cell click handler
   * @returns React element
   */
  renderGrid(
    grid: Grid,
    wordList: Word[],
    onCellClick: (row: number, col: number) => void
  ): JSX.Element;

  /**
   * Render word list
   * @param words - Words to display
   * @returns React element
   */
  renderWordList(words: Word[]): JSX.Element;

  /**
   * Render game chrome (timer, score, etc.)
   * @param state - Current engine state
   * @returns React element
   */
  renderChrome(state: EngineState): JSX.Element;

  /**
   * Render modal dialogs
   * @param type - Modal type
   * @param props - Modal props
   * @returns React element
   */
  renderModal(type: string, props: any): JSX.Element;
}
```

**Success Criteria:**
- [ ] All interfaces defined with complete JSDoc
- [ ] Interfaces compile without errors
- [ ] Interfaces exported from `engine/plugins/index.ts`

#### Task 1.3: Define Generic Types

**Estimated Time:** 4 hours

**Create: `engine/types/Puzzle.ts`**

```typescript
/**
 * Generic puzzle interface
 */
export interface Puzzle {
  /** Unique identifier */
  id: string;

  /** Display title */
  title: string;

  /** Words to find in puzzle */
  words: string[];

  /** Optional category/genre */
  category?: string;

  /** Game-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Word data with placement information
 */
export interface Word {
  /** The word itself */
  word: string;

  /** Whether word has been found */
  found: boolean;

  /** Starting row position */
  row: number;

  /** Starting column position */
  col: number;

  /** Direction vector [dRow, dCol] */
  direction: [number, number];
}
```

**Create: `engine/types/Grid.ts`**

```typescript
/**
 * Grid types
 */
export type Grid = string[][];

/**
 * Cell position
 */
export interface Cell {
  row: number;
  col: number;
  value: string;
}

/**
 * Grid configuration
 */
export interface GridConfig {
  size: number;
  minWordLength: number;
  maxWordLength: number;
  maxWords: number;
  directions: [number, number][];
}
```

**Create: `engine/core/EngineState.ts`**

```typescript
/**
 * Generic engine state
 */
export interface EngineState {
  /** Current puzzle */
  currentPuzzle: Puzzle | null;

  /** Puzzle grid */
  grid: Grid;

  /** Words to find */
  wordList: Word[];

  /** Selected cells */
  selectedCells: Cell[];

  /** Timer state */
  timeRemaining: number;
  paused: boolean;
  gameOver: boolean;

  /** All loaded puzzles */
  puzzles: Puzzle[];

  /** Completed puzzle IDs */
  completedPuzzles: Set<string>;

  /** Game-specific metadata */
  metadata: Record<string, any>;
}
```

**Success Criteria:**
- [ ] All types defined
- [ ] Types compile without errors
- [ ] Types exported from `engine/types/index.ts`

### Week 2: Extract Core Systems

#### Task 1.4: Extract Grid Generator

**Estimated Time:** 6 hours

**Current location:** `lib/game/puzzleGenerator.ts`

**New location:** `engine/systems/GridGenerator.ts`

**Refactoring steps:**

1. **Copy existing code:**
```bash
cp lib/game/puzzleGenerator.ts engine/systems/GridGenerator.ts
```

2. **Update imports:**
```typescript
// Change from:
import type { GameState, PuzzleData } from './state';

// To:
import type { EngineState, Puzzle } from '../types';
```

3. **Update function signatures:**
```typescript
// Change from:
export function generateGrid(
  words: string[],
  config: Config,
  state: GameState
): { grid: string[][]; wordList: WordData[] }

// To:
export function generateGrid(
  words: string[],
  config: GridConfig
): { grid: Grid; wordList: Word[] }
```

4. **Remove game-specific references:**
```typescript
// Remove references to:
// - GameState (use EngineState or just config)
// - PuzzleData (use Puzzle)
// - Any Kethaneum-specific logic
```

5. **Update old file to use new location:**
```typescript
// lib/game/puzzleGenerator.ts
export { generateGrid } from '@/engine/systems/GridGenerator';
// Mark as deprecated
```

**Testing:**
```typescript
// Create test file: engine/systems/__tests__/GridGenerator.test.ts
describe('GridGenerator', () => {
  it('should generate grid with all words placed', () => {
    const words = ['WORD', 'SEARCH', 'PUZZLE'];
    const config = { size: 10, /* ... */ };
    const { grid, wordList } = generateGrid(words, config);

    expect(wordList.length).toBe(words.length);
    expect(grid.length).toBe(config.size);
  });
});
```

**Success Criteria:**
- [ ] Grid generator works with generic types
- [ ] No game-specific dependencies
- [ ] Tests pass
- [ ] Old code imports from new location

#### Task 1.5: Extract Word Validator

**Estimated Time:** 4 hours

**Current location:** `lib/game/logic.ts` (checkForWord function)

**New location:** `engine/systems/WordValidator.ts`

**Refactoring steps:**

1. **Extract function:**
```typescript
// engine/systems/WordValidator.ts
export function checkForWord(
  selectedCells: Cell[],
  grid: Grid,
  wordList: Word[]
): Word | null {
  // Extract existing logic from lib/game/logic.ts
  // Make it work with generic types
}
```

2. **Update original file:**
```typescript
// lib/game/logic.ts
import { checkForWord } from '@/engine/systems/WordValidator';
// Update to use imported function
```

**Success Criteria:**
- [ ] Word validation works with generic types
- [ ] No game-specific dependencies
- [ ] Tests pass

#### Task 1.6: Extract Timer System

**Estimated Time:** 4 hours

**Current location:** `hooks/useTimer.ts`

**New location:** `engine/systems/TimerSystem.ts`

**Refactoring steps:**

1. **Extract timer logic to class:**
```typescript
// engine/systems/TimerSystem.ts
export class TimerSystem {
  private timeRemaining: number;
  private isPaused: boolean;
  private interval: NodeJS.Timeout | null;

  constructor(initialTime: number) {
    this.timeRemaining = initialTime;
    this.isPaused = false;
    this.interval = null;
  }

  start(onTick: (time: number) => void, onExpire: () => void): void {
    // Start timer
  }

  pause(): void {
    // Pause timer
  }

  resume(): void {
    // Resume timer
  }

  stop(): void {
    // Stop timer
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }
}
```

2. **Update hooks to use TimerSystem:**
```typescript
// hooks/useTimer.ts
import { TimerSystem } from '@/engine/systems/TimerSystem';

export function useTimer(config: TimerConfig) {
  const [timer] = useState(() => new TimerSystem(config.initialTime));
  // ... rest of hook
}
```

**Success Criteria:**
- [ ] Timer logic extracted to class
- [ ] Hooks use new timer system
- [ ] No breaking changes to existing hooks

#### Task 1.7: Create PuzzleEngine Class

**Estimated Time:** 8 hours

**Create: `engine/core/PuzzleEngine.ts`**

```typescript
/**
 * Main puzzle engine class
 */
export class PuzzleEngine {
  private state: EngineState;
  private loader: IPuzzleLoader;
  private selector: IPuzzleSelector;
  private progression: IProgressionSystem;
  private renderer: IUIRenderer;

  constructor(
    loader: IPuzzleLoader,
    selector: IPuzzleSelector,
    progression: IProgressionSystem,
    renderer: IUIRenderer
  ) {
    this.loader = loader;
    this.selector = selector;
    this.progression = progression;
    this.renderer = renderer;
    this.state = this.initializeState();
  }

  /**
   * Initialize engine state
   */
  private initializeState(): EngineState {
    return {
      currentPuzzle: null,
      grid: [],
      wordList: [],
      selectedCells: [],
      timeRemaining: 0,
      paused: false,
      gameOver: false,
      puzzles: [],
      completedPuzzles: new Set(),
      metadata: {}
    };
  }

  /**
   * Load all puzzles
   */
  async loadPuzzles(): Promise<void> {
    this.state.puzzles = await this.loader.loadPuzzles();
  }

  /**
   * Select next puzzle
   */
  selectNextPuzzle(): Puzzle | null {
    return this.selector.selectNext(this.state, this.state.puzzles);
  }

  /**
   * Initialize a puzzle
   */
  initializePuzzle(puzzle: Puzzle, config: GridConfig): void {
    const { grid, wordList } = generateGrid(puzzle.words, config);

    this.state.currentPuzzle = puzzle;
    this.state.grid = grid;
    this.state.wordList = wordList;
    this.state.selectedCells = [];
    this.state.gameOver = false;
  }

  /**
   * Check if selected cells form a word
   */
  checkWord(cells: Cell[]): Word | null {
    return checkForWord(cells, this.state.grid, this.state.wordList);
  }

  /**
   * Mark word as found
   */
  markWordFound(word: Word): void {
    const wordInList = this.state.wordList.find(w => w.word === word.word);
    if (wordInList) {
      wordInList.found = true;
    }

    // Check win condition
    if (this.state.wordList.every(w => w.found)) {
      this.onPuzzleComplete();
    }
  }

  /**
   * Handle puzzle completion
   */
  private onPuzzleComplete(): void {
    if (this.state.currentPuzzle) {
      this.state = this.progression.markCompleted(
        this.state.currentPuzzle,
        this.state
      );

      this.state = this.selector.onPuzzleComplete(
        this.state.currentPuzzle,
        this.state
      );

      this.state.gameOver = true;
    }
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<EngineState> {
    return this.state;
  }

  /**
   * Get renderer
   */
  getRenderer(): IUIRenderer {
    return this.renderer;
  }
}
```

**Success Criteria:**
- [ ] PuzzleEngine class created
- [ ] All core methods implemented
- [ ] Type-safe with plugin interfaces
- [ ] Unit tests pass

#### Task 1.8: Documentation

**Estimated Time:** 4 hours

**Create:**
- `engine/README.md` - Engine overview
- `engine/ARCHITECTURE.md` - Engine architecture
- `engine/plugins/README.md` - Plugin development guide

**Success Criteria:**
- [ ] Documentation complete
- [ ] Examples included
- [ ] Clear explanation of plugin system

---

## Phase 2: Extraction (3 Weeks)

### Goals
- Implement Kethaneum as engine plugin
- Migrate all game-specific code
- Maintain backward compatibility
- Update all imports

### Week 3: Implement Kethaneum Plugins

#### Task 2.1: Implement KethaneumLoader

**Estimated Time:** 8 hours

**Create: `games/kethaneum/plugins/KethaneumLoader.ts`**

```typescript
import { IPuzzleLoader, Puzzle } from '@/engine/plugins';

interface KethaneumPuzzleData {
  title: string;
  book: string;
  genre: string;
  words: string[];
  storyPart?: number;
  storyExcerpt?: string;
}

export class KethaneumLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    // Load from genre manifest
    const manifest = await this.loadManifest();
    const allPuzzles: Puzzle[] = [];

    // Load each genre file
    for (const filePath of manifest.genreFiles) {
      const puzzles = await this.loadGenreFile(filePath);
      allPuzzles.push(...puzzles);
    }

    return allPuzzles;
  }

  async loadCategories(): Promise<string[]> {
    const manifest = await this.loadManifest();
    return manifest.genreFiles.map(path => this.extractGenre(path));
  }

  async loadCategory(category: string): Promise<Puzzle[]> {
    const allPuzzles = await this.loadPuzzles();
    return allPuzzles.filter(p => p.category === category);
  }

  private async loadManifest() {
    const response = await fetch('/data/genreManifest.json');
    return response.json();
  }

  private async loadGenreFile(filePath: string): Promise<Puzzle[]> {
    const response = await fetch(filePath);
    const data: KethaneumPuzzleData[] = await response.json();

    return data.map(puzzle => ({
      id: puzzle.title,
      title: puzzle.title,
      words: puzzle.words,
      category: puzzle.genre,
      metadata: {
        book: puzzle.book,
        storyPart: puzzle.storyPart ?? 0,
        storyExcerpt: puzzle.storyExcerpt
      }
    }));
  }

  private extractGenre(filePath: string): string {
    // Extract genre from file path
    const match = filePath.match(/\/(\w+)Puzzles\.json$/);
    return match ? match[1] : 'Unknown';
  }
}
```

**Testing:**
```typescript
describe('KethaneumLoader', () => {
  it('should load all puzzles', async () => {
    const loader = new KethaneumLoader();
    const puzzles = await loader.loadPuzzles();
    expect(puzzles.length).toBeGreaterThan(0);
  });

  it('should transform to generic format', async () => {
    const loader = new KethaneumLoader();
    const puzzles = await loader.loadPuzzles();
    expect(puzzles[0]).toHaveProperty('id');
    expect(puzzles[0]).toHaveProperty('words');
    expect(puzzles[0]).toHaveProperty('metadata');
  });
});
```

**Success Criteria:**
- [ ] Loader implements IPuzzleLoader
- [ ] Transforms Kethaneum format to generic format
- [ ] Tests pass
- [ ] No breaking changes to puzzle data

#### Task 2.2: Implement WeavingSelector

**Estimated Time:** 12 hours

**Create: `games/kethaneum/plugins/WeavingSelector.ts`**

```typescript
import { IPuzzleSelector, Puzzle, EngineState } from '@/engine/plugins';

export class WeavingSelector implements IPuzzleSelector {
  private narrativeGenre = "Kethaneum";
  private minInterval = 2;
  private maxInterval = 5;

  selectNext(state: EngineState, puzzles: Puzzle[]): Puzzle | null {
    // Initialize metadata if needed
    if (!state.metadata.weavingState) {
      state.metadata.weavingState = {
        selectedGenre: '',
        nextNarrativeIndex: 0,
        puzzlesSinceLastNarrative: 0,
        nextNarrativeInterval: this.randomInterval()
      };
    }

    const weavingState = state.metadata.weavingState;

    // Check if time for narrative puzzle
    if (this.shouldInsertNarrative(state)) {
      return this.selectNarrativePuzzle(state, puzzles);
    }

    // Select from chosen genre
    return this.selectGenrePuzzle(state, puzzles);
  }

  private shouldInsertNarrative(state: EngineState): boolean {
    const weavingState = state.metadata.weavingState;

    // Get narrative puzzles
    const narrativePuzzles = state.puzzles.filter(
      p => p.category === this.narrativeGenre
    );

    if (narrativePuzzles.length === 0) return false;
    if (weavingState.nextNarrativeIndex >= narrativePuzzles.length) return false;

    // Check counter
    return weavingState.puzzlesSinceLastNarrative >= weavingState.nextNarrativeInterval;
  }

  private selectNarrativePuzzle(state: EngineState, puzzles: Puzzle[]): Puzzle | null {
    const weavingState = state.metadata.weavingState;
    const narrativePuzzles = puzzles.filter(p => p.category === this.narrativeGenre);

    if (weavingState.nextNarrativeIndex >= narrativePuzzles.length) {
      return null;
    }

    const puzzle = narrativePuzzles[weavingState.nextNarrativeIndex];

    // Update state for next time
    weavingState.nextNarrativeIndex += 1;
    weavingState.puzzlesSinceLastNarrative = 0;
    weavingState.nextNarrativeInterval = this.randomInterval();

    return puzzle;
  }

  private selectGenrePuzzle(state: EngineState, puzzles: Puzzle[]): Puzzle | null {
    const weavingState = state.metadata.weavingState;
    const selectedGenre = weavingState.selectedGenre;

    if (!selectedGenre) return null;

    // Get uncompleted puzzles in selected genre
    const genrePuzzles = puzzles.filter(p =>
      p.category === selectedGenre &&
      !state.completedPuzzles.has(p.id)
    );

    if (genrePuzzles.length === 0) {
      // Genre exhausted
      return null;
    }

    // Select based on book progression
    const puzzle = this.selectByBookProgression(genrePuzzles, state);

    // Increment counter
    weavingState.puzzlesSinceLastNarrative += 1;

    return puzzle;
  }

  private selectByBookProgression(puzzles: Puzzle[], state: EngineState): Puzzle {
    // Group by book, find lowest incomplete part
    const bookGroups: { [book: string]: Puzzle[] } = {};

    puzzles.forEach(p => {
      const book = p.metadata.book || 'Unknown';
      if (!bookGroups[book]) {
        bookGroups[book] = [];
      }
      bookGroups[book].push(p);
    });

    // Find lowest incomplete part per book
    const startingPoints: Puzzle[] = [];

    for (const book in bookGroups) {
      const sorted = bookGroups[book].sort((a, b) =>
        (a.metadata.storyPart || 0) - (b.metadata.storyPart || 0)
      );
      startingPoints.push(sorted[0]);
    }

    // Random selection from starting points
    return startingPoints[Math.floor(Math.random() * startingPoints.length)];
  }

  private randomInterval(): number {
    return Math.floor(Math.random() * (this.maxInterval - this.minInterval + 1)) + this.minInterval;
  }

  canSelect(puzzle: Puzzle, state: EngineState): boolean {
    return !state.completedPuzzles.has(puzzle.id);
  }

  reset(state: EngineState): void {
    state.metadata.weavingState = {
      selectedGenre: '',
      nextNarrativeIndex: 0,
      puzzlesSinceLastNarrative: 0,
      nextNarrativeInterval: this.randomInterval()
    };
  }

  onPuzzleComplete(puzzle: Puzzle, state: EngineState): EngineState {
    state.completedPuzzles.add(puzzle.id);
    return state;
  }
}
```

**Testing:**
```typescript
describe('WeavingSelector', () => {
  it('should alternate between genre and narrative', () => {
    const selector = new WeavingSelector();
    const state = createMockState();
    state.metadata.weavingState = {
      selectedGenre: 'Nature',
      nextNarrativeIndex: 0,
      puzzlesSinceLastNarrative: 0,
      nextNarrativeInterval: 2
    };

    const puzzles = createMockPuzzles();

    // First two should be Nature
    expect(selector.selectNext(state, puzzles).category).toBe('Nature');
    expect(selector.selectNext(state, puzzles).category).toBe('Nature');

    // Third should be Kethaneum
    expect(selector.selectNext(state, puzzles).category).toBe('Kethaneum');
  });
});
```

**Success Criteria:**
- [ ] Selector implements IPuzzleSelector
- [ ] Weaving logic works correctly
- [ ] Tests pass
- [ ] No breaking changes to game behavior

#### Task 2.3: Implement BookProgressionSystem

**Estimated Time:** 6 hours

**Create: `games/kethaneum/plugins/BookProgressionSystem.ts`**

```typescript
import { IProgressionSystem, Puzzle, EngineState, ProgressData, Milestone } from '@/engine/plugins';

export class BookProgressionSystem implements IProgressionSystem {
  getProgress(state: EngineState): ProgressData {
    const books = state.metadata.books || {};
    const discoveredBooks = state.metadata.discoveredBooks || new Set();

    return {
      currentBook: state.metadata.currentBook,
      currentPart: state.metadata.currentStoryPart,
      discoveredBooks: discoveredBooks.size,
      completedBooks: this.countCompletedBooks(books),
      totalPuzzles: state.completedPuzzles.size
    };
  }

  markCompleted(puzzle: Puzzle, state: EngineState): EngineState {
    const newState = { ...state };

    // Initialize books tracking
    if (!newState.metadata.books) {
      newState.metadata.books = {};
    }

    if (!newState.metadata.discoveredBooks) {
      newState.metadata.discoveredBooks = new Set();
    }

    // Get book and part
    const book = puzzle.metadata.book;
    const part = puzzle.metadata.storyPart || 0;

    // Mark as discovered
    newState.metadata.discoveredBooks.add(book);

    // Mark part as complete
    if (!newState.metadata.books[book]) {
      newState.metadata.books[book] = [];
    }
    newState.metadata.books[book][part] = true;

    // Update current position
    newState.metadata.currentBook = book;
    newState.metadata.currentStoryPart = part;

    return newState;
  }

  checkMilestone(state: EngineState): Milestone | null {
    const books = state.metadata.books || {};

    // Check if a book was just completed
    for (const book in books) {
      if (this.isBookComplete(book, books)) {
        const wasCompleted = state.metadata.completedBooks?.[book];
        if (!wasCompleted) {
          // Mark as notified
          if (!state.metadata.completedBooks) {
            state.metadata.completedBooks = {};
          }
          state.metadata.completedBooks[book] = true;

          return {
            type: 'book-complete',
            title: `${book} Complete!`,
            description: `You've finished all parts of ${book}.`,
            data: { book }
          };
        }
      }
    }

    return null;
  }

  initialize(state: EngineState): EngineState {
    if (!state.metadata.books) {
      state.metadata.books = {};
    }
    if (!state.metadata.discoveredBooks) {
      state.metadata.discoveredBooks = new Set();
    }
    if (!state.metadata.completedBooks) {
      state.metadata.completedBooks = {};
    }
    return state;
  }

  private isBookComplete(book: string, books: any): boolean {
    if (!books[book] || !Array.isArray(books[book])) {
      return false;
    }

    // Check if all parts are true
    // Assumes parts 0-4
    for (let i = 0; i <= 4; i++) {
      if (!books[book][i]) {
        return false;
      }
    }

    return true;
  }

  private countCompletedBooks(books: any): number {
    let count = 0;
    for (const book in books) {
      if (this.isBookComplete(book, books)) {
        count++;
      }
    }
    return count;
  }
}
```

**Success Criteria:**
- [ ] System implements IProgressionSystem
- [ ] Book tracking works correctly
- [ ] Milestone detection works
- [ ] Tests pass

### Week 4: Implement UI Renderer & Migrate Components

#### Task 2.4: Implement CosmicUIRenderer

**Estimated Time:** 12 hours

**Create: `games/kethaneum/plugins/CosmicUIRenderer.tsx`**

```typescript
import { IUIRenderer, Grid, Word, EngineState, Cell } from '@/engine/plugins';
import { CosmicBackground } from '@/components/shared/CosmicBackground';

export class CosmicUIRenderer implements IUIRenderer {
  renderGrid(
    grid: Grid,
    wordList: Word[],
    onCellClick: (row: number, col: number) => void
  ): JSX.Element {
    return (
      <div className="relative">
        <CosmicBackground />
        <div className="puzzle-grid">
          {grid.map((row, r) => (
            <div key={r} className="grid-row">
              {row.map((cell, c) => {
                const isSelected = this.isCellSelected(r, c, /* selectedCells */);
                const isPartOfWord = this.isCellPartOfFoundWord(r, c, wordList);

                return (
                  <div
                    key={c}
                    className={`grid-cell ${isSelected ? 'selected' : ''} ${isPartOfWord ? 'found' : ''}`}
                    onClick={() => onCellClick(r, c)}
                  >
                    {cell}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderWordList(words: Word[]): JSX.Element {
    return (
      <div className="word-list cosmic-style">
        {words.map(word => (
          <span
            key={word.word}
            className={`word-item ${word.found ? 'found' : ''}`}
          >
            {word.word}
          </span>
        ))}
      </div>
    );
  }

  renderChrome(state: EngineState): JSX.Element {
    const progress = state.metadata.discoveredBooks || 0;

    return (
      <div className="game-chrome">
        <div className="timer">
          {this.formatTime(state.timeRemaining)}
        </div>
        <div className="progress">
          Books Discovered: {progress}
        </div>
        <div className="word-count">
          {state.wordList.filter(w => w.found).length} / {state.wordList.length} words
        </div>
      </div>
    );
  }

  renderModal(type: string, props: any): JSX.Element {
    switch (type) {
      case 'game-stats':
        return this.renderStatsModal(props);
      case 'genre-selection':
        return this.renderGenreModal(props);
      default:
        return <div></div>;
    }
  }

  private renderStatsModal(props: any): JSX.Element {
    return (
      <div className="modal cosmic-modal">
        <h2>Puzzle Complete!</h2>
        <div className="stats">
          <p>Time: {this.formatTime(props.time)}</p>
          <p>Words Found: {props.wordsFound}</p>
        </div>
        <button onClick={props.onContinue}>Continue</button>
      </div>
    );
  }

  private renderGenreModal(props: any): JSX.Element {
    return (
      <div className="modal cosmic-modal">
        <h2>Select Genre</h2>
        <div className="genre-list">
          {props.genres.map((genre: string) => (
            <button
              key={genre}
              onClick={() => props.onSelect(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    );
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private isCellSelected(row: number, col: number, selectedCells: Cell[]): boolean {
    // Implementation
    return false;
  }

  private isCellPartOfFoundWord(row: number, col: number, wordList: Word[]): boolean {
    // Implementation
    return false;
  }
}
```

**Success Criteria:**
- [ ] Renderer implements IUIRenderer
- [ ] Uses existing Cosmic components
- [ ] Visual appearance unchanged
- [ ] Tests pass

#### Task 2.5: Migrate Puzzle Page to Use Engine

**Estimated Time:** 8 hours

**Update: `app/puzzle/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { PuzzleEngine } from '@/engine/core/PuzzleEngine';
import { KethaneumLoader } from '@/games/kethaneum/plugins/KethaneumLoader';
import { WeavingSelector } from '@/games/kethaneum/plugins/WeavingSelector';
import { BookProgressionSystem } from '@/games/kethaneum/plugins/BookProgressionSystem';
import { CosmicUIRenderer } from '@/games/kethaneum/plugins/CosmicUIRenderer';

export default function PuzzlePage() {
  const [engine, setEngine] = useState<PuzzleEngine | null>(null);
  const [state, setState] = useState<EngineState | null>(null);

  useEffect(() => {
    // Initialize engine
    const loader = new KethaneumLoader();
    const selector = new WeavingSelector();
    const progression = new BookProgressionSystem();
    const renderer = new CosmicUIRenderer();

    const newEngine = new PuzzleEngine(loader, selector, progression, renderer);

    // Load puzzles
    newEngine.loadPuzzles().then(() => {
      // Select first puzzle
      const puzzle = newEngine.selectNextPuzzle();
      if (puzzle) {
        newEngine.initializePuzzle(puzzle, {
          size: 10,
          minWordLength: 3,
          maxWordLength: 12,
          maxWords: 8,
          directions: [/* ... */]
        });
      }

      setEngine(newEngine);
      setState(newEngine.getState());
    });
  }, []);

  if (!engine || !state) {
    return <div>Loading...</div>;
  }

  const renderer = engine.getRenderer();

  return (
    <div className="puzzle-page">
      {renderer.renderChrome(state)}
      {renderer.renderGrid(state.grid, state.wordList, handleCellClick)}
      {renderer.renderWordList(state.wordList)}
    </div>
  );

  function handleCellClick(row: number, col: number) {
    // Handle cell selection
  }
}
```

**Success Criteria:**
- [ ] Puzzle page uses PuzzleEngine
- [ ] Game functionality unchanged
- [ ] No regressions
- [ ] Tests pass

### Week 5: Finalize Migration

#### Task 2.6: Update All Imports

**Estimated Time:** 8 hours

**Script to help find imports:**
```bash
# Find all imports from old locations
grep -r "from './game/" app/ components/ hooks/
grep -r "from '@/lib/game/" app/ components/ hooks/

# Update to engine imports
# Replace manually or with sed
```

**Success Criteria:**
- [ ] All imports updated
- [ ] No broken imports
- [ ] App compiles successfully

#### Task 2.7: Backward Compatibility Layer

**Estimated Time:** 6 hours

**Create: `lib/game/compatibility.ts`**

```typescript
/**
 * Backward compatibility layer
 * Wraps engine to maintain old API
 */
import { PuzzleEngine } from '@/engine/core/PuzzleEngine';
import type { GameState } from './state';
import type { EngineState } from '@/engine/core/EngineState';

export function convertEngineToGameState(engineState: EngineState): GameState {
  // Convert engine state to old game state format
  return {
    // Map fields
    currentScreen: 'puzzle',
    grid: engineState.grid,
    wordList: engineState.wordList,
    // ... map all fields
  };
}

export function convertGameToEngineState(gameState: GameState): EngineState {
  // Convert old game state to engine state
  return {
    currentPuzzle: null,
    grid: gameState.grid,
    wordList: gameState.wordList,
    // ... map all fields
  };
}
```

**Success Criteria:**
- [ ] Old code still works
- [ ] Conversion functions tested
- [ ] No breaking changes

#### Task 2.8: Testing & Bug Fixes

**Estimated Time:** 16 hours

**Testing checklist:**
- [ ] All game modes work (Story, Puzzle-Only, Beat-the-Clock)
- [ ] Puzzle selection works correctly
- [ ] Weaving system works
- [ ] Book progression tracks correctly
- [ ] Save/load works
- [ ] Audio system works
- [ ] Dialogue system works
- [ ] All modals work
- [ ] Navigation works
- [ ] No console errors
- [ ] Performance is acceptable

**Bug fix process:**
1. Document bug
2. Create test case
3. Fix bug
4. Verify test passes
5. Regression test

**Success Criteria:**
- [ ] All tests pass
- [ ] No known bugs
- [ ] Performance acceptable

---

## Phase 3: Validation (1 Week)

### Goals
- Create proof-of-concept game
- Validate engine works for different games
- Document engine for developers
- Measure success metrics

### Week 6: Proof of Concept

#### Task 3.1: Create "Simple Word Search" Game

**Estimated Time:** 16 hours

**Game concept:**
- Minimalist design
- Linear progression (no weaving)
- No story, just puzzles
- Simple difficulty progression

**Create game structure:**
```bash
mkdir -p games/simple-word-search
mkdir -p games/simple-word-search/plugins
mkdir -p games/simple-word-search/data
mkdir -p games/simple-word-search/config
```

**Implement plugins:**

```typescript
// games/simple-word-search/plugins/SimpleLoader.ts
export class SimpleLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    const response = await fetch('/games/simple-word-search/data/puzzles.json');
    const data = await response.json();

    return data.map((p, i) => ({
      id: `puzzle-${i}`,
      title: p.title,
      words: p.words,
      metadata: {
        difficulty: p.difficulty
      }
    }));
  }

  async loadCategories(): Promise<string[]> {
    return ["Easy", "Medium", "Hard"];
  }

  async loadCategory(category: string): Promise<Puzzle[]> {
    const all = await this.loadPuzzles();
    return all.filter(p => p.metadata.difficulty === category.toLowerCase());
  }
}

// games/simple-word-search/plugins/LinearSelector.ts
export class LinearSelector implements IPuzzleSelector {
  selectNext(state: EngineState, puzzles: Puzzle[]): Puzzle | null {
    // Just select next uncompleted puzzle
    const uncompleted = puzzles.filter(p => !state.completedPuzzles.has(p.id));
    return uncompleted[0] || null;
  }

  canSelect(puzzle: Puzzle, state: EngineState): boolean {
    return !state.completedPuzzles.has(puzzle.id);
  }

  reset(state: EngineState): void {
    state.completedPuzzles.clear();
  }

  onPuzzleComplete(puzzle: Puzzle, state: EngineState): EngineState {
    state.completedPuzzles.add(puzzle.id);
    return state;
  }
}

// games/simple-word-search/plugins/SimpleProgression.ts
export class SimpleProgression implements IProgressionSystem {
  getProgress(state: EngineState): ProgressData {
    return {
      currentLevel: state.completedPuzzles.size + 1,
      totalLevels: state.puzzles.length,
      percentage: (state.completedPuzzles.size / state.puzzles.length) * 100
    };
  }

  markCompleted(puzzle: Puzzle, state: EngineState): EngineState {
    state.completedPuzzles.add(puzzle.id);
    return state;
  }

  checkMilestone(state: EngineState): Milestone | null {
    const completed = state.completedPuzzles.size;

    if (completed % 10 === 0 && completed > 0) {
      return {
        type: 'milestone',
        title: `${completed} Puzzles Complete!`,
        description: `You've solved ${completed} puzzles.`,
        data: { count: completed }
      };
    }

    return null;
  }

  initialize(state: EngineState): EngineState {
    return state;
  }
}

// games/simple-word-search/plugins/MinimalRenderer.tsx
export class MinimalRenderer implements IUIRenderer {
  renderGrid(grid: Grid, wordList: Word[], onCellClick: (r: number, c: number) => void): JSX.Element {
    return (
      <div className="simple-grid">
        {grid.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => (
              <div
                key={c}
                className="cell"
                onClick={() => onCellClick(r, c)}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  renderWordList(words: Word[]): JSX.Element {
    return (
      <ul className="word-list">
        {words.map(word => (
          <li key={word.word} className={word.found ? 'found' : ''}>
            {word.word}
          </li>
        ))}
      </ul>
    );
  }

  renderChrome(state: EngineState): JSX.Element {
    return (
      <div className="chrome">
        <div>Level {state.completedPuzzles.size + 1}</div>
        <div>{state.wordList.filter(w => w.found).length} / {state.wordList.length}</div>
      </div>
    );
  }

  renderModal(type: string, props: any): JSX.Element {
    return <div className="modal">{props.message}</div>;
  }
}
```

**Create page:**
```typescript
// app/games/simple-word-search/page.tsx
'use client';

import { createSimpleWordSearchGame } from '@/games/simple-word-search';
import { GameScreen } from '@/engine/components/GameScreen';

export default function SimpleWordSearchPage() {
  const game = createSimpleWordSearchGame();

  return <GameScreen engine={game} />;
}
```

**Success Criteria:**
- [ ] Simple game works end-to-end
- [ ] Different from Kethaneum (proves flexibility)
- [ ] Created in < 16 hours (proves efficiency)
- [ ] No engine changes needed

#### Task 3.2: Create Developer Documentation

**Estimated Time:** 8 hours

**Create: `docs/6-tutorials/BUILDING_A_NEW_GAME.md`**

- Complete tutorial using Simple Word Search as example
- Step-by-step instructions
- Code examples for each plugin
- Common pitfalls and solutions

**Create: `engine/API_REFERENCE.md`**

- Complete API documentation
- All interfaces documented
- All methods documented
- Examples for each interface

**Success Criteria:**
- [ ] Documentation complete
- [ ] Developer can follow tutorial
- [ ] All APIs documented

#### Task 3.3: Measure Success Metrics

**Estimated Time:** 4 hours

**Success Metrics:**

1. **New Game Creation Time:**
   - Target: < 2 weeks
   - Actual: ___ (measured during Simple Word Search creation)
   - Result: ✅ / ❌

2. **Code Reusability:**
   - Target: > 90%
   - Calculation: (Engine code / Total code) × 100
   - Actual: ____%
   - Result: ✅ / ❌

3. **API Stability:**
   - Target: No breaking changes needed for Simple Word Search
   - Actual: ___ breaking changes
   - Result: ✅ / ❌

4. **Developer Experience:**
   - Target: < 8 hours learning time
   - Test: Give tutorial to fresh developer
   - Actual: ___ hours
   - Result: ✅ / ❌

5. **Proof of Concept:**
   - Target: 2+ games running on engine
   - Actual: ___ games
   - Result: ✅ / ❌

**Success Criteria:**
- [ ] All metrics measured
- [ ] Results documented
- [ ] Adjustments planned if needed

---

## Testing Strategy

### Unit Tests

**Coverage targets:**
- Engine core: 90%+
- Plugin interfaces: 100% (type checking)
- Plugins: 80%+

**Key tests:**
- Grid generation (all words placed)
- Word validation (correct detection)
- Puzzle selection (correct algorithm)
- State management (no corruption)
- Plugin integration (correct wiring)

### Integration Tests

**Scenarios:**
1. Load puzzles → Select puzzle → Initialize → Complete
2. Complete puzzle → Track progress → Check milestone
3. Save state → Reload → Verify state intact
4. Switch games → Verify isolation

### E2E Tests

**User flows:**
1. New game → Select genre → Solve puzzles → View progress
2. Continue game → Resume where left off
3. Complete all puzzles in genre → Get notification
4. Complete book → Get achievement

### Performance Tests

**Benchmarks:**
- Puzzle load time: < 1s
- Puzzle generation: < 500ms
- State save: < 100ms
- State load: < 100ms

---

## Risk Mitigation

### Risk 1: Breaking Changes

**Risk:** Refactoring breaks existing functionality

**Mitigation:**
- Maintain backward compatibility layer
- Comprehensive testing at each step
- Feature flags for gradual rollout
- Ability to rollback changes

### Risk 2: Timeline Overrun

**Risk:** Refactoring takes longer than estimated

**Mitigation:**
- Conservative time estimates
- Weekly check-ins on progress
- Flexible scope (can defer non-critical features)
- Parallel work streams where possible

### Risk 3: Plugin System Inadequate

**Risk:** Plugin interfaces don't cover all use cases

**Mitigation:**
- Test with diverse use case (Simple Word Search)
- Iterate on interfaces during Phase 1
- Include extension points in interfaces
- Document known limitations

### Risk 4: Performance Regression

**Risk:** Engine overhead slows down game

**Mitigation:**
- Performance benchmarks before/after
- Optimize critical paths
- Profile and identify bottlenecks
- Caching where appropriate

---

## Dependencies Between Tasks

### Critical Path

```
Phase 1:
  Task 1.1 (Directory Structure)
    ↓
  Task 1.2 (Define Interfaces) → Task 1.3 (Define Types)
    ↓
  Task 1.4-1.6 (Extract Systems)
    ↓
  Task 1.7 (Create PuzzleEngine)

Phase 2:
  Task 2.1-2.3 (Implement Plugins)
    ↓
  Task 2.4 (UI Renderer)
    ↓
  Task 2.5 (Migrate Puzzle Page)
    ↓
  Task 2.6-2.7 (Update Imports & Compatibility)
    ↓
  Task 2.8 (Testing)

Phase 3:
  Task 3.1 (Proof of Concept)
    ↓
  Task 3.2 (Documentation)
    ↓
  Task 3.3 (Metrics)
```

### Parallel Work Opportunities

**Week 1:**
- Task 1.2 and 1.3 can be done in parallel (different developers)

**Week 3:**
- Task 2.1, 2.2, 2.3 can be done in parallel (different plugins)

**Week 4:**
- Task 2.4 can start while 2.1-2.3 are being finalized

---

## Timeline Estimate

### Conservative Estimate (6 weeks)

| Phase | Tasks | Hours | Weeks | Team Size |
|-------|-------|-------|-------|-----------|
| Phase 1 | 1.1 - 1.8 | 40 | 2 | 2-3 devs |
| Phase 2 | 2.1 - 2.8 | 70 | 3 | 2 devs |
| Phase 3 | 3.1 - 3.3 | 28 | 1 | 1-2 devs |
| **Total** | | **138** | **6** | **2-3 devs** |

### Aggressive Estimate (4 weeks)

| Phase | Tasks | Hours | Weeks | Team Size |
|-------|-------|-------|-------|-----------|
| Phase 1 | 1.1 - 1.8 | 40 | 1 | 3 devs |
| Phase 2 | 2.1 - 2.8 | 70 | 2 | 3 devs |
| Phase 3 | 3.1 - 3.3 | 28 | 1 | 2 devs |
| **Total** | | **138** | **4** | **3 devs** |

**Assumptions:**
- Developers are familiar with codebase
- No major blockers or scope changes
- Testing time is included
- Documentation time is included

---

## Success Criteria

### Phase 1 Success

- [ ] Engine directory structure created
- [ ] All plugin interfaces defined
- [ ] Core systems extracted
- [ ] PuzzleEngine class functional
- [ ] TypeScript compiles without errors
- [ ] Basic tests pass

### Phase 2 Success

- [ ] Kethaneum implemented as plugin
- [ ] All game-specific code moved to game directory
- [ ] Puzzle page uses PuzzleEngine
- [ ] All tests pass
- [ ] No regressions in functionality
- [ ] Performance acceptable

### Phase 3 Success

- [ ] Second game (Simple Word Search) created
- [ ] Second game works end-to-end
- [ ] Developer documentation complete
- [ ] Success metrics met (>= 4 out of 5)
- [ ] Code reviewed and approved

### Overall Success

- [ ] 90%+ code reusability achieved
- [ ] New game creation time < 2 weeks
- [ ] No breaking changes to existing game
- [ ] Documentation complete
- [ ] Team trained on new architecture

---

## Post-Refactoring Roadmap

### Immediate Next Steps (Post Phase 3)

1. **Polish & Optimization** (1 week)
   - Performance optimization
   - Code cleanup
   - Documentation improvements

2. **Additional Games** (2-4 weeks)
   - Create 2-3 more games to validate engine
   - Identify remaining pain points
   - Refine plugin interfaces

3. **Advanced Features** (Ongoing)
   - Puzzle analytics
   - Cloud save integration
   - Multiplayer support
   - Mobile optimizations

---

## Related Documentation

- [Game Engine Vision](../2-architecture/GAME_ENGINE_VISION.md) - Future architecture design
- [Architecture Summary](../1-overview/ARCHITECTURE_SUMMARY.md) - Current architecture
- [Puzzle System](../3-systems/PUZZLE_SYSTEM.md) - Puzzle system details
- [Codebase Architecture](../2-architecture/CODEBASE_ARCHITECTURE.md) - Detailed code structure

---

*This refactoring roadmap provides a detailed, step-by-step plan for transforming Chronicles of the Kethaneum into a reusable game engine. The incremental approach ensures continuous functionality while systematically extracting and abstracting core systems.*
