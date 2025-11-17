# Chronicles of the Kethaneum - Architecture Summary

## Quick Overview

**Chronicles of the Kethaneum** is a well-structured **Next.js word search puzzle game** (~6,000 lines of code) with sophisticated story progression and audio systems. The codebase demonstrates good architectural separation at the file level but needs refactoring to become a true reusable game engine.

## Key Findings

### Architecture Health: 7/10

**Strengths:**
- Clean folder structure (lib/components/hooks separation)
- Type-safe codebase (TypeScript throughout)
- Minimal external dependencies (only React/Next.js)
- Sophisticated systems (puzzle selection, audio, dialogue)
- Well-documented audio system

**Weaknesses:**
- Game-specific logic tightly coupled with engine code
- No abstraction for puzzle data format
- Dialogue system hardcoded for Kethaneum
- Limited documentation for core architecture
- UI directly depends on game state structure

### Codebase Statistics

```
Total Code: 6,000 lines (5,000 lib + 900 components + 1,100 other)
Files: 61 TypeScript/JavaScript files
Entry Points: 5 (Title, Puzzle, Backstory, Library, Book)
Game Modes: 3 (Story, Puzzle-Only, Beat-the-Clock)
Systems: 7 major systems (Game, Puzzle, Config, Audio, Dialogue, Save, UI)
External Deps: 0 for game logic (only React/Next.js)
```

### Engine vs Game Content Split

| Aspect | Status | Reusability |
|--------|--------|-------------|
| Game Loop | Core logic is generic | ✅ 100% reusable |
| Configuration | Extensible system | ✅ 90% reusable |
| Audio System | No game specifics | ✅ 100% reusable |
| Save System | Pattern is generic | ✅ 80% reusable |
| Puzzle Generation | Algorithm generic | ⚠️ 60% reusable |
| Puzzle Loading | Assumes genre structure | ⚠️ 40% reusable |
| Puzzle Selection | Kethaneum weaving hardcoded | ❌ 5% reusable |
| Story System | Completely game-specific | ❌ 0% reusable |
| Dialogue System | Game-narrative specific | ❌ 10% reusable |

**Overall: ~40% of codebase is easily reusable as-is**

## Critical Refactoring Opportunities

### #1: Abstract Puzzle Data Format (Highest Impact)

**Current Problem:** Puzzle data hardcoded with game-specific fields
```json
{
  "title": "...",
  "book": "...",           // ← Game-specific
  "genre": "...",          // ← Game-specific  
  "storyPart": 0,          // ← Game-specific
  "storyExcerpt": "...",   // ← Game-specific
  "words": [...]           // ← Generic
}
```

**Solution:** Split into generic content + game metadata
```typescript
interface Puzzle {
  id: string;
  title: string;
  content: string[];
  metadata?: Record<string, any>; // Game-specific fields
}
```

**Impact:** Would enable using same puzzle format for different game types

### #2: Extract Puzzle Selection Strategy (High Impact)

**Current Problem:** `puzzleSelector.ts` hardcoded for Kethaneum weaving

**Solution:** Plugin-based selection system
```typescript
interface PuzzleSelectionStrategy {
  selectNextPuzzle(state: GameState): PuzzleSelectionResult;
}

// Different implementations:
- KethaneumWeavingStrategy (current)
- RandomSelectionStrategy
- SequentialStrategy
- CustomStrategy (user-defined)
```

**Impact:** Would enable different progression systems without code changes

### #3: Generalize Puzzle Loader (Medium Impact)

**Current Problem:** `puzzleLoader.ts` assumes genre-based JSON files

**Solution:** Abstract loader interface with pluggable implementations
```typescript
interface PuzzleLoader {
  loadPuzzles(): Promise<Puzzle[]>;
  loadGenres(): Promise<string[]>;
}

// Implementations:
- JSONFileLoader (current)
- DatabaseLoader (future)
- APILoader (future)
```

### #4: Separate UI Rendering from Game Logic (Medium Impact)

**Current Problem:** Components directly manipulate game state

**Solution:** Add presentation layer abstraction
```typescript
interface GameDisplay {
  renderGrid(grid: string[][]): void;
  renderWords(words: WordData[]): void;
  renderTimer(timeRemaining: number): void;
}
```

## Recommended Refactoring Path

### Phase 1: Foundation (2 weeks)
1. Create engine abstraction layer
2. Extract puzzle format to plugin-friendly structure
3. Document core architecture

**Effort:** 2-3 developers

### Phase 2: Extraction (3 weeks)
1. Decouple game-specific logic
2. Create plugin interfaces
3. Implement Kethaneum as a plugin

**Effort:** 2 developers

### Phase 3: Validation (1 week)
1. Create second game as proof-of-concept
2. Document extension points
3. Create "game creator" guide

**Effort:** 1-2 developers

**Total Estimated Effort:** 4-6 weeks for a fully reusable engine

## Current State of Documentation

| Document | Lines | Quality | Completeness |
|----------|-------|---------|--------------|
| AUDIO_SYSTEM.md | 865 | Excellent | 100% |
| BUILD_FIX_EXPLANATION.md | 135 | Good | 100% |
| README.md | 68 | Basic | 60% |
| **NEW: CODEBASE_ARCHITECTURE.md** | 1,013 | Comprehensive | 95% |

**Missing:** Game loop guide, puzzle format spec, extension guide

## Technology Stack

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Persistence:** localStorage
- **Audio:** Web Audio API
- **Testing:** Cypress E2E

**Note:** Zero npm dependencies beyond React/Next.js!

## Game Features Summary

### Game Modes
- ✅ **Story Mode** - Sequential narrative progression
- ✅ **Puzzle-Only Mode** - Random puzzles with timer
- ✅ **Beat-the-Clock Mode** - 5-min challenges with stats

### Systems Implemented
- ✅ **Puzzle Generator** - Two-phase word placement (ensures solvability)
- ✅ **Story Progression** - Book/Part/Genre hierarchy
- ✅ **Audio System** - 4 categories, playlists, fade transitions
- ✅ **Dialogue System** - Character banter with story beat awareness
- ✅ **Save System** - Auto-save to localStorage
- ✅ **Configuration** - 3 difficulty levels, feature flags
- ✅ **Statistics** - Per-puzzle and session tracking

### Special Features
- **Kethaneum Weaving:** Intelligently interleaves narrative puzzles
- **Seeded RNG:** Reproducible puzzle grids
- **8-Directional Words:** Horizontal, vertical, diagonal placement
- **Story Beats:** 8-part narrative structure
- **Character Retirement:** Dynamic dialogue availability

## Quick Architecture Map

```
lib/ (5,011 lines) - Engine & Logic
├── core/config.ts (282) - Configuration system ✅ Reusable
├── game/
│   ├── logic.ts (380) - Core mechanics ✅ Reusable
│   ├── state.ts (225) - State management ✅ Reusable
│   ├── puzzleGenerator.ts (200) - Grid generation ✅ Reusable
│   ├── puzzleLoader.ts (617) - Data loading ⚠️ Partially reusable
│   ├── puzzleSelector.ts (300) - Selection logic ❌ Game-specific
│   └── stats.ts - Statistics ✅ Reusable
├── dialogue/
│   ├── DialogueManager.ts (605) - Character dialogue ❌ Game-specific
│   └── types.ts (288) - Type definitions
├── audio/
│   ├── audioManager.ts (800) - Audio system ✅ Reusable
│   ├── playlistConfig.ts (255) - Playlists ❌ Game-specific
│   └── playlistExample.tsx
├── save/saveSystem.ts (168) - Persistence ✅ Reusable
└── utils/ - Helpers ✅ Reusable

components/ (935 lines) - React UI
├── shared/CosmicBackground.tsx - Background ❌ Game-specific
├── GameModeModal.tsx - Mode selection ❌ Game-specific
├── GameStatsModal.tsx - Stats display ❌ Game-specific
├── GenreSelectionModal.tsx - Genre selection ❌ Game-specific
├── AudioSettingsModal.tsx - Audio settings ✅ Generic
├── AudioProvider.tsx - Audio init ✅ Generic
└── Navigation.tsx - Navigation ❌ Game-specific

hooks/ (9 hooks) - Custom React Hooks
├── useGameState.ts ✅ Reusable pattern
├── useGameLogic.ts ⚠️ Partially reusable
├── usePuzzle.ts - Puzzle loading ⚠️ Partially reusable
├── useGameModeHandlers.ts ❌ Game-specific
├── useTimer.ts - Timers ✅ Reusable
├── useAudio.ts ✅ Generic
└── Others...

app/ - Next.js Pages
├── page.tsx - Title screen ❌ Game-specific
├── puzzle/page.tsx (450 lines) - Main game ❌ Game-specific
├── library/page.tsx - Progress ❌ Game-specific
└── other pages... ❌ Game-specific

public/data/ - Game Content
├── genreManifest.json
├── *Puzzles.json (4 genre files)
├── dialogue-config.json
├── characters/ (4 character files)
└── story-events/
```

## Recommendations by Priority

### Immediate (This Sprint)
- ✅ Add CODEBASE_ARCHITECTURE.md (DONE)
- Document puzzle data format specification
- Create "How to Add Puzzles" guide

### Short Term (Next Sprint)
- Extract puzzle data format abstraction
- Create PuzzleSelectionStrategy interface
- Add more code comments in complex areas

### Medium Term (Next Quarter)
- Refactor puzzle loader to plugin architecture
- Separate UI from game logic
- Add comprehensive test suite

### Long Term (Next Year)
- Full engine extraction
- Create second game as proof-of-concept
- Release as reusable game engine library

## Key Files to Modify First

1. **lib/game/puzzleLoader.ts** (617 lines)
   - Most impactful change
   - Create abstract loader interface

2. **lib/game/puzzleSelector.ts** (300 lines)
   - Extract selection strategy pattern
   - Make Kethaneum a plugin implementation

3. **lib/dialogue/DialogueManager.ts** (605 lines)
   - Generalize story beat system
   - Abstract character structure

4. **components/** (various)
   - Add presentation layer
   - Decouple from game state

## Conclusion

Chronicles of the Kethaneum is a **well-implemented game with sophisticated systems** (~6,000 lines of clean, type-safe code). The architecture is good for a single game but would require **4-6 weeks of focused refactoring** to become a truly reusable game engine.

The main bottleneck to reusability is **game-specific logic embedded in core files** (puzzle selection, story progression, dialogue). Extracting these into plugin-based systems would unlock the ability to create new games quickly.

**Current reusability: 40% | Potential reusability: 100% | Refactoring effort: 4-6 weeks**

For detailed architecture analysis, see: `docs/CODEBASE_ARCHITECTURE.md`

