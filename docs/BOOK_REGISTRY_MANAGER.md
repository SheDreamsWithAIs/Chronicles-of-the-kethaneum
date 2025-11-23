# Book Registry Manager Documentation

## Overview

The Book Registry Manager is a web-based admin tool for managing the book registry (`bookRegistry.json`). It allows developers to scan genre files for new or updated books, sync changes to the registry, and manage book metadata like order and part counts.

## Accessing the Tool

The Book Registry Manager is available in development mode only:

```
http://localhost:3000/tools/book-registry
```

It is automatically excluded from production builds via `scripts/build-production.js`.

## Features

### 1. Scan Genre Files

Select a genre file from the dropdown to scan it for books. The scanner:

- Reads the genre file from `public/data/puzzles/`
- Extracts book metadata (title, parts count)
- Compares against the current registry
- Shows sync status for each book:
  - **Green (In sync)**: Book exists in registry with matching parts count
  - **Yellow (Needs update)**: Book exists but parts count differs
  - **Blue (New)**: Book not yet in registry

### 2. Sync to Registry

After scanning, you can sync changes:

- **Sync All**: Adds all new books and updates changed books
- **Sync Individual**: Click "Sync" next to specific books

When adding new books, the system automatically:
- Generates a compact ID (e.g., `F01`, `M03`) using the genre prefix
- Assigns the next available order number
- Registers the genre if it's new

### 3. Edit Book Metadata

Click "Edit" on any book to modify:

- **Title**: Display name of the book
- **Parts**: Number of parts/chapters (1-20)
- **Order**: Display order within the genre

### 4. Reorder Books

When changing a book's order:

1. Enter the new order position
2. If it conflicts with another book, a confirmation modal appears
3. The modal shows which books will be shifted
4. Confirm to auto-shuffle all affected books

**Example**: Moving book from position 3 to position 1:
- Book at position 1 moves to position 2
- Book at position 2 moves to position 3
- Target book takes position 1

### 5. Validate Registry

Click "Validate Registry" to check for:

- Missing genre definitions
- Invalid order sequences (gaps or duplicates)
- Books with invalid part counts
- Orphaned genre references

## File Structure

```
app/
├── api/
│   └── book-registry/
│       └── route.ts          # API endpoints
└── tools/
    ├── page.tsx              # Tools index
    └── book-registry/
        └── page.tsx          # Manager UI

public/
└── data/
    ├── bookRegistry.json     # The registry file
    ├── genreManifest.json    # List of genre files
    └── puzzles/
        └── *.json            # Genre puzzle files
```

## API Endpoints

All endpoints are at `/api/book-registry`:

### GET Requests

| Query Params | Description |
|--------------|-------------|
| (none) | Returns the full registry |
| `action=genreFiles` | Returns list of available genre files |
| `action=scan&file=<filename>` | Scans a genre file and returns comparison |
| `action=validate` | Validates registry integrity |

### POST Requests

**Sync books to registry:**
```json
{
  "action": "sync",
  "data": {
    "books": [
      { "title": "Book Name", "genre": "genre-id", "parts": 5 }
    ]
  }
}
```

### PUT Requests

**Update book metadata:**
```json
{
  "bookId": "F01",
  "updates": {
    "title": "New Title",
    "parts": 6,
    "order": 2
  }
}
```

**With reorder confirmation:**
```json
{
  "bookId": "F01",
  "updates": { "order": 2 },
  "confirmReorder": true
}
```

### DELETE Requests

**Delete a book:**
```
DELETE /api/book-registry?bookId=F01
```

## Registry Format

The `bookRegistry.json` file structure:

```json
{
  "version": 1,
  "books": {
    "F01": {
      "title": "The Crystal Garden",
      "genre": "fantasy",
      "parts": 5,
      "order": 1
    },
    "F02": {
      "title": "Dragon's Dawn",
      "genre": "fantasy",
      "parts": 4,
      "order": 2
    }
  },
  "genres": {
    "fantasy": {
      "name": "Fantasy",
      "prefix": "F"
    },
    "mystery": {
      "name": "Mystery",
      "prefix": "M"
    }
  }
}
```

## Workflow: Adding a New Genre

1. Create the genre puzzle file in `public/data/puzzles/` (e.g., `horror-books.json`)
2. Add the file to `genreManifest.json`
3. Open Book Registry Manager
4. Select the new genre file from the dropdown
5. Click "Scan File"
6. Click "Sync All" to add all books

The system will automatically:
- Create a new genre entry with an appropriate prefix
- Generate compact IDs for all books
- Assign sequential order numbers

## Workflow: Adding Books to Existing Genre

1. Add new book entries to the genre puzzle file
2. Open Book Registry Manager
3. Select the genre file and scan
4. New books appear with blue "New" badges
5. Click "Sync" for individual books or "Sync All"

## Development Notes

- The tool only runs in development mode (`npm run dev`)
- Changes are written directly to `public/data/bookRegistry.json`
- The API routes are excluded from production builds
- Themed scrollbar appears when a genre has more than 10 books
