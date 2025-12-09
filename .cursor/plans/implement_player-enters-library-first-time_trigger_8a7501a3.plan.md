---
name: ""
overview: Implement a robust, state-based trigger for `player-enters-library-first-time` by adding a `hasVisitedLibrary` flag to dialogue state, wiring it into the optimized save system, and using it in StoryEventTriggerChecker. Backwards compatibility is not required because this is a pre-alpha build.
todos: []
---

# Implement Robust `player-enters-library-first-time` Trigger

## Goal

Make the `first-visit` story event trigger based on a **real game state flag** (`hasVisitedLibrary`) instead of inferring from event completion. Ensure this flag persists across sessions via the optimized save system.

## Design Overview

- Add `hasVisitedLibrary` to `GameState.dialogue` to represent whether the player has ever visited the Library.
- Persist `hasVisitedLibrary` in the optimized save format.
- Update `StoryEventTriggerChecker.isTriggerConditionCurrentlySatisfied()` so `player-enters-library-first-time` is satisfied exactly when `hasVisitedLibrary` is `false`.
- Set `hasVisitedLibrary` to `true` when the `first-visit` intro event completes (so the flag matches the narrative experience: you have truly "visited" once the intro is done).

Backwards compatibility is not required; we can focus on the cleanest architecture for the pre-alpha.

## Implementation Steps

### 1. Extend GameState.dialogue with hasVisitedLibrary

**File:** `lib/game/state.ts`

- Update `GameState` interface to include the new flag:
```ts
export interface GameState {
  // ...existing fields...
  dialogue?: {
    completedStoryEvents: string[];
    hasVisitedLibrary?: boolean; // NEW: track if player has visited Library
    conversationHistory?: Array<{
      timestamp: number;
      characterId: string;
      dialogueId: string;
      wasStoryEvent: boolean;
    }>; 
  };
}
```

- No change needed to `baseState` because `dialogue` is optional and the flag defaults to `undefined` / `false`.

### 2. Persist hasVisitedLibrary in optimized save format

**File:** `lib/save/optimizedSaveSystem.ts`

1. **Extend OptimizedProgress type:**
```ts
export interface OptimizedProgress {
  // ...existing fields...
  dl?: string[];   // completed story events
  dlv?: boolean;   // NEW: dialogue: has visited library
}
```

2. **Save the flag in saveOptimizedProgress(state):**

- After saving `completedStoryEvents`, write:
```ts
// Add dialogue state (completed story events)
if (state.dialogue?.completedStoryEvents && state.dialogue.completedStoryEvents.length > 0) {
  optimized.dl = state.dialogue.completedStoryEvents;
}

// NEW: Add hasVisitedLibrary flag
if (state.dialogue?.hasVisitedLibrary) {
  optimized.dlv = true;
}
```


3. **Decode the flag in decodeOptimizedProgress(data):**

- Extend `DecodedProgress` (where it’s defined) to include:
```ts
interface DecodedProgress {
  // ...existing fields...
  completedStoryEvents?: string[];
  hasVisitedLibrary?: boolean; // NEW
}
```

- In `decodeOptimizedProgress(data)`:
```ts
// Decode dialogue state (completed story events)
if (data.dl && Array.isArray(data.dl)) {
  decoded.completedStoryEvents = data.dl;
}

// NEW: Decode hasVisitedLibrary
if (data.dlv === true) {
  decoded.hasVisitedLibrary = true;
}
```


4. **Propagate the flag into GameState in convertToGameStateFormat(decoded):**

- In the return object, update the `dialogue` shaping:
```ts
return {
  // ...existing mapped fields...
  storyProgress: decoded.storyProgress,
  dialogue: decoded.completedStoryEvents || decoded.hasVisitedLibrary !== undefined
    ? {
        completedStoryEvents: decoded.completedStoryEvents ?? [],
        hasVisitedLibrary: decoded.hasVisitedLibrary ?? false,
      }
    : undefined,
};
```


### 3. Implement the trigger logic in StoryEventTriggerChecker

**File:** `lib/dialogue/StoryEventTriggerChecker.ts`

- In `isTriggerConditionCurrentlySatisfied(triggerCondition, currentState)`, add a case before the "Context-specific triggers" comment:
```ts
// Pattern: "player-enters-library-first-time" - true until Library has been visited
if (triggerCondition === 'player-enters-library-first-time') {
  return !currentState.dialogue?.hasVisitedLibrary;
}
```

- The rest of the method remains unchanged.

### 4. Mark hasVisitedLibrary when intro event completes

**File:** `app/library/page.tsx`

- In the `onCompleted` callback for story events (the one that processes `completedId`), add logic specifically for `first-visit` to set `hasVisitedLibrary: true` in state:
```ts
player.onCompleted(async () => {
  try {
    // ...existing completion logic...

    const completedId = currentEventIdRef.current;

    setState(prevState => {
      const completedEvents = prevState.dialogue?.completedStoryEvents || [];
      const updatedCompletedEvents = completedEvents.includes(completedId)
        ? completedEvents
        : [...completedEvents, completedId];

      return {
        ...prevState,
        dialogue: {
          ...prevState.dialogue,
          completedStoryEvents: updatedCompletedEvents,
          // NEW: Mark library as visited when first-visit completes
          hasVisitedLibrary:
            prevState.dialogue?.hasVisitedLibrary || completedId === 'first-visit'
              ? true
              : prevState.dialogue?.hasVisitedLibrary ?? false,
        },
      };
    });

    // ...rest of onCompleted logic...
  } catch (error) {
    // ...existing error handling...
  }
});
```

- This ensures:
  - Before the intro: `hasVisitedLibrary` is `false` / undefined → trigger returns true → `first-visit` is available.
  - After the intro completes once: `hasVisitedLibrary` is `true` → trigger returns false → `first-visit` cannot re-trigger.

### 5. (Optional later) Documentation Updates

**File:** `lib/dialogue/STORY-EVENTS-README.md`

- Update the `player-enters-library-first-time` row to clarify that it uses `dialogue.hasVisitedLibrary` in game state.
- Mention that this flag is persisted via the optimized save system.

## Summary

- We introduce a **real game state flag** (`dialogue.hasVisitedLibrary`) to represent whether the Library intro has been experienced.
- We wire this flag into the optimized save/load pipeline (`dlv`), so it persists across sessions.
- `StoryEventTriggerChecker` uses this flag to evaluate `player-enters-library-first-time` cleanly and predictably.
- The intro event itself (`first-visit`) sets the flag on completion, synchronizing narrative experience and state.

This gives us an elegant, state-driven trigger that fits neatly into the existing architecture without worrying about backward compatibility.