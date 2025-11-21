import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const REGISTRY_PATH = path.join(process.cwd(), 'public', 'data', 'bookRegistry.json');

interface BookEntry {
  title: string;
  genre: string;
  parts: number;
  order: number;
}

interface GenreEntry {
  name: string;
  prefix: string;
}

interface BookRegistry {
  version: number;
  books: Record<string, BookEntry>;
  genres: Record<string, GenreEntry>;
}

// Load the registry
async function loadRegistry(): Promise<BookRegistry> {
  const content = await fs.readFile(REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

// Save the registry
async function saveRegistry(registry: BookRegistry): Promise<void> {
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

// Generate next available ID for a genre
function generateNextId(registry: BookRegistry, genre: string): string {
  const genreData = registry.genres[genre];
  if (!genreData) {
    throw new Error(`Unknown genre: ${genre}`);
  }

  const prefix = genreData.prefix;
  const existingIds = Object.keys(registry.books)
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.slice(prefix.length), 10))
    .filter(n => !isNaN(n));

  const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

// Validate registry integrity
function validateRegistry(registry: BookRegistry): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for duplicate IDs (inherently prevented by object keys, but check titles)
  const titles = new Set<string>();
  for (const [id, book] of Object.entries(registry.books)) {
    // Check title uniqueness
    if (titles.has(book.title)) {
      errors.push(`Duplicate title: "${book.title}"`);
    }
    titles.add(book.title);

    // Check genre exists
    if (!registry.genres[book.genre]) {
      errors.push(`Book ${id} has unknown genre: "${book.genre}"`);
    }

    // Check ID prefix matches genre
    const expectedPrefix = registry.genres[book.genre]?.prefix;
    if (expectedPrefix && !id.startsWith(expectedPrefix)) {
      errors.push(`Book ${id} has mismatched prefix (expected ${expectedPrefix})`);
    }

    // Check parts is positive
    if (book.parts < 1) {
      errors.push(`Book ${id} has invalid parts count: ${book.parts}`);
    }

    // Check order is positive
    if (book.order < 1) {
      errors.push(`Book ${id} has invalid order: ${book.order}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// GET - Get registry data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    const registry = await loadRegistry();

    if (action === 'validate') {
      const validation = validateRegistry(registry);
      return NextResponse.json({
        success: true,
        ...validation
      });
    }

    if (action === 'nextId') {
      const genre = searchParams.get('genre');
      if (!genre) {
        return NextResponse.json(
          { success: false, error: 'Genre is required for nextId action' },
          { status: 400 }
        );
      }
      try {
        const nextId = generateNextId(registry, genre);
        return NextResponse.json({ success: true, nextId });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: (error as Error).message },
          { status: 400 }
        );
      }
    }

    // Default: return full registry
    return NextResponse.json({
      success: true,
      registry
    });
  } catch (error) {
    console.error('Registry read error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Add new book or genre
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    const registry = await loadRegistry();

    if (type === 'book') {
      const { id, title, genre, parts, order } = data;

      // Validate required fields
      if (!title || !genre || !parts) {
        return NextResponse.json(
          { success: false, error: 'Title, genre, and parts are required' },
          { status: 400 }
        );
      }

      // Validate genre exists
      if (!registry.genres[genre]) {
        return NextResponse.json(
          { success: false, error: `Unknown genre: ${genre}` },
          { status: 400 }
        );
      }

      // Generate ID if not provided
      const bookId = id || generateNextId(registry, genre);

      // Check if ID already exists
      if (registry.books[bookId]) {
        return NextResponse.json(
          { success: false, error: `Book ID ${bookId} already exists` },
          { status: 400 }
        );
      }

      // Check for duplicate title
      const existingTitle = Object.values(registry.books).find(b => b.title === title);
      if (existingTitle) {
        return NextResponse.json(
          { success: false, error: `A book with title "${title}" already exists` },
          { status: 400 }
        );
      }

      // Calculate order if not provided
      const bookOrder = order || Object.values(registry.books)
        .filter(b => b.genre === genre)
        .length + 1;

      // Add book
      registry.books[bookId] = {
        title,
        genre,
        parts: Number(parts),
        order: bookOrder
      };

      await saveRegistry(registry);

      return NextResponse.json({
        success: true,
        bookId,
        book: registry.books[bookId]
      });
    }

    if (type === 'genre') {
      const { id, name, prefix } = data;

      if (!id || !name || !prefix) {
        return NextResponse.json(
          { success: false, error: 'ID, name, and prefix are required for genre' },
          { status: 400 }
        );
      }

      if (registry.genres[id]) {
        return NextResponse.json(
          { success: false, error: `Genre ${id} already exists` },
          { status: 400 }
        );
      }

      // Check prefix uniqueness
      const existingPrefix = Object.values(registry.genres).find(g => g.prefix === prefix);
      if (existingPrefix) {
        return NextResponse.json(
          { success: false, error: `Prefix "${prefix}" is already used by another genre` },
          { status: 400 }
        );
      }

      registry.genres[id] = { name, prefix };
      await saveRegistry(registry);

      return NextResponse.json({
        success: true,
        genreId: id,
        genre: registry.genres[id]
      });
    }

    if (type === 'bulk') {
      const { books } = data;
      if (!Array.isArray(books)) {
        return NextResponse.json(
          { success: false, error: 'Books must be an array' },
          { status: 400 }
        );
      }

      const added: string[] = [];
      const errors: string[] = [];

      for (const book of books) {
        try {
          const { title, genre, parts, order } = book;

          if (!title || !genre || !parts) {
            errors.push(`Missing required fields for book: ${title || 'unknown'}`);
            continue;
          }

          if (!registry.genres[genre]) {
            errors.push(`Unknown genre "${genre}" for book: ${title}`);
            continue;
          }

          // Check for duplicate title
          const existingTitle = Object.values(registry.books).find(b => b.title === title);
          if (existingTitle) {
            errors.push(`Duplicate title: ${title}`);
            continue;
          }

          const bookId = generateNextId(registry, genre);
          const bookOrder = order || Object.values(registry.books)
            .filter(b => b.genre === genre)
            .length + 1;

          registry.books[bookId] = {
            title,
            genre,
            parts: Number(parts),
            order: bookOrder
          };

          added.push(bookId);
        } catch (error) {
          errors.push(`Error adding book: ${(error as Error).message}`);
        }
      }

      if (added.length > 0) {
        await saveRegistry(registry);
      }

      return NextResponse.json({
        success: true,
        added,
        errors,
        totalAdded: added.length,
        totalErrors: errors.length
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "book", "genre", or "bulk"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registry write error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update existing book
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, updates } = body;

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const registry = await loadRegistry();

    if (!registry.books[bookId]) {
      return NextResponse.json(
        { success: false, error: `Book ${bookId} not found` },
        { status: 404 }
      );
    }

    // Apply updates
    const book = registry.books[bookId];

    if (updates.title !== undefined) {
      // Check for duplicate title (excluding current book)
      const existingTitle = Object.entries(registry.books)
        .find(([id, b]) => id !== bookId && b.title === updates.title);
      if (existingTitle) {
        return NextResponse.json(
          { success: false, error: `A book with title "${updates.title}" already exists` },
          { status: 400 }
        );
      }
      book.title = updates.title;
    }

    if (updates.parts !== undefined) {
      book.parts = Number(updates.parts);
    }

    if (updates.order !== undefined) {
      book.order = Number(updates.order);
    }

    // Note: Changing genre would require changing the ID, which is complex
    // For now, we don't support genre changes

    await saveRegistry(registry);

    return NextResponse.json({
      success: true,
      bookId,
      book: registry.books[bookId]
    });
  } catch (error) {
    console.error('Registry update error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete book
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const registry = await loadRegistry();

    if (!registry.books[bookId]) {
      return NextResponse.json(
        { success: false, error: `Book ${bookId} not found` },
        { status: 404 }
      );
    }

    const deletedBook = registry.books[bookId];
    delete registry.books[bookId];

    await saveRegistry(registry);

    return NextResponse.json({
      success: true,
      bookId,
      deletedBook
    });
  } catch (error) {
    console.error('Registry delete error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
