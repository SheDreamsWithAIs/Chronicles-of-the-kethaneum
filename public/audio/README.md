# Audio Files Directory

Place your game audio files in this directory structure:

```
audio/
├── music/          - Background music (loops automatically)
│   ├── menu-theme.mp3
│   ├── puzzle-theme.mp3
│   └── victory-theme.mp3
│
├── ambient/        - Environmental/atmospheric sounds (loops automatically)
│   ├── cosmic-atmosphere.mp3
│   ├── library-ambience.mp3
│   └── wind.mp3
│
├── sfx/            - Sound effects (one-shot sounds)
│   ├── button-click.mp3
│   ├── word-found.mp3
│   ├── puzzle-complete.mp3
│   └── page-turn.mp3
│
└── voice/          - Voice lines and dialogue
    ├── intro-narration.mp3
    └── victory-speech.mp3
```

## Supported Formats

- **MP3** (recommended) - Best browser compatibility
- **OGG** - Good compression, open format
- **WAV** - Uncompressed, larger files
- **M4A** - Apple formats

## Recommendations

- Use MP3 files at 128-192 kbps for music/ambient
- Use 96 kbps for SFX and voice lines
- Keep file sizes reasonable for web delivery
- Name files descriptively (e.g., `button-click-soft.mp3`)

## Background Music Configuration

**No code changes needed!** Background music is configured via a JSON file.

Edit `public/data/audio-config.json` to add, remove, or reorder music tracks:

```json
{
  "backgroundMusic": {
    "playlistId": "background-music",
    "playlistName": "Background Music",
    "mode": "REPEAT_ALL",
    "autoAdvance": true,
    "fadeDuration": 2000,
    "tracks": [
      {
        "id": "background-music-1",
        "src": "/audio/music/background-music.mp3",
        "title": "Background Music"
      }
    ]
  }
}
```

**To add more tracks**, simply add more entries to the `tracks` array. The playlist will automatically play through all tracks and loop continuously.

**Playlist modes:**
- `REPEAT_ALL` - Loop through all tracks continuously (default)
- `SEQUENTIAL` - Play tracks in order, stop at end
- `SHUFFLE` - Play tracks in random order
- `REPEAT_ONE` - Repeat the current track indefinitely

## Usage

See `/docs/AUDIO_SYSTEM.md` for complete documentation on how to use the audio system in your code.

## Quick Example

```typescript
import { useAudio } from '@/hooks/useAudio';
import { AudioCategory } from '@/lib/audio/audioManager';

// Preload and play
await audio.preload('menu-music', '/audio/music/menu-theme.mp3', AudioCategory.MUSIC, true);
await audio.playMusic('menu-music', 1000); // 1 second fade-in
```
