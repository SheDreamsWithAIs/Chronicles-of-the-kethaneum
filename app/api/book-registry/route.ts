import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const REGISTRY_PATH = path.join(DATA_DIR, 'bookRegistry.json');
const MANIFEST_PATH = path.join(DATA_DIR, 'genreManifest.json');

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

interface PuzzleEntry {
  title: string;
  book: string;
  storyPart: number;
  genre: string;
  words: string[];
  storyExcerpt: string;
}

interface ScannedBook {
  title: string;
  genre: string;
  parts: number;
  inRegistry: boolean;
  registryId?: string;
  registryParts?: number;
  needsUpdate: boolean;
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

// Load genre manifest
async function loadGenreManifest(): Promise<{ genreFiles: string[] }> {
  const content = await fs.readFile(MANIFEST_PATH, 'utf-8');
  return JSON.parse(content);
}

// Load and scan a genre file
async function scanGenreFile(filePath: string): Promise<ScannedBook[]> {
  const fullPath = path.join(process.cwd(), 'public', filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  const puzzles: PuzzleEntry[] = JSON.parse(content);

  // Group puzzles by book
  const bookMap = new Map<string, { genre: string; parts: Set<number> }>();

  for (const puzzle of puzzles) {
    if (!puzzle.book) continue;

    if (!bookMap.has(puzzle.book)) {
      bookMap.set(puzzle.book, {
        genre: puzzle.genre,
        parts: new Set()
      });
    }

    const bookData = bookMap.get(puzzle.book)!;
    bookData.parts.add(puzzle.storyPart);
  }

  // Convert to array with part counts
  const books: Array<{ title: string; genre: string; parts: number }> = [];
  bookMap.forEach((data, title) => {
    books.push({
      title,
      genre: data.genre,
      parts: data.parts.size
    });
  });

  // Load registry to check status
  const registry = await loadRegistry();

  // Annotate with registry status
  return books.map(book => {
    const registryEntry = Object.entries(registry.books).find(
      ([, b]) => b.title === book.title
    );

    if (registryEntry) {
      const [id, regBook] = registryEntry;
      return {
        ...book,
        inRegistry: true,
        registryId: id,
        registryParts: regBook.parts,
        needsUpdate: regBook.parts !== book.parts
      };
    }

    return {
      ...book,
      inRegistry: false,
      needsUpdate: true // New book needs to be added
    };
  });
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

  const titles = new Set<string>();
  for (const [id, book] of Object.entries(registry.books)) {
    if (titles.has(book.title)) {
      errors.push(`Duplicate title: "${book.title}"`);
    }
    titles.add(book.title);

    if (!registry.genres[book.genre]) {
      errors.push(`Book ${id} has unknown genre: "${book.genre}"`);
    }

    const expectedPrefix = registry.genres[book.genre]?.prefix;
    if (expectedPrefix && !id.startsWith(expectedPrefix)) {
      errors.push(`Book ${id} has mismatched prefix (expected ${expectedPrefix})`);
    }

    if (book.parts < 1) {
      errors.push(`Book ${id} has invalid parts count: ${book.parts}`);
    }

    if (book.order < 1) {
      errors.push(`Book ${id} has invalid order: ${book.order}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// GET - Get registry data, genre files, or scan results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Get list of genre files
    if (action === 'genreFiles') {
      const manifest = await loadGenreManifest();
      return NextResponse.json({
        success: true,
        genreFiles: manifest.genreFiles
      });
    }

    // Scan a specific genre file
    if (action === 'scan') {
      const filePath = searchParams.get('file');
      if (!filePath) {
        return NextResponse.json(
          { success: false, error: 'File path is required' },
          { status: 400 }
        );
      }

      const books = await scanGenreFile(filePath);
      return NextResponse.json({
        success: true,
        file: filePath,
        books
      });
    }

    // Validate registry
    if (action === 'validate') {
      const registry = await loadRegistry();
      const validation = validateRegistry(registry);
      return NextResponse.json({
        success: true,
        ...validation
      });
    }

    // Get next ID for a genre
    if (action === 'nextId') {
      const genre = searchParams.get('genre');
      if (!genre) {
        return NextResponse.json(
          { success: false, error: 'Genre is required for nextId action' },
          { status: 400 }
        );
      }
      const registry = await loadRegistry();
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
    const registry = await loadRegistry();
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

// POST - Sync books from genre file to registry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const registry = await loadRegistry();

    // Sync books from a scanned genre file
    if (action === 'sync') {
      const { books } = data as { books: ScannedBook[] };

      if (!Array.isArray(books)) {
        return NextResponse.json(
          { success: false, error: 'Books must be an array' },
          { status: 400 }
        );
      }

      const added: string[] = [];
      const updated: string[] = [];
      const errors: string[] = [];

      for (const book of books) {
        try {
          // Validate genre exists
          if (!registry.genres[book.genre]) {
            errors.push(`Unknown genre "${book.genre}" for book: ${book.title}`);
            continue;
          }

          if (book.inRegistry && book.registryId) {
            // Update existing book
            if (book.needsUpdate) {
              registry.books[book.registryId].parts = book.parts;
              updated.push(book.registryId);
            }
          } else {
            // Add new book
            const bookId = generateNextId(registry, book.genre);
            const bookOrder = Object.values(registry.books)
              .filter(b => b.genre === book.genre)
              .length + 1;

            registry.books[bookId] = {
              title: book.title,
              genre: book.genre,
              parts: book.parts,
              order: bookOrder
            };

            added.push(bookId);
          }
        } catch (error) {
          errors.push(`Error processing "${book.title}": ${(error as Error).message}`);
        }
      }

      if (added.length > 0 || updated.length > 0) {
        await saveRegistry(registry);
      }

      return NextResponse.json({
        success: true,
        added,
        updated,
        errors,
        totalAdded: added.length,
        totalUpdated: updated.length,
        totalErrors: errors.length
      });
    }

    // Add a new genre
    if (action === 'addGenre') {
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

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "sync" or "addGenre"' },
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
    const { bookId, updates, confirmReorder } = body;

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

    const book = registry.books[bookId];
    const genre = book.genre;

    if (updates.title !== undefined) {
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

    // Handle order changes with reshuffling
    if (updates.order !== undefined) {
      const newOrder = Number(updates.order);
      const oldOrder = book.order;

      // Get all books in the same genre
      const genreBooks = Object.entries(registry.books)
        .filter(([, b]) => b.genre === genre)
        .sort((a, b) => a[1].order - b[1].order);

      const maxOrder = genreBooks.length;

      // Validate order is within bounds
      if (newOrder < 1 || newOrder > maxOrder) {
        return NextResponse.json(
          { success: false, error: `Order must be between 1 and ${maxOrder}` },
          { status: 400 }
        );
      }

      // If order changed, need to reshuffle
      if (newOrder !== oldOrder) {
        // If not confirmed, return what would happen
        if (!confirmReorder) {
          const affectedBooks: Array<{ id: string; title: string; oldOrder: number; newOrder: number }> = [];

          if (newOrder > oldOrder) {
            // Moving down: books between old and new shift up
            genreBooks.forEach(([id, b]) => {
              if (id !== bookId && b.order > oldOrder && b.order <= newOrder) {
                affectedBooks.push({
                  id,
                  title: b.title,
                  oldOrder: b.order,
                  newOrder: b.order - 1
                });
              }
            });
          } else {
            // Moving up: books between new and old shift down
            genreBooks.forEach(([id, b]) => {
              if (id !== bookId && b.order >= newOrder && b.order < oldOrder) {
                affectedBooks.push({
                  id,
                  title: b.title,
                  oldOrder: b.order,
                  newOrder: b.order + 1
                });
              }
            });
          }

          return NextResponse.json({
            success: true,
            requiresConfirmation: true,
            bookId,
            bookTitle: book.title,
            oldOrder,
            newOrder,
            affectedBooks
          });
        }

        // Confirmed - perform the reshuffle
        if (newOrder > oldOrder) {
          // Moving down: shift books between old and new up by 1
          Object.entries(registry.books).forEach(([id, b]) => {
            if (b.genre === genre && id !== bookId && b.order > oldOrder && b.order <= newOrder) {
              b.order -= 1;
            }
          });
        } else {
          // Moving up: shift books between new and old down by 1
          Object.entries(registry.books).forEach(([id, b]) => {
            if (b.genre === genre && id !== bookId && b.order >= newOrder && b.order < oldOrder) {
              b.order += 1;
            }
          });
        }

        book.order = newOrder;
      }
    }

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
