# Story Events System Documentation

## Overview

The Story Events system manages dialogue sequences that trigger based on game conditions. Story events are displayed in the Library and trigger visual notifications on Library buttons when available.

**Key Behaviors:**
- Story events **prioritize** over character banter when available
- Each click of "Start a Conversation" plays **one** story event, then the conversation ends
- If multiple story events are unlocked, the player must click "Start a Conversation" repeatedly to play each event sequentially
- Once a story event is played, it is marked as complete and won't replay
- Notifications persist until **all unlocked story events for the current story beat** have been completed
- After all unlocked story events are completed, the system reverts to random character banter

---

## Quick Reference

### Where Things Are Located

- **Story Event Files**: `/public/data/story-events/*.json`
- **Event Manifest**: `/public/data/story-events/event-manifest.json`
- **DialogueManager**: `/lib/dialogue/DialogueManager.ts`
- **StoryEventTriggerChecker**: `/lib/dialogue/StoryEventTriggerChecker.ts` - Centralized trigger condition evaluation
- **StoryEventPlayer**: `/lib/dialogue/StoryEventPlayer.ts` - Handles story event dialogue playback
- **Notification System**: `/contexts/StoryNotificationContext.tsx`
- **Library Page**: `/app/library/page.tsx` - Main integration point

### Trigger Conditions

Trigger conditions are stored **inside each story event JSON file** in the `triggerCondition` field. These conditions are **evaluated against game state** by `StoryEventTriggerChecker`, not just matched as strings.

**Important:** Trigger conditions must be implemented in `StoryEventTriggerChecker.ts` to actually work. The checker evaluates game state transitions (e.g., puzzle completion, book discovery) to determine if an event should trigger.

```json
{
  "storyEvent": {
    "id": "first-visit",
    "title": "First Steps in the Kethaneum",
    "triggerCondition": "player-enters-library-first-time",
    "storyBeat": "hook"
  }
}
```

**Available Trigger Conditions:**
- `first-puzzle-complete` - Triggers when player completes their first puzzle
- `first-kethaneum-puzzle-complete` - Triggers when player completes their first Kethaneum puzzle
- `puzzle-milestone-{N}` - Triggers when player reaches N total puzzles completed
- `kethaneum-puzzle-milestone-{N}` - Triggers when player reaches N Kethaneum puzzles completed
- `first-book-complete` - Triggers when player completes their first book
- `books-complete-{N}` - Triggers when player reaches N total books completed
- `kethaneum-book-complete-{bookTitle}` - Triggers when all puzzles in a specific Kethaneum book are completed
- `player-enters-library-first-time` - Special case: checked manually in Library page on first visit

---

## How Story Events Work

### 1. Story Event Structure

Each story event is a JSON file in `/public/data/story-events/` with this structure:

```json
{
  "storyEvent": {
    "id": "unique-event-id",
    "title": "Event Title",
    "triggerCondition": "condition-name-here",
    "storyBeat": "hook"  // Optional: which story beat this event is for
  },
  "dialogue": [
    {
      "sequence": 1,
      "speaker": "character-id",
      "text": "Dialogue text here",
      "emotion": ["welcoming", "formal"],
      "pauseAfter": true
    }
  ],
  "characters": [
    {
      "id": "character-id",
      "portraitFile": "character-portrait.svg"
    }
  ],
  "metadata": {
    "estimatedDuration": "medium",
    "storyImportance": "introduction",
    "unlocks": ["feature-name"],
    "lastUpdated": "2025-05-27"
  }
}
```

### 2. Loading Story Events

Story events are automatically loaded when DialogueManager initializes:

```typescript
// In your app initialization (already done in StorySystemProvider)
await dialogueManager.initialize();
// This loads all events from event-manifest.json
```

### 3. Triggering Story Events

To check if a story event should trigger based on game conditions:

```typescript
import { dialogueManager } from '@/lib/dialogue/DialogueManager';

// Check for available event by trigger condition
const eventId = dialogueManager.checkForAvailableStoryEvent(
  'player-enters-library-first-time',  // trigger condition
  currentStoryBeat                      // optional: current story beat
);

if (eventId) {
  // Event is available!
  // This automatically triggers library button notification
  const event = dialogueManager.getStoryEvent(eventId);
  // Display the event dialogue to the player
}
```

### 4. Automatic Notification Flow

**When Puzzle Completes:**
1. `useGameModeHandlers.ts` calls `StoryEventTriggerChecker.checkAvailableEvents()`
2. Trigger conditions are evaluated against game state transitions
3. For each matching event, `dialogueManager.checkForAvailableStoryEvent()` is called
4. DialogueManager emits `dialogueManager:storyEventAvailable` event
5. StorySystemProvider catches the event and calls `setNewDialogueAvailable()`
6. Library buttons start glowing with amber animation

**When Library Page Loads:**
1. Library page `useEffect` calls `StoryEventTriggerChecker.checkAvailableEvents(state, undefined)`
2. Available events are filtered to exclude completed ones
3. If any available events exist, `setNewDialogueAvailable()` is called
4. Notification persists until **all unlocked story events for the current beat** are completed

**Notification Persistence:**
- Notifications **do not** clear when player visits Library
- Notifications persist until all unlocked story events for the current story beat are completed
- This ensures notifications survive page refreshes and multiple visits

---

## Common Trigger Conditions

Here are common trigger conditions you might use:

| Trigger Condition | When to Use |
|------------------|-------------|
| `player-enters-library-first-time` | First time player visits Library |
| `first-book-discovered` | When player discovers their first book |
| `genre-completed` | When player completes all books in a genre |
| `story-beat-advanced` | When story progresses to new beat |
| `puzzle-milestone-reached` | After completing X puzzles |

You can create any trigger condition name you want - just make sure to check for it in your game logic!

---

## Adding New Story Events

### Step 1: Create the Event File

Create a new JSON file in `/public/data/story-events/`:

```bash
# Example: create welcome-event.json
```

```json
{
  "storyEvent": {
    "id": "welcome-event",
    "title": "Welcome to the Archives",
    "triggerCondition": "player-completes-first-puzzle",
    "storyBeat": "hook"
  },
  "dialogue": [
    {
      "sequence": 1,
      "speaker": "archivist-lumina",
      "text": "Well done! You're getting the hang of this.",
      "emotion": ["encouraging"],
      "pauseAfter": false,
      "isLastInSequence": true
    }
  ],
  "characters": [
    {
      "id": "archivist-lumina",
      "portraitFile": "lumina-portrait.svg"
    }
  ],
  "metadata": {
    "estimatedDuration": "short",
    "storyImportance": "milestone",
    "unlocks": [],
    "lastUpdated": "2025-11-28"
  }
}
```

### Step 2: Add to Manifest

Update `/public/data/story-events/event-manifest.json`:

```json
[
  "first-visit.json",
  "welcome-event.json"  // Add your new event
]
```

### Step 3: Implement Trigger Condition (if new)

If you're using a new trigger condition, add it to `StoryEventTriggerChecker.ts`:

```typescript
// In StoryEventTriggerChecker.matchesTriggerCondition()
if (triggerCondition === 'your-new-trigger-condition') {
  // Evaluate game state to determine if condition is met
  const currentValue = currentState.someProperty;
  const prevValue = previousState?.someProperty || 0;
  return currentValue === desiredValue && prevValue !== desiredValue;
}
```

**Note:** Story events are automatically checked after puzzle completion via `useGameModeHandlers.ts`. You don't need to manually trigger them unless you're adding a new trigger type that isn't checked automatically.

---

## Retrieving Story Events

### Get Event by ID
```typescript
const event = dialogueManager.getStoryEvent('first-visit');
```

### Get All Available Events for Current Beat
```typescript
const availableEventIds = dialogueManager.getAvailableStoryEvents(currentBeat);
```

### Check for Specific Trigger
```typescript
const eventId = dialogueManager.checkForAvailableStoryEvent(
  'my-trigger-condition',
  currentBeat
);
```

---

## Notification System

### How Notifications Work

```
Game Logic
    ↓
checkForAvailableStoryEvent('condition')
    ↓
DialogueManager finds matching event
    ↓
Emits 'dialogueManager:storyEventAvailable' event
    ↓
StorySystemProvider catches event
    ↓
Calls setNewDialogueAvailable()
    ↓
Library buttons glow amber
    ↓
Player visits Library
    ↓
clearNewDialogue() called
    ↓
Glow stops
```

### Manual Notification Control

If you need to manually control notifications:

```typescript
import { useStoryNotification } from '@/contexts/StoryNotificationContext';

function MyComponent() {
  const {
    hasNewDialogue,
    setNewDialogueAvailable,
    clearNewDialogue
  } = useStoryNotification();

  // Check if notification is active
  if (hasNewDialogue) {
    console.log('Library has new dialogue!');
  }

  // Manually trigger notification
  setNewDialogueAvailable();

  // Manually clear notification
  clearNewDialogue();
}
```

---

## Story Event vs Story Blurb

### Story Events (Library - Dialogue)
- **Location**: Library
- **Purpose**: Character dialogue sequences
- **Trigger**: Game conditions checked by your code
- **Notification**: Library buttons glow amber
- **File Location**: `/public/data/story-events/`
- **Manager**: DialogueManager

### Story Blurbs (Book of Passage - Narrative)
- **Location**: Book of Passage
- **Purpose**: Narrative story moments
- **Trigger**: Automatic based on story beat advancement
- **Notification**: Book of Passage buttons glow amber
- **File Location**: `/public/data/story-blurbs.json`
- **Manager**: StoryBlurbManager

Both systems work together to tell your story!

---

## Examples

### Example 1: Library Page Load Check

```typescript
// In app/library/page.tsx
useEffect(() => {
  if (!state.storyProgress || !dialogueManager.getInitialized()) return;

  // Use StoryEventTriggerChecker to properly evaluate trigger conditions
  const triggeredEventIds = StoryEventTriggerChecker.checkAvailableEvents(
    state,
    undefined  // Check current state, not transitions
  );
  
  // Filter out completed events
  const completedEvents = state.dialogue?.completedStoryEvents || [];
  const availableEventIds = triggeredEventIds.filter(
    eventId => !completedEvents.includes(eventId)
  );

  if (availableEventIds.length > 0) {
    setNewDialogueAvailable();  // Show notification
  } else {
    clearNewDialogue();  // Clear if all events completed
  }
}, [state.storyProgress?.currentStoryBeat, state.dialogue?.completedStoryEvents]);
```

### Example 2: Playing Story Events (Library Page)

```typescript
// In handleStartConversation (app/library/page.tsx)
const handleStartConversation = async () => {
  // Clear queue to prevent old panels from persisting
  dialogueQueueRef.current?.clear();
  
  setConversationActive(true);
  
  const currentBeat = state.storyProgress?.currentStoryBeat || 'hook';
  const completedEvents = completedEventsRef.current.length > 0
    ? completedEventsRef.current
    : (state.dialogue?.completedStoryEvents || []);
  
  // Get ONE available event (filtering completed ones)
  const availableEvent = dialogueManager.getAvailableStoryEvent(
    currentBeat,
    completedEvents
  );
  
  if (availableEvent) {
    // Play story event
    const player = new StoryEventPlayer(dialogueManager);
    const eventId = availableEvent.storyEvent.id;
    currentEventIdRef.current = eventId;
    
    // Set up completion callback
    player.onCompleted(async () => {
      // Mark event as completed
      completedEventsRef.current.push(eventId);
      setState(prevState => ({
        ...prevState,
        dialogue: {
          ...prevState.dialogue,
          completedStoryEvents: [...prevState.dialogue.completedStoryEvents, eventId],
        },
      }));
      
      // End conversation
      dialogueQueueRef.current?.clear();
      setConversationActive(false);
    });
    
    await player.loadStoryEvent(eventId);
    eventPlayerRef.current = player;
  } else {
    // No story events - play banter instead
    const banter = dialogueManager.getRandomBanter(currentBeat);
    // ... play banter ...
  }
};
```

---

## Debugging

### Check What Events Are Loaded
```typescript
const status = dialogueManager.getStatus();
console.log('Story events loaded:', status.storyEventsLoaded);
```

### Check for Events Matching Current Beat
```typescript
const available = dialogueManager.getAvailableStoryEvents('hook');
console.log('Available events for hook beat:', available);
```

### Listen to Event Loading
```typescript
document.addEventListener('dialogueManager:storyEventsLoaded', (event) => {
  console.log('Story events loaded:', event.detail);
});
```

### Listen to Event Triggers
```typescript
document.addEventListener('dialogueManager:storyEventAvailable', (event) => {
  console.log('Story event available:', event.detail);
});
```

---

## Configuration

Story event behavior is configured in `/public/data/dialogue-config.json`:

```json
{
  "behavior": {
    "storyEvents": {
      "triggerMethod": "external",
      "autoAdvanceDelay": 0,
      "allowSkipping": true
    }
  }
}
```

- **triggerMethod**: `"external"` means you control when to check for events
- **autoAdvanceDelay**: Delay between dialogue sequences (0 = manual)
- **allowSkipping**: Whether players can skip dialogue

---

## Summary Checklist

When adding a new story event:

- [ ] Create JSON file in `/public/data/story-events/`
- [ ] Add filename to `event-manifest.json`
- [ ] Choose a unique trigger condition name
- [ ] Add trigger check in appropriate game logic
- [ ] Test that library buttons glow when event is available
- [ ] Test that notification clears when library is visited

---

## Related Documentation

- **Story Progression System**: `/lib/story/README.md`
- **Dialogue Config**: `/public/data/README.md`
- **Notification System**: `/contexts/StoryNotificationContext.tsx`
- **StoryEventTriggerChecker**: `/lib/dialogue/StoryEventTriggerChecker.ts` - Trigger condition evaluation
- **StoryEventPlayer**: `/lib/dialogue/StoryEventPlayer.ts` - Story event dialogue playback
- **DialogueManager**: `/lib/dialogue/DialogueManager.ts` - Central dialogue management
- **Library Page**: `/app/library/page.tsx` - Main integration point for story events and banter

## Technical Notes

### State Management

- **Completed Events Tracking:** Uses both `state.dialogue.completedStoryEvents` (persistent) and `completedEventsRef` (immediate) to handle React's asynchronous state updates
- **Event Completion:** Events are marked complete immediately via ref, then synced to state to ensure next click correctly filters them out

### Trigger Condition Evaluation

- Trigger conditions are evaluated against **game state transitions**, not just current state
- `StoryEventTriggerChecker.checkAvailableEvents(currentState, previousState)` compares states to detect transitions
- For page load checks, pass `undefined` as `previousState` to check current state

### Queue Management

- Dialogue queue is cleared at the start of each new conversation to prevent old panels from persisting
- Queue is also cleared when a story event completes or banter conversation ends

### Notification Persistence

- Notifications persist across page refreshes and multiple Library visits
- Notifications only clear when **all unlocked story events for the current story beat** are completed
- This ensures players don't miss story events even if they visit Library multiple times
