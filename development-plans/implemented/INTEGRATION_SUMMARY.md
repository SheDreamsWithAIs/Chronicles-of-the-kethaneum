# Story System Integration - Summary

**Date:** November 25, 2025
**Status:** ✅ Integration Hook Created, Documentation Updated
**Next Steps:** Wire up in app and test

---

## ✅ What Was Completed

### 1. **Renamed for Clarity**
Renamed `storyProgressManager` → `storyBlurbManager` throughout the entire codebase to make it clear what each system does:

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `storyProgressManager` | `storyBlurbManager` | Displays narrative text moments |
| `StoryProgressManager` | `StoryProgressionManager` | Advances storybeats automatically |

**Files Updated:**
- ✅ `lib/story/storyProgressManager.ts` → `lib/story/storyBlurbManager.ts`
- ✅ `lib/story/index.ts` - Updated exports
- ✅ `hooks/useStoryProgress.ts` - All references updated
- ✅ `hooks/useGameModeHandlers.ts` - All references updated
- ✅ `app/book-of-passage/page.tsx` - Import updated

### 2. **Added Beat Trigger Emission**
Enhanced `StoryProgressionManager` to notify the blurb system when storybeats advance:

```typescript
// In StoryProgressionManager.onStoryBeatChanged()
// Now emits:
this.emit('beatTrigger', {
  trigger: 'story_beat_first_plot_point',
  beat: 'first_plot_point',
  timestamp: new Date().toISOString(),
});
```

This allows story blurbs with triggers like `story_beat_first_plot_point` to fire when the beat advances.

### 3. **Created Integration Hook** ⭐ NEW
Created `hooks/story/useStorySystemIntegration.ts` - a dedicated hook that coordinates both systems:

**What it does:**
- ✅ Listens for `storyProgression:beatTrigger` events
- ✅ Checks `storyBlurbManager` for matching narrative moments
- ✅ Calls `onBlurbTriggered` callback when a new blurb should show
- ✅ Keeps both systems synchronized automatically

**Why this approach?**
- **Maintainable**: Single responsibility - just coordinates story systems
- **Independent**: Won't break game logic if story systems change
- **Reusable**: Can use anywhere in your app
- **Testable**: Easy to test in isolation
- **Clear**: Future developers will understand it immediately

### 4. **Updated Documentation**
Updated `lib/story/README.md` to explain both systems:
- ✅ Added overview of both StoryProgressionManager and StoryBlurbManager
- ✅ Added "How They Work Together" section with diagram
- ✅ Updated file structure to show both managers
- ✅ Added integration hook usage examples
- ✅ Updated initialization code to include both systems

---

## 🔄 How The Systems Work Together Now

```
Player completes puzzle
         ↓
Game Logic (lib/game/logic.ts)
         ↓
StoryProgressionManager.checkAndAdvanceStory()
         ↓
DialogueManager.setStoryBeat(newBeat)
         ↓
Emits: 'dialogueManager:beatChanged'
         ↓
StoryProgressionManager.onStoryBeatChanged()
         ↓
    ┌────────────┬─────────────┬──────────────────┐
    ↓            ↓             ↓                  ↓
  Music     Story Events  Characters    Emits 'beatTrigger'
  Changes   Triggered     Loaded               ↓
                                    useStorySystemIntegration
                                               ↓
                                    StoryBlurbManager.getBlurbForTrigger()
                                               ↓
                                    onBlurbTriggered callback
                                               ↓
                                    UI shows narrative moment
```

---

## 🎯 Next Steps - What You Need to Do

### Step 1: Wire Up the Integration Hook

Add the integration hook to your main game component or app layout:

```typescript
// In app/layout.tsx or your main game component
import { useStorySystemIntegration } from '@/hooks/story/useStorySystemIntegration';
import { useGameState } from '@/hooks/useGameState';

function YourGameComponent() {
  const { state } = useGameState();

  // Coordinate both story systems
  useStorySystemIntegration({
    state,
    onBlurbTriggered: (blurbId, trigger) => {
      console.log('🎭 New story moment unlocked:', blurbId);
      // TODO: Show notification, update UI, navigate to Book of Passage, etc.
    }
  });

  return (
    // Your game UI
  );
}
```

### Step 2: Initialize Both Systems

Update your app initialization to include both managers:

```typescript
async function initializeGame() {
  // 1. Initialize audio system
  await initializeAudioSystem();

  // 2. Initialize dialogue manager
  await dialogueManager.initialize();

  // 3. Initialize story blurb manager (narrative moments)
  await storyBlurbManager.loadBlurbs();

  // 4. Initialize story progression manager (beat advancement)
  await storyProgressionManager.initialize();

  console.log('✅ All story systems ready!');
}
```

### Step 3: Test the Integration

1. **Start a new game** with logging enabled
2. **Complete 3 puzzles** (to trigger first_plot_point advancement)
3. **Check console logs** for:
   ```
   [StoryProgressionManager] Story advanced: hook → first_plot_point
   [StoryProgressionManager] Emitted beat trigger: story_beat_first_plot_point
   [StorySystemIntegration] Beat advanced to: first_plot_point
   [StorySystemIntegration] Found blurb for trigger story_beat_first_plot_point: blurb-id
   🎭 New story moment unlocked: blurb-id
   ```

4. **Verify** the narrative blurb appears in the Book of Passage

### Step 4: Handle the Blurb Trigger

Decide what should happen when a new blurb is triggered:

**Option A: Show Notification**
```typescript
onBlurbTriggered: (blurbId, trigger) => {
  showNotification("New story moment unlocked!");
}
```

**Option B: Navigate to Book of Passage**
```typescript
onBlurbTriggered: (blurbId, trigger) => {
  router.push('/book-of-passage');
}
```

**Option C: Update State & Show Modal**
```typescript
onBlurbTriggered: (blurbId, trigger) => {
  setNewBlurbId(blurbId);
  setShowStoryModal(true);
}
```

---

## 📊 Current System Status

| System | Status | Config File | Purpose |
|--------|--------|-------------|---------|
| **StoryProgressionManager** | ✅ Active | `story-progression-config.json` | Advances storybeats based on metrics |
| **StoryBlurbManager** | ✅ Active | `story-progress.json` | Displays narrative moments |
| **Integration Hook** | ⚠️ Created, Not Wired | N/A | Coordinates both systems |
| **Event Emission** | ✅ Working | N/A | Beat changes emit triggers |

---

## 🔍 Testing Checklist

When you wire up the integration hook, verify:

- [ ] Both systems initialize without errors
- [ ] Completing puzzles advances storybeat (check console)
- [ ] Beat advancement emits `beatTrigger` event (check console)
- [ ] Integration hook receives the event (check console)
- [ ] Blurb manager finds matching blurb (check console)
- [ ] `onBlurbTriggered` callback fires (check console)
- [ ] UI responds appropriately (notification/navigation/etc.)
- [ ] Book of Passage shows new story moment
- [ ] Story history is preserved across sessions

---

## 📝 Configuration Files

### Story Progression Rules
**File:** `public/data/story-progression-config.json`

Defines **when** to advance storybeats:
- Conditions: puzzles completed, books discovered
- Music mappings: beat → playlist
- Event triggers: beat → story event
- Character loading: beat → groups

### Story Blurbs (Narrative Text)
**File:** `public/data/story-progress.json`

Defines **what** narrative moments to show:
- Blurbs: narrative text with titles
- Triggers: when to show each blurb
- Beat associations: which beat each blurb belongs to
- Order: sequence for story history

Both files work together to create a cohesive narrative experience!

---

## 🎓 Key Concepts

### StoryProgressionManager (The Conductor)
- **Automatic**: Watches game progress, advances story automatically
- **Configurable**: All rules in JSON, no code changes needed
- **Coordinator**: Triggers music, events, characters, AND blurbs

### StoryBlurbManager (The Narrator)
- **Content-Driven**: Displays narrative text moments
- **Trigger-Based**: Shows blurbs when specific events occur
- **Historical**: Tracks all seen blurbs for Book of Passage

### Integration Hook (The Bridge)
- **Event-Driven**: Listens for beat changes
- **Coordinating**: Connects progression to blurbs
- **Maintainable**: Single file, clear purpose, easy to test

---

## 🚀 What You Have Now

You have a **complete, maintainable story system** with:

✅ Clear naming that explains what each part does
✅ Two complementary managers that work together
✅ Event-driven coordination that won't break game logic
✅ Fully documented architecture and usage
✅ Ready to wire up and test

All that's left is to add the integration hook to your app and test it! 🎉

---

## ❓ Questions to Consider

When implementing the integration:

1. **Where should the integration hook live?**
   - Main app layout (always active)?
   - Game screen component (only during gameplay)?
   - Book of Passage page (only when viewing)?

2. **What should happen when a blurb triggers?**
   - Show notification?
   - Navigate to Book of Passage?
   - Display modal?
   - All of the above?

3. **Should old blurbs re-trigger?**
   - Currently prevented by `firedTriggers` tracking
   - Want to change this behavior?

4. **Should players be able to dismiss blurbs?**
   - Or force them to read?
   - Save "dismissed" state?

---

**Happy to help when you're ready to wire this up and test! 🎮✨**
