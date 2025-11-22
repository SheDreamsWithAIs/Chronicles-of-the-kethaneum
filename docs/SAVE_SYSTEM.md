# Save System Documentation

## Overview

The Chronicles of the Kethaneum save system provides scalable, efficient storage for game progress. The system is designed to handle hundreds of discoverable books (puzzles) without overloading localStorage, achieving approximately 70-80% storage reduction compared to the original format.

Key features:
- **Compact storage format** - Short property names and bitmap encoding
- **Automatic migration** - Seamlessly upgrades old saves to new format
- **Book registry** - Centralized metadata for all books/puzzles
- **Backward compatibility** - Works with both old and new save formats

## Architecture

The save system consists of several interconnected components:

1. **BookRegistryManager** (`lib/book/bookRegistry.ts`) - Singleton managing book metadata lookups
2. **Progress Bitmap Utilities** (`lib/book/progressBitmap.ts`) - Efficient part completion encoding
3. **Optimized Save System** (`lib/save/optimizedSaveSystem.ts`) - Compact v2 format handling
4. **Migrations** (`lib/save/migrations.ts`) - Version upgrade with backup/rollback
5. **Unified Save System** (`lib/save/unifiedSaveSystem.ts`) - Single API for all save operations
6. **Book Registry Data** (`public/data/bookRegistry.json`) - Central book metadata file

## Storage Formats

### Version 1 (Legacy)

The original format stored data verbosely:

```json
{
  "currentPuzzle": {
    "genre": "nature",
    "bookTitle": "Fruits of the Orchard",
    "partIndex": 2
  },
  "discoveredBooks": ["Fruits of the Orchard", "Luminos: The Price of 'Perfect Vision'"],
  "completedParts": {
    "Fruits of the Orchard": [true, true, false, false, false],
    "Luminos: The Price of 'Perfect Vision'": [true, false, false, false]
  }
}
```

### Version 2 (Optimized)

The new format uses compact encoding:

```json
{
  "v": 2,
  "d": "N001,K001",
  "p": {
    "N001": 3,
    "K001": 1
  },
  "g": "nature",
  "m": {
    "b": "N001",
    "i": 2
  },
  "n": 5,
  "c": true,
  "s": 1500
}
```

**Property mapping:**
| v2 Property | v1 Equivalent | Description |
|-------------|---------------|-------------|
| `v` | - | Format version |
| `d` | `discoveredBooks` | Comma-separated book IDs |
| `p` | `completedParts` | Book ID to bitmap mapping |
| `g` | `currentPuzzle.genre` | Current genre |
| `m` | `currentPuzzle` | Current puzzle metadata |
| `m.b` | `currentPuzzle.bookTitle` | Current book ID |
| `m.i` | `currentPuzzle.partIndex` | Current part index |
| `n` | `puzzlesCompleted` | Total puzzles completed |
| `c` | `puzzleCompleted` | Current puzzle complete flag |
| `s` | `score` | Player score |

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
const book = bookRegistry.getBook('N001');
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
const count = getCompletedCount(7, 5);
// Returns: 3
```

### Storage Efficiency

For a book with 5 parts:
- **Old format**: `[true, true, false, true, false]` = ~30 characters
- **New format**: `11` = 2 characters

**Savings: ~93%**

## Migration System

### Automatic Migration

The unified save system automatically detects and migrates old saves:

```typescript
import { loadProgress } from '@/lib/save/unifiedSaveSystem';

// Automatically handles:
// 1. Detecting save version
// 2. Creating backup of old save
// 3. Migrating to v2 format
// 4. Returning normalized game state
const gameState = loadProgress();
```

### Manual Migration

```typescript
import { detectSaveVersion, migrateToV2, createBackup } from '@/lib/save/migrations';

// Check current version
const version = detectSaveVersion();
// Returns: 1, 2, or null

// Create backup before migration
createBackup();

// Migrate v1 to v2
const success = migrateToV2();
```

### Backup and Rollback

Before any migration, the system creates a backup:

```typescript
// Backup is stored at: kethaneumProgress_backup_v1
// Timestamp stored at: kethaneumProgress_backup_timestamp

import { rollbackFromBackup, getBackupInfo } from '@/lib/save/migrations';

// Check if backup exists
const backupInfo = getBackupInfo();
if (backupInfo) {
  console.log(`Backup from: ${backupInfo.timestamp}`);
  console.log(`Version: ${backupInfo.version}`);
}

// Restore from backup if needed
const restored = rollbackFromBackup();
```

## Unified Save System API

The unified save system provides a single interface for all save operations:

### Saving Progress

```typescript
import { saveProgress } from '@/lib/save/unifiedSaveSystem';

// Save current game state
saveProgress({
  currentPuzzle: {
    genre: 'nature',
    bookTitle: 'Fruits of the Orchard',
    partIndex: 2
  },
  discoveredBooks: new Set(['Fruits of the Orchard', 'Luminos...']),
  completedParts: {
    'Fruits of the Orchard': [true, true, false, false, false]
  },
  puzzlesCompleted: 5,
  score: 1500
});
```

### Loading Progress

```typescript
import { loadProgress } from '@/lib/save/unifiedSaveSystem';

// Load and normalize game state
const gameState = loadProgress();

// Returns normalized state with:
// - discoveredBooks as Set<string>
// - completedParts as Record<string, boolean[]>
// - All other game state properties
```

### Clearing Progress

```typescript
import { clearProgress } from '@/lib/save/unifiedSaveSystem';

// Clear all saved progress
clearProgress();
```

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
const book = bookRegistry.getBook('N003');
console.log(book); // Should show your new book
```

## Integration with useGameState

The save system is integrated into the main game state hook:

```typescript
import { useGameState } from '@/hooks/useGameState';

function GameComponent() {
  const {
    gameState,
    saveGame,
    loadGame,
    updateGameState
  } = useGameState();

  // Game state is automatically loaded on mount
  // and saved when updateGameState is called

  const handlePuzzleComplete = () => {
    updateGameState({
      puzzlesCompleted: gameState.puzzlesCompleted + 1,
      score: gameState.score + 100
    });
    // Automatically saves in optimized format
  };
}
```

## Storage Keys

| Key | Description |
|-----|-------------|
| `kethaneumProgress` | Main save data (v1 or v2 format) |
| `kethaneumProgress_backup_v1` | Backup of v1 save before migration |
| `kethaneumProgress_backup_timestamp` | When backup was created |
| `kethaneumAudioSettings` | Audio preferences (separate) |

## Best Practices

### 1. Always Use Unified API

```typescript
// Good - uses unified system
import { saveProgress, loadProgress } from '@/lib/save/unifiedSaveSystem';

// Avoid - bypasses migration handling
localStorage.setItem('kethaneumProgress', JSON.stringify(data));
```

### 2. Handle Missing Data Gracefully

```typescript
const gameState = loadProgress();

// Always provide defaults
const discoveredBooks = gameState?.discoveredBooks ?? new Set();
const score = gameState?.score ?? 0;
```

### 3. Keep Book Registry Updated

When adding new puzzle content, always update `bookRegistry.json` to ensure:
- Save system can map titles to IDs
- Book of Passage can display correct metadata
- Migration system handles the book correctly

### 4. Test Migrations

After changing save format, test migration paths:

```typescript
// In development, simulate old save
localStorage.setItem('kethaneumProgress', JSON.stringify({
  // v1 format data
}));

// Load should auto-migrate
const state = loadProgress();
```

## Troubleshooting

### Save Not Persisting

1. **Check localStorage availability** - Some browsers block in private mode
2. **Check storage quota** - localStorage has ~5MB limit
3. **Verify save is called** - Add logging to `saveProgress`

### Books Not Showing in Book of Passage

1. **Check discoveredBooks** - Ensure books are in the Set
2. **Verify registry** - Book must exist in `bookRegistry.json`
3. **Check ID mapping** - Title-to-ID lookup must succeed

### Migration Failed

1. **Check backup** - Restore from `kethaneumProgress_backup_v1`
2. **Verify data format** - Ensure v1 data is valid JSON
3. **Check console** - Migration logs errors

### Part Completion Not Saving

1. **Verify bitmap encoding** - Parts array must be boolean[]
2. **Check book ID** - Must match registry exactly
3. **Confirm save trigger** - `updateGameState` must be called

## Storage Capacity

With the optimized format, the system can handle:

| Books | v1 Size (est.) | v2 Size (est.) | Savings |
|-------|----------------|----------------|---------|
| 10 | ~2 KB | ~400 B | 80% |
| 100 | ~20 KB | ~4 KB | 80% |
| 500 | ~100 KB | ~20 KB | 80% |
| 2500 | ~500 KB | ~100 KB | 80% |

The system comfortably supports the planned 2500 puzzles (10 genres x 50 books x 5 parts) well within localStorage limits.

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
- Check `bookRegistry.json` for book metadata issues
