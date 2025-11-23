# Story Progress System - Development Plan

## Status: ✅ COMPLETED (Phase 1)

**Branch:** `claude/story-progress-system-01AFdyDreNKR9DLVvx6o2NYN`
**Completion Date:** 2025-11-23
**Commits:** 1ee6487

---

## Overview

The Story Progress System tracks the player's journey through the Kethaneum narrative with unlockable story blurbs that update as they progress. The system provides a configurable trigger mechanism that can be extended for future event system integration.

**Phase 1 (Complete):** Core story progress tracking, Book of Passage integration, placeholder blurbs
**Phase 2 (Planned):** Story Blurb Editor tool for content management
**Phase 3 (Future):** Full event system integration, advanced trigger conditions

---

## What Was Implemented

### 1. Core Files Created

#### `lib/story/types.ts`
- **Purpose:** Type definitions for the story progress system
- **Location:** `/lib/story/types.ts`
- **Exports:**
  - `StoryBlurb` interface - Individual story entries
  - `StoryTrigger` type - Configurable trigger types
  - `StoryProgressState` interface - Player's story progress tracking
  - `TriggerCondition` interface - Extensible trigger configuration
  - `DEFAULT_STORY_PROGRESS` constant - Initial state

**Key Types:**
```typescript
interface StoryBlurb {
  id: string;              // Unique identifier
  storyBeat: StoryBeat;    // Which story beat this belongs to
  trigger: StoryTrigger;   // What unlocks this blurb
  title: string;           // Display title
  text: string;            // Narrative content
  order: number;           // Sort order within beat
  conditions?: TriggerCondition[];  // Advanced conditions
  metadata?: { author?: string; lastUpdated?: string; tags?: string[] };
}

type StoryTrigger =
  | 'game_start'
  | 'first_book_discovered'
  | 'first_puzzle_complete'
  | 'first_book_complete'
  | 'books_discovered_5' | 'books_discovered_10' | 'books_discovered_25' | ...
  | 'puzzles_complete_10' | 'puzzles_complete_25' | ...
  | 'kethaneum_genre_revealed'
  | 'kethaneum_first_puzzle'
  | 'kethaneum_book_complete'
  | 'story_beat_first_plot_point' | 'story_beat_midpoint' | ...
  | `custom_${string}`;  // Extensible for future events
```

#### `lib/story/storyProgressManager.ts`
- **Purpose:** Core singleton manager for story progression
- **Location:** `/lib/story/storyProgressManager.ts`
- **Features:**
  - Loads blurbs from JSON file
  - Checks trigger conditions against game state
  - Manages blurb unlocking and history
  - Caches blurbs for efficient lookup
  - Supports story beat progression

**Key Methods:**
```typescript
class StoryProgressManager {
  async loadBlurbs(): Promise<void>;
  isLoaded(): boolean;
  getBlurbById(id: string): StoryBlurb | null;
  getBlurbsForTrigger(trigger: StoryTrigger): StoryBlurb[];
  getBlurbForTrigger(trigger, currentBeat, firedTriggers): StoryBlurb | null;
  checkTriggerConditions(state, previousState?): TriggerCheckResult;
  unlockBlurb(blurbId, currentProgress): StoryProgressState;
  advanceStoryBeat(currentProgress, newBeat): StoryProgressState;
  getCurrentBlurb(storyProgress): StoryBlurb | null;
  getStoryHistory(storyProgress): StoryBlurb[];
  hasStoryHistory(storyProgress): boolean;
  initializeProgress(): StoryProgressState;
}
```

#### `lib/story/index.ts`
- **Purpose:** Module barrel export
- **Exports:** All types and the singleton manager

#### `hooks/useStoryProgress.ts`
- **Purpose:** React hook for components
- **Location:** `/hooks/useStoryProgress.ts`
- **Features:**
  - Loads story blurbs on mount
  - Provides current blurb and history
  - Exposes trigger checking utilities
  - Initialization helpers for new games

**Hook Interface:**
```typescript
interface UseStoryProgressResult {
  isReady: boolean;
  currentBlurb: StoryBlurb | null;
  storyHistory: StoryBlurb[];
  hasHistory: boolean;
  currentStoryBeat: StoryBeat;
  checkTriggers: (state, previousState?) => StoryProgressState | null;
  unlockBlurb: (blurbId, currentProgress) => StoryProgressState;
  advanceStoryBeat: (currentProgress, newBeat) => StoryProgressState;
  initializeProgress: () => StoryProgressState;
  getBlurbById: (id) => StoryBlurb | null;
}
```

#### `public/data/story-progress.json`
- **Purpose:** Story blurbs data file
- **Location:** `/public/data/story-progress.json`
- **Format:** JSON with blurbs array and trigger configuration

**Structure:**
```json
{
  "version": 1,
  "triggerConfig": {
    "allowMultiplePerTrigger": false,
    "defaultStoryBeat": "hook",
    "milestones": {
      "booksDiscovered": [5, 10, 25, 50, 100],
      "puzzlesComplete": [10, 25, 50, 100],
      "booksComplete": [5, 10, 25]
    }
  },
  "blurbs": [
    {
      "id": "intro_001",
      "storyBeat": "hook",
      "trigger": "game_start",
      "title": "A New Beginning",
      "text": "The pages of your Book of Passage shimmer...",
      "order": 1,
      "metadata": { "tags": ["introduction", "opening"] }
    }
    // ... more blurbs
  ]
}
```

### 2. Modified Files

#### `lib/game/state.ts`
- **Changes:**
  - Added `storyProgress: StoryProgressState` to `GameState` interface
  - Added `storyProgress` to `baseState` with defaults
  - Added `storyProgress` initialization in `initializeGameState()`
  - Added `storyProgress` restoration in `restoreGameState()`

#### `hooks/useGameState.ts`
- **Changes:**
  - Added `storyProgress` to save state hash for change detection
  - Story progress now auto-saves with other game state

#### `hooks/useGameModeHandlers.ts`
- **Changes:**
  - Imported `storyProgressManager`
  - Added trigger checking in `handleWin()` for Story Mode
  - Updates `storyProgress` when triggers fire

#### `app/book-of-passage/page.tsx`
- **Changes:**
  - Added imports for `useStoryProgress`, `useInitializeStoryProgress`, `storyProgressManager`
  - Added three-tab structure: Current Story, Story History, Discovered Books
  - Dynamic "Your Current Journey" section using current blurb
  - Story History tab (hidden until first unlock) with scrolling list
  - Auto-initialization of first blurb on page load

#### `app/book-of-passage/book-of-passage.module.css`
- **Changes:**
  - Added `.blurbTitle` - Story blurb title styling
  - Added `.storyBeatIndicator` - Story beat badge
  - Added `.storyHistoryList` - History container
  - Added `.historyEntry` - Individual history entry
  - Added `.historyEntryHeader`, `.historyEntryNumber`, `.historyEntryTitle`
  - Added `.historyEntryText`, `.historyEntryMeta`, `.historyEntryBeat`
  - Added `.noHistory` - Empty state message
  - Added responsive styles for mobile

---

## How It Works

### Story Progression Flow

```
Player completes puzzle
    ↓
handleWin() called in useGameModeHandlers
    ↓
checkTriggerConditions(state) compares state to trigger conditions
    ↓
Trigger matched? → getBlurbForTrigger() returns blurb
    ↓
unlockBlurb(blurbId, state) updates storyProgress:
  - Adds blurbId to unlockedBlurbs array
  - Sets currentBlurbId
  - Records trigger in firedTriggers
  - Updates lastUpdated timestamp
    ↓
setState() updates GameState with new storyProgress
    ↓
Auto-save triggers (via useGameState)
    ↓
Book of Passage shows new "Current Journey" blurb
    ↓
Previous blurb visible in "Story History" tab
```

### Trigger System

**Milestone Triggers:**
- `first_book_discovered` - First book added to discoveredBooks
- `books_discovered_N` - N books discovered (5, 10, 25, 50, 100)
- `puzzles_complete_N` - N puzzles completed (10, 25, 50, 100)
- `books_complete_N` - N books fully completed (5, 10, 25)

**Event Triggers:**
- `game_start` - First time viewing Book of Passage
- `first_puzzle_complete` - First puzzle solved
- `first_book_complete` - First book fully completed
- `kethaneum_genre_revealed` - Kethaneum genre unlocked
- `kethaneum_first_puzzle` - First Kethaneum puzzle started
- `kethaneum_book_complete` - Kethaneum book completed

**Story Beat Triggers:**
- `story_beat_first_plot_point`
- `story_beat_first_pinch_point`
- `story_beat_midpoint`
- `story_beat_second_pinch_point`
- `story_beat_second_plot_point`
- `story_beat_climax`
- `story_beat_resolution`

### Story Beat System

The 8-beat structure follows classic narrative arc:

1. **Hook** - Introduction, early discoveries (order 1-9)
2. **First Plot Point** - Kethaneum revealed, patterns emerge (order 10-19)
3. **First Pinch Point** - Mystery deepens, tension rises (order 20-29)
4. **Midpoint** - Major milestone, turning point (order 30-39)
5. **Second Pinch Point** - Stakes raised, danger revealed (order 40-49)
6. **Second Plot Point** - Final preparation, all pieces in place (order 50-59)
7. **Climax** - Confrontation with main challenge (order 60-69)
8. **Resolution** - Victory, new beginning (order 70+)

---

## Technical Details

### File Locations

```
Chronicles-of-the-kethaneum/
├── app/
│   └── book-of-passage/
│       ├── page.tsx                    # Modified: 3 tabs, dynamic content
│       └── book-of-passage.module.css  # Modified: History styles
├── hooks/
│   ├── useStoryProgress.ts            # New: React hook
│   ├── useGameState.ts                # Modified: Save detection
│   └── useGameModeHandlers.ts         # Modified: Trigger checking
├── lib/
│   ├── game/
│   │   └── state.ts                   # Modified: storyProgress field
│   └── story/
│       ├── index.ts                   # New: Module exports
│       ├── types.ts                   # New: Type definitions
│       └── storyProgressManager.ts    # New: Core manager
└── public/
    └── data/
        └── story-progress.json        # New: Blurbs data
```

### TypeScript Interfaces

```typescript
interface StoryProgressState {
  currentBlurbId: string;       // Currently displayed blurb
  unlockedBlurbs: string[];     // All unlocked blurb IDs (in order)
  currentStoryBeat: StoryBeat;  // Current narrative beat
  lastUpdated: number;          // Timestamp of last update
  firedTriggers: StoryTrigger[]; // Triggers already processed
}

interface TriggerCheckResult {
  shouldTrigger: boolean;
  trigger: StoryTrigger | null;
  blurb: StoryBlurb | null;
}
```

---

## How to Update Story Content

### Simple Blurb Edit

1. Open `public/data/story-progress.json`
2. Find the blurb by `id`
3. Edit `title` or `text`
4. Save and refresh

### Adding a New Blurb

```json
{
  "id": "unique_blurb_id",
  "storyBeat": "hook",
  "trigger": "first_book_discovered",
  "title": "Blurb Title",
  "text": "The narrative text for this blurb...",
  "order": 5,
  "metadata": {
    "tags": ["discovery", "milestone"]
  }
}
```

### Adding a Custom Trigger

1. Add the trigger type to `StoryTrigger` in `lib/story/types.ts`
2. Add condition checking logic in `storyProgressManager.checkTriggerConditions()`
3. Create blurbs using that trigger in `story-progress.json`

---

## Future Enhancement Ideas

### Phase 2: Story Blurb Editor Tool

**Location:** `/tools/story-blurb-editor`

**Features:**
- Visual editor for story blurbs
- Trigger configuration UI
- Story beat organization
- Live preview of blurb display
- Drag-and-drop reordering
- JSON export and save

### Phase 3: Full Event System Integration

**Planned Features:**
- Event listeners for custom game events
- Dynamic trigger registration
- Conditional logic builder
- Event chaining and sequences
- Debug/testing panel

### Additional Ideas

1. **Story Beat Visualization** - Timeline view of player progress
2. **Blurb Animations** - Fade-in effects when new blurbs unlock
3. **Audio Integration** - Sound effects for story moments
4. **Character Dialogue Ties** - Link blurbs to dialogue system
5. **Achievement Integration** - Unlock achievements with blurbs
6. **Player Stats Tracking** - Record when blurbs were unlocked
7. **A/B Testing Support** - Multiple blurb variants for testing

---

## Testing Recommendations

### Manual Testing Checklist

- [ ] Book of Passage loads without errors
- [ ] "Current Story" tab shows initial blurb or fallback
- [ ] Story History tab hidden when no history
- [ ] Complete first puzzle → new blurb unlocks
- [ ] Story History tab appears after unlock
- [ ] History shows blurbs in correct order
- [ ] Progress saves and restores correctly
- [ ] Discovered Books tab still works
- [ ] Tab switching works smoothly
- [ ] Mobile responsive layout correct

### Test Scenarios

1. **New Game Flow:**
   - Start fresh (clear localStorage)
   - Open Book of Passage
   - Verify "game_start" blurb appears
   - Check Story History tab visible

2. **Puzzle Completion:**
   - Complete first puzzle
   - Open Book of Passage
   - Verify "first_puzzle_complete" blurb unlocked
   - Check history has both blurbs

3. **Save/Restore:**
   - Unlock several blurbs
   - Refresh page
   - Verify all blurbs still in history
   - Current blurb correct

---

## Security Considerations

✅ **Safe:** Content loaded via fetch (no eval)
✅ **Safe:** No user-generated content
✅ **Safe:** Blurbs rendered through React (XSS protected)
✅ **Safe:** Trigger logic server-controlled

---

## Credits & Notes

**Developed By:** Claude (Anthropic)
**Requested By:** SheDreamsWithAIs
**Repository:** https://github.com/SheDreamsWithAIs/Chronicles-of-the-kethaneum

**Design Decisions:**
- JSON format for easy non-developer editing
- Trigger system designed for extensibility
- Story beat structure follows proven narrative arc
- Singleton pattern for manager ensures consistent state
- History stored as ID array for compact saves

**Future-Proofing:**
- Custom trigger types supported via template literals
- Conditions array allows complex trigger logic
- Metadata field for analytics/tagging
- Version field in data for migrations

---

## Quick Start for Continuation

If you need to continue this work:

1. **Review the implementation:**
   - `/lib/story/types.ts` for type definitions
   - `/lib/story/storyProgressManager.ts` for core logic
   - `/hooks/useStoryProgress.ts` for React integration

2. **Test the system:**
   - Edit `/public/data/story-progress.json`
   - Run `npm run dev`
   - Navigate to `/book-of-passage`
   - Complete puzzles to see triggers fire

3. **Extend as needed:**
   - Add new triggers in `types.ts` and `storyProgressManager.ts`
   - Add new blurbs in `story-progress.json`
   - Update UI in `page.tsx` for new features
