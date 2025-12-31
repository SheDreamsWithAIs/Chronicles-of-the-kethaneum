# Narrative Orchestration System - Design Document

## Overview

This document describes the unified narrative orchestration system that coordinates three narrative subsystems: **Kethaneum Puzzles**, **Story Events**, and **Book of Passage Blurbs**. The design creates natural pacing and prevents narrative overwhelm while maintaining coherence.

---

## Current State Analysis

### Existing Systems

| System | Current Implementation | Trigger Logic | State Tracking |
|--------|----------------------|---------------|----------------|
| **Kethaneum Puzzles** | `puzzleSelector.ts:selectNextPuzzle()` | Every 2-5 normal puzzles (random) | `puzzlesSinceLastKethaneum`, `nextKethaneumInterval` |
| **Story Events** | `StoryEventTriggerChecker.ts` | Milestone-based (puzzle count milestones, first-time events) | Tracked in `DialogueManager` |
| **Book of Passage** | `storyBlurbManager.ts` | Event-based triggers (game events, milestones) | `unlockedBlurbs`, `firedTriggers` |

### Integration Point

All three systems are currently called in `useGameModeHandlers.handleWin()` after puzzle completion:
```typescript
// Line 135-194 in useGameModeHandlers.ts
1. markPuzzleCompleted()
2. Update puzzlesSinceLastKethaneum
3. Check & unlock story blurbs
4. Check story events (via StoryEventTriggerChecker)
5. Show stats modal
```

---

## Design Goals

1. **Orderly Progression**: Clear dependency chain prevents narrative chaos
2. **Natural Pacing**: Players don't feel overwhelmed by multiple narrative threads
3. **Backpressure System**: Debt counter ensures story events are completed before advancing
4. **Narrative Coherence**: Sequential story events maintain plot flow
5. **Player Agency**: Flexible Book of Passage triggers allow narrative flexibility
6. **Non-Breaking**: Preserve existing Kethaneum orchestration pattern

---

## New Orchestration Flow

### Dependency Hierarchy

```
Normal Puzzles (player controlled)
    ↓
Kethaneum Puzzles (gated by debt counter)
    ↓
Story Events (unlocked by thresholds)
    ↓
Book of Passage Blurbs (triggered by events)
```

### Flow Diagram

```
Player completes puzzle
    ↓
Is this a Kethaneum puzzle? → NO → Increment puzzlesSinceLastKethaneum
    ↓ YES                              ↓
Increment kethaneumPuzzlesCompleted    Check Story Event unlock thresholds
    ↓                                   ↓
    └──────────────────────────────────┘
                    ↓
    Did a Story Event unlock? → NO → Check Book of Passage triggers
                    ↓ YES              ↓
        Increment storyEventDebt       Display appropriate modal
                    ↓
        Show "Something vies for attention" message
                    ↓
        Enable Story Event UI glow/pulse
```

---

## Core Components

### 1. Story Event Unlock System

#### State Addition (to `GameState`)

```typescript
interface GameState {
  // ... existing fields

  // NEW: Story event orchestration
  narrativeOrchestration: {
    kethaneumPuzzlesCompleted: number;      // Total Kethaneum puzzles completed
    storyEventDebt: number;                 // Unlocked but uncompleted events
    storyEventsCompleted: number;           // Total story events completed
    unlockedStoryEvents: string[];          // IDs of unlocked but uncompleted events
    completedStoryEvents: string[];         // IDs of completed events
    lastStoryEventUnlocked: string | null;  // Most recently unlocked event ID
  };
}
```

#### Story Event Configuration

**Location**: `/lib/narrative/storyEventConfig.ts` (NEW FILE)

```typescript
export interface StoryEventUnlockRequirement {
  eventId: string;                    // Matches story-events/*.json id
  requiredKethaneumPuzzles: number;   // Kethaneum puzzle count threshold
  requiredNormalPuzzles: number;      // Normal puzzle count threshold
  order: number;                      // Sequential ordering (1, 2, 3...)
}

export const STORY_EVENT_UNLOCK_REQUIREMENTS: StoryEventUnlockRequirement[] = [
  {
    eventId: "first-visit",
    requiredKethaneumPuzzles: 1,
    requiredNormalPuzzles: 7,
    order: 1
  },
  {
    eventId: "first-kethaneum-puzzle",
    requiredKethaneumPuzzles: 2,
    requiredNormalPuzzles: 10,
    order: 2
  },
  // ... more events defined here
];

export interface NarrativeOrchestrationConfig {
  kethaneumPuzzleInterval: {
    min: number;                      // Minimum puzzles between Kethaneum (5)
    max: number;                      // Maximum puzzles between Kethaneum (7)
  };
  storyEventDebtThreshold: number;    // Max uncompleted events before gating (2)
  enableMessaging: boolean;           // Show debt messages in win modal
  messageTypes: {
    debtZero: string;                 // "Something important vies for your attention"
    debtOne: string;                  // "Something is drawing you to seek..."
    debtThreshold: string;            // "The energy of the Kethaneum feels urgent..."
  };
}

export const DEFAULT_NARRATIVE_CONFIG: NarrativeOrchestrationConfig = {
  kethaneumPuzzleInterval: {
    min: 5,
    max: 7
  },
  storyEventDebtThreshold: 2,
  enableMessaging: true,
  messageTypes: {
    debtZero: "Something important vies for your attention",
    debtOne: "Something is drawing you to seek out other information",
    debtThreshold: "The energy of the Kethaneum feels urgent, yet you feel a stagnation. Perhaps you should look elsewhere for answers."
  }
};
```

### 2. Enhanced Puzzle Selector

#### Modifications to `puzzleSelector.ts`

**New Logic in `selectNextPuzzle()`**:

```typescript
export function selectNextPuzzle(state: GameState): PuzzleSelectionResult | null {
  // ... existing setup code

  const { narrativeOrchestration } = state;
  const config = DEFAULT_NARRATIVE_CONFIG; // or load from state

  // NEW: Check if Kethaneum puzzles are blocked by story event debt
  const kethaneumBlocked = narrativeOrchestration.storyEventDebt >= config.storyEventDebtThreshold;

  // Existing Kethaneum timing check
  const isTimeForKethaneum = state.puzzlesSinceLastKethaneum >= state.nextKethaneumInterval;

  if (isTimeForKethaneum && !kethaneumBlocked) {
    // Proceed with Kethaneum puzzle selection (existing logic)
    return selectKethaneumPuzzle(state);
  } else if (isTimeForKethaneum && kethaneumBlocked) {
    // NEW: Kethaneum puzzle wanted but blocked - select normal puzzle instead
    // The counter keeps incrementing, so when debt clears, Kethaneum will immediately trigger
    return selectGenrePuzzle(state);
  } else {
    // Normal puzzle selection (existing logic)
    return selectGenrePuzzle(state);
  }
}
```

**New Config Values** (update `puzzleSelectionConfig.ts`):

```typescript
export const PUZZLE_SELECTION_CONFIG = {
  kethaneumInterval: {
    min: 5,    // Changed from 2
    max: 7     // Changed from 5
  },
  // ... rest of existing config
};
```

### 3. Story Event Unlock Checker

#### New File: `/lib/narrative/storyEventUnlockChecker.ts`

```typescript
import { GameState } from '@/lib/game/state';
import { STORY_EVENT_UNLOCK_REQUIREMENTS } from './storyEventConfig';

export interface StoryEventUnlockResult {
  eventId: string;
  wasUnlocked: boolean;
  reason?: string;
}

/**
 * Checks if any story events should be unlocked based on current puzzle completion.
 * Story events unlock ONE AT A TIME in sequential order.
 *
 * @param state - Current game state
 * @returns The next story event to unlock, or null if none qualify
 */
export function checkStoryEventUnlock(state: GameState): StoryEventUnlockResult | null {
  const {
    completedPuzzles,
    narrativeOrchestration: {
      kethaneumPuzzlesCompleted,
      storyEventsCompleted,
      unlockedStoryEvents,
      completedStoryEvents
    }
  } = state;

  // Calculate normal puzzle count (total - Kethaneum)
  const normalPuzzlesCompleted = completedPuzzles - kethaneumPuzzlesCompleted;

  // Find the next story event in sequence
  const nextEventRequirement = STORY_EVENT_UNLOCK_REQUIREMENTS
    .filter(req => !completedStoryEvents.includes(req.eventId))
    .filter(req => !unlockedStoryEvents.includes(req.eventId))
    .sort((a, b) => a.order - b.order)[0];

  if (!nextEventRequirement) {
    // No more story events to unlock
    return null;
  }

  // Check if requirements are met
  const meetsKethaneumReq = kethaneumPuzzlesCompleted >= nextEventRequirement.requiredKethaneumPuzzles;
  const meetsNormalReq = normalPuzzlesCompleted >= nextEventRequirement.requiredNormalPuzzles;

  if (meetsKethaneumReq && meetsNormalReq) {
    return {
      eventId: nextEventRequirement.eventId,
      wasUnlocked: true
    };
  }

  return null;
}

/**
 * Marks a story event as unlocked (increments debt).
 */
export function unlockStoryEvent(state: GameState, eventId: string): GameState {
  return {
    ...state,
    narrativeOrchestration: {
      ...state.narrativeOrchestration,
      storyEventDebt: state.narrativeOrchestration.storyEventDebt + 1,
      unlockedStoryEvents: [...state.narrativeOrchestration.unlockedStoryEvents, eventId],
      lastStoryEventUnlocked: eventId
    }
  };
}

/**
 * Marks a story event as completed (decrements debt).
 */
export function completeStoryEvent(state: GameState, eventId: string): GameState {
  return {
    ...state,
    narrativeOrchestration: {
      ...state.narrativeOrchestration,
      storyEventDebt: Math.max(0, state.narrativeOrchestration.storyEventDebt - 1),
      unlockedStoryEvents: state.narrativeOrchestration.unlockedStoryEvents.filter(id => id !== eventId),
      completedStoryEvents: [...state.narrativeOrchestration.completedStoryEvents, eventId],
      storyEventsCompleted: state.narrativeOrchestration.storyEventsCompleted + 1
    }
  };
}
```

### 4. Win Modal Messaging System

#### New File: `/lib/narrative/narrativeMessaging.ts`

```typescript
import { GameState } from '@/lib/game/state';
import { DEFAULT_NARRATIVE_CONFIG } from './storyEventConfig';

export interface NarrativeMessage {
  text: string;
  debtLevel: number;
  shouldHighlightStoryEvents: boolean;
  isBlocking: boolean;
}

/**
 * Determines what narrative message to show in the win modal based on story event debt.
 */
export function getNarrativeMessage(state: GameState): NarrativeMessage | null {
  const { narrativeOrchestration } = state;
  const config = DEFAULT_NARRATIVE_CONFIG;

  if (!config.enableMessaging) {
    return null;
  }

  const debt = narrativeOrchestration.storyEventDebt;
  const threshold = config.storyEventDebtThreshold;

  if (debt === 0) {
    // No message needed - player is caught up
    return null;
  } else if (debt === 1) {
    // Soft reminder
    return {
      text: config.messageTypes.debtOne,
      debtLevel: 1,
      shouldHighlightStoryEvents: true,
      isBlocking: false
    };
  } else if (debt >= threshold) {
    // Hard block
    return {
      text: config.messageTypes.debtThreshold,
      debtLevel: debt,
      shouldHighlightStoryEvents: true,
      isBlocking: true
    };
  }

  return null;
}

/**
 * Gets the message to show when a new story event has just been unlocked.
 */
export function getNewStoryEventMessage(state: GameState): NarrativeMessage | null {
  const { narrativeOrchestration } = state;
  const config = DEFAULT_NARRATIVE_CONFIG;

  if (!narrativeOrchestration.lastStoryEventUnlocked) {
    return null;
  }

  return {
    text: config.messageTypes.debtZero,
    debtLevel: narrativeOrchestration.storyEventDebt,
    shouldHighlightStoryEvents: true,
    isBlocking: false
  };
}
```

### 5. Enhanced Win Modal

#### Modifications to `components/GameStatsModal.tsx`

**Add messaging display section**:

```typescript
import { getNarrativeMessage } from '@/lib/narrative/narrativeMessaging';

function GameStatsModal({ /* existing props */ state }: Props) {
  // ... existing modal code

  const narrativeMessage = getNarrativeMessage(state);

  return (
    <Modal>
      {/* Existing stats display */}

      {/* NEW: Narrative messaging section */}
      {narrativeMessage && (
        <div className={`narrative-message ${narrativeMessage.isBlocking ? 'urgent' : 'subtle'}`}>
          <p className="narrative-text">{narrativeMessage.text}</p>

          {narrativeMessage.shouldHighlightStoryEvents && (
            <button
              className="story-events-button glowing-pulse"
              onClick={() => {
                // Navigate to story events view
                // This could be a modal, a page, or a library section
              }}
            >
              View Story Events
            </button>
          )}
        </div>
      )}

      {/* Existing action buttons */}
    </Modal>
  );
}
```

### 6. Integration in Game Handlers

#### Modifications to `hooks/useGameModeHandlers.ts`

**Enhanced `handleWin()` function**:

```typescript
import { checkStoryEventUnlock, unlockStoryEvent } from '@/lib/narrative/storyEventUnlockChecker';

const handleWin = useCallback(() => {
  // ... existing win logic

  // Mark puzzle as completed
  const updatedState = markPuzzleCompleted(state, currentPuzzle);

  // NEW: Track Kethaneum completion
  if (currentPuzzle.genre === 'Kethaneum') {
    updatedState.narrativeOrchestration.kethaneumPuzzlesCompleted += 1;
  }

  // NEW: Check if a story event should unlock
  const unlockResult = checkStoryEventUnlock(updatedState);

  if (unlockResult && unlockResult.wasUnlocked) {
    // Unlock the story event (increments debt)
    const stateWithUnlock = unlockStoryEvent(updatedState, unlockResult.eventId);
    setState(stateWithUnlock);

    // Show notification that new story event is available
    // (message will appear in win modal)
  } else {
    setState(updatedState);
  }

  // Existing: Check blurb triggers
  checkStoryBlurbTriggers(updatedState);

  // Show stats modal (will include narrative messaging)
  setShowStatsModal(true);

}, [state, currentPuzzle]);
```

---

## Book of Passage Integration

### Current System Analysis

**Good News**: The Book of Passage system already has everything needed for event-based triggers!

#### ✅ Already Implemented:

1. **Unique IDs**: Every blurb has a unique `id` field in `/public/data/story-progress.json`
2. **Trigger System**: Blurbs unlock based on configurable `trigger` conditions
3. **Display Order**: Blurbs are stored in `storyProgress.unlockedBlurbs[]` array **in the order they were triggered**
4. **History Function**: `getStoryHistory()` returns blurbs in unlock order (chronological, not by `order` field)
5. **Extensible Triggers**: TypeScript type includes `custom_${string}` pattern for any custom trigger

#### How It Currently Works:

```typescript
// From lib/story/storyBlurbManager.ts
unlockBlurb(blurbId: string, currentProgress: StoryProgressState): StoryProgressState {
  return {
    ...currentProgress,
    currentBlurbId: blurbId,
    unlockedBlurbs: [...currentProgress.unlockedBlurbs, blurbId], // Appends in order
    firedTriggers: [...currentProgress.firedTriggers, blurb.trigger],
    lastUpdated: Date.now(),
  };
}

getStoryHistory(storyProgress: StoryProgressState): StoryBlurb[] {
  const history: StoryBlurb[] = [];
  for (const blurbId of storyProgress.unlockedBlurbs) { // Order preserved
    const blurb = this.getBlurbById(blurbId);
    if (blurb) history.push(blurb);
  }
  return history;
}
```

**Result**: Book of Passage naturally displays blurbs in the order they were unlocked, preserving narrative coherence.

### What We Need to Add

#### 1. New Trigger Types

Use the `custom_` pattern for story event and Kethaneum milestone triggers:

**Story Event Triggers** (format: `custom_story_event_{eventId}`):
- `custom_story_event_first-visit` - Triggers when "first-visit" story event completes
- `custom_story_event_first-kethaneum-puzzle` - Triggers when this event completes
- `custom_story_event_{any-event-id}` - Extensible for any story event

**Kethaneum Milestone Triggers** (format: `custom_kethaneum_milestone_{count}`):
- `custom_kethaneum_milestone_1` - Triggers when 1st Kethaneum puzzle completes
- `custom_kethaneum_milestone_3` - Triggers when 3rd Kethaneum puzzle completes
- `custom_kethaneum_milestone_{n}` - Extensible for any milestone

**Why Use `custom_` Pattern?**
- Already defined in TypeScript: `| 'custom_${string}'`
- No need to update type definitions
- Fully extensible without code changes
- Clear semantic naming

#### 2. Trigger Detection Logic

**Modify**: `/lib/story/storyBlurbManager.ts` - Add to `checkTriggerConditions()`

```typescript
// NEW: Check for story event completions
if (state.narrativeOrchestration) {
  const currentCompleted = state.narrativeOrchestration.completedStoryEvents;
  const previousCompleted = previousState?.narrativeOrchestration?.completedStoryEvents || [];

  if (currentCompleted.length > previousCompleted.length) {
    // Find newly completed event
    const newlyCompleted = currentCompleted.filter(
      id => !previousCompleted.includes(id)
    );

    for (const eventId of newlyCompleted) {
      const trigger = `custom_story_event_${eventId}` as StoryTrigger;
      const result = checkTrigger(trigger);
      if (result) return result;
    }
  }
}

// NEW: Check for Kethaneum puzzle milestones
if (state.narrativeOrchestration) {
  const currentCount = state.narrativeOrchestration.kethaneumPuzzlesCompleted;
  const previousCount = previousState?.narrativeOrchestration?.kethaneumPuzzlesCompleted || 0;

  if (currentCount > previousCount) {
    // Check for milestone trigger at current count
    const trigger = `custom_kethaneum_milestone_${currentCount}` as StoryTrigger;
    const result = checkTrigger(trigger);
    if (result) return result;
  }
}
```

#### 3. Configuration Examples

**Location**: `/public/data/story-progress.json`

```json
{
  "version": 1,
  "triggerConfig": {
    "allowMultiplePerTrigger": false,
    "defaultStoryBeat": "hook"
  },
  "blurbs": [
    {
      "id": "intro_001",
      "storyBeat": "hook",
      "trigger": "game_start",
      "title": "The Book of Passage",
      "text": "The crystalline cover of your Book of Passage...",
      "order": 1
    },
    {
      "id": "after_luminas_warning",
      "storyBeat": "hook",
      "trigger": "custom_story_event_first-visit",
      "title": "A Warning Heeded",
      "text": "Lumina's words echo in your mind as you return to the puzzles. Her protective stance, the urgency in her voice... You feel the weight of her warning pressing against your thoughts.",
      "order": 2
    },
    {
      "id": "first_kethaneum_reflection",
      "storyBeat": "hook",
      "trigger": "custom_kethaneum_milestone_1",
      "title": "The Kethaneum's Pull",
      "text": "Having completed your first Kethaneum puzzle, you feel something shift within you. The library's energy pulses differently now, as if acknowledging your progress.",
      "order": 3
    },
    {
      "id": "third_kethaneum_insight",
      "storyBeat": "first_plot_point",
      "trigger": "custom_kethaneum_milestone_3",
      "title": "Patterns Emerge",
      "text": "Three Kethaneum books completed. The patterns are becoming clearer, the connections between the puzzles revealing something larger...",
      "order": 10
    },
    {
      "id": "after_second_story_event",
      "storyBeat": "first_plot_point",
      "trigger": "custom_story_event_first-kethaneum-puzzle",
      "title": "Understanding Deepens",
      "text": "The revelations from your recent encounter settle into your understanding...",
      "order": 11
    }
  ]
}
```

### Configuration Best Practices

1. **Unique IDs**: Use descriptive, unique IDs for each blurb
2. **Story Beats**: Align blurbs with appropriate story beats
3. **Order Field**: Use for fallback ordering within same story beat (though unlock order is primary)
4. **Trigger Format**: Follow naming conventions:
   - `custom_story_event_{eventId}` for story events
   - `custom_kethaneum_milestone_{count}` for Kethaneum milestones
5. **Testing**: Each trigger should be testable by completing the corresponding action

### Integration Points

The Book of Passage blurbs will trigger **after** puzzle completion in this sequence:

```
1. Player completes puzzle
2. Mark puzzle completed
3. Track Kethaneum completion (if applicable)
4. Check & unlock story event (if thresholds met)
5. Complete story event (when player finishes dialogue)
6. Check Book of Passage triggers ← Story event completion triggers blurb
7. Check Book of Passage triggers ← Kethaneum milestone triggers blurb
8. Display win modal (with any active blurb)
```

### Testing Strategy for Book of Passage

**Test Cases**:
1. Complete story event "first-visit" → Verify `custom_story_event_first-visit` blurb unlocks
2. Complete 1st Kethaneum puzzle → Verify `custom_kethaneum_milestone_1` blurb unlocks
3. Complete 3rd Kethaneum puzzle → Verify `custom_kethaneum_milestone_3` blurb unlocks
4. Verify blurbs appear in Book of Passage in unlock order
5. Verify no duplicate blurb unlocks
6. Verify `firedTriggers` prevents re-triggering same blurb

---

## State Migration

### Initial State Addition

**Location**: `/lib/game/state.ts`

Add to `initializeGameState()`:

```typescript
export function initializeGameState(): GameState {
  return {
    // ... existing initialization

    narrativeOrchestration: {
      kethaneumPuzzlesCompleted: 0,
      storyEventDebt: 0,
      storyEventsCompleted: 0,
      unlockedStoryEvents: [],
      completedStoryEvents: [],
      lastStoryEventUnlocked: null
    }
  };
}
```

### Save/Restore Support

**Location**: `/lib/game/state.ts`

Update `restoreGameState()` to handle new fields:

```typescript
export function restoreGameState(saved: any): GameState {
  // ... existing restoration logic

  narrativeOrchestration: {
    kethaneumPuzzlesCompleted: saved.narrativeOrchestration?.kethaneumPuzzlesCompleted ?? 0,
    storyEventDebt: saved.narrativeOrchestration?.storyEventDebt ?? 0,
    storyEventsCompleted: saved.narrativeOrchestration?.storyEventsCompleted ?? 0,
    unlockedStoryEvents: saved.narrativeOrchestration?.unlockedStoryEvents ?? [],
    completedStoryEvents: saved.narrativeOrchestration?.completedStoryEvents ?? [],
    lastStoryEventUnlocked: saved.narrativeOrchestration?.lastStoryEventUnlocked ?? null
  }
}
```

---

## Implementation Phases with Testing Milestones

**IMPORTANT**: Each phase must pass its testing milestone before proceeding to the next phase. This prevents cascading bugs and makes debugging much easier.

### Phase 1: Core State & Configuration (Foundation)
**Status**: ✅ COMPLETED

**Files Created**:
- `/lib/narrative/types.ts` - NarrativeOrchestrationState type
- `/lib/narrative/storyEventConfig.ts` - Unlock requirements & orchestration config
- `/lib/narrative/storyEventUnlockChecker.ts` - Story event unlock/complete logic

**Files Modified**:
- `/lib/game/state.ts` - Added `narrativeOrchestration` to GameState, save/restore logic
- `/lib/game/puzzleSelectionConfig.ts` - Changed Kethaneum interval to 5-7

**Testing Milestone**:
- [ ] Verify new game initializes with `narrativeOrchestration` at defaults
- [ ] Verify saved game without field initializes to defaults (migration)
- [ ] Verify saved game with field restores correctly
- [ ] Verify TypeScript compiles without errors
- [ ] Verify storyEventConfig validation catches bad configuration

**How to Test**:
```typescript
// In browser console after starting new game:
console.log(gameState.narrativeOrchestration);
// Should show: { kethaneumPuzzlesCompleted: 0, storyEventDebt: 0, ... }
```

---

### Phase 2: Kethaneum Tracking & Debt Gating
**Status**: 🔄 PARTIALLY COMPLETED

**Files Modified**:
- `/lib/game/puzzleSelector.ts` - Added debt gating logic
- `/hooks/useGameModeHandlers.ts` - Track Kethaneum puzzle completions

**Testing Milestone**:
- [ ] Complete 1 Kethaneum puzzle → Verify `kethaneumPuzzlesCompleted` = 1
- [ ] Complete 5-7 normal puzzles → Verify next puzzle is Kethaneum (if debt = 0)
- [ ] Manually set `storyEventDebt` to 2 → Verify Kethaneum blocked, normal puzzle shown
- [ ] Set debt back to 0 → Verify Kethaneum immediately available (counter already met)
- [ ] Verify Kethaneum counter doesn't increment for normal puzzles
- [ ] Verify puzzle counter persists across save/load

**How to Test**:
```typescript
// In browser console:
// 1. Check current state
console.log('Kethaneum count:', gameState.narrativeOrchestration.kethaneumPuzzlesCompleted);
console.log('Debt:', gameState.narrativeOrchestration.storyEventDebt);
console.log('Puzzles since last Kethaneum:', gameState.puzzlesSinceLastKethaneum);

// 2. Manually trigger debt (for testing)
gameState.narrativeOrchestration.storyEventDebt = 2;

// 3. Complete puzzle and verify Kethaneum doesn't appear
```

**STOP HERE AND TEST BEFORE PROCEEDING**

---

### Phase 3: Story Event Unlocking
**Status**: ⏸️ NOT STARTED

**Files to Modify**:
- `/hooks/useGameModeHandlers.ts` - Add story event unlock checking in `handleWin()`

**Implementation Steps**:
1. Import `checkStoryEventUnlock` and `unlockStoryEvent`
2. After tracking Kethaneum completion, call `checkStoryEventUnlock(updatedState)`
3. If event unlocks, call `unlockStoryEvent()` and update state
4. Log unlock events for debugging

**Testing Milestone**:
- [ ] Complete 1 Kethaneum + 7 normal → Verify "first-visit" unlocks
- [ ] Verify `unlockedStoryEvents` contains "first-visit"
- [ ] Verify `storyEventDebt` = 1
- [ ] Verify `lastStoryEventUnlocked` = "first-visit"
- [ ] Complete more puzzles (don't complete event) → Verify event 2 doesn't unlock yet
- [ ] Complete to 2 Kethaneum + 10 normal → Verify "first-kethaneum-puzzle" unlocks
- [ ] Verify `storyEventDebt` = 2
- [ ] Verify only one event unlocked at a time (sequential)

**How to Test**:
```typescript
// Set up test scenario:
gameState.narrativeOrchestration.kethaneumPuzzlesCompleted = 0;
gameState.completedPuzzles = 0;

// Complete 1 Kethaneum + 7 normal (8 total)
// Check:
console.log('Unlocked events:', gameState.narrativeOrchestration.unlockedStoryEvents);
// Should be: ["first-visit"]
console.log('Debt:', gameState.narrativeOrchestration.storyEventDebt);
// Should be: 1
```

**STOP HERE AND TEST BEFORE PROCEEDING**

---

### Phase 4: Story Event Completion
**Status**: ⏸️ NOT STARTED

**Files to Modify**:
- Need to research where story event dialogue completion is handled
- Likely `/lib/dialogue/DialogueManager.ts` or dialogue UI component

**Implementation Steps**:
1. Find where story event dialogue ends (dialogue system review needed)
2. Import `completeStoryEvent` from storyEventUnlockChecker
3. Call `completeStoryEvent(state, eventId)` when dialogue finishes
4. Update game state with returned state
5. Log completion for debugging

**Testing Milestone**:
- [ ] Unlock a story event (debt = 1)
- [ ] Complete the story event dialogue
- [ ] Verify event moved from `unlockedStoryEvents` to `completedStoryEvents`
- [ ] Verify `storyEventDebt` decremented by 1
- [ ] Verify event added to `dialogue.completedStoryEvents` (backwards compat)
- [ ] Verify `storyEventsCompleted` incremented
- [ ] Save and reload → Verify completion persists

**How to Test**:
```typescript
// Before completing dialogue:
console.log('Unlocked:', gameState.narrativeOrchestration.unlockedStoryEvents);
console.log('Completed:', gameState.narrativeOrchestration.completedStoryEvents);
console.log('Debt:', gameState.narrativeOrchestration.storyEventDebt);

// After completing dialogue:
// Unlocked should be empty, Completed should have the event, Debt should decrease
```

**STOP HERE AND TEST BEFORE PROCEEDING**

---

### Phase 5: Win Modal Messaging
**Status**: ⏸️ NOT STARTED

**Files to Create**:
- `/lib/narrative/narrativeMessaging.ts`

**Files to Modify**:
- `/components/GameStatsModal.tsx`

**Implementation Steps**:
1. Create `narrativeMessaging.ts` with `getNarrativeMessage()` function
2. Import and call in GameStatsModal
3. Add conditional rendering for narrative messages
4. Add placeholder styling (doesn't need to be pretty yet)
5. Add console logs to verify messaging logic

**Testing Milestone**:
- [ ] Debt = 0, just unlocked event → Verify "Something vies..." message shows
- [ ] Debt = 1 → Verify "Something is drawing..." message shows
- [ ] Debt = 2 → Verify "The energy feels urgent..." message shows
- [ ] Debt = 0, no recent unlock → Verify no message shows
- [ ] Each message has correct `isBlocking` state
- [ ] Message text matches config

**How to Test**:
```typescript
// Manually set debt levels and complete puzzle:
gameState.narrativeOrchestration.storyEventDebt = 0;
gameState.narrativeOrchestration.lastStoryEventUnlocked = "test-event";
// Complete puzzle, check win modal for message

gameState.narrativeOrchestration.storyEventDebt = 1;
gameState.narrativeOrchestration.lastStoryEventUnlocked = null;
// Complete puzzle, check for different message

gameState.narrativeOrchestration.storyEventDebt = 2;
// Complete puzzle, check for blocking message
```

**STOP HERE AND TEST BEFORE PROCEEDING**

---

### Phase 6: Book of Passage Triggers
**Status**: ⏸️ NOT STARTED

**Files to Modify**:
- `/lib/story/storyBlurbManager.ts` - Add trigger checking logic

**Files to Create/Update**:
- `/public/data/story-progress.json` - Add test blurbs

**Implementation Steps**:
1. Add story event completion checking to `checkTriggerConditions()`
2. Add Kethaneum milestone checking to `checkTriggerConditions()`
3. Create test blurbs in story-progress.json
4. Add console logs for debugging trigger detection

**Testing Milestone**:
- [ ] Complete story event → Verify corresponding blurb triggers
- [ ] Complete 1st Kethaneum → Verify milestone blurb triggers
- [ ] Complete 3rd Kethaneum → Verify milestone blurb triggers
- [ ] Verify blurbs appear in Book of Passage
- [ ] Verify blurbs appear in triggered order
- [ ] Verify no duplicate blurb unlocks
- [ ] Verify `firedTriggers` prevents re-triggering

**How to Test**:
```typescript
// Add test blurb to story-progress.json:
{
  "id": "test_story_event",
  "trigger": "custom_story_event_first-visit",
  "title": "Test",
  "text": "Test blurb",
  "order": 100,
  "storyBeat": "hook"
}

// Complete "first-visit" event, check:
console.log('Unlocked blurbs:', gameState.storyProgress.unlockedBlurbs);
// Should include "test_story_event"
console.log('Fired triggers:', gameState.storyProgress.firedTriggers);
// Should include "custom_story_event_first-visit"
```

**STOP HERE AND TEST BEFORE PROCEEDING**

---

### Phase 7: Integration Testing & Polish
**Status**: ⏸️ NOT STARTED

**Full System Test**:
This phase tests the complete flow end-to-end.

**Test Scenarios**:

1. **Happy Path - Normal Progression**:
   - [ ] Start new game
   - [ ] Complete 1 Kethaneum + 7 normal puzzles
   - [ ] Verify first story event unlocks (debt = 1)
   - [ ] Verify messaging in win modal
   - [ ] Complete story event
   - [ ] Verify debt decreases to 0
   - [ ] Verify Book of Passage blurb unlocks
   - [ ] Continue to 2 Kethaneum + 10 normal
   - [ ] Verify second story event unlocks (debt = 1)
   - [ ] Complete second story event
   - [ ] Verify system returns to normal

2. **Debt Gating Test**:
   - [ ] Unlock 2 story events without completing them (debt = 2)
   - [ ] Complete enough normal puzzles to trigger Kethaneum
   - [ ] Verify Kethaneum is blocked
   - [ ] Verify only normal puzzles available
   - [ ] Complete one story event (debt = 1)
   - [ ] Verify Kethaneum still blocked
   - [ ] Complete second story event (debt = 0)
   - [ ] Verify Kethaneum immediately available

3. **Save/Load Persistence**:
   - [ ] Progress to debt = 1
   - [ ] Save game
   - [ ] Reload page
   - [ ] Verify state restored correctly
   - [ ] Continue gameplay
   - [ ] Verify system works normally

4. **Edge Cases**:
   - [ ] Complete two story events back-to-back (debt 2→1→0)
   - [ ] Verify system handles correctly
   - [ ] Replay completed puzzle
   - [ ] Verify counters don't increment incorrectly

**STOP HERE - SYSTEM COMPLETE**

---

## Edge Cases & Considerations

### 1. Player Completes Two Story Events Back-to-Back
- **Behavior**: Debt goes from 2 → 1 → 0
- **Result**: Kethaneum puzzles immediately available again
- **Implementation**: No special handling needed, debt math handles this

### 2. Player Ignores Story Events Indefinitely
- **Behavior**: After debt reaches threshold, only normal puzzles available
- **Result**: Player cannot progress to higher story events (blocked by Kethaneum requirement)
- **Implementation**: Working as intended - soft forcing function

### 3. Story Event Unlocks During Kethaneum Puzzle Completion
- **Behavior**: Kethaneum completion increments Kethaneum count, triggers unlock check
- **Result**: Debt increases, next Kethaneum might be blocked
- **Implementation**: Player sees message immediately after the Kethaneum puzzle that unlocked the event

### 4. Saved Game from Before Update
- **Behavior**: Missing `narrativeOrchestration` field
- **Result**: Initialized to defaults (0 debt, 0 events, 0 Kethaneum)
- **Implementation**: May cause story event 1 to unlock "early" based on existing progress
- **Mitigation**: Could add migration logic to estimate Kethaneum count from completed puzzles

### 5. Player Replays Genre (Genre Completion Modal)
- **Behavior**: Completing repeated puzzles doesn't increment counts again
- **Result**: No impact on narrative orchestration
- **Implementation**: `markPuzzleCompleted()` already deduplicates via Set

---

## Configuration Examples

### Conservative Pacing (Slower Story)
```typescript
{
  kethaneumPuzzleInterval: { min: 6, max: 9 },
  storyEventDebtThreshold: 1,  // Block earlier
  // Story events unlock less frequently
}
```

### Aggressive Pacing (Faster Story)
```typescript
{
  kethaneumPuzzleInterval: { min: 3, max: 5 },
  storyEventDebtThreshold: 3,  // Allow more accumulation
  // Story events unlock more frequently
}
```

### Debug/Testing Mode
```typescript
{
  kethaneumPuzzleInterval: { min: 1, max: 2 },
  storyEventDebtThreshold: 5,
  enableMessaging: true,
  // Fast unlocks for testing flow
}
```

---

## Future Enhancements

### Potential Additions (Out of Scope for V1)

1. **Dynamic Interval Adjustment**
   - Adjust Kethaneum interval based on player completion rate
   - Faster players get more frequent Kethaneum puzzles

2. **Story Event Hints**
   - If player stuck on story event, provide in-game hints
   - Track time since unlock, offer help after threshold

3. **Narrative Analytics**
   - Track time between story events
   - Identify players who ignore story vs engage heavily
   - Adjust pacing dynamically

4. **Multiple Story Threads**
   - Parallel story arcs with independent debt counters
   - Player chooses which thread to follow

5. **Story Event Replayability**
   - Allow replaying completed story events from library
   - Doesn't affect debt or progression

---

## Success Metrics

### Quantitative
- Story event completion rate (% of players who complete events when unlocked)
- Average time between unlock and completion
- Debt counter distribution (how often players hit threshold)
- Kethaneum puzzle completion rate

### Qualitative
- Player feedback on pacing
- Reports of narrative confusion (should decrease)
- Engagement with story events vs puzzle-only mode

---

## References

### Key Files
- `/lib/game/puzzleSelector.ts` - Puzzle selection orchestration
- `/lib/dialogue/StoryEventTriggerChecker.ts` - Story event triggers
- `/lib/story/storyBlurbManager.ts` - Book of Passage blurbs
- `/hooks/useGameModeHandlers.ts` - Game completion handlers
- `/components/GameStatsModal.tsx` - Win modal
- `/lib/game/state.ts` - State management

### Related Systems
- Save/Restore System (`state.ts`)
- Dialogue Manager (`DialogueManager.ts`)
- Story Progression (`StoryProgressionManager.ts`)
- Audio Context (`AudioContext.tsx`)

---

## Appendix: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       PLAYER COMPLETES PUZZLE                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  handleWin()     │
                    │  (useGameMode    │
                    │   Handlers.ts)   │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │ markPuzzleCompleted  │  │ Is Kethaneum puzzle? │
    │ (puzzleSelector.ts)  │  └──────────┬───────────┘
    └──────────────────────┘             │
                                         │ YES
                                         ▼
                          ┌──────────────────────────────┐
                          │ kethaneumPuzzlesCompleted++  │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │ checkStoryEventUnlock()      │
                          │ (storyEventUnlockChecker.ts) │
                          └──────────────┬───────────────┘
                                         │
                      ┌──────────────────┴──────────────────┐
                      ▼                                     ▼
         ┌──────────────────────┐              ┌──────────────────────┐
         │ Requirements met?    │              │ No event unlocked    │
         │ K ≥ req.K && N ≥ req.N│             └──────────────────────┘
         └──────────┬───────────┘
                    │ YES
                    ▼
         ┌──────────────────────┐
         │ unlockStoryEvent()   │
         │ - storyEventDebt++   │
         │ - Add to unlocked[]  │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Show win modal with  │
         │ "Something vies..."  │
         │ + Glowing button     │
         └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PLAYER COMPLETES STORY EVENT                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ completeStory    │
                    │ Event()          │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │ storyEventDebt--     │  │ Move from unlocked[] │
    │                      │  │ to completed[]       │
    └──────────────────────┘  └──────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ checkStoryBlurb      │
                  │ Triggers()           │
                  │ (storyBlurbManager)  │
                  └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PLAYER STARTS NEXT PUZZLE                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ selectNextPuzzle │
                        │ (puzzleSelector) │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │ puzzlesSinceLast     │  │ storyEventDebt >=    │
        │ Kethaneum >=         │  │ threshold?           │
        │ interval?            │  └──────────┬───────────┘
        └──────────┬───────────┘             │
                   │                         │ YES (debt=2)
                   │ YES                     │
                   ▼                         ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │ Is Kethaneum blocked?│  │ Block Kethaneum      │
        └──────────┬───────────┘  │ Select normal puzzle │
                   │ NO            └──────────────────────┘
                   ▼
        ┌──────────────────────┐
        │ Return Kethaneum     │
        │ puzzle               │
        └──────────────────────┘
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-31
**Author**: Claude (with She Dreams)
**Status**: Design Phase - Ready for Review
