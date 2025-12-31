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

### Trigger Updates

**Location**: `/public/data/story-progress.json`

Add new trigger types for story event-based blurbs:

```json
{
  "id": "story_001",
  "trigger": "story_event_complete_first-visit",
  "title": "A Warning Heeded",
  "text": "Lumina's words echo in your mind...",
  "order": 5
}
```

**Modify**: `/lib/story/storyBlurbManager.ts`

Add story event completion triggers to `checkTriggerConditions()`:

```typescript
// Check for story event completions
if (state.narrativeOrchestration.completedStoryEvents.length > previousState?.narrativeOrchestration?.completedStoryEvents?.length) {
  const newlyCompleted = state.narrativeOrchestration.completedStoryEvents.filter(
    id => !previousState?.narrativeOrchestration?.completedStoryEvents?.includes(id)
  );

  for (const eventId of newlyCompleted) {
    const trigger = `story_event_complete_${eventId}` as StoryTrigger;
    if (availableBlurb.trigger === trigger && !firedTriggers.includes(trigger)) {
      return availableBlurb;
    }
  }
}

// Also check for Kethaneum puzzle completions
if (state.narrativeOrchestration.kethaneumPuzzlesCompleted > previousState?.narrativeOrchestration?.kethaneumPuzzlesCompleted) {
  const kethaneumCount = state.narrativeOrchestration.kethaneumPuzzlesCompleted;
  const trigger = `kethaneum_puzzle_${kethaneumCount}` as StoryTrigger;
  // ... check for matching blurb
}
```

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

## Implementation Phases

### Phase 1: Core State & Configuration (Foundation)
**Files to Create/Modify**:
- ✅ Create `/lib/narrative/storyEventConfig.ts`
- ✅ Create `/lib/narrative/storyEventUnlockChecker.ts`
- ✅ Modify `/lib/game/state.ts` - Add `narrativeOrchestration` to GameState
- ✅ Update `/lib/game/puzzleSelectionConfig.ts` - Change interval to 5-7

**Acceptance Criteria**:
- State includes all new narrative orchestration fields
- Story event unlock requirements are defined
- Configuration is type-safe and validated

### Phase 2: Puzzle Selector Gating (Core Logic)
**Files to Modify**:
- ✅ Modify `/lib/game/puzzleSelector.ts` - Add debt gating logic
- ✅ Modify `/hooks/useGameModeHandlers.ts` - Track Kethaneum completions

**Acceptance Criteria**:
- Kethaneum puzzles blocked when debt >= threshold
- Normal puzzles continue when Kethaneum blocked
- Counter increments properly for Kethaneum vs normal

### Phase 3: Story Event Unlocking (Unlock Flow)
**Files to Modify**:
- ✅ Modify `/hooks/useGameModeHandlers.ts` - Call unlock checker after puzzle completion
- ✅ Ensure story events unlocked one at a time in order

**Acceptance Criteria**:
- Story events unlock when thresholds met
- Only next event in sequence unlocks
- Debt counter increments on unlock

### Phase 4: Story Event Completion (Debt Decrement)
**Files to Modify**:
- ✅ Modify `/lib/dialogue/DialogueManager.ts` - Call `completeStoryEvent()` when dialogue ends
- ✅ Or create new hook for story event completion

**Acceptance Criteria**:
- Completing story event decrements debt
- Event moved from unlocked to completed list
- State persists correctly

### Phase 5: Win Modal Messaging (Player Feedback)
**Files to Create/Modify**:
- ✅ Create `/lib/narrative/narrativeMessaging.ts`
- ✅ Modify `/components/GameStatsModal.tsx` - Add narrative message display
- ✅ Add CSS for glowing/pulsing button effect

**Acceptance Criteria**:
- Messages show based on debt level (0, 1, 2+)
- Story events button glows when debt > 0
- Message text matches config
- Blocking state clearly indicated

### Phase 6: Book of Passage Integration (Event Triggers)
**Files to Modify**:
- ✅ Modify `/lib/story/storyBlurbManager.ts` - Add story event triggers
- ✅ Update `/lib/story/types.ts` - Add new StoryTrigger types
- ✅ Update `/public/data/story-progress.json` - Add event-based blurbs

**Acceptance Criteria**:
- Blurbs trigger on story event completion
- Blurbs trigger on specific Kethaneum puzzle completion
- No duplicate triggers

### Phase 7: Testing & Polish
**Testing Checklist**:
- ✅ Kethaneum interval is 5-7 puzzles
- ✅ Story event 1 unlocks after 1 Kethaneum + 7 normal
- ✅ Story event 2 unlocks after 2 Kethaneum + 10 normal
- ✅ Debt counter blocks at threshold (2)
- ✅ Messages show correctly in win modal
- ✅ Completing story events clears debt
- ✅ Book of Passage blurbs trigger on events
- ✅ State persists across sessions
- ✅ No duplicate unlocks or completions

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
