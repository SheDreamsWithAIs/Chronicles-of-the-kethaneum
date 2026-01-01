# Save System Documentation

## Overview

The Chronicles of the Kethaneum save system provides scalable, efficient storage for game progress. The system is designed to handle hundreds of discoverable books (puzzles) without overloading localStorage, achieving approximately 70-80% storage reduction compared to verbose JSON formats.

Key features:
- **Compact storage format** - Short property names and bitmap encoding
- **Book registry** - Centralized metadata for all books/puzzles
- **Automatic persistence** - Auto-save on state changes
- **Audio settings integration** - Settings persisted with game progress

## Architecture

The save system consists of several interconnected components:

1. **BookRegistryManager** (`lib/book/bookRegistry.ts`) - Singleton managing book metadata lookups
2. **Progress Bitmap Utilities** (`lib/book/progressBitmap.ts`) - Efficient part completion encoding
3. **Save System** (`lib/save/saveSystem.ts`) - Complete save/load implementation
4. **Book Registry Data** (`public/data/bookRegistry.json`) - Central book metadata file

## Storage Format

The save system uses a compact JSON format with short property names to minimize localStorage usage.

### Example Save File

```json
{
  "v": 2,
  "d": "N001,K001",
  "p": {
    "N001": 3,
    "K001": 1
  },
  "g": {
    "nature": ["N001", "N002"]
  },
  "m": "s",
  "n": 5,
  "c": {
    "g": "nature",
    "b": "N001",
    "p": 2,
    "i": 0
  },
  "s": {
    "g": "nature",
    "k": 0,
    "p": 3,
    "i": 5,
    "r": false,
    "e": false
  },
  "sp": {
    "unlockedBlurbs": ["intro_001"],
    "firedTriggers": []
  },
  "dl": ["SE001"],
  "dlv": true,
  "no": {
    "kc": 0,
    "d": 1,
    "sc": 1,
    "u": ["SE002"],
    "c": ["SE001"],
    "l": "SE002"
  },
  "a": {
    "mv": 0.7,
    "mu": 0.8,
    "av": 0.6,
    "sv": 0.7,
    "vv": 1.0,
    "mm": false,
    "mum": false,
    "am": false,
    "sm": false,
    "vm": false
  }
}
```

## Property Listing

### Root Level Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `v` | number | Format version (always 2) | `2` |
| `d` | string | Discovered book IDs (comma-separated) | `"N001,K001,E002"` |
| `p` | object | Progress bitmaps per book ID (see Bitmap Encoding) | `{"N001": 3, "K001": 1}` |
| `g` | object | Completed puzzle IDs by genre | `{"nature": ["N001", "N002"]}` |
| `m` | string | Game mode ('s'=story, 'p'=puzzle-only, 'b'=beat-the-clock) | `"s"` |
| `n` | number | Total puzzles completed | `5` |
| `c` | object | Current puzzle state (optional, see below) | `{...}` |
| `s` | object | Puzzle selection state (optional, see below) | `{...}` |
| `sp` | object | Story progression state (optional, see below) | `{...}` |
| `dl` | string[] | Completed story event IDs (optional) | `["SE001", "SE002"]` |
| `dlv` | boolean | Has visited library flag (optional) | `true` |
| `no` | object | Narrative orchestration state (optional, see below) | `{...}` |
| `a` | object | Audio settings (optional, see below) | `{...}` |

### Current State (`c`) Properties

Only saved when actively playing a puzzle. Omitted when on title screen or between puzzles.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `c.g` | string | Current genre | `"nature"` |
| `c.b` | string | Current book ID | `"N001"` |
| `c.p` | number | Current part index (0-based) | `2` |
| `c.i` | number | Current puzzle index | `0` |

### Selection State (`s`) Properties

Saved when the player has selected a genre at Book of Passage. Controls Kethaneum puzzle frequency.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `s.g` | string | Selected genre | `"nature"` |
| `s.k` | number | Next Kethaneum index (which Kethaneum book to show next) | `0` |
| `s.p` | number | Puzzles since last Kethaneum (counter) | `3` |
| `s.i` | number | Next Kethaneum interval (random 3-7) | `5` |
| `s.r` | boolean | Kethaneum revealed (genre visible in selection UI) | `false` |
| `s.e` | boolean | Genre exhausted (no more new puzzles in selected genre) | `false` |

**Note**: This block is only saved once the player reaches Book of Passage and selects a genre. On a fresh game start, this will not appear until genre selection occurs.

### Story Progress (`sp`) Properties

Tracks story blurbs and triggers unlocked during gameplay.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `sp.unlockedBlurbs` | string[] | Story blurb IDs that have been unlocked | `["intro_001", "nature_002"]` |
| `sp.firedTriggers` | string[] | Trigger IDs that have fired | `[]` |

### Narrative Orchestration (`no`) Properties

Tracks story event unlocking and the debt system. Only saved when genre selection has occurred.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `no.kc` | number | Kethaneum puzzles completed (controls nextKethaneumIndex) | `0` |
| `no.d` | number | Story event debt (unlocked but not completed) | `1` |
| `no.sc` | number | Story events completed count | `1` |
| `no.u` | string[] | Unlocked story event IDs (not yet completed) | `["SE002"]` |
| `no.c` | string[] | Completed story event IDs | `["SE001"]` |
| `no.l` | string \| null | Last unlocked story event ID (for notifications) | `"SE002"` |

**Debt System**:
- Debt increments when story events UNLOCK
- Debt decrements when story events are COMPLETED via dialogue
- When debt >= 2, Kethaneum puzzles are blocked

**Note**: Like selection state, this block only appears after genre selection at Book of Passage.

### Audio Settings (`a`) Properties

Volume levels and mute states for all audio channels.

| Property | Type | Description | Range |
|----------|------|-------------|-------|
| `a.mv` | number | Master volume | `0.0 - 1.0` |
| `a.mu` | number | Music volume | `0.0 - 1.0` |
| `a.av` | number | Ambient volume | `0.0 - 1.0` |
| `a.sv` | number | SFX volume | `0.0 - 1.0` |
| `a.vv` | number | Voice volume | `0.0 - 1.0` |
| `a.mm` | boolean | Master muted | `true/false` |
| `a.mum` | boolean | Music muted | `true/false` |
| `a.am` | boolean | Ambient muted | `true/false` |
| `a.sm` | boolean | SFX muted | `true/false` |
| `a.vm` | boolean | Voice muted | `true/false` |

## Book Registry System

### Registry File Structure

The book registry (`public/data/bookRegistry.json`) contains metadata for all books:

```json
{
  "version": 1,
  "books": {
    "K001": {
      "title": "Luminos: The Price of 'Perfect Vision'",
      "genre": "kethaneum",
      "parts": 4,
      "order": 1
    },
    "N001": {
      "title": "Fruits of the Orchard",
      "genre": "nature",
      "parts": 5,
      "order": 1
    }
  },
  "genres": {
    "kethaneum": { "name": "The Kethaneum", "prefix": "K" },
    "nature": { "name": "Nature", "prefix": "N" }
  }
}
```

### Book ID Convention

Book IDs follow the pattern: `{GenrePrefix}{Number}`

| Genre | Prefix | Example IDs |
|-------|--------|-------------|
| kethaneum | K | K001, K002, K003 |
| nature | N | N001, N002, N003 |
| emotions | E | E001, E002, E003 |
| science | S | S001, S002, S003 |

### Using the Book Registry

```typescript
import { bookRegistry } from '@/lib/book/bookRegistry';

// Get book metadata by ID
const book = await bookRegistry.getBook('N001');
// Returns: { title: "Fruits of the Orchard", genre: "nature", parts: 5, order: 1 }

// Find book ID by title (synchronous, cached)
const bookId = bookRegistry.getBookIdByTitleSync('Fruits of the Orchard');
// Returns: "N001"

// Get all books in a genre
const natureBooks = await bookRegistry.getBooksByGenre('nature');

// Get all books
const allBooks = await bookRegistry.getAllBooks();

// Get genre metadata
const genre = await bookRegistry.getGenre('nature');
// Returns: { name: "Nature", prefix: "N" }
```

## Bitmap Encoding

The system uses bitmap encoding to efficiently store part completion states. Each bit represents whether a part is completed.

### How It Works

```
Parts:    [true, true, false, true, false]
Binary:   11010 (read right to left: part0=1, part1=1, part2=0, part3=1, part4=0)
Decimal:  11
```

### Bitmap Utilities

```typescript
import {
  encodeParts,
  decodeParts,
  completePart,
  isPartCompleted,
  getCompletedCount
} from '@/lib/book/progressBitmap';

// Encode boolean array to number
const bitmap = encodeParts([true, true, false, true, false]);
// Returns: 11

// Decode bitmap back to boolean array
const parts = decodeParts(11, 5);
// Returns: [true, true, false, true, false]

// Mark a part as completed
const newBitmap = completePart(3, 2); // bitmap=3, partIndex=2
// Returns: 7 (binary: 111)

// Check if a specific part is completed
const isComplete = isPartCompleted(7, 1);
// Returns: true

// Count completed parts
const count = getCompletedCount(7);
// Returns: 3
```

### Storage Efficiency

For a book with 5 parts:
- **Verbose format**: `[true, true, false, true, false]` = ~30 characters
- **Bitmap format**: `11` = 2 characters

**Savings: ~93%**

## Save System API

### Saving Progress

```typescript
import { saveProgress } from '@/lib/save/saveSystem';

// Save current game state
await saveProgress(gameState);
```

The save function automatically:
- Converts book titles to IDs
- Encodes part completion as bitmaps
- Includes audio settings
- Stores narrative orchestration state
- Saves to `kethaneumProgress` key in localStorage

### Loading Progress

```typescript
import { loadProgress } from '@/lib/save/saveSystem';

// Load and normalize game state
const result = await loadProgress();

if (result.data) {
  // result.data contains full game state
  // result.audioSettings contains audio settings (if any)
  // result.version contains save version
}
```

The load function automatically:
- Detects save format version
- Decodes bitmaps to boolean arrays
- Converts book IDs back to titles
- Restores audio settings
- Returns normalized GameState format

### Clearing Progress

```typescript
import { clearProgress } from '@/lib/save/saveSystem';

// Clear all saved progress
clearProgress();
```

### Checking for Save Data

```typescript
import { hasSaveData, getSaveInfo } from '@/lib/save/saveSystem';

// Check if save exists
const hasData = hasSaveData();

// Get detailed save information
const info = getSaveInfo();
// Returns: { version: 2, storageSize: { bytes: 1234, formatted: "1.2 KB" }, hasData: true }
```

### Getting Raw Save Data

```typescript
import { getRawSaveData } from '@/lib/save/saveSystem';

// Get raw save object for debugging
const rawSave = getRawSaveData();
console.log(JSON.stringify(rawSave, null, 2));
```

## Integration with useGameState

The save system is integrated into the main game state hook via GameStateContext:

```typescript
import { useGameState } from '@/contexts/GameStateContext';

function GameComponent() {
  const { state, updateState, isReady } = useGameState();

  // Game state is automatically loaded on mount
  // Auto-save triggers on state changes

  const handlePuzzleComplete = () => {
    updateState({
      completedPuzzles: state.completedPuzzles + 1
    });
    // Auto-save will trigger after state update
  };
}
```

## Storage Keys

| Key | Description |
|-----|-------------|
| `kethaneumProgress` | Main save data (v2 format with all game state and audio settings) |
| `kethaneumAudioSettings` | Legacy audio settings (fallback only, usually not present) |
| `debug_autosave_logs` | Debug logs for auto-save system (development only) |

Legacy keys that are automatically cleaned up:
- `kethaneumProgress_backup_v1`
- `kethaneumProgress_backup_timestamp`

## Adding New Books

### Step 1: Add to Book Registry

Edit `public/data/bookRegistry.json`:

```json
{
  "books": {
    "N003": {
      "title": "Your New Book Title",
      "genre": "nature",
      "parts": 4,
      "order": 3
    }
  }
}
```

### Step 2: Create Puzzle Data

Add puzzle data files following existing patterns in `public/data/puzzles/`.

### Step 3: Verify Registration

```typescript
import { bookRegistry } from '@/lib/book/bookRegistry';

// Refresh registry cache
await bookRegistry.refresh();

// Verify book is accessible
const book = await bookRegistry.getBook('N003');
console.log(book); // Should show your new book
```

## Best Practices

### 1. Always Use the Save System API

```typescript
// Good - uses official API
import { saveProgress, loadProgress } from '@/lib/save/saveSystem';

// Avoid - bypasses encoding and validation
localStorage.setItem('kethaneumProgress', JSON.stringify(data));
```

### 2. Handle Missing Data Gracefully

```typescript
const result = await loadProgress();

// Always provide defaults
const discoveredBooks = result.data?.discoveredBooks ?? new Set();
const completedPuzzles = result.data?.completedPuzzles ?? 0;
```

### 3. Keep Book Registry Updated

When adding new puzzle content, always update `bookRegistry.json` to ensure:
- Save system can map titles to IDs
- Book of Passage can display correct metadata
- New books are properly tracked

### 4. Use Console Commands for Testing

```typescript
// In browser console:
debugGameState = window.debugGameState; // Access game state
debugLog.print(); // View auto-save logs
debugLog.clear(); // Clear debug logs
```

## Troubleshooting

### Save Not Persisting

1. **Check localStorage availability** - Some browsers block in private mode
2. **Check storage quota** - localStorage has ~5MB limit
3. **Verify auto-save is working** - Check `debug_autosave_logs` in localStorage
4. **Check for errors** - Open browser console for save system errors

### Books Not Showing in Book of Passage

1. **Check discoveredBooks** - Ensure books are in the Set
2. **Verify registry** - Book must exist in `bookRegistry.json`
3. **Check ID mapping** - Title-to-ID lookup must succeed
4. **Check raw save** - Use `getRawSaveData()` to inspect

### Part Completion Not Saving

1. **Verify bitmap encoding** - Parts array must be boolean[]
2. **Check book ID** - Must match registry exactly
3. **Confirm auto-save triggered** - Check debug logs
4. **Verify state update** - Use `updateState()` to trigger auto-save

### Selection State or Orchestration State Not Appearing

This is normal behavior. These blocks (`s` and `no`) only appear in the save file after:
1. Player reaches Book of Passage screen
2. Player selects a genre

On a fresh game start, these fields will not be present until genre selection occurs.

## Storage Capacity

With the optimized format, the system can handle:

| Books | Estimated Size | Notes |
|-------|----------------|-------|
| 10 | ~400 B | Typical early game |
| 100 | ~4 KB | Mid game |
| 500 | ~20 KB | Late game |
| 2500 | ~100 KB | Maximum planned content |

The system comfortably supports the planned 2500 puzzles (10 genres × 50 books × 5 parts) well within localStorage limits (~5MB).

## Future Enhancements

Potential improvements to consider:

- Cloud save sync
- Multiple save slots
- Save compression (gzip)
- Save export/import
- Incremental saves (only changed data)
- Save versioning history

## Support

For issues with the save system:
- Check browser console for error messages
- Verify localStorage in DevTools > Application > Local Storage
- Test with `loadProgress()` and `saveProgress()` directly
- Use `getRawSaveData()` to inspect save contents
- Check `debug_autosave_logs` for auto-save diagnostics
- Verify `bookRegistry.json` for book metadata issues
