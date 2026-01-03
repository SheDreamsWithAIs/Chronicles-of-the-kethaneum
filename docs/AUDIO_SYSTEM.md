# Audio System Documentation

## Overview

The Chronicles of the Kethaneum audio system provides background music playback that persists across all screens. The system supports volume control, muting, track navigation, and crossfading between tracks. User preferences are persisted to localStorage.

## Architecture

The audio system consists of three main components:

1. **AudioManager** (`lib/audio/AudioManager.ts`) - Core singleton class managing background music playback
2. **AudioContext** (`contexts/AudioContext.tsx`) - React context provider for app-wide audio state
3. **useAudio Hook** (`hooks/useAudio.ts`) - Convenience hook for component integration

## Features

- **Continuous Playback**: Music continues playing across page navigation
- **Playlist Support**: Multiple tracks configured via JSON
- **Track Navigation**: Next/previous track controls
- **Crossfading**: Smooth fade in/out when changing tracks
- **Volume Control**: 0-100 volume range
- **Mute/Unmute**: Toggle mute state
- **Persistence**: Settings saved to localStorage
- **Playlist Modes**: REPEAT_ALL, REPEAT_ONE, SEQUENTIAL

## File Structure

Place your audio files in the `public/audio` directory:

```
public/
└── audio/
    └── music/
        └── Act-1-bg-music/
            ├── Reflection in the Expanse.mp3
            ├── The Kethaneum (act 1).mp3
            ├── The Silence Between Words.mp3
            ├── Through the Quiet Veil.mp3
            └── Whispers of the Ages.mp3
```

### Supported Audio Formats

- **MP3** - Recommended for broad compatibility
- **OGG** - Good compression, open format
- **WAV** - Uncompressed, larger file size
- **M4A** - Apple formats (use with caution)

**Recommendation**: Use MP3 files at 128-192 kbps for music.

## Configuration

The background music playlist is configured via a JSON file, allowing you to update music tracks without code changes.

### Configuration File

Edit `public/data/config/audio-config.json` to manage your background music playlist:

```json
{
  "backgroundMusic": {
    "playlistId": "background-music",
    "playlistName": "Act 1 Background Music",
    "mode": "REPEAT_ALL",
    "autoAdvance": true,
    "fadeDuration": 2000,
    "tracks": [
      {
        "id": "act1-bg-1",
        "src": "/audio/music/Act-1-bg-music/Reflection in the Expanse.mp3",
        "title": "Reflection in the Expanse"
      },
      {
        "id": "act1-bg-2",
        "src": "/audio/music/Act-1-bg-music/The Kethaneum (act 1).mp3",
        "title": "The Kethaneum"
      }
    ]
  }
}
```

### Configuration Options

- **`playlistId`** - Internal identifier for the playlist
- **`playlistName`** - Display name (for debugging/logging)
- **`mode`** - Playlist playback mode:
  - **`REPEAT_ALL`** - Loop through all tracks continuously (default)
  - **`REPEAT_ONE`** - Repeat the current track indefinitely
  - **`SEQUENTIAL`** - Play tracks in order, stop at end
- **`autoAdvance`** - Automatically move to next track when current ends (default: `true`)
- **`fadeDuration`** - Fade-in/fade-out duration in milliseconds (default: `2000`)
- **`tracks`** - Array of track objects, each with:
  - **`id`** - Unique identifier for the track
  - **`src`** - Path to the audio file (relative to `public/`)
  - **`title`** - Display name (optional, for debugging)

### Important Notes

- **No code changes needed** - Just edit the JSON file and restart the app
- **File paths** - Always start with `/audio/` (relative to `public/`)
- **File must exist** - If a track file doesn't exist, it will be skipped with a warning
- **Hot reload** - Changes require a page refresh to take effect
- **Format support** - MP3, OGG, WAV, M4A (MP3 recommended)

## Usage

### Basic Setup

The audio system is automatically initialized by the `AudioProvider` in your app layout. No additional setup is required!

```tsx
// This is already done in app/layout.tsx
import { AudioProvider } from "@/contexts/AudioContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
```

### Using Audio in Components

```tsx
import { useAudio } from '@/hooks/useAudio';

function MyComponent() {
  const { volume, isMuted, isPlaying, setVolume, toggleMute, play, pause } = useAudio();

  return (
    <div>
      <p>Volume: {volume}%</p>
      <p>Muted: {isMuted ? 'Yes' : 'No'}</p>
      <p>Playing: {isPlaying ? 'Yes' : 'No'}</p>
      
      <button onClick={() => setVolume(50)}>Set Volume to 50%</button>
      <button onClick={toggleMute}>Toggle Mute</button>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
}
```

### Volume Control Example

```tsx
import { useAudio } from '@/hooks/useAudio';

function VolumeControl() {
  const { volume, setVolume } = useAudio();

  return (
    <div>
      <label>
        Volume: {volume}%
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
```

### Mute Toggle Example

```tsx
import { useAudio } from '@/hooks/useAudio';

function MuteButton() {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button onClick={toggleMute}>
      {isMuted ? '🔇 Unmute' : '🔊 Mute'}
    </button>
  );
}
```

## API Reference

### useAudio Hook

The `useAudio` hook provides access to audio controls and state:

```typescript
const {
  volume: number;        // Current volume (0-100)
  isMuted: boolean;     // Mute state
  isPlaying: boolean;    // Whether audio is currently playing
  isLoaded: boolean;     // Whether audio system is initialized
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: () => Promise<void>;
  pause: () => void;
} = useAudio();
```

### AudioManager Methods (Direct Access)

If you need direct access to the AudioManager singleton:

```typescript
import { AudioManager } from '@/lib/audio/AudioManager';

const audioManager = AudioManager.getInstance();

// Play audio
await audioManager.play();

// Pause audio
audioManager.pause();

// Stop audio with fade out
await audioManager.stop();

// Navigate tracks
audioManager.nextTrack();
audioManager.previousTrack();

// Volume control
audioManager.setVolume(70); // 0-100
const volume = audioManager.getVolume();

// Mute control
audioManager.toggleMute();
audioManager.setMuted(true);
const isMuted = audioManager.getMuted();

// Get current state
const state = audioManager.getState();
// Returns: {
//   volume: number,
//   isMuted: boolean,
//   isPlaying: boolean,
//   currentTrackIndex: number,
//   currentTrack: AudioTrack | null,
//   isInitialized: boolean
// }

// Check if playing
const playing = audioManager.isPlaying();
```

## How It Works

### Initialization

1. `AudioProvider` mounts in the app layout
2. On mount, it loads saved settings from localStorage
3. Initializes `AudioManager` singleton with config from `/data/config/audio-config.json`
4. Applies saved volume and mute settings
5. Starts playing if not muted

### Persistence

Audio settings are automatically saved to localStorage with the key `audioSettings`:

```json
{
  "volume": 70,
  "isMuted": false
}
```

Settings are saved whenever:
- Volume is changed
- Mute state is toggled

### Track Playback

- Tracks are loaded on demand when needed
- When a track ends, the next track automatically starts (if `autoAdvance` is true)
- Track changes use crossfading (fade out current, fade in next)
- Single-track playlists restart the same track when it ends

### Navigation Persistence

The audio system uses a singleton pattern, so the same `AudioManager` instance persists across all React component mounts/unmounts. This ensures music continues playing when navigating between pages in Next.js.

## Best Practices

### 1. Use the Hook

Always use the `useAudio` hook in components rather than accessing `AudioManager` directly. This ensures React state stays in sync:

```tsx
// Good
const { volume, setVolume } = useAudio();

// Avoid
const audioManager = AudioManager.getInstance();
audioManager.setVolume(50); // React state won't update
```

### 2. Handle Loading State

Check `isLoaded` before using audio controls:

```tsx
const { isLoaded, play } = useAudio();

if (!isLoaded) {
  return <div>Loading audio...</div>;
}

// Safe to use audio controls
```

### 3. Browser Autoplay Policy

Modern browsers require user interaction before playing audio. The system handles this automatically:
- Audio will attempt to play on initialization
- If blocked, it will wait for user interaction
- Once user interacts, audio will start playing automatically

### 4. Volume Ranges

Volume is stored as 0-100, but internally converted to 0.0-1.0 for the HTMLAudioElement:

```tsx
setVolume(70); // 70% volume
```

## Troubleshooting

### Audio Not Playing

1. **Check browser console** - Look for autoplay policy errors
2. **Ensure user interaction** - Audio may be blocked until user interacts with page
3. **Verify file paths** - Ensure audio files exist at specified paths in `audio-config.json`
4. **Check volume/mute** - Verify volume isn't set to 0 or muted
5. **Check localStorage** - Verify `audioSettings` in localStorage isn't corrupted

### Music Restarts on Navigation

If music restarts when navigating between pages:
- This should not happen with the singleton pattern
- Check that `AudioProvider` is only mounted once in `app/layout.tsx`
- Verify `AudioManager.getInstance()` is being used (not creating new instances)

### Volume Not Working

1. **Check mute status** - Both `isMuted` state and actual audio element mute
2. **Check localStorage** - Verify saved settings aren't corrupted
3. **Browser settings** - Check browser's site audio permissions

### Track Not Advancing

1. **Check `autoAdvance`** - Should be `true` in config
2. **Check `mode`** - `SEQUENTIAL` mode stops at end, `REPEAT_ALL` loops
3. **Check console** - Look for errors loading next track

## Example: Complete Integration

Here's a complete example integrating audio controls:

```tsx
'use client';

import { useAudio } from '@/hooks/useAudio';
import { useState } from 'react';

export default function SettingsPage() {
  const { volume, isMuted, isPlaying, isLoaded, setVolume, toggleMute, play, pause } = useAudio();
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  if (!isLoaded) {
    return <div>Loading audio system...</div>;
  }

  return (
    <div>
      <h1>Audio Settings</h1>
      
      <div>
        <label>
          Volume: {volume}%
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
      </div>

      <div>
        <button onClick={toggleMute}>
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      <div>
        <button onClick={isPlaying ? pause : play}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div>
        <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
        <p>Muted: {isMuted ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
```

## Type Definitions

```typescript
// lib/audio/types.ts

export interface AudioTrack {
  id: string;
  src: string;
  title: string;
}

export interface BackgroundMusicConfig {
  playlistId: string;
  playlistName: string;
  mode: 'REPEAT_ALL' | 'REPEAT_ONE' | 'SEQUENTIAL';
  autoAdvance: boolean;
  fadeDuration: number;
  tracks: AudioTrack[];
}

export interface AudioConfig {
  backgroundMusic: BackgroundMusicConfig;
}

export interface AudioSettings {
  volume: number; // 0-100
  isMuted: boolean;
}

export interface AudioState extends AudioSettings {
  isPlaying: boolean;
  currentTrackIndex: number;
  isLoaded: boolean;
}
```

## Future Enhancements

Potential improvements to consider:

- Audio settings modal UI component
- Integration with game save system
- Multiple playlist support (switch between playlists)
- Shuffle mode for playlists
- Track position persistence (resume from where it stopped)
- More advanced crossfade algorithms (equal-power, logarithmic)
- Web Audio API effects (reverb, EQ, compression, etc.)
- Audio visualization
- Sound effects system (SFX)
- Ambient sounds system
- Voice lines system

## Support

For issues or questions about the audio system, check:
- Browser console for error messages
- Network tab to verify audio files are loading
- localStorage for saved audio settings
- `public/data/config/audio-config.json` for configuration

## License

This audio system is part of Chronicles of the Kethaneum.
