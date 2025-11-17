# Game Engine Vision - Future Architecture Design

## Executive Summary

This document outlines the vision for transforming Chronicles of the Kethaneum from a **single-purpose game** into a **reusable game engine** that can power multiple word search puzzle games with different themes, mechanics, and progression systems.

**Current State:** Well-architected game with 40% reusable code

**Future Vision:** 100% reusable engine with pluggable game content

**Estimated Effort:** 4-6 weeks of focused refactoring

**Value Proposition:** Create new word search games in 1-2 weeks instead of months

---

## What "Game Engine" Means in This Context

### Definition

A **game engine** in this context is:
- A **reusable code library** that handles common word search game mechanics
- A **plugin architecture** that allows customization without modifying engine code
- A **clear separation** between engine logic and game-specific content
- A **documented API** for creating new games using the engine
- A **proof of concept** showing the engine powering multiple games

### What It's NOT

This is not:
- A visual game editor (no drag-and-drop interface)
- A multi-genre engine (specialized for word search puzzles)
- A commercial product (internal tool for rapid game development)
- A complete replacement of custom code (some game-specific code still needed)

### Scope

**In Scope:**
- Core word search mechanics (grid generation, word checking, win conditions)
- Puzzle loading and selection systems (abstract, pluggable)
- Audio system (already generic)
- Save/load system (already mostly generic)
- Configuration system (already extensible)
- UI component library (reusable React components)

**Out of Scope:**
- Non-word-search puzzle types (crossword, sudoku, etc.)
- Multiplayer functionality
- Server-side components
- Mobile native apps (web-only)
- Game editor UI

---

## Current Coupling vs Desired Separation

### Current Architecture (40% Reusable)

```
┌─────────────────────────────────────────────────────────────┐
│                     Chronicles of the Kethaneum             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Game Logic (MIXED)                                   │  │
│  │                                                      │  │
│  │  • Puzzle generation (generic) ✅                    │  │
│  │  • Word checking (generic) ✅                        │  │
│  │  • Puzzle loading (hardcoded Kethaneum format) ❌   │  │
│  │  • Puzzle selection (hardcoded weaving) ❌          │  │
│  │  • Story progression (hardcoded books/parts) ❌     │  │
│  │  • Dialogue system (hardcoded characters) ❌        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Game Content (JSON)                                  │  │
│  │                                                      │  │
│  │  • Kethaneum puzzles                                │  │
│  │  • Nature puzzles                                   │  │
│  │  • Character data                                   │  │
│  │  • Story events                                     │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Problem:** Engine and game code are intertwined

### Desired Architecture (100% Reusable)

```
┌─────────────────────────────────────────────────────────────┐
│                    WORD SEARCH ENGINE                       │
│                       (Reusable)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Core Systems                                         │  │
│  │  • Puzzle generation algorithm                      │  │
│  │  • Word validation                                  │  │
│  │  • Timer management                                 │  │
│  │  • Audio system                                     │  │
│  │  • Save/load system                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Plugin Interfaces                                    │  │
│  │  • IPuzzleLoader                                    │  │
│  │  • IPuzzleSelectionStrategy                         │  │
│  │  • IProgressionSystem                               │  │
│  │  • IDialogueSystem                                  │  │
│  │  • IUIRenderer                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Implements
                            │
┌────────────────────────────┴────────────────────────────────┐
│                                                             │
│  ┌─────────────────────┐          ┌─────────────────────┐  │
│  │  Game: Kethaneum    │          │  Game: Other Theme  │  │
│  │                     │          │                     │  │
│  │  • Weaving Strategy │          │  • Linear Strategy  │  │
│  │  • Book Progression │          │  • Level Progression│  │
│  │  • Character Dialog │          │  • No Dialogue      │  │
│  │  • Cosmic UI Theme  │          │  • Minimal UI       │  │
│  │  • Story Content    │          │  • Simple Puzzles   │  │
│  │                     │          │                     │  │
│  └─────────────────────┘          └─────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Benefit:** Engine code is fully reusable, games are just plugins

---

## Engine Layer vs Game Content Layer Design

### Layer 1: Core Engine (100% Reusable)

**Location:** `engine/core/`

**Responsibilities:**
- Puzzle grid generation algorithm
- Word placement and validation
- Game state management (abstract)
- Timer system
- Configuration system
- Audio system
- Save/load serialization

**Example:**
```typescript
// engine/core/PuzzleEngine.ts
export class PuzzleEngine {
  private loader: IPuzzleLoader;
  private selector: IPuzzleSelectionStrategy;
  private renderer: IUIRenderer;

  constructor(loader: IPuzzleLoader, selector: IPuzzleSelectionStrategy) {
    this.loader = loader;
    this.selector = selector;
  }

  async loadPuzzles(): Promise<Puzzle[]> {
    return await this.loader.loadPuzzles();
  }

  selectNextPuzzle(state: EngineState): Puzzle | null {
    return this.selector.selectNext(state);
  }

  generateGrid(words: string[], config: GridConfig): Grid {
    // Generic grid generation (already implemented)
    return generateGrid(words, config);
  }

  checkWord(cells: Cell[], grid: Grid, wordList: Word[]): WordMatch | null {
    // Generic word checking (already implemented)
    return checkForWord(cells, grid, wordList);
  }
}
```

### Layer 2: Plugin Interfaces (Contracts)

**Location:** `engine/plugins/`

**Responsibilities:**
- Define contracts that games must implement
- Provide TypeScript interfaces
- Document expected behavior
- Include abstract base classes with common functionality

**Example Interfaces:**

```typescript
// engine/plugins/IPuzzleLoader.ts
export interface IPuzzleLoader {
  /**
   * Load puzzles from data source
   * @returns Array of puzzles with metadata
   */
  loadPuzzles(): Promise<Puzzle[]>;

  /**
   * Load available categories/genres
   * @returns Array of category names
   */
  loadCategories(): Promise<string[]>;
}

// engine/plugins/IPuzzleSelectionStrategy.ts
export interface IPuzzleSelectionStrategy {
  /**
   * Select next puzzle based on current game state
   * @param state - Current engine state
   * @returns Selected puzzle or null if none available
   */
  selectNext(state: EngineState): Puzzle | null;

  /**
   * Check if a puzzle is eligible for selection
   * @param puzzle - Puzzle to check
   * @param state - Current engine state
   * @returns True if puzzle can be selected
   */
  canSelect(puzzle: Puzzle, state: EngineState): boolean;

  /**
   * Reset selection state (e.g., when starting new game)
   * @param state - Current engine state
   */
  reset(state: EngineState): void;
}

// engine/plugins/IProgressionSystem.ts
export interface IProgressionSystem {
  /**
   * Get current progression state
   */
  getProgress(state: EngineState): ProgressData;

  /**
   * Mark puzzle as completed
   */
  markCompleted(puzzle: Puzzle, state: EngineState): EngineState;

  /**
   * Check if progression milestone reached
   */
  checkMilestone(state: EngineState): Milestone | null;
}

// engine/plugins/IUIRenderer.ts
export interface IUIRenderer {
  /**
   * Render puzzle grid
   */
  renderGrid(grid: Grid): JSX.Element;

  /**
   * Render word list
   */
  renderWordList(words: Word[]): JSX.Element;

  /**
   * Render game chrome (timer, score, etc.)
   */
  renderChrome(state: EngineState): JSX.Element;
}
```

### Layer 3: Game Implementations (Game-Specific)

**Location:** `games/[game-name]/`

**Responsibilities:**
- Implement plugin interfaces
- Provide game-specific content (puzzles, audio, images)
- Configure engine for specific game
- Define UI theme/styling

**Example Game Structure:**

```
games/kethaneum/
├── plugins/
│   ├── KethaneumPuzzleLoader.ts      # Implements IPuzzleLoader
│   ├── WeavingSelectionStrategy.ts   # Implements IPuzzleSelectionStrategy
│   ├── BookProgressionSystem.ts      # Implements IProgressionSystem
│   └── CosmicUIRenderer.ts           # Implements IUIRenderer
├── data/
│   ├── puzzles/
│   │   ├── kethaneumPuzzles.json
│   │   ├── naturePuzzles.json
│   │   └── manifest.json
│   ├── characters/
│   │   └── [character-files].json
│   └── story-events/
│       └── [event-files].json
├── config/
│   └── gameConfig.ts                 # Game configuration
└── index.ts                          # Game entry point
```

**Example Implementation:**

```typescript
// games/kethaneum/plugins/WeavingSelectionStrategy.ts
import { IPuzzleSelectionStrategy } from '@/engine/plugins';

export class WeavingSelectionStrategy implements IPuzzleSelectionStrategy {
  private kethaneumGenre = "Kethaneum";
  private minInterval = 2;
  private maxInterval = 5;

  selectNext(state: EngineState): Puzzle | null {
    // Check if time for Kethaneum puzzle
    if (this.shouldInsertKethaneum(state)) {
      return this.selectKethaneumPuzzle(state);
    }

    // Select from chosen genre
    return this.selectGenrePuzzle(state);
  }

  private shouldInsertKethaneum(state: EngineState): boolean {
    // Implementation of Kethaneum weaving logic
    return state.puzzlesSinceLastNarrative >= state.nextNarrativeInterval;
  }

  // ... rest of implementation
}

// games/kethaneum/index.ts
import { PuzzleEngine } from '@/engine/core';
import { WeavingSelectionStrategy } from './plugins/WeavingSelectionStrategy';
import { KethaneumPuzzleLoader } from './plugins/KethaneumPuzzleLoader';
import { CosmicUIRenderer } from './plugins/CosmicUIRenderer';

// Initialize engine with Kethaneum-specific plugins
export function createKethaneumGame() {
  const loader = new KethaneumPuzzleLoader();
  const selector = new WeavingSelectionStrategy();
  const renderer = new CosmicUIRenderer();

  const engine = new PuzzleEngine(loader, selector, renderer);

  return engine;
}
```

---

## Plugin Architecture Concepts

### 1. Puzzle Loader Plugin

**Current Problem:**
- Puzzle data format hardcoded (book, genre, storyPart)
- Loading logic assumes specific JSON structure
- Can't load from different sources (database, API)

**Solution:**

```typescript
// Engine provides interface
export interface IPuzzleLoader {
  loadPuzzles(): Promise<Puzzle[]>;
  loadCategories(): Promise<string[]>;
}

// Generic puzzle format
export interface Puzzle {
  id: string;                      // Unique identifier
  title: string;                   // Display name
  words: string[];                 // Words to find
  metadata?: Record<string, any>;  // Game-specific data
}

// Game implements loader
export class KethaneumPuzzleLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    // Load from JSON, transform to generic format
    const rawPuzzles = await this.loadFromJSON();

    return rawPuzzles.map(raw => ({
      id: raw.title,
      title: raw.title,
      words: raw.words,
      metadata: {
        book: raw.book,
        genre: raw.genre,
        storyPart: raw.storyPart,
        storyExcerpt: raw.storyExcerpt
      }
    }));
  }

  async loadCategories(): Promise<string[]> {
    // Return available genres
    return ["Kethaneum", "Nature", "Test"];
  }
}

// Different game, different loader
export class DatabasePuzzleLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    // Load from API endpoint
    const response = await fetch('/api/puzzles');
    const data = await response.json();

    return data.map(item => ({
      id: item.id,
      title: item.name,
      words: item.wordList,
      metadata: item.customData
    }));
  }

  async loadCategories(): Promise<string[]> {
    const response = await fetch('/api/categories');
    return response.json();
  }
}
```

### 2. Puzzle Selection Strategy Plugin

**Current Problem:**
- Selection logic hardcoded for Kethaneum weaving
- Can't use different progression systems (linear, random, difficulty-based)

**Solution:**

```typescript
// Engine provides interface
export interface IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null;
  canSelect(puzzle: Puzzle, state: EngineState): boolean;
  reset(state: EngineState): void;
}

// Kethaneum uses weaving strategy
export class WeavingSelectionStrategy implements IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null {
    // Kethaneum weaving logic
    if (shouldInsertNarrative(state)) {
      return selectNarrativePuzzle(state);
    }
    return selectGenrePuzzle(state);
  }
}

// Simple game uses sequential strategy
export class SequentialSelectionStrategy implements IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null {
    // Just pick next puzzle in order
    return state.puzzles[state.currentIndex + 1] || null;
  }
}

// Educational game uses difficulty progression
export class DifficultyProgressionStrategy implements IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null {
    // Select based on player performance
    const targetDifficulty = this.calculateTargetDifficulty(state);
    return this.findPuzzleWithDifficulty(state.puzzles, targetDifficulty);
  }
}
```

### 3. Progression System Plugin

**Current Problem:**
- Book/story part structure hardcoded
- Can't track different progression types (levels, achievements, skills)

**Solution:**

```typescript
// Engine provides interface
export interface IProgressionSystem {
  getProgress(state: EngineState): ProgressData;
  markCompleted(puzzle: Puzzle, state: EngineState): EngineState;
  checkMilestone(state: EngineState): Milestone | null;
}

// Kethaneum uses book-based progression
export class BookProgressionSystem implements IProgressionSystem {
  getProgress(state: EngineState): ProgressData {
    return {
      currentBook: state.metadata.currentBook,
      currentPart: state.metadata.currentStoryPart,
      discoveredBooks: state.metadata.discoveredBooks.size,
      completedBooks: state.metadata.completedBooks
    };
  }

  markCompleted(puzzle: Puzzle, state: EngineState): EngineState {
    const newState = { ...state };
    const book = puzzle.metadata.book;
    const part = puzzle.metadata.storyPart;

    // Mark part complete
    if (!newState.metadata.books[book]) {
      newState.metadata.books[book] = [];
    }
    newState.metadata.books[book][part] = true;

    return newState;
  }
}

// Simple game uses level progression
export class LevelProgressionSystem implements IProgressionSystem {
  getProgress(state: EngineState): ProgressData {
    return {
      currentLevel: state.metadata.level,
      totalLevels: state.metadata.totalLevels,
      stars: state.metadata.stars
    };
  }

  markCompleted(puzzle: Puzzle, state: EngineState): EngineState {
    const newState = { ...state };
    newState.metadata.level += 1;

    // Award stars based on performance
    const stars = this.calculateStars(puzzle, state);
    newState.metadata.stars += stars;

    return newState;
  }
}
```

### 4. UI Renderer Plugin

**Current Problem:**
- UI components tightly coupled to Kethaneum visuals
- Hard to create different visual themes

**Solution:**

```typescript
// Engine provides interface
export interface IUIRenderer {
  renderGrid(grid: Grid, wordList: Word[]): JSX.Element;
  renderWordList(words: Word[], onWordClick?: (word: Word) => void): JSX.Element;
  renderChrome(state: EngineState): JSX.Element;
  renderModal(type: ModalType, props: any): JSX.Element;
}

// Kethaneum uses cosmic theme
export class CosmicUIRenderer implements IUIRenderer {
  renderGrid(grid: Grid, wordList: Word[]): JSX.Element {
    return (
      <div className="cosmic-background">
        <div className="grid-container floating-animation">
          {grid.map((row, r) => (
            <div key={r} className="grid-row">
              {row.map((cell, c) => (
                <div key={c} className="grid-cell cosmic-glow">
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderWordList(words: Word[]): JSX.Element {
    return (
      <div className="word-list cosmic-border">
        {words.map(word => (
          <span key={word.word} className={word.found ? "found cosmic-text" : "cosmic-text"}>
            {word.word}
          </span>
        ))}
      </div>
    );
  }
}

// Minimal game uses simple theme
export class MinimalUIRenderer implements IUIRenderer {
  renderGrid(grid: Grid, wordList: Word[]): JSX.Element {
    return (
      <div className="simple-grid">
        {grid.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => (
              <div key={c} className="cell">{cell}</div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  renderWordList(words: Word[]): JSX.Element {
    return (
      <ul className="word-list-simple">
        {words.map(word => (
          <li key={word.word} className={word.found ? "found" : ""}>
            {word.word}
          </li>
        ))}
      </ul>
    );
  }
}
```

---

## Extension Points for Creating New Games

### Creating a New Game: Step-by-Step

**Step 1: Define Game Concept**

```
Game Name: Word Detective
Theme: Mystery/Detective
Progression: Case-based (solve cases to progress)
Puzzles: Crime scene evidence words
Special Mechanic: Clue system (hints based on found words)
```

**Step 2: Create Game Directory Structure**

```
games/word-detective/
├── plugins/
│   ├── CaseLoader.ts              # Implements IPuzzleLoader
│   ├── CaseSelectionStrategy.ts   # Implements IPuzzleSelectionStrategy
│   ├── CaseProgressionSystem.ts   # Implements IProgressionSystem
│   └── DetectiveUIRenderer.ts     # Implements IUIRenderer
├── data/
│   └── cases.json                 # Puzzle data
├── config/
│   └── gameConfig.ts
├── assets/
│   ├── images/
│   └── audio/
└── index.ts
```

**Step 3: Implement Puzzle Loader**

```typescript
// games/word-detective/plugins/CaseLoader.ts
import { IPuzzleLoader, Puzzle } from '@/engine/plugins';

interface CaseData {
  caseName: string;
  difficulty: string;
  evidence: string[];
  clues: string[];
}

export class CaseLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    const response = await fetch('/games/word-detective/data/cases.json');
    const cases: CaseData[] = await response.json();

    return cases.map(case => ({
      id: case.caseName,
      title: case.caseName,
      words: case.evidence,
      metadata: {
        difficulty: case.difficulty,
        clues: case.clues
      }
    }));
  }

  async loadCategories(): Promise<string[]> {
    return ["Easy Cases", "Medium Cases", "Hard Cases", "Cold Cases"];
  }
}
```

**Step 4: Implement Selection Strategy**

```typescript
// games/word-detective/plugins/CaseSelectionStrategy.ts
import { IPuzzleSelectionStrategy, Puzzle, EngineState } from '@/engine/plugins';

export class CaseSelectionStrategy implements IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null {
    // Select next unsolved case in difficulty order
    const unsolvedCases = state.puzzles.filter(p =>
      !state.metadata.solvedCases.has(p.id)
    );

    if (unsolvedCases.length === 0) {
      return null;  // All cases solved!
    }

    // Sort by difficulty, return easiest unsolved
    const sorted = this.sortByDifficulty(unsolvedCases);
    return sorted[0];
  }

  private sortByDifficulty(cases: Puzzle[]): Puzzle[] {
    const order = { "easy": 1, "medium": 2, "hard": 3, "cold": 4 };
    return cases.sort((a, b) =>
      order[a.metadata.difficulty] - order[b.metadata.difficulty]
    );
  }

  canSelect(puzzle: Puzzle, state: EngineState): boolean {
    return !state.metadata.solvedCases.has(puzzle.id);
  }

  reset(state: EngineState): void {
    state.metadata.solvedCases.clear();
  }
}
```

**Step 5: Implement UI Renderer**

```typescript
// games/word-detective/plugins/DetectiveUIRenderer.ts
import { IUIRenderer, Grid, Word, EngineState } from '@/engine/plugins';

export class DetectiveUIRenderer implements IUIRenderer {
  renderGrid(grid: Grid, wordList: Word[]): JSX.Element {
    return (
      <div className="detective-case-file">
        <h2>Crime Scene Evidence</h2>
        <div className="evidence-grid">
          {/* Render grid with detective theme */}
        </div>
      </div>
    );
  }

  renderWordList(words: Word[]): JSX.Element {
    return (
      <div className="evidence-list">
        <h3>Evidence to Find:</h3>
        {words.map(word => (
          <div key={word.word} className="evidence-item">
            {word.found && <span className="checkmark">✓</span>}
            {word.word}
          </div>
        ))}
      </div>
    );
  }

  renderChrome(state: EngineState): JSX.Element {
    return (
      <div className="detective-hud">
        <div className="case-progress">
          Case {state.metadata.currentCase} / {state.metadata.totalCases}
        </div>
        <div className="clues-remaining">
          Clues: {state.metadata.cluesRemaining}
        </div>
      </div>
    );
  }
}
```

**Step 6: Configure and Initialize**

```typescript
// games/word-detective/index.ts
import { PuzzleEngine } from '@/engine/core';
import { CaseLoader } from './plugins/CaseLoader';
import { CaseSelectionStrategy } from './plugins/CaseSelectionStrategy';
import { DetectiveUIRenderer } from './plugins/DetectiveUIRenderer';

export function createWordDetectiveGame() {
  const config = {
    gridSize: 10,
    timeLimit: 180,
    maxWords: 8,
    // ... other config
  };

  const loader = new CaseLoader();
  const selector = new CaseSelectionStrategy();
  const renderer = new DetectiveUIRenderer();

  const engine = new PuzzleEngine(config, loader, selector, renderer);

  return engine;
}
```

**Step 7: Create Entry Point**

```typescript
// app/games/word-detective/page.tsx
'use client';

import { createWordDetectiveGame } from '@/games/word-detective';
import { GameScreen } from '@/engine/components/GameScreen';

export default function WordDetectivePage() {
  const game = createWordDetectiveGame();

  return <GameScreen engine={game} />;
}
```

---

## Code Examples: Current vs Future Architecture

### Example 1: Puzzle Loading

#### Current (Coupled)

```typescript
// lib/game/puzzleLoader.ts - Hardcoded for Kethaneum
export async function loadAllPuzzles(state: GameState, config: Config) {
  // Hardcoded file paths
  const genreFiles = [
    '/data/kethaneumPuzzles.json',
    '/data/naturePuzzles.json'
  ];

  // Hardcoded field names
  puzzleData.forEach(puzzle => {
    if (!puzzle.book || !puzzle.genre) {  // ❌ Kethaneum-specific
      return;
    }

    if (puzzle.storyPart === undefined) {  // ❌ Kethaneum-specific
      puzzle.storyPart = 0;
    }
  });
}
```

#### Future (Decoupled)

```typescript
// engine/core/PuzzleEngine.ts - Generic
export class PuzzleEngine {
  constructor(private loader: IPuzzleLoader) {}

  async loadPuzzles(): Promise<Puzzle[]> {
    return await this.loader.loadPuzzles();  // ✅ Delegates to plugin
  }
}

// games/kethaneum/plugins/KethaneumLoader.ts - Game-specific
export class KethaneumLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    const raw = await this.loadFromFiles();

    return raw.map(p => ({
      id: p.title,
      title: p.title,
      words: p.words,
      metadata: {
        book: p.book,        // ✅ Game-specific in metadata
        genre: p.genre,
        storyPart: p.storyPart
      }
    }));
  }
}
```

### Example 2: Puzzle Selection

#### Current (Coupled)

```typescript
// lib/game/puzzleSelector.ts - Hardcoded weaving
export function selectNextPuzzle(state: GameState) {
  // ❌ Hardcoded "Kethaneum" genre name
  const kethaneumPuzzles = state.puzzles["Kethaneum"];

  // ❌ Hardcoded weaving logic
  if (state.puzzlesSinceLastKethaneum >= state.nextKethaneumInterval) {
    return selectKethaneumPuzzle(state);
  }

  return selectGenrePuzzle(state);
}
```

#### Future (Decoupled)

```typescript
// engine/core/PuzzleEngine.ts - Generic
export class PuzzleEngine {
  constructor(private selector: IPuzzleSelectionStrategy) {}

  selectNextPuzzle(state: EngineState): Puzzle | null {
    return this.selector.selectNext(state);  // ✅ Delegates to plugin
  }
}

// games/kethaneum/plugins/WeavingStrategy.ts - Game-specific
export class WeavingStrategy implements IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null {
    // ✅ Weaving logic contained in game plugin
    if (this.shouldInsertNarrative(state)) {
      return this.selectNarrativePuzzle(state);
    }
    return this.selectGenrePuzzle(state);
  }
}

// games/simple-game/plugins/SequentialStrategy.ts - Different game
export class SequentialStrategy implements IPuzzleSelectionStrategy {
  selectNext(state: EngineState): Puzzle | null {
    // ✅ Simple sequential selection
    return state.puzzles[state.currentIndex + 1] || null;
  }
}
```

### Example 3: State Management

#### Current (Coupled)

```typescript
// lib/game/state.ts - Kethaneum-specific fields
export interface GameState {
  puzzles: { [genre: string]: PuzzleData[] };
  currentBook: string;           // ❌ Kethaneum-specific
  currentStoryPart: number;      // ❌ Kethaneum-specific
  discoveredBooks: Set<string>;  // ❌ Kethaneum-specific
  nextKethaneumIndex: number;    // ❌ Kethaneum-specific
  // ... many more game-specific fields
}
```

#### Future (Decoupled)

```typescript
// engine/core/EngineState.ts - Generic
export interface EngineState {
  puzzles: Puzzle[];
  currentPuzzleIndex: number;
  completedPuzzles: Set<string>;
  timeRemaining: number;
  grid: Grid;
  wordList: Word[];

  metadata: Record<string, any>;  // ✅ Game-specific data goes here
}

// games/kethaneum/types.ts - Game-specific
export interface KethaneumMetadata {
  currentBook: string;
  currentStoryPart: number;
  discoveredBooks: Set<string>;
  nextKethaneumIndex: number;
  // ... Kethaneum-specific fields
}

// Usage
const state: EngineState = {
  // ... generic fields
  metadata: {
    currentBook: "Book 1",
    currentStoryPart: 2,
    // ... Kethaneum data
  } as KethaneumMetadata
};
```

---

## How a Developer Would Create a New Game Using the Engine

### Complete Example: "Word Garden"

**Concept:** Relaxing word search game with botanical themes

#### Step 1: Setup Project Structure

```bash
# Create game directory
mkdir -p games/word-garden/{plugins,data,assets,config}

# Create necessary files
touch games/word-garden/index.ts
touch games/word-garden/plugins/GardenLoader.ts
touch games/word-garden/plugins/SeasonalStrategy.ts
touch games/word-garden/plugins/GardenUIRenderer.ts
touch games/word-garden/data/flowers.json
touch games/word-garden/config/gameConfig.ts
```

#### Step 2: Define Puzzle Data

```json
// games/word-garden/data/flowers.json
[
  {
    "name": "Spring Blooms",
    "season": "spring",
    "plants": ["tulip", "daffodil", "crocus", "iris", "lilac"],
    "colors": ["pink", "yellow", "purple"]
  },
  {
    "name": "Summer Garden",
    "season": "summer",
    "plants": ["rose", "sunflower", "dahlia", "peony", "zinnia"],
    "colors": ["red", "orange", "yellow"]
  }
]
```

#### Step 3: Implement Puzzle Loader

```typescript
// games/word-garden/plugins/GardenLoader.ts
import { IPuzzleLoader, Puzzle } from '@/engine/plugins';

interface GardenData {
  name: string;
  season: string;
  plants: string[];
  colors: string[];
}

export class GardenLoader implements IPuzzleLoader {
  async loadPuzzles(): Promise<Puzzle[]> {
    const response = await fetch('/games/word-garden/data/flowers.json');
    const gardens: GardenData[] = await response.json();

    return gardens.map(garden => ({
      id: garden.name,
      title: garden.name,
      words: [...garden.plants, ...garden.colors],
      metadata: {
        season: garden.season
      }
    }));
  }

  async loadCategories(): Promise<string[]> {
    return ["Spring", "Summer", "Fall", "Winter"];
  }
}
```

#### Step 4: Implement Selection Strategy

```typescript
// games/word-garden/plugins/SeasonalStrategy.ts
import { IPuzzleSelectionStrategy, Puzzle, EngineState } from '@/engine/plugins';

export class SeasonalStrategy implements IPuzzleSelectionStrategy {
  private seasonOrder = ["spring", "summer", "fall", "winter"];

  selectNext(state: EngineState): Puzzle | null {
    const currentSeason = this.getCurrentSeason(state);

    // Find next puzzle in current season
    const seasonPuzzles = state.puzzles.filter(p =>
      p.metadata.season === currentSeason &&
      !state.completedPuzzles.has(p.id)
    );

    if (seasonPuzzles.length > 0) {
      return seasonPuzzles[0];
    }

    // Move to next season
    const nextSeason = this.getNextSeason(currentSeason);
    const nextSeasonPuzzles = state.puzzles.filter(p =>
      p.metadata.season === nextSeason
    );

    return nextSeasonPuzzles[0] || null;
  }

  private getCurrentSeason(state: EngineState): string {
    return state.metadata.currentSeason || "spring";
  }

  private getNextSeason(current: string): string {
    const index = this.seasonOrder.indexOf(current);
    return this.seasonOrder[(index + 1) % 4];
  }

  canSelect(puzzle: Puzzle, state: EngineState): boolean {
    return !state.completedPuzzles.has(puzzle.id);
  }

  reset(state: EngineState): void {
    state.metadata.currentSeason = "spring";
  }
}
```

#### Step 5: Implement UI Renderer

```typescript
// games/word-garden/plugins/GardenUIRenderer.tsx
import { IUIRenderer, Grid, Word, EngineState } from '@/engine/plugins';

export class GardenUIRenderer implements IUIRenderer {
  renderGrid(grid: Grid, wordList: Word[]): JSX.Element {
    return (
      <div className="garden-scene">
        <div className="flower-bed">
          {grid.map((row, r) => (
            <div key={r} className="garden-row">
              {row.map((cell, c) => (
                <div key={c} className="soil-patch">
                  <span className="letter-seed">{cell}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderWordList(words: Word[]): JSX.Element {
    return (
      <div className="seed-packet">
        <h3>Seeds to Plant:</h3>
        <div className="seed-list">
          {words.map(word => (
            <div key={word.word} className={`seed ${word.found ? 'planted' : ''}`}>
              {word.found && <span className="sprout">🌱</span>}
              {word.word}
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderChrome(state: EngineState): JSX.Element {
    const season = state.metadata.currentSeason || "spring";
    const seasonEmoji = {
      spring: "🌸",
      summer: "☀️",
      fall: "🍂",
      winter: "❄️"
    };

    return (
      <div className="garden-hud">
        <div className="season-indicator">
          {seasonEmoji[season]} {season.toUpperCase()}
        </div>
        <div className="garden-progress">
          {state.metadata.flowersPlanted || 0} flowers planted
        </div>
      </div>
    );
  }

  renderModal(type: string, props: any): JSX.Element {
    if (type === "completion") {
      return (
        <div className="garden-complete-modal">
          <h2>Garden Complete!</h2>
          <p>You've planted all the flowers for {props.season}!</p>
          <button>Continue to Next Season</button>
        </div>
      );
    }
    return <div></div>;
  }
}
```

#### Step 6: Configure Game

```typescript
// games/word-garden/config/gameConfig.ts
export const gardenConfig = {
  gridSize: 10,
  timeLimit: 0,  // No time limit (relaxing game)
  minWordLength: 3,
  maxWordLength: 10,
  maxWords: 8,
  difficulty: "easy",
  features: {
    timer: false,
    hints: true,
    music: true
  }
};
```

#### Step 7: Initialize Game

```typescript
// games/word-garden/index.ts
import { PuzzleEngine } from '@/engine/core';
import { GardenLoader } from './plugins/GardenLoader';
import { SeasonalStrategy } from './plugins/SeasonalStrategy';
import { GardenUIRenderer } from './plugins/GardenUIRenderer';
import { gardenConfig } from './config/gameConfig';

export function createWordGardenGame() {
  const loader = new GardenLoader();
  const selector = new SeasonalStrategy();
  const renderer = new GardenUIRenderer();

  const engine = new PuzzleEngine(
    gardenConfig,
    loader,
    selector,
    renderer
  );

  return engine;
}
```

#### Step 8: Create Page

```typescript
// app/games/word-garden/page.tsx
'use client';

import { createWordGardenGame } from '@/games/word-garden';
import { GameScreen } from '@/engine/components/GameScreen';
import './garden.css';

export default function WordGardenPage() {
  const game = createWordGardenGame();

  return (
    <div className="word-garden-app">
      <GameScreen engine={game} />
    </div>
  );
}
```

**Result:** Fully functional "Word Garden" game created with ~300 lines of code instead of ~6,000!

---

## Benefits of Engine Architecture

### Development Speed
- **Current:** 3-6 months to build new word search game from scratch
- **Future:** 1-2 weeks to create new game using engine

### Code Reusability
- **Current:** ~40% code reusable
- **Future:** ~95% code reusable (only game-specific plugins needed)

### Maintenance
- **Current:** Bug fixes must be applied to each game separately
- **Future:** Bug fixes in engine benefit all games automatically

### Testing
- **Current:** Test each game individually
- **Future:** Test engine once, games inherit reliability

### Consistency
- **Current:** Each game may have different behaviors
- **Future:** Core mechanics consistent across all games

### Innovation
- **Current:** Hard to experiment with new features
- **Future:** Easy to test new selection strategies, progression systems

---

## Migration Path

See [Refactoring Roadmap](../7-refactoring/REFACTORING_ROADMAP.md) for detailed migration plan.

**High-level overview:**

1. **Phase 1: Foundation** (2 weeks)
   - Create engine directory structure
   - Extract generic code to engine
   - Define plugin interfaces

2. **Phase 2: Extraction** (3 weeks)
   - Move game-specific code to Kethaneum plugin
   - Implement plugin interfaces
   - Update imports and references

3. **Phase 3: Validation** (1 week)
   - Create second game as proof-of-concept
   - Document engine API
   - Create developer guide

---

## Success Metrics

**How we'll know the engine is successful:**

1. **New Game Creation Time:** < 2 weeks for new game
2. **Code Reusability:** > 90% of engine code reused
3. **API Stability:** No breaking changes to plugin interfaces for 6 months
4. **Developer Experience:** New developer can create game with <8 hours of learning
5. **Proof of Concept:** At least 2 different games running on the engine

---

## Related Documentation

- [Refactoring Roadmap](../7-refactoring/REFACTORING_ROADMAP.md) - Step-by-step migration plan
- [Architecture Summary](../1-overview/ARCHITECTURE_SUMMARY.md) - Current architecture
- [Puzzle System](../3-systems/PUZZLE_SYSTEM.md) - Puzzle mechanics details
- [Codebase Architecture](CODEBASE_ARCHITECTURE.md) - Detailed code structure

---

*The Game Engine Vision represents the future of Chronicles of the Kethaneum: a transformation from a single game into a platform for creating diverse word search experiences with minimal effort and maximum reusability.*
