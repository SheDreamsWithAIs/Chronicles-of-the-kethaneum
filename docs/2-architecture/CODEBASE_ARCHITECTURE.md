# Chronicles of the Kethaneum - Comprehensive Codebase Architecture Analysis

## Executive Summary

Chronicles of the Kethaneum is a **Next.js-based word search puzzle game** with an integrated narrative system. The codebase consists of **~5,000 lines of library code** and **~900 lines of component code**, organized across a **Next.js 16 + React 19** architecture with TypeScript. The project demonstrates a **partial separation of engine and game content**, with room for refactoring to achieve true game engine reusability.

**Key Stats:**
- Total TypeScript/JavaScript files: 61
- Library code: 5,011 lines
- Component code: 935 lines
- Supported game modes: 3 (Story, Puzzle-Only, Beat-the-Clock)
- Estimated completion: ~15,000+ words of story content with 3 genres

---

## 1. Overall Directory Structure and Organization

```
Chronicles-of-the-kethaneum/
├── app/                           # Next.js App Router
│   ├── api/manifest-manager/      # Development tools API (excluded from prod)
│   ├── backstory/                 # Story introduction page
│   ├── book-of-passage/           # Story progression page
│   ├── library/                   # Book collection/progress tracking page
│   ├── puzzle/                    # Main puzzle game page
│   ├── tools/                     # Development tools (genre-builder, manifest-manager)
│   ├── layout.tsx                 # Root layout with AudioProvider
│   ├── page.tsx                   # Title screen
│   ├── globals.css                # Global styling
│   └── title-screen.module.css    # Title screen styles
│
├── lib/                           # Core game engine & logic
│   ├── core/config.ts             # Game configuration & difficulty settings
│   ├── game/
│   │   ├── state.ts               # Game state interface definitions
│   │   ├── logic.ts               # Core game mechanics (word checking, win conditions)
│   │   ├── puzzleGenerator.ts     # Word grid generation algorithm
│   │   ├── puzzleLoader.ts        # Puzzle data loading system
│   │   ├── puzzleOnlyLoader.ts    # Puzzle-only mode loader
│   │   ├── beatTheClockLoader.ts  # Beat-the-clock mode loader
│   │   ├── puzzleSelector.ts      # Intelligent puzzle selection with Kethaneum weaving
│   │   ├── puzzleSelectionConfig.ts # Puzzle selection configuration
│   │   └── stats.ts               # Statistics tracking
│   ├── dialogue/
│   │   ├── DialogueManager.ts     # Character dialogue system (singleton)
│   │   └── types.ts               # Dialogue type definitions
│   ├── audio/
│   │   ├── audioManager.ts        # Audio system (singleton)
│   │   ├── playlistConfig.ts      # Playlist configurations by context
│   │   └── playlistExample.tsx    # Usage examples
│   ├── save/
│   │   └── saveSystem.ts          # Game progress & settings persistence
│   └── utils/
│       ├── mathUtils.ts           # Math utilities & seeded RNG
│       └── assetPath.ts           # Asset path resolution
│
├── components/                    # React components
│   ├── shared/
│   │   └── CosmicBackground.tsx   # Background component
│   ├── GameModeModal.tsx          # Game mode selection
│   ├── GameStatsModal.tsx         # End-game statistics display
│   ├── GenreCompletionModal.tsx   # Genre completion notification
│   ├── GenreSelectionModal.tsx    # Genre selection UI
│   ├── AudioSettingsModal.tsx     # Audio control panel
│   ├── AudioProvider.tsx          # Audio system provider/initialization
│   └── Navigation.tsx             # Navigation bar
│
├── hooks/                         # React custom hooks
│   ├── useGameState.ts            # Game state management + persistence
│   ├── useGameLogic.ts            # Word selection & checking logic
│   ├── useGameModeHandlers.ts     # Mode-specific event handlers
│   ├── usePuzzle.ts               # Puzzle loading interface
│   ├── usePuzzleLoading.ts        # Puzzle initialization for different modes
│   ├── useTimer.ts                # Mode-specific timer hooks
│   ├── useAudio.ts                # Audio hook interface
│   ├── useScreenSize.ts           # Responsive design utilities
│   └── dialogue/useDialogue.ts    # Dialogue hook interface
│
├── public/
│   ├── data/                      # Game content (JSON data)
│   │   ├── genreManifest.json     # List of puzzle files
│   │   ├── kethaneumPuzzles.json  # Main narrative puzzles
│   │   ├── naturePuzzles.json     # Nature genre puzzles
│   │   ├── testPuzzles.json       # Test/example puzzles
│   │   ├── beatTheClockPuzzles.json # Time-challenge mode puzzles
│   │   ├── dialogue-config.json   # Dialogue system configuration
│   │   ├── characters/            # Character data files
│   │   │   ├── character-manifest.json
│   │   │   ├── archivist-lumina.json
│   │   │   ├── professor-lengthy-mcwordsworth.json
│   │   │   └── tester-testerson.json
│   │   └── story-events/          # Story event triggers
│   │       └── first-visit.json
│   ├── audio/                     # Audio files (not in repo, user-added)
│   └── images/                    # Game images/assets
│
├── docs/                          # Documentation
│   ├── AUDIO_SYSTEM.md            # Comprehensive audio system guide
│   └── BUILD_FIX_EXPLANATION.md   # Production build optimization
│
├── cypress/                       # E2E testing
│   ├── e2e/                       # Test specifications
│   └── support/                   # Test utilities
│
├── scripts/                       # Build scripts
│   └── build-production.js        # Custom production build orchestration
│
├── package.json                   # Dependencies
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── cypress.config.ts              # Cypress configuration
└── README.md                      # Project documentation
```

### Directory Insights
- **Clear separation**: UI layer (`components/hooks`), business logic (`lib/`), and game content (`public/data`)
- **Modular structure**: Game systems are self-contained (audio, dialogue, save, core game logic)
- **Development tools isolated**: Tools are excluded from production builds via custom build script
- **Data-driven design**: All puzzle and character content is loaded from JSON files

---

## 2. Main Entry Points and Core Game Files

### Application Entry Points

1. **`app/page.tsx`** - Title Screen
   - Loads saved game progress
   - Routes to appropriate page based on game state
   - Handles new game vs. continue game flows

2. **`app/puzzle/page.tsx`** - Main Game Screen
   - Largest component (~450 lines)
   - Manages all game modes (story, puzzle-only, beat-the-clock)
   - Orchestrates hook coordination and timer management
   - Handles puzzle grid rendering and word selection UI

3. **`app/backstory/page.tsx`** - Story Introduction
   - Intro narrative before first puzzle

4. **`app/book-of-passage/page.tsx`** - Story progression
   - Shows book progress and story beats

5. **`app/library/page.tsx`** - Progress tracking
   - Shows completed books and statistics

### Core Engine Files (5,011 lines total)

**Game Logic Core:**
- `lib/game/logic.ts` - Core mechanics
  - Word validation (`checkForWord`)
  - Win condition checking
  - Game state transitions (pause, resume, end)
  - Timer management
  - 380 lines of pure game logic

- `lib/game/state.ts` - Game state definitions
  - GameState interface (80+ properties)
  - State initialization and restoration
  - Save/restore logic
  - 225 lines of state management

**Puzzle System:**
- `lib/game/puzzleGenerator.ts` - Procedural grid generation
  - Two-phase word placement algorithm (random then systematic)
  - Seeded RNG for reproducibility
  - Supports 8 directional word placement
  - ~200 lines

- `lib/game/puzzleLoader.ts` - Puzzle data loading
  - Loads from JSON manifest system
  - Groups puzzles by genre
  - Builds story progression mappings
  - Sequential puzzle selection with fallback recovery
  - 617 lines (largest single file)

- `lib/game/puzzleSelector.ts` - Intelligent puzzle selection
  - Implements "Kethaneum weaving" system
  - Alternates between chosen genre and narrative puzzles
  - Tracks completed puzzles to avoid repetition
  - Smart interval calculation
  - ~300 lines

- `lib/game/puzzleOnlyLoader.ts` & `beatTheClockLoader.ts`
  - Mode-specific puzzle loaders

**Configuration System:**
- `lib/core/config.ts` - Centralized configuration
  - Difficulty levels (easy/medium/hard)
  - Feature flags (haptics, animations, sound)
  - Testing configuration
  - Audio settings with mute states
  - 282 lines with getter/setter utilities

**Dialogue System:**
- `lib/dialogue/DialogueManager.ts` - Character banter system (singleton)
  - Loads character definitions from JSON
  - Manages story beat availability
  - Weighted random character selection
  - Avoids character repetition
  - 605 lines

- `lib/dialogue/types.ts` - Dialogue type definitions
  - Character metadata
  - Story event structure
  - Dialogue configuration schema
  - 288 lines

**Audio System:**
- `lib/audio/audioManager.ts` - Audio system (singleton)
  - Web Audio API integration
  - 4 audio categories (music, ambient, sfx, voice)
  - Playlist management with 4 modes
  - Volume control with master + category levels
  - Fade-in/fade-out transitions
  - ~800 lines (complex system)

- `lib/audio/playlistConfig.ts` - Audio organization
  - Pre-configured playlists by context/game state
  - 255 lines of configuration data

**Save System:**
- `lib/save/saveSystem.ts` - Game progress persistence
  - LocalStorage-based save system
  - Handles Set/Array conversion for JSON serialization
  - Audio settings persistence
  - 168 lines

**Utilities:**
- `lib/utils/mathUtils.ts` - Math helpers & seeded RNG
  - createSeededRandom() for reproducible puzzles
  - Helper functions (shuffle, clamp, lerp, etc.)
  - 98 lines

- `lib/utils/assetPath.ts` - Asset resolution
  - Fetch wrapper for Next.js asset paths
  - ~20 lines

---

## 3. Game Architecture (Components, Systems, Modules)

### Architectural Patterns

#### **Singleton Pattern (2 instances)**
1. **AudioManager** - Centralized audio control
2. **DialogueManager** - Centralized character dialogue
- Both follow singleton pattern with getInstance() methods
- Persist state across page navigation

#### **Functional State Management**
- React's `useState` + `useCallback` for component state
- Custom hooks for business logic isolation
- No external state management library (Redux, Zustand)
- State persisted to localStorage via useGameState hook

#### **Hook-Based Architecture**
```
Custom Hooks (9 total):
├── useGameState() - Load/save game state
├── useGameLogic() - Word selection & win checking
├── useGameModeHandlers() - Mode-specific event handlers
├── usePuzzle() - Puzzle loading interface
├── usePuzzleLoading() - Puzzle initialization orchestration
├── useTimer() - Mode-specific timer hooks (3 variants)
├── useAudio() - Audio system interface
├── useScreenSize() - Responsive design
└── useDialogue() - Dialogue system interface
```

#### **Module Architecture**
```
Game Systems:
├── Core Game Loop (state → logic → rendering)
├── Configuration System (centralized settings)
├── Puzzle Generation & Loading (content delivery)
├── Audio System (music, sfx, voice, ambient)
├── Dialogue System (character interactions)
├── Save System (persistence)
└── UI Components (React presentational)
```

### Data Flow

```
TitleScreen
    ↓
loadGameProgress() → GameState
    ↓
Game Loop (puzzle/page.tsx):
├─ useGameState() → loads saved state or initializes new
├─ usePuzzle() → loads puzzle data
│   ├─ puzzleLoader.ts → loads JSON data
│   ├─ puzzleGenerator.ts → generates grid
│   └─ puzzleSelector.ts → intelligent selection
├─ useGameLogic() → word checking logic
├─ useTimer() → countdown timer (mode-specific)
├─ useAudio() → audio playback
├─ DialogueManager → character dialogue
└─ saveGameProgress() → persist to localStorage
    ↓
Game Over / Continue to next puzzle
```

### Component Composition

**Main Game Page (`puzzle/page.tsx`):**
```
PuzzleScreen
├─ State Management
│  ├─ useGameState()
│  ├─ useGameLogic()
│  ├─ usePuzzleLoading()
│  └─ useGameModeHandlers()
├─ Rendering (grid, words, timer)
├─ Modal Management
│  ├─ GameStatsModal
│  ├─ GenreCompletionModal
│  └─ Audio Settings
└─ Event Handlers
   ├─ handleWin()
   ├─ handleLose()
   └─ handleCell selection
```

---

## 4. Engine vs. Game Content Separation

### Engine Code (Reusable)
**Current Status: ~70% reusable**

**Well-Abstracted Systems:**
- ✅ **Game Logic** (`logic.ts`) - Generic word search mechanics
  - checkForWord() - Works with any wordList/grid
  - Timer management - Mode-independent
  - State transitions - Generic

- ✅ **Configuration System** (`config.ts`) - Extensible settings
  - Difficulty presets can be customized
  - Feature flags easily toggled
  - Audio settings generic

- ✅ **Audio System** (`audioManager.ts`) - Fully generic
  - No game-specific audio files hardcoded
  - Category-based organization
  - Could be extracted to separate package

- ✅ **Save System** (`saveSystem.ts`) - Generic serialization
  - localStorage-based but pattern is generic
  - Could adapt to cloud save

**Partially Abstracted:**
- ⚠️ **Puzzle Generation** (`puzzleGenerator.ts`)
  - Core algorithm is generic
  - Grid size configurable
  - But word placement logic is game-specific
  - Could be parameterized for other puzzle types

- ⚠️ **Puzzle Loading** (`puzzleLoader.ts`)
  - Data loading is generic
  - Genre/book organization is Kethaneum-specific
  - Hardcoded field names (storyPart, genre, book)
  - **Refactoring needed**: Create abstract loader interface

### Game Content (Kethaneum-Specific)

**Hard-Coded Game Logic:**
- ❌ **Puzzle Selection** (`puzzleSelector.ts`)
  - "Kethaneum weaving" system is game-narrative specific
  - Alternates between genre + Kethaneum books
  - Would need complete rewrite for different game

- ❌ **Story Progression System**
  - Book → StoryPart → Genre progression
  - Hardcoded assumptions about puzzle structure
  - No abstraction for other narrative patterns

- ❌ **Dialogue System** (`DialogueManager.ts`)
  - Built specifically for Kethaneum character system
  - Story beat integration is game-specific
  - Character retirement logic is hardcoded

- ❌ **UI Components** (`components/`)
  - Kathaneum-branded visuals
  - Cosmic background styling
  - Layout assumes word search puzzle format

**Data Format Specificity:**
```json
Puzzle Data Format (Kethaneum-specific):
{
  "title": "...",           // Required
  "book": "...",            // Game-specific: narrative structure
  "genre": "...",           // Game-specific: category system
  "storyPart": 0,           // Game-specific: story progression
  "storyExcerpt": "...",    // Game-specific: narrative content
  "words": [...]            // Generic: puzzle content
}
```

---

## 5. Current State of Documentation

**Existing Documentation:**
- ✅ `docs/AUDIO_SYSTEM.md` - Comprehensive (865 lines)
  - Usage examples with code snippets
  - API reference complete
  - Best practices documented
  - Playlist system extensively covered

- ✅ `docs/BUILD_FIX_EXPLANATION.md` - Technical (135 lines)
  - Problem statement clear
  - Solution explanation thorough
  - Build process documentation

- ✅ `README.md` - Basic (68 lines)
  - Getting started instructions
  - Tool setup guide
  - Links to resources

**Missing Documentation:**
- ❌ Architecture overview
- ❌ Game loop explanation
- ❌ State management guide
- ❌ Puzzle data format specification
- ❌ Dialogue system usage guide
- ❌ How to create new puzzles
- ❌ Extension points for custom games
- ❌ API reference for core game logic

**Documentation Quality Assessment:**
- Audio system: Excellent (production-ready)
- Build system: Good
- General project: Minimal
- Architecture: Non-existent

---

## 6. Key Technologies and Frameworks

### Core Stack
- **Framework**: Next.js 16.0.1 (App Router)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4 + PostCSS
- **Build Tool**: Next.js built-in (webpack)

### Development Tools
- **Linting**: ESLint 9 + ESLint Config Next
- **Testing**: Cypress 13.6.0 (E2E)
- **Test Runner**: start-server-and-test

### Browser APIs Used
- **Web Audio API** - Audio playback and mixing
- **localStorage** - Game progress persistence
- **CustomEvent** - Event system for dialogue/audio
- **AudioContext** - Advanced audio control

### Package Dependencies (Minimal!)
```json
{
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "next": "16.0.1"
}
```

**Notable: No external dependencies beyond React/Next.js!**
- Audio system implemented from scratch using Web Audio API
- Game logic uses native JavaScript
- State management uses React hooks
- Styling uses Tailwind CSS

### File Type Distribution
- TypeScript/TSX: 61 files (5,946 lines)
- CSS: 2 main files + module styles
- JSON: 11 data files + config files
- No third-party libraries for game mechanics

---

## 7. Game Mechanics and Features Implemented

### Core Game Mechanics
**Word Search Puzzle System:**
- ✅ 10×10 grid (configurable: 8-12 by difficulty)
- ✅ Word placement in 8 directions
  - Right, Down, Diagonal, Left, Up, Reverse Diagonal, etc.
- ✅ Dynamic word placement with two-phase algorithm
  - Phase 1: Random placement attempts
  - Phase 2: Systematic placement fallback
- ✅ Word validation against selected cells
- ✅ Real-time selection feedback

### Game Modes (3 Implemented)

1. **Story Mode**
   - Sequential puzzle progression through narrative
   - Books divided into story parts
   - Timer is decorative (no time pressure)
   - Puzzle-to-puzzle progression based on book/genre
   - Tracks discovered books

2. **Puzzle-Only Mode**
   - Random puzzle selection from any genre
   - Real countdown timer (3 minutes default)
   - Lose if time expires
   - No narrative progression

3. **Beat-the-Clock Mode**
   - Fixed 5-minute run duration
   - Multiple puzzles completed in sequence
   - Individual puzzle timers within run timer
   - Statistics tracking (puzzles/words/time)
   - Final score reporting

### Feature Set

**Difficulty System:**
- Easy: 8×8 grid, 4 min, 6 words
- Medium: 10×10 grid, 3 min, 8 words
- Hard: 12×12 grid, 2.5 min, 10 words

**Audio System:**
- 4 independent volume channels (music, ambient, sfx, voice)
- Master volume control
- Individual mute toggles
- Fade-in/fade-out transitions
- Playlist management with 4 playback modes
  - Sequential, Shuffle, Repeat-One, Repeat-All

**Dialogue System:**
- Character-based banter
- Story beat-aware availability
- Weighted random selection (avoids repetition)
- Loading groups (deferred loading)

**Progression Tracking:**
- Discovered books counter
- Story part completion tracking
- Genre-specific completion tracking
- Statistics per puzzle (time, words, accuracy)
- Session statistics (beat-the-clock mode)

**Save System:**
- Auto-saves after each puzzle
- Saves to localStorage
- Restores on app reload
- Handles game mode persistence
- Audio settings persistence

**UI Features:**
- Responsive design (tested across devices)
- Cosmic background animations
- Modal dialogs (game mode, stats, settings, etc.)
- Navigation between game modes
- Title screen with new/continue options

### Configuration Options
- Enabled/disabled features via feature flags
- Difficulty level selection
- Grid size customization
- Timer duration modification
- Testing mode toggles
  - Skip timers
  - Show all words
  - Auto-win
  - Load all puzzles

---

## 8. Data Structures and Configuration Patterns

### Core Data Structures

**Game State** (80+ properties)
```typescript
interface GameState {
  // Grid & gameplay
  currentScreen: string;
  grid: string[][];
  wordList: WordData[];
  selectedCells: Cell[];
  
  // Timing
  timeRemaining: number;
  paused: boolean;
  gameOver: boolean;
  
  // Content
  puzzles: { [genre: string]: PuzzleData[] };
  currentGenre: string;
  currentPuzzleIndex: number;
  
  // Story progression
  books: BookProgress;
  currentBook: string;
  currentStoryPart: number;
  completedBooks: number;
  discoveredBooks: Set<string>;
  
  // Puzzle selection (intelligent system)
  selectedGenre: string;
  nextKethaneumIndex: number;
  puzzlesSinceLastKethaneum: number;
  nextKethaneumInterval: number;
  completedPuzzlesByGenre: { [genre: string]: Set<string> };
  kethaneumRevealed: boolean;
  genreExhausted: boolean;
  
  // Statistics & modes
  gameMode: 'story' | 'puzzle-only' | 'beat-the-clock';
  runStartTime: number | null;
  sessionStats: SessionStats | null;
}
```

**Puzzle Data Format**
```typescript
interface PuzzleData {
  title: string;              // Unique identifier
  book: string;               // Story progression (game-specific)
  genre: string;              // Category (game-specific)
  words: string[];            // Word list (generic)
  storyPart?: number;         // Narrative structure (game-specific)
  storyExcerpt?: string;      // Story content (game-specific)
}
```

**Configuration System**
```typescript
interface Config {
  // Puzzle generation
  gridSize: number;
  timeLimit: number;
  minWordLength: number;
  maxWordLength: number;
  maxWords: number;
  directions: number[][];  // 8-directional movement vectors
  
  // Difficulty presets
  difficultyLevels: {
    easy: DifficultyLevel;
    medium: DifficultyLevel;
    hard: DifficultyLevel;
  };
  
  // System controls
  features: FeatureFlags;
  testing: TestingConfig;
  system: SystemSettings;
  audio: AudioSettings;
}
```

**Audio Settings**
```typescript
interface AudioSettings {
  masterVolume: number;         // 0-1 range
  musicVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  masterMuted: boolean;
  musicMuted: boolean;
  ambientMuted: boolean;
  sfxMuted: boolean;
  voiceMuted: boolean;
}
```

### File Structure Patterns

**Puzzle Data Organization:**
```
public/data/
├── genreManifest.json             # Master list of puzzle files
├── kethaneumPuzzles.json          # Genre: Kethaneum (narrative)
├── naturePuzzles.json             # Genre: Nature
├── testPuzzles.json               # Genre: Test
├── beatTheClockPuzzles.json       # Mode-specific puzzles
├── dialogue-config.json           # Dialogue system settings
├── characters/
│   ├── character-manifest.json    # Character file list
│   └── [character-name].json      # Character definition
└── story-events/
    └── [event-name].json          # Story event data
```

**JSON Schema Examples:**

*Genre Manifest (genreManifest.json):*
```json
{
  "genreFiles": [
    "/data/kethaneumPuzzles.json",
    "/data/naturePuzzles.json",
    "/data/testPuzzles.json"
  ]
}
```

*Character File (archivist-lumina.json):*
```json
{
  "character": {
    "id": "archivist-lumina",
    "name": "Archivist Lumina",
    "loadingGroup": "introduction_characters",
    "description": "..."
  },
  "banterDialogue": [
    {
      "id": "greeting-1",
      "text": "Welcome, seeker...",
      "emotion": ["warm", "mysterious"],
      "availableFrom": "hook",
      "availableUntil": "climax"
    }
  ]
}
```

*Puzzle File Structure:*
```json
[
  {
    "title": "Puzzle Title",
    "book": "Book Name",
    "genre": "Genre Name",
    "storyPart": 0,
    "storyExcerpt": "Story text here...",
    "words": ["word1", "word2", ...]
  }
]
```

### Configuration Loading

**Three-tier Configuration System:**
1. **Defaults** - Hardcoded in config.ts
2. **Runtime** - Modified via set() function
3. **Persistence** - Via localStorage (audio settings)

**Configuration Access Pattern:**
```typescript
import { getConfig, set, get } from '@/lib/core/config';

// Get full config
const config = getConfig();

// Get specific value with dot notation
const gridSize = get('gridSize', 10);

// Set configuration
set('audio.masterVolume', 0.8);
set('features.soundEffects', true);
```

---

## 9. Refactoring Analysis: Engine vs. Game Content

### What Needs Refactoring for Engine Reusability

#### Priority 1: High Impact (Would Enable New Games)

**1. Abstract Puzzle Data Format**
Current issue: Hardcoded fields (book, genre, storyPart, storyExcerpt)
```typescript
// Current: Game-specific
interface PuzzleData {
  title: string;
  book: string;              // ← Game-specific
  genre: string;             // ← Game-specific
  storyPart?: number;        // ← Game-specific
  storyExcerpt?: string;     // ← Game-specific
  words: string[];
}

// Refactored: Generic + extensible
interface GenericPuzzleData {
  id: string;
  title: string;
  content: string[];         // Generic: puzzle data
  metadata?: Record<string, any>;  // Game-specific fields
}
```

**2. Extract Puzzle Selection Logic**
Current: `puzzleSelector.ts` hardcoded to Kethaneum weaving
```typescript
// Current: Kethaneum-specific
export function selectNextPuzzle(state: GameState, config: PuzzleSelectionConfig)

// Refactored: Plugin interface
export interface PuzzleSelectionStrategy {
  selectNextPuzzle(state: GameState): PuzzleSelectionResult;
  canSelect(puzzle: PuzzleData): boolean;
}
```

**3. Generalize Puzzle Loader**
Current: `puzzleLoader.ts` assumes genre-based organization
Refactoring: Create abstract loader interface with plugin implementations

#### Priority 2: Medium Impact (Code Quality)

**1. Separate UI from Game Logic**
- Components directly access game state
- No clear presentation layer
- Hard to test game logic in isolation

**2. Extract Configuration Constants**
- Puzzle selection intervals hardcoded
- Story beat progressions hardcoded
- Difficulty presets could be more flexible

**3. Generalize Timer System**
- useTimer.ts has three nearly-identical implementations
- Could be abstracted to strategy pattern

#### Priority 3: Lower Impact (Polish)

**1. DialogueManager Improvements**
- Story beat system is rigid
- Character loading groups hardcoded
- Could benefit from dynamic configuration

**2. Audio System File Organization**
- playlistConfig.ts is very Kethaneum-specific
- Could be split into generic + game-specific

---

## 10. Path to True Game Engine

### Step 1: Create Engine Abstraction Layer (1-2 weeks)

```
engine/
├── core/
│   ├── PuzzleEngine.ts        # Generic puzzle mechanics
│   ├── GameStateManager.ts    # Generic state management
│   └── ConfigSystem.ts        # Already mostly generic
├── loaders/
│   ├── PuzzleLoader.ts        # Make abstract/pluggable
│   ├── PuzzleSelectionStrategy.ts  # Plugin interface
│   └── StateSerializer.ts     # Save/load interface
├── systems/
│   ├── AudioSystem.ts         # Already generic, just needs extraction
│   ├── DialogueSystem.ts      # Make abstract
│   └── SaveSystem.ts          # Make abstract
└── types/
    └── EngineTypes.ts         # Core type definitions
```

### Step 2: Create Game Implementation Layer (1-2 weeks)

```
games/kethaneum/
├── systems/
│   ├── StoryProgressionSystem.ts
│   ├── KethaneumPuzzleSelector.ts
│   ├── CharacterDialogueSystem.ts
│   └── GenreManager.ts
├── data/
│   ├── puzzles.json
│   └── characters.json
└── config/
    └── gameConfig.ts
```

### Step 3: Decouple UI from Game Logic (1-2 weeks)

```
engine/
└── ui/
    ├── interfaces/
    │   ├── IPuzzleRenderer.ts
    │   ├── IGameDisplay.ts
    │   └── IInputHandler.ts
    └── hooks/
        ├── useEngineState.ts
        ├── useEngineLogic.ts
        └── useEngineAudio.ts
```

### Estimated Effort for Full Engine Extraction
- **Total**: 4-6 weeks of development
- **Reusability gain**: Could create new word search games in 1-2 weeks
- **Code reduction**: Remove ~2,000 lines of game-specific code from engine
- **Test coverage**: Would require comprehensive test suite

### Metrics After Refactoring
```
Before:
├── Engine-specific code: ~3,500 lines (70%)
├── Game-specific code: ~1,500 lines (30%)
├── Coupling: HIGH
└── Reusability: LOW

After:
├── Engine code: ~3,500 lines (100% reusable)
├── Game code: ~1,500 lines (100% game-specific)
├── Coupling: LOW
└── Reusability: HIGH
```

---

## 11. Special Features & Systems

### Kethaneum Weaving System
The most distinctive feature - intelligently interleaves narrative puzzles:
- Player chooses a puzzle genre
- After N puzzles (2-5 random interval), shows a Kethaneum narrative puzzle
- Tracks completion to avoid repeats
- Makes narrative feel organic, not forced
- ~300 lines of sophisticated puzzle selection logic

### Seeded Random Generation
Ensures puzzle grids are reproducible:
```typescript
// Create seeded RNG from project name
const projectSeed = "Kethaneum".split('')
  .reduce((acc, char) => acc + char.charCodeAt(0), 0);
const seededRandom = createSeededRandom(projectSeed + Date.now() % 10000);
```

### Story Beat System
Dialogue availability tied to narrative progression:
- 8 story beats (HOOK → RESOLUTION)
- Characters have availability windows
- Story retirement system (characters fade out)
- Prevents spoiler dialogue

### Two-Phase Word Placement
Ensures words fit even with complex constraints:
1. Random attempts (100 tries)
2. Systematic scan (fallback)
- Sorts words by length (longest first)
- Prevents unplaceable word configurations

---

## 12. Conclusion: Architecture Assessment

### Strengths
- ✅ Clean separation of concerns (lib/components/hooks)
- ✅ Type-safe with comprehensive TypeScript
- ✅ Zero external game dependencies (only React/Next.js)
- ✅ Sophisticated puzzle selection algorithm
- ✅ Well-documented audio system
- ✅ Good use of React patterns (custom hooks, composition)
- ✅ Extensible configuration system

### Weaknesses
- ❌ Game-specific logic tightly coupled with engine logic
- ❌ No abstraction for puzzle data format
- ❌ Puzzle selection strategy hardcoded for Kethaneum
- ❌ Dialogue system specific to Kethaneum
- ❌ Limited documentation beyond audio system
- ❌ UI components tightly coupled to game state
- ❌ No clear extension points for different game types

### Refactoring Recommendations (Priority Order)

1. **Extract Puzzle Loader Interface** (Most impactful)
   - Creates plugin architecture for puzzle loading
   - Enables custom puzzle formats per game

2. **Abstract Puzzle Selection Strategy**
   - Separate narrative progression from core mechanics
   - Enable different progression systems

3. **Generalize Data Structures**
   - Create "plugin-friendly" puzzle format
   - Keep game-specific metadata separate

4. **Improve Documentation**
   - Add architecture guide
   - Document extension points
   - Create "new game" tutorial

5. **Extract UI from Game Logic**
   - Clear presentation/business logic boundary
   - Enables easier testing and reuse

---

## Appendix: File Size Reference

| File | Lines | Type | Purpose |
|------|-------|------|---------|
| lib/game/puzzleLoader.ts | 617 | Logic | Puzzle data loading |
| lib/audio/audioManager.ts | 800+ | System | Audio management |
| lib/dialogue/DialogueManager.ts | 605 | System | Character dialogue |
| app/puzzle/page.tsx | ~450 | UI | Main game interface |
| lib/game/logic.ts | 380 | Logic | Core mechanics |
| lib/game/puzzleGenerator.ts | 200+ | Logic | Grid generation |
| lib/core/config.ts | 282 | System | Configuration |
| lib/dialogue/types.ts | 288 | Types | Dialogue definitions |
| hooks/useGameState.ts | 70 | Hook | State management |
| lib/utils/mathUtils.ts | 98 | Utils | Math helpers |

**Total Analyzed: 5,946 lines across 61 files**

---

*Analysis completed: Chronicles of the Kethaneum represents a well-structured game with sophisticated systems, but would benefit from refactoring to achieve true engine-level reusability. Current separation of concerns is good at the file level but needs architectural abstraction at the design level.*
