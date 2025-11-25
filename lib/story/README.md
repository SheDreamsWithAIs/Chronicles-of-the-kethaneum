# Story System

**A configurable narrative engine for Chronicles of the Kethaneum**

## 🎯 Overview

The Story System consists of **two complementary managers** that work together to create a dynamic narrative experience:

### 1. **StoryProgressionManager** - The Conductor
Automatically advances the story based on player progress (puzzles completed, books discovered). It:
- ✅ Monitors game metrics
- ✅ Checks progression rules
- ✅ Advances storybeats when conditions are met
- ✅ Triggers music changes, events, and character loading

### 2. **StoryBlurbManager** - The Narrator
Displays narrative text moments (blurbs) when specific triggers fire. It:
- ✅ Shows story moments as player progresses
- ✅ Tracks which blurbs have been seen
- ✅ Provides story history for Book of Passage
- ✅ Responds to both game events and storybeat changes

### How They Work Together

```
Player completes puzzle
         ↓
    Game Logic
         ↓
StoryProgressionManager ← Checks progression rules
         ↓
    Advances storybeat
         ↓
    Emits beatTrigger event
         ↓
StoryBlurbManager ← Checks for matching blurbs
         ↓
    Shows narrative moment
```

### Design Philosophy

- **Configurable**: All rules defined in JSON files
- **Modular**: Systems remain independent
- **Coordinated**: Managers communicate via events
- **Reusable**: Clone repo + swap config = new game

## 🏗️ Architecture

```
Player Action (puzzle completed)
         ↓
    Game Logic
         ↓
  StoryProgressionManager ← Checks progression rules
         ↓
    ┌────┴────┬─────────┬──────────┬──────────────┐
    ↓         ↓         ↓          ↓              ↓
Dialogue  StoryBeats  Music   Characters   StoryBlurbManager
Manager     Events   System   Loading      (narrative text)
```

## 📁 File Structure

```
lib/story/
├── StoryProgressionManager.ts  # Advances storybeats (The Conductor)
├── storyBlurbManager.ts        # Displays narrative blurbs (The Narrator)
├── types.ts                     # TypeScript definitions for both systems
├── index.ts                     # Exports both managers
└── README.md                    # This file

public/data/
├── story-progression-config.json  # ⭐ Storybeat progression rules
└── story-progress.json            # ⭐ Narrative blurbs and triggers

hooks/story/
├── useStoryProgression.ts         # React hook for StoryProgressionManager
├── useStoryProgress.ts            # React hook for StoryBlurbManager
└── useStorySystemIntegration.ts   # ⭐ Coordinates both systems

lib/audio/
└── initializeAudio.ts             # Audio setup utility
```

## ⚙️ Configuration

### Story Progression Config (`public/data/story-progression-config.json`)

This is where you define YOUR game's narrative structure.

#### Progression Rules

Define when to advance from one storybeat to another:

```json
{
  "id": "hook_to_first_plot_point",
  "fromBeat": "hook",
  "toBeat": "first_plot_point",
  "description": "Player has completed the tutorial",
  "conditions": {
    "completedPuzzles": { "min": 3 },
    "discoveredBooks": { "min": 1 }
  },
  "priority": 1
}
```

**Conditions**:
- `completedPuzzles`: Number of puzzles player has finished
- `discoveredBooks`: Number of unique Kethaneum books found
- `completedBooks`: Number of books fully completed
- All conditions must be met for rule to trigger

#### Music Mapping

Map storybeats to audio playlists:

```json
"musicMapping": {
  "beatToPlaylist": {
    "hook": "act1",
    "first_plot_point": "act1",
    "midpoint": "act2",
    "climax": "act3"
  },
  "fadeDuration": 2000
}
```

#### Story Event Triggers

Trigger story events when entering storybeats:

```json
"storyEventTriggers": {
  "beatToEvent": {
    "hook": "first-visit",
    "first_plot_point": "mentor-appears",
    "climax": "final-confrontation"
  },
  "onlyTriggerOnce": true
}
```

#### Character Group Loading

Load character groups at specific storybeats:

```json
"characterGroupLoading": {
  "loadOnBeat": {
    "hook": ["introduction_characters"],
    "first_plot_point": ["regular_contacts"],
    "midpoint": ["visiting_scholars"]
  }
}
```

#### Settings

```json
"settings": {
  "enableAutoProgression": true,      // Auto-advance story
  "allowManualOverride": true,        // Allow manual beat changes
  "enableLogging": true,              // Console logging
  "checkProgressionOnPuzzleComplete": true,
  "checkProgressionOnBookDiscovered": true
}
```

## 🚀 Usage

### In Your App Initialization

```typescript
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import { storyProgressionManager, storyBlurbManager } from '@/lib/story';
import { initializeAudioSystem } from '@/lib/audio/initializeAudio';

async function initializeGame() {
  // 1. Initialize audio system (playlists)
  await initializeAudioSystem();

  // 2. Initialize dialogue manager (characters)
  await dialogueManager.initialize();

  // 3. Initialize story blurb manager (narrative moments)
  await storyBlurbManager.loadBlurbs();

  // 4. Initialize story progression manager (beat advancement)
  await storyProgressionManager.initialize();

  console.log('✅ All story systems ready!');
}
```

### Coordinate Both Systems

Use the integration hook to ensure both systems work together:

```typescript
import { useStorySystemIntegration } from '@/hooks/story/useStorySystemIntegration';
import { useGameState } from '@/hooks/useGameState';

function YourGameComponent() {
  const { state } = useGameState();

  // This hook coordinates StoryProgressionManager + StoryBlurbManager
  useStorySystemIntegration({
    state,
    onBlurbTriggered: (blurbId, trigger) => {
      console.log('New story moment unlocked:', blurbId);
      // Show notification, update UI, etc.
    }
  });

  return <YourGameUI />;
}
```

**What this does:**
1. Listens for storybeat changes from `StoryProgressionManager`
2. When a beat advances, checks `StoryBlurbManager` for matching blurbs
3. Calls `onBlurbTriggered` when a new narrative moment should show
4. Keeps both systems perfectly synchronized

### In React Components

```typescript
import { useStoryProgression } from '@/hooks/story/useStoryProgression';

function GameComponent() {
  const {
    isInitialized,
    currentBeat,
    initialize,
    setAutoProgression
  } = useStoryProgression();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div>
      <p>Current Story: {currentBeat}</p>
      <button onClick={() => setAutoProgression(false)}>
        Pause Story
      </button>
    </div>
  );
}
```

### Story Progression Happens Automatically

When a puzzle completes, the system automatically:

1. ✅ Checks current metrics (puzzles, books)
2. ✅ Evaluates progression rules
3. ✅ Advances storybeat if conditions met
4. ✅ Updates music playlist
5. ✅ Triggers story events
6. ✅ Loads new character groups

**You don't need to do anything!** It's all wired up in `lib/game/logic.ts`.

### Manual Control (for testing)

```typescript
// Manually set storybeat
storyProgressionManager.setStorybeat('midpoint');

// Disable auto-progression
storyProgressionManager.setAutoProgression(false);

// Check status
const status = storyProgressionManager.getStatus();
console.log(status.currentBeat);
console.log(status.triggeredEvents);
```

## 🎮 Creating a New Game

Want to use this system for a different game? Here's how:

### 1. Clone the Repository

```bash
git clone your-game-repo
cd your-game-repo
```

### 2. Replace Content Files

Replace these files with your own content:

#### `/public/data/story-progression-config.json`
- Define YOUR storybeats and progression rules
- Map YOUR music to story moments
- Configure YOUR character groups

#### `/public/data/dialogue-config.json`
- Update character groups
- Adjust storybeat definitions if needed

#### `/public/data/characters/`
- Replace with YOUR character files
- Update `character-manifest.json`

#### `/public/data/story-events/`
- Create YOUR story event sequences

#### `/lib/audio/playlistConfig.ts`
- Update playlist tracks with YOUR music files
- Adjust act/mood playlists

### 3. Adjust Puzzle Content

#### `/public/data/puzzles/`
- Add YOUR puzzle files
- Organize by genre/category

### 4. That's It!

The **entire system works with your new content** without touching any core code!

## 📊 Storybeat Flow

The default storybeat structure (configurable):

```
hook (tutorial/intro)
  ↓
first_plot_point (story begins)
  ↓
first_pinch_point (first challenge)
  ↓
midpoint (turning point)
  ↓
second_pinch_point (raising stakes)
  ↓
second_plot_point (final approach)
  ↓
climax (peak conflict)
  ↓
resolution (ending)
```

You can **rename these** or **add new beats** by updating:
- `lib/dialogue/types.ts` (StoryBeat type)
- `story-progression-config.json` (rules)
- `dialogue-config.json` (beat definitions)

## 🎵 Music System Integration

The system automatically switches music when storybeats change:

1. Player completes puzzles
2. Story advances to new beat
3. Music fades out (configurable duration)
4. New playlist starts based on mapping
5. Seamless transition!

Configure in `story-progression-config.json`:

```json
"musicMapping": {
  "beatToPlaylist": {
    "hook": "calm-intro",
    "climax": "intense-battle"
  },
  "fadeDuration": 2000  // milliseconds
}
```

## 🎭 Story Events

Story events are **automatically triggered** when entering new storybeats:

```json
"storyEventTriggers": {
  "beatToEvent": {
    "hook": "first-visit",
    "midpoint": "revelation",
    "climax": "final-stand"
  },
  "onlyTriggerOnce": true
}
```

The system:
- Checks for configured event when beat changes
- Emits `storyProgression:storyEventTriggered` event
- Your UI can listen and display the event
- Tracks triggered events (won't repeat if `onlyTriggerOnce: true`)

## 👥 Character Management

Characters load automatically based on storybeat:

```json
"characterGroupLoading": {
  "loadOnBeat": {
    "hook": ["introduction_characters"],
    "midpoint": ["visiting_scholars"],
    "climax": ["final_allies"]
  }
}
```

Characters defined in `/public/data/characters/` with properties:
- `loadingGroup`: Which group they belong to
- `retireAfter`: When they leave the story
- `availableFrom`/`availableUntil`: Dialogue availability

## 🐛 Debugging

### Enable Logging

In `story-progression-config.json`:

```json
"settings": {
  "enableLogging": true
}
```

Check console for:
- `[StoryProgressionManager]` - System events
- `[Story Progression]` - Advancement notifications
- `[Audio]` - Music system events

### Check Status

```typescript
const status = storyProgressionManager.getStatus();
console.log('Current beat:', status.currentBeat);
console.log('Auto-progression:', status.autoProgressionEnabled);
console.log('Triggered events:', status.triggeredEvents);
console.log('Loaded groups:', status.loadedCharacterGroups);
```

### Events to Listen For

```typescript
// Story progression changed
document.addEventListener('storyProgression:storyProgressionChanged', (e) => {
  console.log('Story advanced:', e.detail);
});

// Story event triggered
document.addEventListener('storyProgression:storyEventTriggered', (e) => {
  console.log('Event triggered:', e.detail);
});

// Storybeat changed (from DialogueManager)
document.addEventListener('dialogueManager:beatChanged', (e) => {
  console.log('Beat changed:', e.detail);
});
```

## 🧪 Testing

### Test Story Progression

1. Lower thresholds in config for faster testing:

```json
{
  "conditions": {
    "completedPuzzles": { "min": 1 },  // Was 3
    "discoveredBooks": { "min": 1 }    // Was 2
  }
}
```

2. Complete a puzzle and check logs
3. Verify beat advancement
4. Check music changes
5. Verify events triggered

### Manual Testing

```typescript
// Skip to specific beat
storyProgressionManager.setStorybeat('climax');

// Reset triggered events
storyProgressionManager.resetTriggeredEvents();

// Disable auto-progression to test manually
storyProgressionManager.setAutoProgression(false);
```

## 📝 Example: Full Integration

```typescript
// app/layout.tsx or _app.tsx
import { useEffect } from 'react';
import { useDialogue } from '@/hooks/dialogue/useDialogue';
import { useStoryProgression } from '@/hooks/story/useStoryProgression';
import { initializeAudioSystem } from '@/lib/audio/initializeAudio';

export default function RootLayout({ children }) {
  const dialogue = useDialogue();
  const story = useStoryProgression();

  useEffect(() => {
    async function init() {
      // Initialize all systems
      await initializeAudioSystem();
      await dialogue.initialize();
      await story.initialize();

      console.log('All systems initialized!');
      console.log('Current storybeat:', story.currentBeat);
    }

    init();
  }, []);

  return (
    <div>
      {children}
    </div>
  );
}
```

## 🎓 Summary

This system gives you:

✅ **Configurable story progression** - JSON, not code
✅ **Automatic music changes** - Based on story moments
✅ **Event triggering** - Story events at right times
✅ **Character management** - Load/unload based on story
✅ **Reusable engine** - Build multiple games from one codebase

## 🆘 Troubleshooting

**Story not advancing?**
- Check `enableAutoProgression: true` in config
- Verify conditions are met (check console logs)
- Ensure story progression manager is initialized

**Music not playing?**
- Check audio system is initialized
- Verify playlist exists in `playlistConfig.ts`
- Check console for audio errors
- Ensure browser allows audio (user interaction needed)

**Events not triggering?**
- Check `beatToEvent` mapping in config
- Verify event files exist in `/public/data/story-events/`
- Check if `onlyTriggerOnce: true` and event already played

**Characters not loading?**
- Verify character group in `loadOnBeat` config
- Check character files exist
- Ensure `character-manifest.json` includes characters

---

**Need help?** The system is designed to be self-documenting. Read the config file comments and check console logs with `enableLogging: true`.
