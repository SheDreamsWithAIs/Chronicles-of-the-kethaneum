# Story Progression System - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Initialize the Systems

Find your app's main initialization point (usually `app/layout.tsx`, `_app.tsx`, or a main game component) and add:

```typescript
import { useEffect, useState } from 'react';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import { storyProgressionManager } from '@/lib/story/StoryProgressionManager';
import { initializeAudioSystem } from '@/lib/audio/initializeAudio';

function YourMainComponent() {
  const [systemsReady, setSystemsReady] = useState(false);

  useEffect(() => {
    async function initializeSystems() {
      console.log('Initializing game systems...');

      // 1. Initialize audio system (registers playlists)
      await initializeAudioSystem();

      // 2. Initialize dialogue manager (loads characters)
      await dialogueManager.initialize();

      // 3. Initialize story progression manager (loads rules)
      await storyProgressionManager.initialize();

      setSystemsReady(true);
      console.log('✅ All systems initialized!');
    }

    initializeSystems();
  }, []);

  if (!systemsReady) {
    return <div>Loading...</div>;
  }

  return <YourGameContent />;
}
```

### Step 2: Configure Your Story Rules

Edit `/public/data/story-progression-config.json`:

```json
{
  "progressionRules": [
    {
      "id": "hook_to_first_plot_point",
      "fromBeat": "hook",
      "toBeat": "first_plot_point",
      "conditions": {
        "completedPuzzles": { "min": 3 },
        "discoveredBooks": { "min": 1 }
      },
      "priority": 1
    }
  ],
  "musicMapping": {
    "beatToPlaylist": {
      "hook": "act1",
      "first_plot_point": "act1",
      "midpoint": "act2",
      "climax": "act3"
    }
  }
}
```

### Step 3: That's It!

The system is now active! When players complete puzzles:

1. ✅ Game logic updates stats
2. ✅ Story progression manager checks rules
3. ✅ Story advances when conditions met
4. ✅ Music changes automatically
5. ✅ Events trigger
6. ✅ Characters load

## 🎮 What Happens Behind the Scenes

```
Player completes puzzle
         ↓
lib/game/logic.ts (endGame function)
         ↓
Calls storyProgressionManager.checkAndAdvanceStory()
         ↓
Checks rules in story-progression-config.json
         ↓
If conditions met:
  - Sets new storybeat in DialogueManager
  - Triggers music playlist change
  - Loads new character groups
  - Triggers story event (if configured)
```

## 🔧 Configuration Files

### Files You'll Edit for Your Game

1. **`/public/data/story-progression-config.json`** ⭐
   - Story advancement rules
   - Music mappings
   - Event triggers
   - Character loading schedule

2. **`/lib/audio/playlistConfig.ts`**
   - Music playlist definitions
   - Track lists for each act

3. **`/public/data/characters/`**
   - Character dialogue files
   - Character groups

4. **`/public/data/story-events/`**
   - Story event sequences

### Files You Won't Touch

- `/lib/story/StoryProgressionManager.ts` - Core engine
- `/lib/game/logic.ts` - Already wired up
- `/lib/dialogue/DialogueManager.ts` - Already works

## 📊 Testing Your Setup

### 1. Check Console Logs

With `enableLogging: true` in config, you'll see:

```
[Audio] Initializing audio system...
[Audio] Registered playlist: Act 1: The Beginning
[StoryProgressionManager] Configuration loaded
[StoryProgressionManager] Story advanced: hook → first_plot_point
[Story Progression] Player has completed the tutorial
```

### 2. Complete a Few Puzzles

- Play 3 puzzles
- Check console for story advancement
- Listen for music change
- Verify dialogue changes

### 3. Manual Testing

Open browser console:

```javascript
// Check current status
storyProgressionManager.getStatus()

// Manually advance story (for testing)
storyProgressionManager.setStorybeat('climax')

// Disable auto-progression
storyProgressionManager.setAutoProgression(false)
```

## 🎵 Setting Up Music

### 1. Add Your Audio Files

Place music files in `/public/audio/music/`:

```
/public/audio/music/
  ├── act1/
  │   ├── intro.mp3
  │   └── discovery.mp3
  ├── act2/
  │   └── journey.mp3
  └── act3/
      └── climax.mp3
```

### 2. Update Playlist Config

Edit `/lib/audio/playlistConfig.ts`:

```typescript
export const ACT1_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'act1-intro',
    src: '/audio/music/act1/intro.mp3',
    title: 'Mysterious Beginning'
  }
];
```

### 3. Map to Storybeats

In `story-progression-config.json`:

```json
"musicMapping": {
  "beatToPlaylist": {
    "hook": "act1",
    "climax": "act3"
  }
}
```

That's it! Music changes automatically when story progresses.

## 👥 Character System

Characters automatically load based on story progress:

### In Character Files (`/public/data/characters/`)

```json
{
  "character": {
    "id": "mentor",
    "loadingGroup": "regular_contacts",
    "retireAfter": "never"
  },
  "banterDialogue": [
    {
      "text": "Welcome to the library!",
      "availableFrom": "hook",
      "availableUntil": "first_plot_point"
    }
  ]
}
```

### In Story Progression Config

```json
"characterGroupLoading": {
  "loadOnBeat": {
    "hook": ["introduction_characters"],
    "first_plot_point": ["regular_contacts"]
  }
}
```

When story reaches `first_plot_point`, the mentor loads automatically!

## 🎭 Story Events

### 1. Create Event File

`/public/data/story-events/mentor-appears.json`:

```json
{
  "storyEvent": {
    "id": "mentor-appears",
    "title": "The Mentor Arrives",
    "storyBeat": "first_plot_point"
  },
  "dialogue": [
    {
      "sequence": 1,
      "speaker": "mentor",
      "text": "I've been watching your progress...",
      "emotion": ["wise", "encouraging"]
    }
  ]
}
```

### 2. Configure Trigger

In `story-progression-config.json`:

```json
"storyEventTriggers": {
  "beatToEvent": {
    "first_plot_point": "mentor-appears"
  }
}
```

### 3. Listen in Your UI

```typescript
useEffect(() => {
  const handleEvent = (event) => {
    console.log('Story event:', event.detail.eventId);
    // Show your story event UI
  };

  document.addEventListener(
    'storyProgression:storyEventTriggered',
    handleEvent
  );

  return () => {
    document.removeEventListener(
      'storyProgression:storyEventTriggered',
      handleEvent
    );
  };
}, []);
```

## 🐛 Common Issues

### Story Not Advancing

**Problem**: Completed puzzles but story doesn't advance

**Solutions**:
- Check `enableAutoProgression: true` in config
- Verify puzzle completion increments `completedPuzzles`
- Check console logs for conditions
- Lower thresholds for testing:
  ```json
  "conditions": { "completedPuzzles": { "min": 1 } }
  ```

### Music Not Playing

**Problem**: Story advances but no music

**Solutions**:
- Check browser console for audio errors
- Verify files exist at specified paths
- Check browser autoplay policy (need user interaction)
- Verify playlist registered:
  ```javascript
  audioManager.getPlaylists()
  ```

### Events Not Triggering

**Problem**: Story event doesn't show

**Solutions**:
- Check event file exists
- Verify `beatToEvent` mapping
- Check `onlyTriggerOnce` - may have already played
- Listen for event emission:
  ```javascript
  document.addEventListener('storyProgression:storyEventTriggered', console.log);
  ```

## 📝 Adjusting for Your Game

### Lower Difficulty (Faster Progression)

```json
{
  "conditions": {
    "completedPuzzles": { "min": 2 },  // Lower threshold
    "discoveredBooks": { "min": 1 }
  }
}
```

### Higher Difficulty (Slower Progression)

```json
{
  "conditions": {
    "completedPuzzles": { "min": 10 },  // Higher threshold
    "discoveredBooks": { "min": 3 }
  }
}
```

### Add New Metrics

1. Track in `lib/game/state.ts`
2. Update in `lib/game/logic.ts` (endGame)
3. Add to progression check:
   ```typescript
   const metrics = {
     completedPuzzles: newState.completedPuzzles,
     discoveredBooks: newState.discoveredBooks.size,
     yourNewMetric: newState.yourNewMetric  // Add here
   };
   ```
4. Use in rules:
   ```json
   "conditions": {
     "yourNewMetric": { "min": 5 }
   }
   ```

## 🎯 Next Steps

1. ✅ Initialize the systems
2. ✅ Test with default config
3. ✅ Adjust thresholds for your game
4. ✅ Add your music files
5. ✅ Create character dialogue
6. ✅ Design story events
7. ✅ Polish and balance

## 📚 Full Documentation

See `/lib/story/README.md` for complete documentation including:
- Detailed API reference
- Advanced configuration
- Creating new games from this engine
- Architecture deep dive

---

**You're all set!** The story progression system is now managing your game's narrative flow. Focus on creating great content - the engine handles the rest. 🚀
