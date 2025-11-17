# Puzzle System - Technical Documentation

## Overview

The Puzzle System is the core content delivery mechanism for Chronicles of the Kethaneum. It handles puzzle data loading, grid generation, intelligent selection, and game mode specific behavior. The system consists of three primary modules:

1. **Puzzle Loader** - Loads puzzle data from JSON files
2. **Puzzle Generator** - Creates word search grids algorithmically
3. **Puzzle Selector** - Intelligently chooses next puzzles (Kethaneum weaving)

**Key Files:**
- `lib/game/puzzleLoader.ts` (617 lines) - Data loading and organization
- `lib/game/puzzleGenerator.ts` (200+ lines) - Grid generation algorithm
- `lib/game/puzzleSelector.ts` (300+ lines) - Intelligent selection system
- `lib/game/puzzleOnlyLoader.ts` - Puzzle-Only mode loader
- `lib/game/beatTheClockLoader.ts` - Beat-the-Clock mode loader
- `lib/game/state.ts` (225 lines) - State definitions

---

## Puzzle Data Format

### Core Data Structure

Puzzles are stored as JSON arrays with the following structure:

```json
[
  {
    "title": "Puzzle Title",
    "book": "Book Name",
    "genre": "Genre Name",
    "storyPart": 0,
    "storyExcerpt": "Story text here...",
    "words": ["word1", "word2", "word3", ...]
  }
]
```

### Field Definitions

**Required Fields:**
- `title` (string) - Unique identifier for the puzzle
- `book` (string) - Which book/story arc this puzzle belongs to
- `words` (string[]) - Array of words to find in the puzzle

**Optional Fields:**
- `genre` (string) - Category/theme (defaults to file-based genre if not specified)
- `storyPart` (number) - Sequential story position (0-4, defaults to 0)
- `storyExcerpt` (string) - Narrative text shown before puzzle

### TypeScript Interface

```typescript
export interface PuzzleData {
  title: string;           // Required: Unique puzzle identifier
  book: string;            // Required: Story arc name
  genre?: string;          // Optional: Puzzle category
  words: string[];         // Required: Word list for puzzle
  storyPart?: number;      // Optional: Story sequence (0-4)
  storyExcerpt?: string;   // Optional: Narrative text
}
```

### Story Part Values

Story parts follow a narrative structure:

| Value | Meaning | Description |
|-------|---------|-------------|
| 0 | The Hook/Introduction | Setup and introduction |
| 1 | Rising Action/Complication | Conflict develops |
| 2 | Midpoint Twist | Major revelation or turn |
| 3 | Climactic Moment | Peak of tension |
| 4 | Resolution/Epilogue | Conclusion and aftermath |

**Example:**
```json
{
  "title": "Luminos: The Price of 'Perfect Vision' - Part 1 The Foundation Day",
  "book": "Luminos: The Price of 'Perfect Vision'",
  "storyPart": 0,
  "genre": "Kethaneum",
  "words": ["principles", "changed", "taking", "credit", "solidarity", "shifting"],
  "storyExcerpt": "The Kethaneum's central chamber domed ceiling reflected..."
}
```

---

## Puzzle Loading System

### Genre Manifest

The system uses a manifest file to discover puzzle files:

**File:** `public/data/genreManifest.json`

```json
{
  "genreFiles": [
    "/data/kethaneumPuzzles.json",
    "/data/naturePuzzles.json",
    "/data/testPuzzles.json"
  ]
}
```

**Purpose:**
- Central registry of all puzzle files
- Easy addition of new genres
- Fallback mechanism if manifest fails to load

### Loading Process

**Function:** `loadAllPuzzles(state, config)`

**Location:** `lib/game/puzzleLoader.ts`

**Process:**
1. Load genre manifest from `/data/genreManifest.json`
2. Parse manifest to get list of puzzle files
3. Load all puzzle files in parallel (Promise.all)
4. Validate each puzzle for required fields
5. Group puzzles by genre field (one file can contain multiple genres)
6. Merge puzzles into game state
7. Build book-to-parts mapping for navigation
8. Return updated state with loaded puzzles

**Code Example:**
```typescript
import { loadAllPuzzles } from '@/lib/game/puzzleLoader';
import { getConfig } from '@/lib/core/config';
import type { GameState } from '@/lib/game/state';

const config = getConfig();
const { puzzles, newState } = await loadAllPuzzles(state, config);

// Result: newState.puzzles = {
//   "Kethaneum": [...],
//   "Nature": [...],
//   "Test": [...]
// }
```

### Validation Rules

**Required Field Validation:**
- Must have `title` (string)
- Must have `book` (string)
- Must have `words` (array)
- Words array must contain at least one valid string

**Optional Field Defaults:**
- `storyPart` defaults to 0 if missing
- `genre` field should be present (skipped if missing)

**Invalid Puzzle Handling:**
- Logs warning to console
- Skips invalid puzzle
- Continues loading valid puzzles
- Does not fail entire load operation

### Duplicate Handling

**When merging genres:**
- Check for existing genre in state
- Compare puzzle titles to detect duplicates
- Only add new puzzles (avoid duplicate titles)
- Preserve existing puzzles

**Code:**
```typescript
// From puzzleLoader.ts
const existingTitles = new Set(newState.puzzles[genre].map(p => p.title));
const newPuzzles = puzzles.filter(p => !existingTitles.has(p.title));
newState.puzzles[genre] = [...newState.puzzles[genre], ...newPuzzles];
```

### Book-to-Parts Mapping

**Function:** `buildBookPartsMapping(state)`

**Purpose:** Create fast lookup of available story parts per book

**Process:**
1. Iterate through all genres and puzzles
2. Extract book name and story part from each puzzle
3. Build mapping: `{ [bookName]: [0, 1, 2, 3, 4] }`
4. Sort parts numerically for each book
5. Store in `state.bookPartsMap`

**Result:**
```typescript
state.bookPartsMap = {
  "Luminos: The Price of 'Perfect Vision'": [0, 1, 2, 3],
  "Another Book": [0, 1, 2]
};
```

**Usage:** Quickly determine which parts exist for book navigation

---

## Puzzle Generation Algorithm

### Overview

The puzzle generator creates word search grids using a **two-phase placement algorithm** that ensures all words fit while maintaining puzzle solvability.

**Function:** `generateGrid(words, config, state)`

**Location:** `lib/game/puzzleGenerator.ts`

**Returns:**
```typescript
{
  grid: string[][];      // 2D array of letters
  wordList: WordData[];  // Word placement data
}
```

### Two-Phase Word Placement

#### Phase 1: Random Placement (100 attempts)

**Algorithm:**
```
For each word:
  attempts = 0
  while not placed and attempts < 100:
    - Pick random starting position (row, col)
    - Pick random direction from 8 possibilities
    - Check if word fits without collisions
    - If yes: place word and mark as found
    - If no: increment attempts and try again

  If still not placed after 100 attempts:
    → Proceed to Phase 2
```

**Code Example:**
```typescript
// Phase 1: Random placement
while (!placed && attempts < maxRandomAttempts) {
  attempts++;

  // Random starting position using seeded random
  const row = Math.floor(seededRandom() * gridSize);
  const col = Math.floor(seededRandom() * gridSize);

  // Random direction
  const dirIndex = Math.floor(seededRandom() * validDirections.length);
  const [dRow, dCol] = validDirections[dirIndex];

  // Check if word fits
  if (canPlaceWord(grid, word, row, col, dRow, dCol, gridSize)) {
    placeWord(grid, word, row, col, dRow, dCol);
    placements.push({ word, found: false, row, col, direction: [dRow, dCol] });
    placed = true;
  }
}
```

#### Phase 2: Systematic Placement (fallback)

**Algorithm:**
```
If random placement failed:
  For each row (0 to gridSize):
    For each column (0 to gridSize):
      For each direction (8 total):
        If word fits at this position/direction:
          → Place word and exit
```

**Purpose:** Guarantee word placement even in constrained grids

**Code Example:**
```typescript
// Phase 2: Systematic placement
if (!placed) {
  console.warn(`Random placement failed for "${word}" - trying systematic`);

  for (let r = 0; r < gridSize && !placed; r++) {
    for (let c = 0; c < gridSize && !placed; c++) {
      for (const [dRow, dCol] of validDirections) {
        if (canPlaceWord(grid, word, r, c, dRow, dCol, gridSize)) {
          placeWord(grid, word, r, c, dRow, dCol);
          placements.push({ word, found: false, row: r, col: c, direction: [dRow, dCol] });
          placed = true;
          break;
        }
      }
    }
  }
}
```

### Word Placement Directions

**8 Directional Support:**

```typescript
const directions = [
  [0, 1],   // Right →
  [1, 0],   // Down ↓
  [1, 1],   // Diagonal down-right ↘
  [0, -1],  // Left ←
  [-1, 0],  // Up ↑
  [-1, -1], // Diagonal up-left ↖
  [1, -1],  // Diagonal down-left ↙
  [-1, 1]   // Diagonal up-right ↗
];
```

**Direction Vectors:**
- `[dRow, dCol]` - How to move from one letter to the next
- `[0, 1]` means same row, next column (right)
- `[1, 1]` means next row, next column (diagonal)

### Collision Detection

**Function:** `canPlaceWord(grid, word, row, col, dRow, dCol, gridSize)`

**Checks:**
1. **Bounds Check:** Does the word extend outside the grid?
2. **Collision Check:** Are all cells empty OR already contain the correct letter?

**Code:**
```typescript
export function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  gridSize: number
): boolean {
  const length = word.length;

  // Check bounds
  const endRow = row + (length - 1) * dRow;
  const endCol = col + (length - 1) * dCol;

  if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
    return false;
  }

  // Check collisions
  for (let i = 0; i < length; i++) {
    const r = row + i * dRow;
    const c = col + i * dCol;

    if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
      return false;  // Cell occupied by different letter
    }
  }

  return true;
}
```

### Word Sorting Strategy

**Before placement:**
```typescript
const sortedWords = [...validWords].sort((a, b) => b.length - a.length);
```

**Reason:** Longer words are harder to place, so place them first when the grid is empty.

### Filling Empty Cells

**After all words are placed:**
```typescript
export function fillEmptyCells(grid: string[][]): void {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === '') {
        const randomIndex = Math.floor(Math.random() * letters.length);
        grid[row][col] = letters[randomIndex];
      }
    }
  }
}
```

**Purpose:** Make words harder to find visually by hiding them in random letters

### Seeded Random Generation

**Purpose:** Create reproducible puzzles

**Implementation:**
```typescript
const projectSeed = "Kethaneum".split('')
  .reduce((acc, char) => acc + char.charCodeAt(0), 0);
const seededRandom = createSeededRandom(projectSeed + Date.now() % 10000);
```

**How it works:**
- Base seed from project name ("Kethaneum")
- Add time-based variance (Date.now() % 10000)
- Creates consistent but varied puzzles
- Same puzzle data = same grid layout

---

## Puzzle Selection System (Kethaneum Weaving)

### Overview

The **Puzzle Selector** implements the signature "Kethaneum weaving" feature that intelligently alternates between player-chosen genre puzzles and narrative Kethaneum puzzles.

**Function:** `selectNextPuzzle(state, config)`

**Location:** `lib/game/puzzleSelector.ts`

**Returns:**
```typescript
interface PuzzleSelectionResult {
  puzzle: PuzzleData | null;        // Selected puzzle
  newState: GameState;               // Updated state
  isKethaneum: boolean;              // Is this a narrative puzzle?
  genreExhausted: boolean;           // All genre puzzles completed?
  kethaneumExhausted: boolean;       // All story puzzles shown?
  message?: string;                  // Optional UI notification
}
```

### Selection Algorithm

**High-level flow:**

```
1. Check if it's time for a Kethaneum puzzle
   - Has counter reached interval? (e.g., 3 puzzles)
   → Yes: Select Kethaneum puzzle (sequential order)
   → No: Select from chosen genre

2. Select from chosen genre
   - Continue current book if incomplete
   - Start new book if current complete
   - Track completed puzzles to avoid repeats
   - Reset and notify if genre exhausted
```

### Kethaneum Weaving Logic

**Counter-based insertion:**

```typescript
function checkIfTimeForKethaneum(state: GameState, config: PuzzleSelectionConfig): boolean {
  // Do we have Kethaneum puzzles?
  const kethaneumPuzzles = state.puzzles[config.kethaneumGenreName];
  if (!kethaneumPuzzles || kethaneumPuzzles.length === 0) {
    return false;
  }

  // Have we shown all Kethaneum puzzles?
  if (state.nextKethaneumIndex >= kethaneumPuzzles.length) {
    return false;
  }

  // Has counter reached interval?
  return state.puzzlesSinceLastKethaneum >= state.nextKethaneumInterval;
}
```

**State tracking:**
- `puzzlesSinceLastKethaneum` - Counter incremented after each genre puzzle
- `nextKethaneumInterval` - Random value (2-5) determining when to insert Kethaneum
- `nextKethaneumIndex` - Which Kethaneum puzzle to show next (sequential)

**Example flow:**
```
Interval set to 3

Puzzle 1: Nature (counter = 1)
Puzzle 2: Nature (counter = 2)
Puzzle 3: Nature (counter = 3) → Triggers Kethaneum
Puzzle 4: Kethaneum Book 1 Part 0 (counter reset to 0, new interval set)
Puzzle 5: Nature (counter = 1)
Puzzle 6: Nature (counter = 2)
Puzzle 7: Nature (counter = 3) → Triggers Kethaneum
Puzzle 8: Kethaneum Book 1 Part 1 (counter reset to 0, new interval set)
...
```

### Kethaneum Puzzle Selection

**Function:** `selectKethaneumPuzzle(state, config)`

**Algorithm:**
```
1. Get next Kethaneum puzzle by index (sequential order)
2. Validate puzzle exists and has required fields
3. Increment nextKethaneumIndex for next time
4. Reset counter: puzzlesSinceLastKethaneum = 0
5. Set new random interval (2-5)
6. Mark Kethaneum genre as revealed (for Library)
7. Return selected puzzle
```

**Code Example:**
```typescript
const puzzle = kethaneumPuzzles[state.nextKethaneumIndex];

const newState = { ...state };
newState.nextKethaneumIndex += 1;
newState.puzzlesSinceLastKethaneum = 0;
newState.nextKethaneumInterval = getRandomKethaneumInterval(config);
newState.currentGenre = config.kethaneumGenreName;
newState.currentBook = puzzle.book;
newState.currentStoryPart = puzzle.storyPart ?? 0;
newState.kethaneumRevealed = true;

return { puzzle, newState, isKethaneum: true, ... };
```

### Genre Puzzle Selection

**Function:** `selectGenrePuzzle(state, config)`

**Priority system:**

1. **Continue current book** (if has uncompleted parts)
   - Find lowest uncompleted story part in current book
   - Maintains narrative continuity

2. **Select new book** (if current book complete)
   - Group uncompleted puzzles by book
   - Find lowest uncompleted part per book
   - Randomly choose from these starting points

3. **Reset genre** (if all puzzles complete)
   - Clear completed set for genre
   - Select random puzzle
   - Set `genreExhausted = true` for UI notification

**Code Example:**
```typescript
// Priority 1: Continue current book
if (state.currentBook) {
  const currentBookPuzzles = uncompletedPuzzles.filter(p => p.book === state.currentBook);

  if (currentBookPuzzles.length > 0) {
    // Find lowest uncompleted part
    const lowestPart = currentBookPuzzles.reduce((lowest, p) => {
      const pPart = p.storyPart ?? 0;
      const lowestPart = lowest.storyPart ?? 0;
      return pPart < lowestPart ? p : lowest;
    });

    puzzle = lowestPart;
  } else {
    // Current book complete, select new book
    puzzle = selectNewBook(uncompletedPuzzles, selectedGenre);
  }
}
```

### Completion Tracking

**Data structure:**
```typescript
completedPuzzlesByGenre: {
  [genre: string]: Set<string>  // Set of puzzle titles
}
```

**Marking puzzles complete:**
```typescript
export function markPuzzleCompleted(state: GameState, puzzle: PuzzleData): GameState {
  const newState = { ...state };
  const genre = puzzle.genre || newState.currentGenre;

  if (!newState.completedPuzzlesByGenre[genre]) {
    newState.completedPuzzlesByGenre[genre] = new Set();
  }

  newState.completedPuzzlesByGenre[genre].add(puzzle.title);
  newState.completedPuzzles += 1;

  return newState;
}
```

**Checking if puzzle is completed:**
```typescript
const completedSet = state.completedPuzzlesByGenre[selectedGenre];
const uncompletedPuzzles = genrePuzzles.filter(
  (puzzle) => puzzle && puzzle.title && !completedSet.has(puzzle.title)
);
```

---

## Mode-Specific Loaders

### Puzzle-Only Mode Loader

**File:** `lib/game/puzzleOnlyLoader.ts`

**Behavior:**
- Loads random puzzle from any genre
- No story progression tracking
- Simple random selection
- Enforces time limit

**Key function:**
```typescript
export function loadRandomPuzzle(state: GameState, config: Config)
```

### Beat-the-Clock Mode Loader

**File:** `lib/game/beatTheClockLoader.ts`

**Behavior:**
- Uses dedicated puzzle file: `beatTheClockPuzzles.json`
- Optimized for rapid puzzle succession
- Tracks session statistics
- Individual puzzle timers within run timer

**Key function:**
```typescript
export function loadBeatTheClockPuzzle(state: GameState, config: Config)
```

---

## State Management

### Game State Fields (Puzzle-Related)

```typescript
interface GameState {
  // Puzzle storage
  puzzles: { [genre: string]: PuzzleData[] };

  // Current puzzle
  currentGenre: string;
  currentPuzzleIndex: number;
  currentBook: string;
  currentStoryPart: number;

  // Puzzle grid
  grid: string[][];
  wordList: WordData[];

  // Selection system
  selectedGenre: string;
  nextKethaneumIndex: number;
  puzzlesSinceLastKethaneum: number;
  nextKethaneumInterval: number;

  // Completion tracking
  completedPuzzles: number;
  completedPuzzlesByGenre: { [genre: string]: Set<string> };
  books: BookProgress;
  bookPartsMap: { [bookTitle: string]: number[] };

  // Status flags
  kethaneumRevealed: boolean;
  genreExhausted: boolean;
}
```

### Word Data Structure

```typescript
interface WordData {
  word: string;              // The word itself
  found: boolean;            // Has player found it?
  row: number;               // Starting row position
  col: number;               // Starting column position
  direction: [number, number]; // Movement vector [dRow, dCol]
}
```

**Example:**
```typescript
{
  word: "KETHANEUM",
  found: false,
  row: 2,
  col: 5,
  direction: [1, 1]  // Diagonal down-right
}
```

---

## API Reference

### Puzzle Loader Functions

#### `loadAllPuzzles(state, config)`

Load all puzzles from genre manifest.

**Parameters:**
- `state: GameState` - Current game state
- `config: Config` - Game configuration

**Returns:**
```typescript
Promise<{
  puzzles: { [genre: string]: PuzzleData[] };
  newState: GameState;
}>
```

**Usage:**
```typescript
const { puzzles, newState } = await loadAllPuzzles(state, config);
```

#### `loadGenrePuzzles(genre, filePath, state)`

Load puzzles for a specific genre.

**Parameters:**
- `genre: string` - Genre name
- `filePath: string` - Path to JSON file
- `state: GameState` - Current game state

**Returns:**
```typescript
Promise<{
  genre: string;
  puzzles: PuzzleData[];
}>
```

#### `loadSequentialPuzzle(genre, book, state, config, allowReplay)`

Load next puzzle in story progression (Story Mode).

**Parameters:**
- `genre: string | null` - Target genre
- `book: string | null` - Target book
- `state: GameState` - Current game state
- `config: Config` - Game configuration
- `allowReplay: boolean` - Allow replaying completed books

**Returns:**
```typescript
{
  success: boolean;
  newState: GameState;
  genreComplete?: boolean;
}
```

### Puzzle Generator Functions

#### `generateGrid(words, config, state)`

Generate word search grid with word placement.

**Parameters:**
- `words: string[]` - Words to place
- `config: Config` - Game configuration
- `state: GameState` - Current game state

**Returns:**
```typescript
{
  grid: string[][];
  wordList: WordData[];
}
```

#### `initializePuzzle(puzzleData, config, state)`

Initialize a puzzle with grid generation and state setup.

**Parameters:**
- `puzzleData: PuzzleData` - Puzzle to initialize
- `config: Config` - Game configuration
- `state: GameState` - Current game state

**Returns:**
```typescript
{
  success: boolean;
  newState: GameState;
}
```

**Usage:**
```typescript
const result = initializePuzzle(puzzleData, config, state);
if (result.success) {
  setState(result.newState);
}
```

### Puzzle Selector Functions

#### `selectNextPuzzle(state, config)`

Select next puzzle using Kethaneum weaving algorithm.

**Parameters:**
- `state: GameState` - Current game state
- `config: PuzzleSelectionConfig` - Selection configuration

**Returns:** `PuzzleSelectionResult`

**Usage:**
```typescript
const result = selectNextPuzzle(state, config);

if (result.puzzle) {
  // Initialize and display puzzle
  const initResult = initializePuzzle(result.puzzle, gameConfig, result.newState);
  setState(initResult.newState);
}

if (result.genreExhausted) {
  // Show genre completion modal
  showGenreCompletionModal();
}
```

#### `markPuzzleCompleted(state, puzzle)`

Mark a puzzle as completed in tracking system.

**Parameters:**
- `state: GameState` - Current game state
- `puzzle: PuzzleData` - Completed puzzle

**Returns:** `GameState` - Updated state

#### `selectGenre(state, genre, config)`

Handle player genre selection.

**Parameters:**
- `state: GameState` - Current game state
- `genre: string` - Selected genre name
- `config: PuzzleSelectionConfig` - Selection configuration

**Returns:** `GameState` - Updated state

---

## Configuration

### Puzzle Selection Config

```typescript
interface PuzzleSelectionConfig {
  kethaneumGenreName: string;      // Name of narrative genre
  minInterval: number;              // Min puzzles between Kethaneum
  maxInterval: number;              // Max puzzles between Kethaneum
}

const defaultPuzzleSelectionConfig = {
  kethaneumGenreName: "Kethaneum",
  minInterval: 2,
  maxInterval: 5
};
```

### Game Config (Puzzle-Related)

```typescript
interface Config {
  gridSize: number;           // 8, 10, or 12
  timeLimit: number;          // Seconds
  minWordLength: number;      // Minimum word length
  maxWordLength: number;      // Maximum word length
  maxWords: number;           // Words per puzzle
  directions: number[][];     // Valid directions for word placement
}
```

---

## Error Handling

### Common Errors

**1. Missing Required Fields:**
```typescript
if (!puzzle.title || !puzzle.book || !puzzle.words) {
  console.warn(`Skipping invalid puzzle:`, puzzle);
  return;  // Skip puzzle
}
```

**2. Word Placement Failure:**
```typescript
if (!placed) {
  throw new Error(`Could not place word: ${word}`);
}
```

**3. Genre Not Found:**
```typescript
if (!state.puzzles[selectedGenre]) {
  return {
    puzzle: null,
    message: `No puzzles found in genre: ${selectedGenre}`
  };
}
```

### Fallback Mechanisms

**Manifest Load Failure:**
```typescript
// Fallback to default files
return [
  '/data/kethaneumPuzzles.json',
  '/data/naturePuzzles.json',
  '/data/testPuzzles.json'
];
```

**Puzzle Load Failure:**
```typescript
// Continue with other puzzles, don't fail entire operation
catch (error) {
  console.error(`Error loading ${filePath}:`, error);
  return null;  // Filter out later
}
```

---

## Performance Considerations

### Optimization Strategies

**1. Parallel Loading:**
```typescript
// Load all genres in parallel
const loadPromises = genreFiles.map(async (filePath) => { ... });
const results = await Promise.all(loadPromises);
```

**2. Lazy Initialization:**
- Initialize completedPuzzlesByGenre sets only when needed
- Defer book mapping until all puzzles loaded

**3. Efficient Collision Detection:**
- Early exit on bounds check
- Check only affected cells, not entire grid

**4. Set-based Completion Tracking:**
- O(1) lookup for completed puzzles
- Efficient duplicate detection

### Memory Management

**Puzzle Storage:**
- ~15 puzzles per genre × 3 genres = ~45 puzzles in memory
- Each puzzle: ~200 bytes (title, words, metadata)
- Total: ~9 KB for all puzzles (negligible)

**Grid Storage:**
- 12×12 grid = 144 cells
- Each cell: 1 character = 2 bytes (Unicode)
- Total per grid: ~288 bytes

**Conclusion:** Memory usage is minimal, no optimization needed

---

## Testing & Debugging

### Testing Puzzle Loading

```typescript
// Test loading all puzzles
const testLoadPuzzles = async () => {
  const state = initializeGameState();
  const config = getConfig();

  const { puzzles, newState } = await loadAllPuzzles(state, config);

  console.log('Loaded genres:', Object.keys(puzzles));
  console.log('Total puzzles:', Object.values(puzzles).flat().length);

  // Verify each puzzle
  for (const genre in puzzles) {
    puzzles[genre].forEach(puzzle => {
      if (!puzzle.title || !puzzle.words) {
        console.error('Invalid puzzle:', puzzle);
      }
    });
  }
};
```

### Testing Puzzle Generation

```typescript
// Test grid generation
const testGenerateGrid = () => {
  const words = ['KETHANEUM', 'PUZZLE', 'WORD', 'SEARCH'];
  const config = getConfig();
  const state = initializeGameState();

  const { grid, wordList } = generateGrid(words, config, state);

  console.log('Grid size:', grid.length, 'x', grid[0].length);
  console.log('Words placed:', wordList.length);

  // Verify all words placed
  if (wordList.length !== words.length) {
    console.error('Not all words were placed!');
  }
};
```

### Testing Puzzle Selection

```typescript
// Test Kethaneum weaving
const testPuzzleSelection = () => {
  let state = initializeGameState();
  state.selectedGenre = "Nature";
  state.puzzlesSinceLastKethaneum = 0;
  state.nextKethaneumInterval = 3;

  for (let i = 0; i < 10; i++) {
    const result = selectNextPuzzle(state, defaultPuzzleSelectionConfig);
    console.log(`Puzzle ${i + 1}:`, {
      title: result.puzzle?.title,
      isKethaneum: result.isKethaneum,
      counter: result.newState.puzzlesSinceLastKethaneum
    });
    state = result.newState;
  }
};
```

---

## Related Documentation

- [Game Overview](../1-overview/GAME_OVERVIEW.md) - High-level game mechanics
- [Codebase Architecture](../2-architecture/CODEBASE_ARCHITECTURE.md) - Overall architecture
- [Adding Puzzles Guide](../5-guides/ADDING_PUZZLES.md) - How to create new puzzles
- [State Management](../2-architecture/STATE_MANAGEMENT.md) - State architecture details
- [Game Engine Vision](../2-architecture/GAME_ENGINE_VISION.md) - Future architecture plans

---

## Future Enhancements

### Planned Improvements

1. **Abstract Puzzle Data Format**
   - Separate generic puzzle data from game-specific metadata
   - Support multiple puzzle types (crossword, sudoku, etc.)

2. **Plugin-based Selection System**
   - Interface for custom selection strategies
   - Multiple progression systems without code changes

3. **Database Loader**
   - Load puzzles from backend API
   - Cloud-based puzzle management
   - Dynamic content updates

4. **Advanced Weaving Algorithms**
   - Mood-based puzzle selection
   - Difficulty progression curves
   - Player skill adaptation

5. **Puzzle Analytics**
   - Track which puzzles are hardest
   - Identify placement patterns that work best
   - Optimize word list generation

---

*The Puzzle System forms the core content delivery mechanism for Chronicles of the Kethaneum, combining sophisticated selection algorithms with efficient generation to create a seamless puzzle-solving experience.*
