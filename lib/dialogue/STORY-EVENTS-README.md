# Story Events System Documentation

## Overview

The Story Events system manages dialogue sequences that trigger based on game conditions. Story events are displayed in the Library and trigger visual notifications on Library buttons when available.

---

## Quick Reference

### Where Things Are Located

- **Story Event Files**: `/public/data/story-events/*.json`
- **Event Manifest**: `/public/data/story-events/event-manifest.json`
- **DialogueManager**: `/lib/dialogue/DialogueManager.ts`
- **Notification System**: `/contexts/StoryNotificationContext.tsx`

### Trigger Conditions

Trigger conditions are stored **inside each story event JSON file** in the `triggerCondition` field:

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

When `checkForAvailableStoryEvent()` finds a matching event:

1. DialogueManager emits `dialogueManager:storyEventAvailable` event
2. StorySystemProvider catches the event
3. Library buttons start glowing with amber animation
4. Notification clears when player visits Library

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

### Step 3: Trigger in Game Logic

In your game code, check for the trigger when appropriate:

```typescript
// Example: After player completes first puzzle
function handlePuzzleComplete() {
  // ... existing puzzle completion logic ...

  if (isFirstPuzzleCompleted) {
    const eventId = dialogueManager.checkForAvailableStoryEvent(
      'player-completes-first-puzzle',
      state.storyProgress?.currentBeat
    );

    if (eventId) {
      // Show the event dialogue to the player
      showStoryEventDialogue(eventId);
    }
  }
}
```

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

### Example 1: First Library Visit

```typescript
// In Library page component
useEffect(() => {
  const eventId = dialogueManager.checkForAvailableStoryEvent(
    'player-enters-library-first-time',
    state.storyProgress?.currentBeat
  );

  if (eventId && !hasSeenEvent(eventId)) {
    // Show the first visit dialogue
    setCurrentDialogueEvent(eventId);
    setShowDialogue(true);
    markEventAsSeen(eventId);
  }
}, []);
```

### Example 2: Milestone Achievement

```typescript
// After significant game milestone
function onMilestoneReached(milestoneName: string) {
  const eventId = dialogueManager.checkForAvailableStoryEvent(
    `milestone-${milestoneName}`,
    state.storyProgress?.currentBeat
  );

  if (eventId) {
    // Queue the event to show next time player visits Library
    queueStoryEvent(eventId);
  }
}
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
