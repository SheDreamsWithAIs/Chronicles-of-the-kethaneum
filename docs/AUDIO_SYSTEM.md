# Audio System Documentation

## Overview

The Chronicles of the Kethaneum audio system provides a comprehensive solution for managing game audio, including background music, ambient sounds, sound effects, and voice lines. The system supports volume control, muting, and persists user preferences across sessions.

## Architecture

The audio system consists of several interconnected components:

1. **AudioManager** (`lib/audio/audioManager.ts`) - Core singleton class managing all audio functionality
2. **useAudio Hook** (`hooks/useAudio.ts`) - React hook for component integration
3. **AudioProvider** (`components/AudioProvider.tsx`) - App-wide provider for initialization and persistence
4. **AudioSettingsModal** (`components/AudioSettingsModal.tsx`) - UI component for audio settings
5. **Config Integration** (`lib/core/config.ts`) - Audio settings in configuration system
6. **Save System** (`lib/save/saveSystem.ts`) - Persistence of audio preferences

## Audio Categories

The system supports four distinct audio categories:

- **Music** - Background music tracks (loops automatically)
- **Ambient** - Environmental/atmospheric sounds (loops automatically)
- **SFX** - Sound effects (one-shot sounds, can overlap)
- **Voice** - Voice lines and dialogue

Each category has independent volume control and mute state, plus a master volume that affects all categories.

## File Structure

Place your audio files in the `public/audio` directory with the following structure:

```
public/
└── audio/
    ├── music/
    │   ├── menu-theme.mp3
    │   ├── puzzle-theme.mp3
    │   └── victory-theme.mp3
    ├── ambient/
    │   ├── cosmic-atmosphere.mp3
    │   ├── library-ambience.mp3
    │   └── wind.mp3
    ├── sfx/
    │   ├── button-click.mp3
    │   ├── word-found.mp3
    │   ├── puzzle-complete.mp3
    │   └── page-turn.mp3
    └── voice/
        ├── intro-narration.mp3
        └── victory-speech.mp3
```

### Supported Audio Formats

- **MP3** - Recommended for broad compatibility
- **OGG** - Good compression, open format
- **WAV** - Uncompressed, larger file size
- **M4A** - Apple formats (use with caution)

**Recommendation**: Use MP3 files at 128-192 kbps for music/ambient, and 96 kbps for SFX/voice.

## Usage

### Basic Setup

The audio system is automatically initialized by the `AudioProvider` in your app layout. No additional setup is required!

```tsx
// This is already done in app/layout.tsx
import { AudioProvider } from "@/components/AudioProvider";

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
import { AudioCategory } from '@/lib/audio/audioManager';
import { useEffect } from 'react';

function MyComponent() {
  const audio = useAudio();

  useEffect(() => {
    // Preload audio files
    const loadAudio = async () => {
      await audio.preload(
        'menu-music',
        '/audio/music/menu-theme.mp3',
        AudioCategory.MUSIC,
        true // loop
      );

      await audio.preload(
        'button-click',
        '/audio/sfx/button-click.mp3',
        AudioCategory.SFX
      );
    };

    loadAudio();
  }, []);

  const handlePlayMusic = () => {
    audio.playMusic('menu-music', 1000); // 1000ms fade-in
  };

  const handleButtonClick = () => {
    audio.playSFX('button-click');
  };

  return (
    <div>
      <button onClick={handlePlayMusic}>Play Music</button>
      <button onClick={handleButtonClick}>Click Me</button>
    </div>
  );
}
```

### Preloading Multiple Audio Files

For better organization, preload multiple files at once:

```tsx
import { useAudioPreload } from '@/hooks/useAudio';
import { AudioCategory } from '@/lib/audio/audioManager';

function GameScreen() {
  const { loading, error, audio } = useAudioPreload([
    {
      id: 'puzzle-music',
      src: '/audio/music/puzzle-theme.mp3',
      category: AudioCategory.MUSIC,
      loop: true
    },
    {
      id: 'cosmic-ambient',
      src: '/audio/ambient/cosmic-atmosphere.mp3',
      category: AudioCategory.AMBIENT,
      loop: true
    },
    {
      id: 'word-found',
      src: '/audio/sfx/word-found.mp3',
      category: AudioCategory.SFX
    },
    {
      id: 'puzzle-complete',
      src: '/audio/sfx/puzzle-complete.mp3',
      category: AudioCategory.SFX
    }
  ]);

  if (loading) return <div>Loading audio...</div>;
  if (error) console.error('Failed to load audio:', error);

  return <div>Game content here</div>;
}
```

## API Reference

### AudioManager Methods

#### Preloading

```typescript
await audio.preload(
  id: string,           // Unique identifier for this audio
  src: string,          // Path to audio file
  category: AudioCategory, // MUSIC, AMBIENT, SFX, or VOICE
  loop?: boolean        // Whether to loop (default: false)
): Promise<void>
```

#### Playing Audio

```typescript
// Play background music (crossfades if music already playing)
await audio.playMusic(id: string, fadeDuration?: number): Promise<void>

// Stop music
await audio.stopMusic(fadeDuration?: number): Promise<void>

// Play ambient sound
await audio.playAmbient(id: string, fadeDuration?: number): Promise<void>

// Stop ambient
await audio.stopAmbient(fadeDuration?: number): Promise<void>

// Play sound effect (can overlap with itself)
audio.playSFX(id: string, volume?: number): void

// Play voice line
await audio.playVoice(id: string): Promise<void>

// Stop specific track
audio.stop(id: string): void

// Stop all audio
audio.stopAll(): void
```

#### Volume Control

```typescript
// Set volume (0-1 range)
audio.setVolume(category: 'master' | AudioCategory, volume: number): void

// Get volume
const volume = audio.getVolume(category: 'master' | AudioCategory): number

// Example
audio.setVolume('master', 0.7);  // 70% master volume
audio.setVolume(AudioCategory.MUSIC, 0.8);  // 80% music volume
```

#### Mute Control

```typescript
// Set mute state
audio.setMuted(category: 'master' | AudioCategory, muted: boolean): void

// Check if muted
const isMuted = audio.isMuted(category: 'master' | AudioCategory): boolean

// Toggle mute
audio.toggleMute(category: 'master' | AudioCategory): void

// Example
audio.toggleMute('master');  // Toggle master mute
audio.setMuted(AudioCategory.SFX, true);  // Mute all sound effects
```

#### Settings Management

```typescript
// Get current settings
const settings = audio.getSettings(): AudioSettings

// Update multiple settings at once
audio.updateSettings({
  masterVolume: 0.8,
  musicMuted: true,
  sfxVolume: 0.6
}): void
```

## Audio Settings Modal

The `AudioSettingsModal` component provides a user interface for adjusting audio settings:

```tsx
import { AudioSettingsModal } from '@/components/AudioSettingsModal';
import { useState } from 'react';

function MyComponent() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button onClick={() => setShowSettings(true)}>
        Settings
      </button>

      <AudioSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={() => console.log('Settings saved!')}
      />
    </>
  );
}
```

The modal includes:
- Volume sliders for each category (0-100%)
- Mute toggle buttons
- Test buttons for each category
- Real-time preview of changes
- Cancel/Save options

## Best Practices

### 1. Preload Audio Early

Preload audio files before they're needed to avoid delays:

```tsx
useEffect(() => {
  // Preload on component mount
  audio.preload('click-sound', '/audio/sfx/click.mp3', AudioCategory.SFX);
}, []);
```

### 2. Use Fade Effects for Music

Always use fade-in/fade-out for music transitions:

```tsx
// Good
await audio.playMusic('level-music', 2000);  // 2 second fade-in
await audio.stopMusic(2000);  // 2 second fade-out

// Avoid
await audio.playMusic('level-music', 0);  // Abrupt start
```

### 3. Don't Overuse Sound Effects

Limit sound effects to important actions:

```tsx
// Good
audio.playSFX('word-found');  // Only when word is found

// Avoid
audio.playSFX('hover');  // On every hover event
```

### 4. Handle Audio Context Restrictions

Modern browsers require user interaction before playing audio. The `AudioProvider` handles this automatically, but you can manually resume if needed:

```tsx
const handleUserInteraction = async () => {
  await audio.resumeAudioContext();
  await audio.playMusic('menu-music');
};
```

### 5. Clean Up on Unmount

The audio system automatically handles cleanup, but if you're managing audio in a specific component:

```tsx
useEffect(() => {
  audio.playMusic('level-music');

  return () => {
    audio.stopMusic(500);  // Fade out when component unmounts
  };
}, []);
```

## Configuration

Audio settings are stored in the configuration system and persisted to localStorage:

```typescript
import { getConfig } from '@/lib/core/config';

const config = getConfig();
console.log(config.audio);  // Access audio settings
```

Default settings:
```typescript
{
  masterVolume: 0.7,    // 70%
  musicVolume: 0.8,     // 80%
  ambientVolume: 0.6,   // 60%
  sfxVolume: 0.7,       // 70%
  voiceVolume: 1.0,     // 100%
  masterMuted: false,
  musicMuted: false,
  ambientMuted: false,
  sfxMuted: false,
  voiceMuted: false
}
```

## Persistence

Audio settings are automatically saved to localStorage and restored on app load. The save system uses the key `kethaneumAudioSettings`.

Manual save/load:
```typescript
import { saveAudioSettings, loadAudioSettings } from '@/lib/save/saveSystem';

// Save
const settings = audio.getSettings();
saveAudioSettings(settings);

// Load
const savedSettings = loadAudioSettings();
if (savedSettings) {
  audio.updateSettings(savedSettings);
}
```

## Example: Complete Integration

Here's a complete example integrating all features:

```tsx
import { useEffect, useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { AudioCategory } from '@/lib/audio/audioManager';
import { AudioSettingsModal } from '@/components/AudioSettingsModal';

export default function GamePage() {
  const audio = useAudio();
  const [showSettings, setShowSettings] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Preload all audio
  useEffect(() => {
    const loadAudio = async () => {
      try {
        // Load music
        await audio.preload(
          'game-music',
          '/audio/music/puzzle-theme.mp3',
          AudioCategory.MUSIC,
          true
        );

        // Load ambient
        await audio.preload(
          'cosmic-ambient',
          '/audio/ambient/cosmic-atmosphere.mp3',
          AudioCategory.AMBIENT,
          true
        );

        // Load sound effects
        await audio.preload('click', '/audio/sfx/button-click.mp3', AudioCategory.SFX);
        await audio.preload('success', '/audio/sfx/word-found.mp3', AudioCategory.SFX);
        await audio.preload('complete', '/audio/sfx/puzzle-complete.mp3', AudioCategory.SFX);

        setAudioLoaded(true);

        // Start playing background audio
        await audio.playMusic('game-music', 2000);
        await audio.playAmbient('cosmic-ambient', 3000);
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadAudio();

    // Cleanup on unmount
    return () => {
      audio.stopMusic(1000);
      audio.stopAmbient(1000);
    };
  }, []);

  const handleWordFound = () => {
    audio.playSFX('success');
  };

  const handlePuzzleComplete = () => {
    audio.playSFX('complete');
  };

  const handleButtonClick = () => {
    audio.playSFX('click');
  };

  return (
    <div>
      {!audioLoaded && <div>Loading audio...</div>}

      <button onClick={handleButtonClick}>
        Click Me
      </button>

      <button onClick={handleWordFound}>
        Find Word
      </button>

      <button onClick={handlePuzzleComplete}>
        Complete Puzzle
      </button>

      <button onClick={() => setShowSettings(true)}>
        Audio Settings
      </button>

      <AudioSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
```

## Troubleshooting

### Audio Not Playing

1. **Check browser console** - Look for autoplay policy errors
2. **Ensure user interaction** - Audio may be blocked until user interacts with page
3. **Verify file paths** - Ensure audio files exist at specified paths
4. **Check volume/mute** - Verify volume isn't set to 0 or muted

### Performance Issues

1. **Preload selectively** - Don't preload all audio at once
2. **Use compressed formats** - MP3 at reasonable bitrates
3. **Limit concurrent sounds** - Too many overlapping SFX can cause issues

### Volume Not Working

1. **Check master volume** - Master volume affects all categories
2. **Check mute status** - Both category and master mute affect playback
3. **Browser settings** - Check browser's site audio permissions

## Future Enhancements

Potential improvements to consider:

- Audio sprite sheets for SFX
- 3D positional audio
- Audio ducking (lowering music when voice plays)
- Playlist support for music
- Dynamic music layers
- Audio visualization
- More advanced crossfade algorithms
- Web Audio API effects (reverb, EQ, etc.)

## Support

For issues or questions about the audio system, check:
- Browser console for error messages
- Network tab to verify audio files are loading
- Volume/mute settings in the AudioSettingsModal

## License

This audio system is part of Chronicles of the Kethaneum.
