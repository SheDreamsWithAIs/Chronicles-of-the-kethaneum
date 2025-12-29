# Book Management UI - Design Plan

## Overview

A web-based admin panel for easily adding, editing, and managing the hundreds of books in Chronicles of the Kethaneum. This eliminates the need to manually edit JSON files or use CLI tools, making content creation fast and error-free.

## Why This Matters

When scaling to 2500+ puzzles across 10 genres with 50 books each, you need:
- **Speed**: Add 50 books in minutes, not hours
- **Accuracy**: Form validation prevents JSON errors
- **Collaboration**: Share a web link with writers/content creators
- **Bulk Operations**: Import entire genres from spreadsheets
- **Preview**: See how books appear in-game before saving

---

## Design: Web-Based Admin Panel

### Location
**Route**: `/admin/books` (development/staging only - not in production build)

### Security
- Protected route (password/auth check)
- Only accessible in development mode or with admin flag
- Could add environment variable check: `NEXT_PUBLIC_ADMIN_ENABLED=true`

---

## UI Sections

### 1. Book Catalog View (Main Page)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📚 Book Management System                    [+ Add Book]  │
├─────────────────────────────────────────────────────────────┤
│  Search: [________] Genre: [All ▾] Sort: [Order ▾]         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Genre: Kethaneum (50 books)                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ K001 │ The Chronicles of Ancient Earth │ 5 parts   │    │
│  │      │ [Edit] [Delete] [Preview]                   │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ K002 │ Mysteries of the Deep         │ 4 parts    │    │
│  │      │ [Edit] [Delete] [Preview]                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Genre: Nature (50 books)                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ N001 │ Forest Secrets                │ 3 parts    │    │
│  │      │ [Edit] [Delete] [Preview]                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Import from CSV] [Export Registry] [Bulk Edit]            │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- List all books organized by genre
- Search by title or book ID
- Filter by genre
- Sort by order, title, or parts count
- Quick actions: Edit, Delete, Preview

---

### 2. Add/Edit Book Form

**Form Fields:**
```
┌─────────────────────────────────────────────────────────────┐
│  Add New Book                                    [✕ Close]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Book Title *                                                │
│  [_____________________________________________]             │
│                                                              │
│  Genre *                                                     │
│  [Kethaneum ▾] or [Create New Genre +]                     │
│                                                              │
│  Number of Parts *                                           │
│  [5    ] (1-32)                                             │
│                                                              │
│  Order in Genre                                              │
│  [Auto ▾] or [Manual: __]                                  │
│                                                              │
│  Book ID (Auto-generated)                                    │
│  K003                                                        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 💡 Preview:                                     │        │
│  │ This will create book "K003" in the Kethaneum  │        │
│  │ genre with 5 story parts. It will be book #3   │        │
│  │ in the Kethaneum sequence.                     │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [Cancel]                              [Save Book]          │
└─────────────────────────────────────────────────────────────┘
```

**Validation:**
- Required fields marked with *
- Book title: 3-100 characters
- Genre: Must exist or create new
- Parts: 1-32 (bitwise limit)
- Auto-generate book ID based on genre
- Prevent duplicate titles

---

### 3. Bulk Import from CSV/Spreadsheet

**Import Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│  Import Books from CSV                           [✕ Close]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Download Template                                  │
│  [📥 Download CSV Template]                                 │
│                                                              │
│  Step 2: Upload Your File                                   │
│  [Drag & drop CSV file here or click to browse]            │
│                                                              │
│  Step 3: Preview Import                                     │
│  ┌────────────────────────────────────────────────┐        │
│  │ 50 books found in CSV                           │        │
│  │                                                 │        │
│  │ ✓ Nature - Forest Secrets (3 parts)            │        │
│  │ ✓ Nature - Ocean Depths (4 parts)              │        │
│  │ ✓ Nature - Mountain Tales (5 parts)            │        │
│  │ ⚠ Warning: "Sky Stories" already exists        │        │
│  │ ✗ Error: "Invalid Book" missing genre          │        │
│  │                                                 │        │
│  │ Valid: 47 | Warnings: 1 | Errors: 2             │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [Cancel]            [Import Valid Books (47)]              │
└─────────────────────────────────────────────────────────────┘
```

**CSV Template Format:**
```csv
title,genre,parts,order
The Chronicles of Ancient Earth,kethaneum,5,1
Mysteries of the Deep,kethaneum,4,2
Forest Secrets,nature,3,1
Ocean Depths,nature,4,2
```

**Import Features:**
- Drag-and-drop CSV upload
- Validate all rows before import
- Show warnings for duplicates
- Show errors for invalid data
- Option to skip/overwrite duplicates
- Bulk import confirmation

---

### 4. Genre Management

**Genre Panel:**
```
┌─────────────────────────────────────────────────────────────┐
│  Manage Genres                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Existing Genres:                                            │
│  ┌────────────────────────────────────────────────┐        │
│  │ Kethaneum     (50 books) │ [Rename] [Delete]   │        │
│  │ Nature        (50 books) │ [Rename] [Delete]   │        │
│  │ Science       (50 books) │ [Rename] [Delete]   │        │
│  │ Mystery       (0 books)  │ [Rename] [Delete]   │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Add New Genre:                                              │
│  [________________________]  [+ Add Genre]                  │
│                                                              │
│  ⚠ Deleting a genre will delete all its books!              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Book Preview

**Preview Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  Preview: The Chronicles of Ancient Earth        [✕ Close]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  This is how the book will appear in the Book of Passage:   │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ The Chronicles of Ancient Earth                 │        │
│  │ Genre: Kethaneum                    0/5 (0%)    │        │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │        │
│  │                                                 │        │
│  │ Parts: [1] [2] [3] [4] [5]                     │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Registry Entry (JSON):                                      │
│  ┌────────────────────────────────────────────────┐        │
│  │ "K001": {                                       │        │
│  │   "title": "The Chronicles of Ancient Earth",   │        │
│  │   "genre": "kethaneum",                         │        │
│  │   "parts": 5,                                   │        │
│  │   "order": 1                                    │        │
│  │ }                                               │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [Copy JSON]                                [Close]         │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File Structure
```
app/
  admin/
    books/
      page.tsx              # Main catalog view
      components/
        BookForm.tsx        # Add/Edit form
        BookList.tsx        # Book catalog display
        BulkImport.tsx      # CSV import
        GenreManager.tsx    # Genre management
        BookPreview.tsx     # Preview modal

lib/
  book/
    bookRegistry.ts         # Registry manager (from main design)
    bookAdmin.ts            # Admin-specific utilities
    validation.ts           # Form validation
    csvParser.ts            # CSV import/export
```

### Core Functions

**File: `/lib/book/bookAdmin.ts`**
```typescript
import { bookRegistry } from './bookRegistry';

export interface BookFormData {
  title: string;
  genre: string;
  parts: number;
  order?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate book data before saving
 */
export function validateBook(data: BookFormData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  // Genre validation
  if (!data.genre || data.genre.trim().length === 0) {
    errors.push('Genre is required');
  }

  // Parts validation
  if (!data.parts || data.parts < 1) {
    errors.push('Must have at least 1 part');
  }
  if (data.parts > 32) {
    errors.push('Maximum 32 parts (bitwise limit)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Add a new book to the registry
 */
export async function addBook(data: BookFormData): Promise<{
  success: boolean;
  bookId?: string;
  error?: string;
}> {
  const validation = validateBook(data);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  try {
    const registry = await bookRegistry.loadRegistry();

    // Generate book ID
    const prefix = data.genre.charAt(0).toUpperCase();
    const genreBooks = Object.keys(registry.books)
      .filter(id => id.startsWith(prefix))
      .map(id => parseInt(id.slice(1), 10))
      .sort((a, b) => b - a);

    const nextNum = genreBooks.length > 0 ? genreBooks[0] + 1 : 1;
    const bookId = `${prefix}${String(nextNum).padStart(3, '0')}`;

    // Check for duplicate title
    const existingBook = Object.values(registry.books).find(
      book => book.title.toLowerCase() === data.title.toLowerCase()
    );
    if (existingBook) {
      return { success: false, error: 'Book with this title already exists' };
    }

    // Determine order
    let order = data.order;
    if (!order) {
      const genreBookCount = Object.values(registry.books)
        .filter(b => b.genre === data.genre).length;
      order = genreBookCount + 1;
    }

    // Add book to registry
    registry.books[bookId] = {
      title: data.title,
      genre: data.genre,
      parts: data.parts,
      order,
    };

    // Update genre count
    if (!registry.genres[data.genre]) {
      registry.genres[data.genre] = {
        name: data.genre,
        bookCount: 0,
      };
    }
    registry.genres[data.genre].bookCount++;

    // Save registry
    await saveRegistry(registry);

    return { success: true, bookId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing book
 */
export async function updateBook(
  bookId: string,
  data: Partial<BookFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const registry = await bookRegistry.loadRegistry();
    const book = registry.books[bookId];

    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    // Update fields
    if (data.title) book.title = data.title;
    if (data.genre) book.genre = data.genre;
    if (data.parts) book.parts = data.parts;
    if (data.order !== undefined) book.order = data.order;

    // Validate
    const validation = validateBook(book as BookFormData);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    await saveRegistry(registry);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a book from the registry
 */
export async function deleteBook(
  bookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const registry = await bookRegistry.loadRegistry();
    const book = registry.books[bookId];

    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    // Update genre count
    if (registry.genres[book.genre]) {
      registry.genres[book.genre].bookCount--;
    }

    delete registry.books[bookId];
    await saveRegistry(registry);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save the registry to file
 * NOTE: This requires a server-side API route in production
 */
async function saveRegistry(registry: any): Promise<void> {
  // In development: direct file write via API route
  const response = await fetch('/api/admin/save-registry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registry),
  });

  if (!response.ok) {
    throw new Error('Failed to save registry');
  }
}
```

**File: `/lib/book/csvParser.ts`**
```typescript
import { BookFormData, validateBook } from './bookAdmin';

export interface CSVRow {
  title: string;
  genre: string;
  parts: number;
  order?: number;
}

export interface ParseResult {
  valid: CSVRow[];
  invalid: { row: number; data: CSVRow; errors: string[] }[];
  warnings: { row: number; data: CSVRow; warnings: string[] }[];
}

/**
 * Parse CSV content into book data
 */
export function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

  const valid: CSVRow[] = [];
  const invalid: ParseResult['invalid'] = [];
  const warnings: ParseResult['warnings'] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    const row: CSVRow = {
      title: values[headers.indexOf('title')] || '',
      genre: values[headers.indexOf('genre')] || '',
      parts: parseInt(values[headers.indexOf('parts')] || '1', 10),
      order: values[headers.indexOf('order')]
        ? parseInt(values[headers.indexOf('order')], 10)
        : undefined,
    };

    const validation = validateBook(row as BookFormData);

    if (!validation.valid) {
      invalid.push({ row: i + 1, data: row, errors: validation.errors });
    } else {
      valid.push(row);
      if (validation.warnings.length > 0) {
        warnings.push({ row: i + 1, data: row, warnings: validation.warnings });
      }
    }
  }

  return { valid, invalid, warnings };
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  return [
    'title,genre,parts,order',
    'Example Book Title,kethaneum,5,1',
    'Another Book,nature,3,2',
  ].join('\n');
}

/**
 * Export registry to CSV
 */
export function exportToCSV(books: { [id: string]: any }): string {
  const rows = Object.entries(books).map(([id, book]) => {
    return `${book.title},${book.genre},${book.parts},${book.order}`;
  });

  return ['title,genre,parts,order', ...rows].join('\n');
}
```

### API Routes

**File: `/app/api/admin/save-registry/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Only allow in development or with admin flag
const ADMIN_ENABLED = process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true';

export async function POST(req: NextRequest) {
  if (!ADMIN_ENABLED) {
    return NextResponse.json(
      { error: 'Admin panel disabled' },
      { status: 403 }
    );
  }

  try {
    const registry = await req.json();

    // Validate registry structure
    if (!registry.books || !registry.genres) {
      return NextResponse.json(
        { error: 'Invalid registry format' },
        { status: 400 }
      );
    }

    // Write to file
    const registryPath = path.join(
      process.cwd(),
      'public/data/bookRegistry.json'
    );

    await fs.writeFile(
      registryPath,
      JSON.stringify(registry, null, 2),
      'utf-8'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save registry:', error);
    return NextResponse.json(
      { error: 'Failed to save registry' },
      { status: 500 }
    );
  }
}
```

---

## UI Component Example

**File: `/app/admin/books/components/BookForm.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { addBook, validateBook, BookFormData } from '@/lib/book/bookAdmin';
import styles from './BookForm.module.css';

interface BookFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export function BookForm({ onSave, onCancel }: BookFormProps) {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    genre: '',
    parts: 5,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validation = validateBook(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Save
    setSaving(true);
    const result = await addBook(formData);
    setSaving(false);

    if (result.success) {
      onSave();
    } else {
      setErrors([result.error || 'Failed to save book']);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Add New Book</h2>

      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        </div>
      )}

      <label>
        Book Title *
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </label>

      <label>
        Genre *
        <input
          type="text"
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          required
        />
      </label>

      <label>
        Number of Parts *
        <input
          type="number"
          min="1"
          max="32"
          value={formData.parts}
          onChange={(e) =>
            setFormData({ ...formData, parts: parseInt(e.target.value, 10) })
          }
          required
        />
      </label>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Book'}
        </button>
      </div>
    </form>
  );
}
```

---

## Workflow Example

### Adding 50 Nature Books

**Option 1: Manual (Web Form)**
1. Navigate to `/admin/books`
2. Click "Add Book"
3. Fill form: Title, Genre (nature), Parts
4. Click Save
5. Repeat 49 more times

**Option 2: Bulk Import (CSV)**
1. Create spreadsheet with 50 books
2. Export as CSV
3. Navigate to `/admin/books`
4. Click "Import from CSV"
5. Upload file
6. Review validation
7. Click "Import Valid Books"
8. Done! 50 books added in seconds

---

## Benefits

1. **Speed**: Add 50 books via CSV in < 1 minute
2. **Accuracy**: Form validation prevents errors
3. **Visual**: See books organized by genre
4. **Safe**: Preview before saving
5. **Team-Friendly**: Share web link with content creators
6. **Flexible**: Support both manual and bulk operations

---

## Development Phases

### Phase 1: Core Form (1-2 hours)
- [ ] Basic add/edit book form
- [ ] Form validation
- [ ] Save to registry API route

### Phase 2: Catalog View (1-2 hours)
- [ ] Display all books in organized list
- [ ] Search and filter
- [ ] Edit/delete actions

### Phase 3: Bulk Import (2-3 hours)
- [ ] CSV parser
- [ ] Upload interface
- [ ] Validation preview
- [ ] Bulk save

### Phase 4: Polish (1-2 hours)
- [ ] Preview modal
- [ ] Genre management
- [ ] Export functionality
- [ ] Styling

**Total Estimate**: 5-9 hours of development

---

## Security Considerations

1. **Environment Check**: Only enable in dev or with explicit flag
2. **Authentication**: Add password/auth check for production admin
3. **Validation**: Server-side validation on all saves
4. **Backup**: Auto-backup registry before bulk operations
5. **Rate Limiting**: Prevent abuse of API routes

---

## Future Enhancements

1. **Puzzle Link**: Connect books to actual puzzle files
2. **Story Editor**: Edit story excerpts inline
3. **Version Control**: Track changes to registry
4. **Undo/Redo**: Revert accidental changes
5. **Multi-Language**: Support translations
6. **Analytics**: Track most popular books

---

## Conclusion

This Book Management UI transforms content creation from tedious JSON editing to a streamlined web experience. Adding 50 books becomes a 5-minute task instead of an hour-long error-prone process. Perfect for scaling to 2500+ puzzles!
