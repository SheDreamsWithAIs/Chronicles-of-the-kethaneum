# Audio Testing Tool - Development Plan

## Overview

A standalone development tool for testing and validating the game's audio system. This tool will allow developers to test audio configurations, validate audio playback across different game contexts, and experiment with audio combinations before implementing them in the game.

**Location:** `/app/tools/audio-test/page.tsx`

**Purpose:** Provide comprehensive control over the audio system for development, testing, and quality assurance.

---

## Requirements

### Functional Requirements

1. **Story Beat Control**
   - Select and set the current story beat
   - Update the game's event system to reflect the selected beat
   - Display current story beat state

2. **Page/Context Simulation**
   - Simulate different game pages (Title, Library, Puzzle, Backstory)
   - Select game mode (Story, Puzzle-Only, Beat-the-Clock)
   - Show recommended audio for the selected context

3. **Multi-Channel Audio Playback**
   - Support all 4 audio categories:
     - Music (background music with playlists)
     - Ambient (environmental sounds)
     - SFX (sound effects with overlap support)
     - Voice (dialogue and voice lines)
   - Play multiple channels simultaneously
   - Independent control for each channel

4. **Volume Management**
   - Master volume control affecting all channels
   - Individual volume controls for each category
   - Mute toggles for master and each category
   - Visual feedback for volume levels

5. **Playlist Testing**
   - Load and test configured playlists
   - Control playback (play, pause, next, previous)
   - Switch between playlist modes (sequential, shuffle, repeat one, repeat all)
   - Display current track and playlist information

---

## System Architecture

### Audio System Overview

**Core Components:**
- `AudioManager` (`lib/audio/audioManager.ts`) - Singleton managing all audio playback
- `AudioProvider` (`components/AudioProvider.tsx`) - React context provider
- `useAudio()` hook (`hooks/useAudio.ts`) - React integration
- Playlist configurations (`lib/audio/playlistConfig.ts`)

**Audio Categories:**
```typescript
enum AudioCategory {
  MUSIC = 'music',    // Background music (loops, crossfades)
  AMBIENT = 'ambient', // Environmental sounds (loops)
  SFX = 'sfx',        // Sound effects (one-shot, can overlap)
  VOICE = 'voice',    // Voice lines and dialogue
}
```

**Default Volume Settings:**
- Master: 70%
- Music: 80%
- Ambient: 60%
- SFX: 70%
- Voice: 100%

### Story Beat System

**Available Story Beats:**
1. `hook` - Introduction
2. `first_plot_point` - First major event
3. `first_pinch_point` - First challenge
4. `midpoint` - Middle turning point
5. `second_pinch_point` - Second challenge
6. `second_plot_point` - Second major event
7. `climax` - Peak action
8. `resolution` - Conclusion

**Integration:**
- Story beats are defined in `lib/dialogue/types.ts`
- Managed by `DialogueManager` (`lib/dialogue/DialogueManager.ts`)
- Can be set via `setStoryBeat(newStoryBeat: StoryBeat)`

### Game Pages

**Available Pages:**
- **Title Screen** (`/`) - Menu music, intro ambient
- **Backstory** (`/backstory`) - Intro/narrative audio
- **Library** (`/library`) - Library ambient, character voices
- **Puzzle** (`/puzzle`) - Gameplay music, timer SFX, word-find effects

**Game Modes:** (Puzzle page only)
- Story Mode - Full narrative experience
- Puzzle-Only Mode - Pure puzzle gameplay
- Beat-the-Clock Mode - Timed challenges

---

## File Structure

```
app/tools/audio-test/
├── page.tsx                      # Main testing page component
├── components/
│   ├── StoryBeatSelector.tsx     # Story beat dropdown selector
│   ├── PageSimulator.tsx         # Page and game mode selector
│   ├── AudioChannelPanel.tsx     # Individual audio channel control
│   ├── PlaylistController.tsx    # Playlist testing interface
│   ├── MasterControls.tsx        # Master volume and emergency controls
│   ├── FileBrowser.tsx           # Audio file browser and selector
│   ├── VolumeSlider.tsx          # Reusable volume slider component
│   └── ActiveAudioStatus.tsx     # Display current audio state
└── lib/
    ├── audioTestState.ts         # State management for the tool
    └── audioRecommendations.ts   # Page/beat → audio mapping logic
```

---

## Component Specifications

### 1. StoryBeatSelector Component

**Purpose:** Allow selection and updating of the current story beat.

**Props:**
```typescript
interface StoryBeatSelectorProps {
  currentBeat: StoryBeat;
  onBeatChange: (beat: StoryBeat) => void;
}
```

**Features:**
- Dropdown with all 8 story beats
- Clear labels with descriptions
- Visual indicator of current selection
- Updates DialogueManager when changed

**UI:**
```
┌─────────────────────────────┐
│ Story Beat:              ▼ │
│ ┌─────────────────────────┐ │
│ │ Hook                    │ │
│ │ First Plot Point        │ │
│ │ First Pinch Point       │ │
│ │ ● Midpoint             │ │  ← Currently selected
│ │ Second Pinch Point      │ │
│ │ Second Plot Point       │ │
│ │ Climax                  │ │
│ │ Resolution              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

### 2. PageSimulator Component

**Purpose:** Simulate different game pages and contexts.

**Props:**
```typescript
interface PageSimulatorProps {
  selectedPage: 'menu' | 'library' | 'puzzle' | 'intro';
  selectedGameMode: 'story' | 'puzzle-only' | 'beat-the-clock';
  onPageChange: (page: string) => void;
  onGameModeChange: (mode: string) => void;
}
```

**Features:**
- Page selector dropdown
- Game mode selector (visible only when Puzzle page selected)
- Display recommended audio configuration
- Show context information

**UI:**
```
┌──────────────────────────────────────────────────┐
│ Page Context                                     │
│ ┌──────────────┐  ┌────────────────────────┐   │
│ │ Page:     ▼ │  │ Game Mode:          ▼ │   │
│ │ Puzzle       │  │ Story Mode             │   │
│ └──────────────┘  └────────────────────────┘   │
│                                                  │
│ 💡 Recommended Audio:                           │
│    Music: Act 2 Playlist                        │
│    Ambient: Puzzle Ambience                     │
│    [Load Recommended]                           │
└──────────────────────────────────────────────────┘
```

---

### 3. AudioChannelPanel Component

**Purpose:** Control individual audio channels (reusable for all 4 categories).

**Props:**
```typescript
interface AudioChannelPanelProps {
  category: AudioCategory;
  currentFile: string | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFileSelect: (filePath: string) => void;
  loop?: boolean;
  onLoopToggle?: () => void;
}
```

**Features:**
- Category label and icon
- Current file display
- Playback controls (Play, Pause, Stop)
- Loop toggle (for Music and Ambient)
- Volume slider (0-100%)
- Mute toggle
- File browser button
- Playback status indicator
- Progress bar (for Music and Voice)

**Variants by Category:**

**Music/Ambient:**
```
┌──────────────────────────────┐
│ 🎵 MUSIC                     │
│ ─────────────────────────    │
│ File: act2-adventure.mp3     │
│ ████████░░░░░░░░ 2:34 / 4:12│
│ [▶] [⏸] [■] [🔁 Loop]       │
│ Volume: ████████░░ 80%       │
│ [🔇 Mute] [📁 Browse]        │
└──────────────────────────────┘
```

**SFX:** (Multiple quick-play buttons)
```
┌──────────────────────────────┐
│ 🔊 SFX                       │
│ ─────────────────────────    │
│ Quick Play:                  │
│ [Page Turn] [Word Found]     │
│ [Timer Tick] [Puzzle Done]   │
│ [Error] [Success]            │
│                              │
│ Custom: [📁 Browse & Play]   │
│ Volume: ███████░░░ 70%       │
│ [🔇 Mute]                    │
└──────────────────────────────┘
```

**Voice:**
```
┌──────────────────────────────┐
│ 🎙️ VOICE                     │
│ ─────────────────────────    │
│ File: lumina-greeting.mp3    │
│ ████████████░░░░ 3:12 / 4:05│
│ [▶] [⏸] [■]                 │
│ Volume: ██████████ 100%      │
│ [🔇 Mute] [📁 Browse]        │
└──────────────────────────────┘
```

---

### 4. PlaylistController Component

**Purpose:** Test playlist functionality and playback modes.

**Props:**
```typescript
interface PlaylistControllerProps {
  playlists: Playlist[];
  activePlaylist: string | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  playlistMode: PlaylistMode;
  onPlaylistSelect: (playlistId: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onModeChange: (mode: PlaylistMode) => void;
}
```

**Features:**
- Playlist selector dropdown
- Playback controls (Play, Pause, Next, Previous)
- Playlist mode selector
- Track list display with current track highlighted
- Current track information
- Auto-advance toggle

**UI:**
```
┌────────────────────────────────────────────────────┐
│ 📻 PLAYLIST CONTROLLER                             │
│ ─────────────────────────────────────────────────  │
│ Playlist: [Act 2: The Journey ▼]                  │
│ Mode: [Repeat All ▼] ☑ Auto-advance              │
│                                                    │
│ [⏮] [▶] [⏭]                                      │
│                                                    │
│ Now Playing: Track 2 of 5                         │
│ ♫ act2-adventure.mp3                              │
│                                                    │
│ Track List:                                        │
│ ┌────────────────────────────────────────────┐   │
│ │ 1. act2-mystery.mp3                        │   │
│ │ 2. ▶ act2-adventure.mp3  ← Now Playing    │   │
│ │ 3. act2-tension.mp3                        │   │
│ │ 4. act2-wonder.mp3                         │   │
│ │ 5. act2-discovery.mp3                      │   │
│ └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

### 5. MasterControls Component

**Purpose:** Overall audio control and emergency functions.

**Props:**
```typescript
interface MasterControlsProps {
  masterVolume: number;
  masterMuted: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
  onStopAll: () => void;
  onResetDefaults: () => void;
}
```

**Features:**
- Master volume slider
- Master mute toggle
- Stop all audio button (emergency stop)
- Reset to defaults button
- Visual feedback for overall audio state

**UI:**
```
┌──────────────────────────────────────────────┐
│ 🎛️ MASTER CONTROLS                          │
│ ───────────────────────────────────────────  │
│ Master Volume: ███████░░░ 70%               │
│ [🔇 Mute All]                               │
│                                              │
│ [🛑 Stop All Audio] [↺ Reset to Defaults]  │
└──────────────────────────────────────────────┘
```

---

### 6. FileBrowser Component

**Purpose:** Browse and select audio files from the public directory.

**Props:**
```typescript
interface FileBrowserProps {
  category: AudioCategory;
  onFileSelect: (filePath: string) => void;
  onClose: () => void;
}
```

**Features:**
- Modal/drawer interface
- Directory tree navigation
- File list filtered by category
- Preview/play sample button
- Recent files list
- Search/filter functionality

**UI:**
```
┌────────────────────────────────────────┐
│ 📁 Select Audio File - Music           │
│ ────────────────────────────────────── │
│ 🔍 [Search files...]                   │
│                                        │
│ Recent Files:                          │
│ • act2-adventure.mp3                   │
│ • menu-theme.mp3                       │
│                                        │
│ Browse:                                │
│ 📂 music/                              │
│   📂 act1/                             │
│   📂 act2/                             │
│     📄 act2-mystery.mp3      [▶]      │
│     📄 act2-adventure.mp3    [▶]      │
│     📄 act2-tension.mp3      [▶]      │
│   📂 act3/                             │
│   📂 menu/                             │
│   📂 puzzle/                           │
│                                        │
│ [Cancel] [Select File]                │
└────────────────────────────────────────┘
```

---

### 7. ActiveAudioStatus Component

**Purpose:** Display current state of all audio channels.

**Props:**
```typescript
interface ActiveAudioStatusProps {
  musicState: AudioState;
  ambientState: AudioState;
  sfxState: AudioState[];
  voiceState: AudioState;
  playlistState: PlaylistState | null;
}

interface AudioState {
  isActive: boolean;
  fileName: string | null;
  isPlaying: boolean;
  volume: number;
}
```

**Features:**
- Visual indicators for each channel
- Current file names
- Playback state
- Active SFX count
- Playlist information

**UI:**
```
┌────────────────────────────────────────────────┐
│ 📊 ACTIVE AUDIO STATUS                        │
│ ──────────────────────────────────────────────│
│ 🎵 Music: ▶ Playing (act2-adventure.mp3)     │
│ 🌊 Ambient: ▶ Playing (library-ambient.mp3)  │
│ 🔊 SFX: 2 active (word-found.mp3, page.mp3)  │
│ 🎙️ Voice: ⏸ Idle                             │
│ 📻 Playlist: Act 2 (Track 2/5, Repeat All)   │
└────────────────────────────────────────────────┘
```

---

## State Management

### AudioTestState Interface

```typescript
interface AudioTestState {
  // Context Simulation
  selectedStoryBeat: StoryBeat;
  selectedPage: 'menu' | 'library' | 'puzzle' | 'intro';
  selectedGameMode: 'story' | 'puzzle-only' | 'beat-the-clock';

  // Active Audio Files
  activeMusic: string | null;
  activeAmbient: string | null;
  activeSFX: string[];
  activeVoice: string | null;
  activePlaylist: string | null;

  // Playback State
  musicPlaying: boolean;
  musicLoop: boolean;
  ambientPlaying: boolean;
  ambientLoop: boolean;
  playlistPlaying: boolean;
  currentPlaylistTrack: number;
  playlistMode: PlaylistMode;

  // Volume Settings (for testing overrides)
  volumeOverrides: {
    master: number | null;
    music: number | null;
    ambient: number | null;
    sfx: number | null;
    voice: number | null;
  };

  // Mute State
  muteOverrides: {
    master: boolean | null;
    music: boolean | null;
    ambient: boolean | null;
    sfx: boolean | null;
    voice: boolean | null;
  };

  // UI State
  showFileBrowser: boolean;
  fileBrowserCategory: AudioCategory | null;
  recentFiles: Map<AudioCategory, string[]>;
}
```

### State Persistence

**Local Storage Keys:**
- `audio-test-recent-files` - Recent file selections per category
- `audio-test-last-config` - Last used configuration (optional)

---

## Audio Recommendations System

### Recommendation Mapping

Create a mapping system that suggests audio configurations based on page and story beat combinations.

**File:** `lib/audio-test/audioRecommendations.ts`

```typescript
interface AudioRecommendation {
  music?: string;           // Playlist ID or file path
  ambient?: string;         // File path
  description: string;
}

export const audioRecommendations: Record<
  string, // page
  Record<StoryBeat, AudioRecommendation>
> = {
  menu: {
    hook: {
      music: 'menu',
      description: 'Menu music, welcoming atmosphere'
    },
    // ... other beats use same menu config
  },

  library: {
    hook: {
      music: 'act1',
      ambient: 'library-ambient',
      description: 'Introduction to the library'
    },
    midpoint: {
      music: 'act2',
      ambient: 'library-ambient',
      description: 'Mid-story library exploration'
    },
    climax: {
      music: 'act3',
      ambient: 'library-ambient',
      description: 'Climactic library moments'
    },
    // ...
  },

  puzzle: {
    hook: {
      music: 'act1',
      description: 'Early game puzzles'
    },
    midpoint: {
      music: 'act2',
      description: 'Mid-game puzzles'
    },
    climax: {
      music: 'act3',
      description: 'Late game, challenging puzzles'
    },
    // ...
  },

  intro: {
    hook: {
      music: 'act1',
      description: 'Backstory introduction'
    },
    // ...
  }
};

export function getRecommendation(
  page: string,
  storyBeat: StoryBeat
): AudioRecommendation | null {
  return audioRecommendations[page]?.[storyBeat] || null;
}
```

---

## Implementation Steps

### Phase 1: Foundation (Basic Structure)

1. **Create page structure**
   - Create `/app/tools/audio-test/page.tsx`
   - Set up basic layout with sections
   - Add navigation link from main tools page
   - Implement basic styling/grid layout

2. **Set up state management**
   - Create `audioTestState.ts` with state interface
   - Implement React state hooks
   - Add local storage persistence for recent files

3. **Integrate AudioManager**
   - Import and access AudioManager singleton
   - Use `useAudio()` hook
   - Test basic audio playback

### Phase 2: Context Controls

4. **Build StoryBeatSelector**
   - Create dropdown component
   - Wire up DialogueManager integration
   - Add visual feedback

5. **Build PageSimulator**
   - Create page selector dropdown
   - Add game mode selector (conditional)
   - Display current context

6. **Implement audioRecommendations**
   - Create recommendation mapping
   - Build recommendation display
   - Add "Load Recommended" functionality

### Phase 3: Audio Channel Controls

7. **Create VolumeSlider component**
   - Build reusable slider with mute toggle
   - Add visual feedback
   - Implement volume change handlers

8. **Build AudioChannelPanel (Music)**
   - File display
   - Playback controls
   - Volume integration
   - Loop toggle
   - Progress bar

9. **Adapt AudioChannelPanel for Ambient**
   - Similar to Music
   - Adjust UI labels/icons

10. **Build SFX panel variant**
    - Quick-play buttons for common SFX
    - Support multiple simultaneous SFX
    - Custom file browser

11. **Build Voice panel variant**
    - Similar to Music but no loop
    - Voice-specific file browser

### Phase 4: Playlist System

12. **Create PlaylistController**
    - Playlist selector dropdown
    - Load playlists from config
    - Display playlist tracks

13. **Add playlist playback controls**
    - Play/Pause
    - Next/Previous
    - Mode selector
    - Current track display

14. **Implement track list display**
    - Show all tracks
    - Highlight current track
    - Visual playback indicator

### Phase 5: Master Controls & Status

15. **Build MasterControls**
    - Master volume slider
    - Master mute toggle
    - Stop all button
    - Reset defaults button

16. **Create ActiveAudioStatus**
    - Display all active channels
    - Show current files
    - Playback state indicators

17. **Add FileBrowser component**
    - Modal/drawer UI
    - Directory navigation
    - File filtering by category
    - Recent files list

### Phase 6: Polish & Testing

18. **Add visual feedback**
    - Loading states
    - Error messages
    - Success indicators
    - Active channel highlights

19. **Implement cleanup**
    - Stop audio on page unmount
    - Clear references
    - Handle navigation away

20. **Error handling**
    - Missing file handling
    - Audio load failures
    - Browser compatibility checks

21. **Keyboard shortcuts (optional)**
    - Space = Play/Pause
    - S = Stop All
    - M = Mute Master
    - Number keys for quick SFX

22. **Testing**
    - Test all channels simultaneously
    - Verify volume controls
    - Check playlist modes
    - Validate story beat integration
    - Cross-browser testing

---

## UI/UX Considerations

### Layout

**Desktop Layout (Recommended):**
- Three-column grid
- Left: Context controls, Master controls
- Center: Music and Ambient panels
- Right: SFX and Voice panels
- Bottom: Playlist controller and status

**Responsive Behavior:**
- Stack vertically on mobile/tablet
- Collapsible sections
- Sticky master controls

### Visual Design

**Color Coding by Category:**
- Music: Blue theme
- Ambient: Teal/cyan theme
- SFX: Orange theme
- Voice: Purple theme

**Icons:**
- 🎵 Music
- 🌊 Ambient
- 🔊 SFX
- 🎙️ Voice
- 📻 Playlist
- 🎛️ Master Controls

**Status Indicators:**
- Green = Playing
- Yellow = Paused/Loaded
- Gray = Idle
- Red = Error

### Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus indicators
- Sufficient color contrast
- Text alternatives for icons

---

## Technical Considerations

### Audio File Management

**File Organization:**
```
public/audio/
├── music/
│   ├── act1/
│   ├── act2/
│   ├── act3/
│   ├── menu/
│   └── puzzle/
├── ambient/
│   ├── library/
│   └── cosmic/
├── sfx/
│   ├── ui/
│   ├── puzzle/
│   └── timer/
└── voice/
    ├── lumina/
    ├── theron/
    └── narrator/
```

**File Discovery:**
- Read directory structure at runtime (development)
- Use static manifest (production)
- Support both approaches

### Memory Management

**Best Practices:**
- Preload only necessary files
- Unload unused audio when switching contexts
- Limit simultaneous SFX instances
- Clear audio buffer on cleanup

**Monitoring:**
- Track loaded audio count
- Display memory usage estimate
- Warn if too many files loaded

### Performance

**Optimization:**
- Lazy load file browser contents
- Throttle volume slider updates
- Debounce file search
- Use Web Audio API efficiently

**Loading States:**
- Show spinners during audio load
- Disable controls while loading
- Provide feedback for long loads

### Error Handling

**Common Errors:**
- File not found (404)
- Audio format not supported
- Browser autoplay policy
- Audio context suspended

**Error Recovery:**
- Graceful degradation
- User-friendly error messages
- Retry mechanisms
- Fallback options

### Browser Compatibility

**Requirements:**
- Web Audio API support
- HTML5 Audio element
- ES6+ JavaScript

**Polyfills/Fallbacks:**
- Check for Web Audio API
- Fallback to HTML5 Audio if needed
- Display compatibility warnings

### Development vs Production

**Development Only:**
- Add route protection
- Environment variable check
- Hide from production builds

**Example:**
```typescript
// In page.tsx
if (process.env.NODE_ENV === 'production') {
  redirect('/');
}
```

---

## Future Enhancements (Optional)

### Advanced Features

1. **Presets System**
   - Save audio configurations
   - Load saved presets
   - Export/import preset files
   - Quick switch between configs

2. **Timeline View**
   - Visual timeline of audio playback
   - See all channels on timeline
   - Scrub through time
   - Schedule audio cues

3. **Waveform Visualization**
   - Visual representation of audio files
   - Real-time playback position
   - Frequency analysis
   - Volume meters

4. **Export Configuration**
   - Generate code snippet for current setup
   - Copy to clipboard
   - Export as JSON
   - Documentation generator

5. **Audio File Upload**
   - Test custom audio without deployment
   - Drag-and-drop interface
   - Temporary file storage
   - Format validation

6. **History Tracking**
   - Log recently tested configurations
   - Replay previous setups
   - Compare configurations
   - Session history

7. **Keyboard Shortcuts**
   - Customizable shortcuts
   - Quick access to common operations
   - Shortcut help overlay
   - Global shortcuts

8. **Audio Analysis**
   - Duration display
   - File size
   - Bit rate
   - Format information
   - Peak volume detection

9. **Crossfade Tester**
   - Preview music transitions
   - Adjust fade duration
   - Test different crossfade curves
   - A/B comparison

10. **Scene Builder**
    - Create audio "scenes"
    - Combine multiple channels
    - Save scene configurations
    - Quick scene switching

---

## Testing Strategy

### Unit Testing

**Components to Test:**
- VolumeSlider - Volume changes, mute toggle
- StoryBeatSelector - Beat selection, updates
- PlaylistController - Playlist operations
- FileBrowser - File selection, filtering

**Test Coverage:**
- Component rendering
- User interactions
- State updates
- Error conditions

### Integration Testing

**Scenarios:**
- Loading and playing audio files
- Switching between story beats
- Changing page contexts
- Volume adjustments across channels
- Playlist playback modes

### Manual Testing

**Test Cases:**

1. **Multi-Channel Playback**
   - Play music + ambient + SFX simultaneously
   - Verify independent volume control
   - Test mute toggles
   - Check master volume effect

2. **Story Beat Integration**
   - Select each story beat
   - Verify DialogueManager updates
   - Check recommendation updates
   - Test audio persistence

3. **Playlist Functionality**
   - Load different playlists
   - Test all playback modes
   - Verify track transitions
   - Check auto-advance

4. **Volume Controls**
   - Test all volume sliders
   - Verify mute toggles
   - Check master volume override
   - Test volume persistence

5. **File Browser**
   - Browse all categories
   - Select files
   - Verify recent files
   - Test search/filter

6. **Error Scenarios**
   - Missing audio files
   - Invalid file formats
   - Browser restrictions
   - Network failures

### Browser Testing

**Target Browsers:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

**Test Points:**
- Audio playback
- Volume controls
- UI rendering
- Performance

---

## Documentation

### User Documentation

**Create:** `/app/tools/audio-test/README.md`

**Contents:**
- Tool overview
- Feature descriptions
- Usage instructions
- Common workflows
- Troubleshooting
- Known limitations

### Developer Documentation

**Code Comments:**
- Component purpose
- Complex logic explanations
- Integration points
- State management

**API Documentation:**
- audioRecommendations API
- State management functions
- Utility functions
- Type definitions

---

## Dependencies

### Existing Dependencies (Already in Project)

- React
- Next.js
- TypeScript
- Tailwind CSS (if using)
- AudioManager (custom)
- DialogueManager (custom)

### Potential New Dependencies

**Optional:**
- `react-slider` - Enhanced slider components
- `react-icons` - Icon library
- `wavesurfer.js` - Waveform visualization (future enhancement)
- `react-dropzone` - File upload (future enhancement)

**Keep Minimal:**
- Prefer using existing audio system
- Avoid unnecessary dependencies
- Use built-in browser APIs

---

## Success Criteria

### Functional Criteria

✅ Can select and update story beats
✅ Can simulate different game pages and modes
✅ Can play audio from all 4 categories simultaneously
✅ Can control volume for each category independently
✅ Can load and play playlists with different modes
✅ Can browse and select audio files
✅ Master controls affect all audio appropriately
✅ Audio recommendations work for page/beat combinations

### Quality Criteria

✅ Clean, intuitive UI
✅ Responsive design
✅ No memory leaks
✅ Proper cleanup on unmount
✅ Error handling for edge cases
✅ Accessible (keyboard navigation, screen readers)
✅ Cross-browser compatible

### Performance Criteria

✅ Audio loads within 2 seconds
✅ UI updates without lag
✅ Supports 10+ simultaneous audio instances
✅ No audio crackling or stuttering

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Browser autoplay policy blocking audio | High | Medium | Require user interaction, show warnings |
| Memory issues with many audio files | Medium | Low | Implement cleanup, limit preloads |
| Audio format compatibility | Medium | Low | Use widely supported formats (MP3, OGG) |
| Performance on low-end devices | Low | Medium | Optimize audio loading, provide settings |

### Development Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Scope creep | Medium | Medium | Stick to MVP, defer enhancements |
| Integration complexity | Medium | Low | Well-documented AudioManager API |
| Testing effort | Low | High | Focus on critical paths first |

---

## Timeline Estimate

### MVP (Minimum Viable Product)

**Estimated Time:** 8-12 hours

- Phase 1: Foundation (2 hours)
- Phase 2: Context Controls (1.5 hours)
- Phase 3: Audio Channels (3 hours)
- Phase 4: Playlist System (1.5 hours)
- Phase 5: Master Controls (1 hour)
- Phase 6: Polish & Testing (2-3 hours)

### Full Implementation (with optional features)

**Estimated Time:** 15-20 hours

- MVP (8-12 hours)
- Advanced features (4-6 hours)
- Comprehensive testing (2-3 hours)

---

## Conclusion

This audio testing tool will provide comprehensive control over the game's audio system, enabling efficient development, testing, and quality assurance. By leveraging the existing AudioManager and DialogueManager systems, the tool integrates seamlessly with the game's architecture while remaining completely standalone.

The modular component design allows for incremental development, with each phase building on the previous. The MVP focuses on core functionality, while optional enhancements can be added based on needs and priorities.

**Key Benefits:**
- Rapid audio configuration testing
- No need to play through game to test audio
- Validate audio combinations before implementation
- Debug audio issues efficiently
- Document audio design decisions

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Iterate based on testing feedback
4. Expand with optional features as needed
