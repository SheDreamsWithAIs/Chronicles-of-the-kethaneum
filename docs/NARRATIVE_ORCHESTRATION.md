# Narrative Orchestration System

## Overview

The Narrative Orchestration System coordinates three interconnected narrative subsystems to create natural pacing and prevent narrative overwhelm:

1. **Story Events** - Character dialogue sequences that unlock based on progress thresholds
2. **Kethaneum Puzzles** - Special narrative puzzles woven into regular gameplay
3. **Book of Passage Blurbs** - Short narrative moments triggered by specific events

These systems work together through a **debt-based gating mechanism** that ensures players engage with story content before advancing to more Kethaneum puzzles.

---

## Core Concepts

### Story Event Debt

**Debt** tracks how many story events are unlocked but not yet completed:
- When a story event unlocks → debt increases by 1
- When a story event completes → debt decreases by 1
- When debt ≥ 2 → Kethaneum puzzles are blocked

This creates gentle pressure to complete story events without forcing them immediately.

### Sequential Unlocking

Story events unlock **one at a time** in sequential order when thresholds are met. A player cannot unlock event #3 until they've unlocked events #1 and #2.

### Kethaneum Weaving

Kethaneum puzzles are automatically inserted every 5-7 regular puzzles (configurable), providing narrative beats that deepen the world-building.

---

## How It Works

### 1. Story Event Unlocking

Story events unlock based on **two counters**:
- `kethaneumPuzzlesCompleted` - How many Kethaneum puzzles completed
- Normal puzzles completed - Tracked separately from Kethaneum puzzles

**Configuration** (`lib/narrative/storyEventConfig.ts`):

```typescript
export const STORY_EVENT_UNLOCK_REQUIREMENTS: StoryEventUnlockRequirement[] = [
  {
    eventId: "first-visit",
    requiredKethaneumPuzzles: 0,
    requiredNormalPuzzles: 0,
    order: 1  // Tutorial event, unlocks immediately
  },
  {
    eventId: "second-encounter",
    requiredKethaneumPuzzles: 1,  // After 1st Kethaneum
    requiredNormalPuzzles: 7,     // After 7 normal puzzles
    order: 2
  },
  {
    eventId: "pattern-recognition",
    requiredKethaneumPuzzles: 2,  // After 2nd Kethaneum
    requiredNormalPuzzles: 15,    // After 15 normal puzzles
    order: 3
  }
];
```

### 2. Kethaneum Gating

When `storyEventDebt >= 2`, the system:
- ✅ Continues selecting regular genre puzzles normally
- ❌ Skips Kethaneum puzzle insertion
- 💬 Shows narrative debt messages in win modal

**Messages** (configurable in `storyEventConfig.ts`):
- **debt = 1**: "Something is drawing you to seek out other information..."
- **debt ≥ 2**: "The energy of the Kethaneum feels urgent like it is drawing your attention elsewhere."

### 3. Book of Passage Blurbs

Blurbs unlock based on specific triggers:

**Built-in Triggers**:
- `game_start` - When game initializes
- `first_book_discovered` - First book completed
- `books_discovered_5` - 5th book discovered
- `puzzles_complete_10` - 10th puzzle completed
- etc.

**Custom Triggers** (for narrative orchestration):
- `custom_story_event_{eventId}` - When specific story event completes
- `custom_kethaneum_milestone_{count}` - When Nth Kethaneum completes

**Configuration** (`/public/data/config/book-of-passage-blurb-config.json`):

```json
{
  "blurbs": [
    {
      "id": "intro_001",
      "trigger": "game_start",
      "title": "The Book of Passage",
      "text": "...",
      "order": 1
    },
    {
      "id": "first_kethaneum_reflection",
      "trigger": "custom_kethaneum_milestone_1",
      "title": "The Kethaneum's Pull",
      "text": "...",
      "order": 2
    },
    {
      "id": "after_second_encounter",
      "trigger": "custom_story_event_second-encounter",
      "title": "Patterns Emerge",
      "text": "...",
      "order": 3
    }
  ]
}
```

---

## State Tracking

The system maintains state in `narrativeOrchestration`:

```typescript
interface NarrativeOrchestrationState {
  kethaneumPuzzlesCompleted: number;      // Counter for Kethaneum puzzles
  storyEventDebt: number;                  // Unlocked but incomplete events
  storyEventsCompleted: number;            // Total completed
  unlockedStoryEvents: string[];           // Currently unlocked event IDs
  completedStoryEvents: string[];          // Completed event IDs
  lastStoryEventUnlocked: string | null;   // Most recent unlock
}
```

This state is:
- ✅ Saved to localStorage automatically
- ✅ Restored on page load
- ✅ Updated during puzzle completion

---

## Integration Points

### When Puzzle Completes (Story Mode)

The system runs in this order:

1. **Mark puzzle as completed**
2. **If Kethaneum puzzle**:
   - Increment `kethaneumPuzzlesCompleted`
   - Reset `puzzlesSinceLastKethaneum` to 0
3. **If normal puzzle**:
   - Increment `puzzlesSinceLastKethaneum`
4. **Check for story event unlock**:
   - Compare thresholds in `STORY_EVENT_UNLOCK_REQUIREMENTS`
   - If met and not already unlocked → unlock next sequential event
   - Increment debt
   - Trigger dialogue event
5. **Check for Book of Passage blurb triggers**:
   - Check if puzzle completion triggers any blurbs
   - Check if Kethaneum milestone triggers any blurbs
6. **Show win modal** with narrative debt messages (if applicable)

### When Story Event Completes

1. **Decrement debt**
2. **Move event from unlocked to completed**
3. **Check for Book of Passage blurb**:
   - Look for `custom_story_event_{eventId}` trigger
   - Unlock blurb if configured
4. **Clear Library notification** if no events remain

### When Selecting Next Puzzle

1. **Check if Kethaneum should be inserted**:
   - `puzzlesSinceLastKethaneum >= nextKethaneumInterval`
2. **Check debt counter**:
   - If `debt >= 2` → skip Kethaneum, select regular genre
   - If `debt < 2` → insert Kethaneum puzzle

---

## Configuration Files

### 1. Story Event Requirements
**Location**: `lib/narrative/storyEventConfig.ts`
**Purpose**: Define unlock thresholds and debt configuration

```typescript
export const STORY_EVENT_UNLOCK_REQUIREMENTS: StoryEventUnlockRequirement[] = [
  // Array of requirements with thresholds
];

export const DEFAULT_NARRATIVE_CONFIG: NarrativeOrchestrationConfig = {
  kethaneumPuzzleInterval: { min: 5, max: 7 },
  storyEventDebtThreshold: 2,
  enableMessaging: true,
  messageTypes: {
    debtOne: "Message for debt = 1",
    debtThreshold: "Message for debt >= 2"
  }
};
```

### 2. Book of Passage Blurbs
**Location**: `/public/data/config/book-of-passage-blurb-config.json`
**Purpose**: Define narrative blurbs and their triggers

```json
{
  "version": 1,
  "triggerConfig": {
    "allowMultiplePerTrigger": false,
    "defaultStoryBeat": "hook"
  },
  "blurbs": [
    // Array of blurb objects
  ]
}
```

### 3. Kethaneum Puzzle Interval
**Location**: `lib/game/puzzleSelectionConfig.ts`
**Purpose**: Control how often Kethaneum puzzles appear

```typescript
export const defaultPuzzleSelectionConfig: PuzzleSelectionConfig = {
  minPuzzlesBeforeKethaneum: 5,
  maxPuzzlesBeforeKethaneum: 7,
  kethaneumGenreName: 'Kethaneum',
};
```

---

## Player Experience

### Example Flow

1. **Start game**:
   - First story event (`first-visit`) unlocks immediately (debt = 1)
   - "The Book of Passage" blurb unlocks (`game_start` trigger)

2. **Complete 5 normal puzzles**:
   - No events unlock yet (threshold not met)
   - No debt changes

3. **Complete 1st Kethaneum puzzle**:
   - `kethaneumPuzzlesCompleted` = 1
   - Still need more normal puzzles for next event
   - "The Kethaneum's Pull" blurb unlocks

4. **Complete 7th normal puzzle**:
   - Second story event unlocks (1 Keth + 7 normal met)
   - Debt increases to 2
   - Win modal shows: "The energy of the Kethaneum feels urgent..."
   - Kethaneum puzzles now blocked

5. **Complete first story event**:
   - Debt decreases to 1
   - Win modal shows: "Something is drawing you to seek..."
   - Kethaneum puzzles still blocked (debt still > 0)

6. **Complete second story event**:
   - Debt decreases to 0
   - Kethaneum puzzles unblocked
   - Blurb unlocks for completing that event

7. **Continue gameplay**:
   - After 5-7 more normal puzzles → 2nd Kethaneum appears
   - Pattern continues with higher thresholds

---

## Debugging

### Console Helpers

Call `debugNarrative()` in browser console to inspect state:

```javascript
debugNarrative()
// Outputs:
// === Narrative Orchestration Debug ===
// Kethaneum Puzzles Completed: 2
// Story Event Debt: 1
// Story Events Completed: 3
// Unlocked Events: ['event-4']
// Completed Events: ['first-visit', 'second-encounter', 'pattern-recognition']
// ---
// Puzzles Since Last Kethaneum: 3
// Next Kethaneum Interval: 6
// Total Completed Puzzles: 18
// Current Genre: Fantasy
```

### Common Issues

**Q: Kethaneum puzzles stopped appearing**
A: Check debt counter. If debt ≥ 2, complete story events to reduce debt.

**Q: Story event won't unlock**
A: Check both counters. Event requires BOTH Kethaneum count AND normal puzzle count thresholds to be met, AND all previous events must be unlocked.

**Q: Book of Passage notification showing but no new content**
A: Likely `game_start` blurb triggering. This is expected on first visit.

---

## Design Rationale

### Why Debt Instead of Forcing Events?

The debt system creates **soft pressure** rather than hard gates:
- Players can skip story events temporarily if desired
- But continued skipping naturally blocks progression
- Creates incentive without removing agency

### Why Sequential Unlocking?

Prevents narrative chaos:
- Story events follow intended plot order
- Players can't accidentally skip crucial narrative beats
- Makes writing coherent story arcs manageable

### Why Gate Kethaneum Puzzles?

Kethaneum puzzles often contain major narrative revelations. Gating ensures:
- Players experience story events in context
- Narrative pacing remains coherent
- High-impact moments don't get lost in gameplay

---

## For Content Creators

### Adding a New Story Event

1. Create the story event JSON file in `/public/data/story-events/`
2. Add entry to `STORY_EVENT_UNLOCK_REQUIREMENTS` in `storyEventConfig.ts`:
   ```typescript
   {
     eventId: "your-event-id",
     requiredKethaneumPuzzles: 3,
     requiredNormalPuzzles: 22,
     order: 4  // Next in sequence
   }
   ```
3. (Optional) Add Book of Passage blurb that triggers after completion:
   ```json
   {
     "id": "after_your_event",
     "trigger": "custom_story_event_your-event-id",
     "title": "...",
     "text": "..."
   }
   ```

### Adding a Kethaneum Milestone Blurb

Add to `book-of-passage-blurb-config.json`:

```json
{
  "id": "third_kethaneum",
  "trigger": "custom_kethaneum_milestone_3",
  "title": "Deeper Understanding",
  "text": "..."
}
```

This unlocks after the player completes their 3rd Kethaneum puzzle.

---

## Related Documentation

- **[Story Progression Quickstart](./STORY_PROGRESSION_QUICKSTART.md)** - Story beat advancement system
- **[Notification System Guide](./NOTIFICATION-SYSTEM-GUIDE.md)** - Book of Passage and Library notifications
- **[Dialogue System](./diagrams/dialogue-system.md)** - Character dialogue and story events
- **[Design Document](../development-plans/implemented/NARRATIVE_ORCHESTRATION_DESIGN.md)** - Full system design and rationale
