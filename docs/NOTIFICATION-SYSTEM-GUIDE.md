# Notification System Quick Reference Guide

## Overview

The game has TWO notification systems that work in parallel:

1. **Book of Passage Notifications** - For story narrative moments
2. **Library Notifications** - For dialogue event sequences

Both use the same amber glow/pulse animation on their respective buttons.

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────┐
│                  NOTIFICATION SYSTEM                     │
└─────────────────────────────────────────────────────────┘

Story Content (Book of Passage)     Dialogue Events (Library)
         ↓                                   ↓
   Story Blurbs                        Story Events
         ↓                                   ↓
 StoryBlurbManager                   DialogueManager
         ↓                                   ↓
StoryProgressionManager            checkForAvailableStoryEvent()
         ↓                                   ↓
  Auto-triggers based              Manual trigger checks
  on story beat                    in your game code
         ↓                                   ↓
  beatTrigger event               storyEventAvailable event
         ↓                                   ↓
    StorySystemProvider (listens to both)
         ↓                                   ↓
setNewStoryAvailable()          setNewDialogueAvailable()
         ↓                                   ↓
BookOfPassageButton glows         LibraryButton glows
         ↓                                   ↓
  Visit Book of Passage            Visit Library
         ↓                                   ↓
   clearNewStory()                clearNewDialogue()
         ↓                                   ↓
    Glow stops                       Glow stops
```

---

## Quick Reference Table

| Feature | Book of Passage | Library |
|---------|----------------|---------|
| **What** | Story narrative moments | Character dialogue sequences |
| **Content Type** | Story blurbs | Story events |
| **Trigger** | Automatic (story beat advancement) | Manual check in game code |
| **Trigger Stored In** | `StoryProgressionManager` config | Individual story event JSON files |
| **Data Location** | `/public/data/story-blurbs.json` | `/public/data/story-events/*.json` |
| **Manager** | `StoryBlurbManager` | `DialogueManager` |
| **Event Emitted** | `storyProgression:beatTrigger` | `dialogueManager:storyEventAvailable` |
| **Notification Hook** | `setNewStoryAvailable()` | `setNewDialogueAvailable()` |
| **Clear Hook** | `clearNewStory()` | `clearNewDialogue()` |
| **Button Component** | `<BookOfPassageButton>` | `<LibraryButton>` |
| **Glow Color** | Amber (same for both) | Amber (same for both) |

---

## Where Trigger Conditions Are Stored

### Story Blurbs (Book of Passage)
Triggers are defined in the **Story Progression Manager configuration**:

Location: Configured in code within `StoryProgressionManager`

Example:
```typescript
// Progression rules define when beats advance
// When beat advances, blurb system automatically checks for matching trigger
```

### Story Events (Library)
Triggers are defined **inside each story event JSON file**:

Location: `/public/data/story-events/[event-name].json`

Example:
```json
{
  "storyEvent": {
    "id": "first-visit",
    "triggerCondition": "player-enters-library-first-time",  // ← HERE
    "storyBeat": "hook"
  }
}
```

---

## How to Trigger Each System

### Trigger Book of Passage Notification (Automatic)
```typescript
// Story blurbs trigger automatically when story beats advance
// via StoryProgressionManager based on:
// - Puzzles completed
// - Books discovered
// - Other game metrics

// You don't need to manually trigger these!
// The StoryProgressionManager handles it automatically
```

### Trigger Library Notification (Manual Check)
```typescript
import { dialogueManager } from '@/lib/dialogue/DialogueManager';

// In your game logic, check for story events:
const eventId = dialogueManager.checkForAvailableStoryEvent(
  'player-enters-library-first-time',  // trigger condition from event JSON
  currentStoryBeat                      // current story beat (optional)
);

if (eventId) {
  // Event matched! Notification is automatically triggered
  // Display the dialogue to the player
}
```

---

## Where Notifications Are Triggered

### Book of Passage Notifications

**File**: `components/StorySystemProvider.tsx`

```typescript
useStorySystemIntegration({
  state,
  onBlurbTriggered: (blurbId, trigger) => {
    setNewStoryAvailable();  // ← Triggers Book of Passage button glow
  },
});
```

### Library Notifications

**File**: `components/StorySystemProvider.tsx`

```typescript
useEffect(() => {
  const handleStoryEventAvailable = (event: CustomEvent) => {
    setNewDialogueAvailable();  // ← Triggers Library button glow
  };

  document.addEventListener(
    'dialogueManager:storyEventAvailable',
    handleStoryEventAvailable
  );
}, []);
```

---

## Where Buttons Are Used

### BookOfPassageButton Locations
- **Puzzle pause menu**: `app/puzzle/page.tsx`
- **Win modal**: `components/GameStatsModal.tsx`

### LibraryButton Locations
- **Book of Passage page**: `app/book-of-passage/page.tsx` ("Enter the Library")
- **Puzzle pause menu**: `app/puzzle/page.tsx` ("Return to Library")
- **Win modal**: `components/GameStatsModal.tsx` ("Return to Library")

---

## Adding New Triggers

### For Story Blurbs (Book of Passage)
1. Add trigger to `/public/data/story-blurbs.json`
2. StoryProgressionManager will automatically check when beat advances
3. No code changes needed!

### For Story Events (Library)
1. Create new JSON file in `/public/data/story-events/`
2. Add `triggerCondition` field to the JSON
3. Add filename to `/public/data/story-events/event-manifest.json`
4. In your game code, call `checkForAvailableStoryEvent('your-trigger-name')`

---

## Testing Notifications

### Test Book of Passage Notification
```typescript
// Manually trigger (for testing only)
const { setNewStoryAvailable } = useStoryNotification();
setNewStoryAvailable();

// Should see Book of Passage buttons glow
```

### Test Library Notification
```typescript
// Manually trigger (for testing only)
const { setNewDialogueAvailable } = useStoryNotification();
setNewDialogueAvailable();

// Should see Library buttons glow
```

### Test Clearing
```typescript
const { clearNewStory, clearNewDialogue } = useStoryNotification();

// Clear Book of Passage notification
clearNewStory();

// Clear Library notification
clearNewDialogue();
```

---

## Debugging Checklist

**Book of Passage notification not showing?**
- [ ] Check if story beat advanced
- [ ] Check if matching blurb exists in `story-blurbs.json`
- [ ] Check browser console for StorySystemIntegration logs
- [ ] Verify StoryProgressionManager initialized

**Library notification not showing?**
- [ ] Check if story event JSON exists in `/public/data/story-events/`
- [ ] Check if event is in `event-manifest.json`
- [ ] Check if `checkForAvailableStoryEvent()` is called
- [ ] Check trigger condition matches exactly
- [ ] Check browser console for DialogueManager logs

**Notification won't clear?**
- [ ] Check if `clearNewStory()` or `clearNewDialogue()` is called
- [ ] Check if useEffect is running on page mount
- [ ] Check browser console for StoryNotification logs

---

## Related Documentation

- **Story Events Detail**: `/lib/dialogue/STORY-EVENTS-README.md`
- **Story Progression**: `/lib/story/README.md`
- **Story Blurbs**: `/public/data/README.md`

---

## Code Files Reference

**Core Notification System:**
- `contexts/StoryNotificationContext.tsx` - Global notification state
- `components/StorySystemProvider.tsx` - Event listeners & coordination
- `styles/story-notification.module.css` - Amber glow/pulse animation

**Button Components:**
- `components/BookOfPassageButton.tsx` - Book of Passage button with glow
- `components/LibraryButton.tsx` - Library button with glow

**Story Systems:**
- `lib/story/StoryProgressionManager.ts` - Auto story beat advancement
- `lib/story/storyBlurbManager.ts` - Story blurb display
- `lib/dialogue/DialogueManager.ts` - Story event loading & checking

**Integration:**
- `hooks/story/useStorySystemIntegration.ts` - Coordinates blurb + progression
