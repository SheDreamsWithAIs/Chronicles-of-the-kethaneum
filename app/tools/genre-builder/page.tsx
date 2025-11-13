'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Puzzle {
  title: string;
  book: string;
  storyPart: number;
  genre: string;
  words: string[];
  storyExcerpt: string;
}

interface Book {
  name: string;
  puzzles: Puzzle[];
}

interface GenreFile {
  filename: string;
  genre: string;
  books: Book[];
}

type Scope = 'file' | 'book' | 'puzzle';

interface ScopeState {
  level: Scope;
  bookIndex?: number;
  puzzleIndex?: number;
}

interface ValidationError {
  bookIndex?: number;
  puzzleIndex?: number;
  field: string;
  message: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validatePuzzle(puzzle: Puzzle): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!puzzle.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (!puzzle.book.trim()) {
    errors.push({ field: 'book', message: 'Book name is required' });
  }
  if (!puzzle.genre.trim()) {
    errors.push({ field: 'genre', message: 'Genre is required' });
  }
  if (!puzzle.words || puzzle.words.length === 0) {
    errors.push({ field: 'words', message: 'At least one word is required' });
  }
  if (!puzzle.storyExcerpt.trim()) {
    errors.push({ field: 'storyExcerpt', message: 'Story excerpt is required' });
  }

  return errors;
}

function validateGenreFile(genreFile: GenreFile): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!genreFile.filename.trim()) {
    errors.push({ field: 'filename', message: 'Filename is required' });
  }
  if (!genreFile.genre.trim()) {
    errors.push({ field: 'genre', message: 'Genre is required' });
  }

  genreFile.books.forEach((book, bookIndex) => {
    if (book.puzzles.length === 0) {
      errors.push({
        bookIndex,
        field: 'puzzles',
        message: `Book "${book.name}" must have at least 1 puzzle`
      });
    }

    book.puzzles.forEach((puzzle, puzzleIndex) => {
      const puzzleErrors = validatePuzzle(puzzle);
      puzzleErrors.forEach(err => {
        errors.push({
          bookIndex,
          puzzleIndex,
          field: err.field,
          message: err.message
        });
      });
    });
  });

  return errors;
}

// ============================================================================
// UTILITIES
// ============================================================================

function createEmptyPuzzle(bookName: string, genre: string, storyPart: number): Puzzle {
  return {
    title: '',
    book: bookName,
    storyPart,
    genre,
    words: [],
    storyExcerpt: ''
  };
}

function createTemplateBook(genre: string): Book {
  const bookName = 'New Book';
  return {
    name: bookName,
    puzzles: Array.from({ length: 5 }, (_, i) => createEmptyPuzzle(bookName, genre, i))
  };
}

function createNewGenreFile(): GenreFile {
  const genre = 'newGenre';
  return {
    filename: 'newGenrePuzzles.json',
    genre,
    books: [createTemplateBook(genre)]
  };
}

function extractGenreFromFilename(filename: string): string {
  // Remove .json extension
  const base = filename.replace('.json', '');
  // Remove "Puzzles" suffix if present
  const genre = base.replace(/Puzzles$/i, '');
  return genre || 'newGenre';
}

function genreFileToJSON(genreFile: GenreFile): Puzzle[] {
  const allPuzzles: Puzzle[] = [];

  genreFile.books.forEach(book => {
    book.puzzles.forEach((puzzle, index) => {
      allPuzzles.push({
        ...puzzle,
        storyPart: index,
        genre: genreFile.genre
      });
    });
  });

  return allPuzzles;
}

function jsonToGenreFile(puzzles: Puzzle[], filename: string): GenreFile {
  const genre = puzzles[0]?.genre || extractGenreFromFilename(filename);
  const booksMap = new Map<string, Puzzle[]>();

  puzzles.forEach(puzzle => {
    const bookName = puzzle.book;
    if (!booksMap.has(bookName)) {
      booksMap.set(bookName, []);
    }
    booksMap.get(bookName)!.push(puzzle);
  });

  const books: Book[] = Array.from(booksMap.entries()).map(([name, puzzles]) => ({
    name,
    puzzles: puzzles.sort((a, b) => a.storyPart - b.storyPart)
  }));

  return { filename, genre, books };
}

// Auto-save to localStorage
function saveToLocalStorage(genreFile: GenreFile) {
  localStorage.setItem('genreBuilder_autoSave', JSON.stringify(genreFile));
  localStorage.setItem('genreBuilder_autoSave_timestamp', new Date().toISOString());
}

function loadFromLocalStorage(): GenreFile | null {
  const saved = localStorage.getItem('genreBuilder_autoSave');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

function clearLocalStorage() {
  localStorage.removeItem('genreBuilder_autoSave');
  localStorage.removeItem('genreBuilder_autoSave_timestamp');
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GenreBuilder() {
  const [genreFile, setGenreFile] = useState<GenreFile>(createNewGenreFile());
  const [scope, setScope] = useState<ScopeState>({ level: 'file' });
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Auto-save on changes
  useEffect(() => {
    saveToLocalStorage(genreFile);
    setLastSaved(new Date());
  }, [genreFile]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      setGenreFile(saved);
      const timestamp = localStorage.getItem('genreBuilder_autoSave_timestamp');
      if (timestamp) {
        setLastSaved(new Date(timestamp));
      }
    }
  }, []);

  // Validate on changes
  useEffect(() => {
    const errors = validateGenreFile(genreFile);
    setValidationErrors(errors);
  }, [genreFile]);

  const handleNewFile = useCallback(() => {
    if (confirm('Create a new genre file? Any unsaved changes will be lost.')) {
      const newFile = createNewGenreFile();
      setGenreFile(newFile);
      setScope({ level: 'file' });
      clearLocalStorage();
    }
  }, []);

  const handleLoadFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const puzzles = JSON.parse(text) as Puzzle[];
      const loadedFile = jsonToGenreFile(puzzles, file.name);
      setGenreFile(loadedFile);
      setScope({ level: 'file' });
      setSaveMessage(`Loaded ${file.name}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      alert('Error loading file: ' + (error as Error).message);
    }
  }, []);

  const handleSaveFile = useCallback(async () => {
    const errors = validateGenreFile(genreFile);
    if (errors.length > 0) {
      setShowValidation(true);
      alert('Cannot save: Please fix all validation errors first.');
      return;
    }

    try {
      const json = genreFileToJSON(genreFile);
      const jsonString = JSON.stringify(json, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = genreFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // TODO: Future feature - Auto-update genreManifest.json
      // Add the new genre file path to /public/data/genreManifest.json
      // This would require a server-side API endpoint to safely update the manifest

      setSaveMessage(`Saved ${genreFile.filename}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      alert('Error saving file: ' + (error as Error).message);
    }
  }, [genreFile]);

  const updateGenreFile = useCallback((updater: (prev: GenreFile) => GenreFile) => {
    setGenreFile(updater);
  }, []);

  const addBook = useCallback(() => {
    updateGenreFile(prev => ({
      ...prev,
      books: [...prev.books, createTemplateBook(prev.genre)]
    }));
  }, [updateGenreFile]);

  const deleteBook = useCallback((bookIndex: number) => {
    if (confirm('Delete this book and all its puzzles?')) {
      updateGenreFile(prev => ({
        ...prev,
        books: prev.books.filter((_, i) => i !== bookIndex)
      }));
      setScope({ level: 'file' });
    }
  }, [updateGenreFile]);

  const addPuzzle = useCallback((bookIndex: number) => {
    updateGenreFile(prev => {
      const newBooks = [...prev.books];
      const book = newBooks[bookIndex];
      const newPuzzle = createEmptyPuzzle(book.name, prev.genre, book.puzzles.length);
      newBooks[bookIndex] = {
        ...book,
        puzzles: [...book.puzzles, newPuzzle]
      };
      return { ...prev, books: newBooks };
    });
  }, [updateGenreFile]);

  const deletePuzzle = useCallback((bookIndex: number, puzzleIndex: number) => {
    if (confirm('Delete this puzzle?')) {
      updateGenreFile(prev => {
        const newBooks = [...prev.books];
        const book = newBooks[bookIndex];
        newBooks[bookIndex] = {
          ...book,
          puzzles: book.puzzles.filter((_, i) => i !== puzzleIndex)
        };
        return { ...prev, books: newBooks };
      });
      setScope({ level: 'book', bookIndex });
    }
  }, [updateGenreFile]);

  const updatePuzzle = useCallback((bookIndex: number, puzzleIndex: number, updates: Partial<Puzzle>) => {
    updateGenreFile(prev => {
      const newBooks = [...prev.books];
      const book = newBooks[bookIndex];
      const newPuzzles = [...book.puzzles];
      newPuzzles[puzzleIndex] = { ...newPuzzles[puzzleIndex], ...updates };
      newBooks[bookIndex] = { ...book, puzzles: newPuzzles };
      return { ...prev, books: newBooks };
    });
  }, [updateGenreFile]);

  const getScopedJSON = useCallback(() => {
    if (scope.level === 'puzzle' && scope.bookIndex !== undefined && scope.puzzleIndex !== undefined) {
      const puzzle = genreFile.books[scope.bookIndex].puzzles[scope.puzzleIndex];
      return JSON.stringify({ ...puzzle, storyPart: scope.puzzleIndex }, null, 2);
    } else if (scope.level === 'book' && scope.bookIndex !== undefined) {
      const book = genreFile.books[scope.bookIndex];
      const puzzles = book.puzzles.map((p, i) => ({ ...p, storyPart: i, genre: genreFile.genre }));
      return JSON.stringify(puzzles, null, 2);
    } else {
      return JSON.stringify(genreFileToJSON(genreFile), null, 2);
    }
  }, [scope, genreFile]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 bg-white rounded-lg shadow p-4">
          <h1 className="text-3xl font-bold mb-4">Genre Builder Tool</h1>

          {/* File Controls */}
          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={handleNewFile}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              New File
            </button>

            <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
              Load File
              <input
                type="file"
                accept=".json"
                onChange={handleLoadFile}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSaveFile}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              disabled={validationErrors.length > 0}
            >
              Save to File
            </button>

            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Preview JSON
            </button>

            <button
              onClick={() => setShowValidation(!showValidation)}
              className={`px-4 py-2 rounded ${validationErrors.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'} text-white`}
            >
              Validation ({validationErrors.length})
            </button>

            {lastSaved && (
              <span className="text-sm text-gray-500">
                Auto-saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}

            {saveMessage && (
              <span className="text-sm text-green-600 font-semibold">
                {saveMessage}
              </span>
            )}
          </div>
        </header>

        <div className="flex gap-6">
          {/* Sidebar */}
          <Sidebar
            genreFile={genreFile}
            scope={scope}
            onScopeChange={setScope}
          />

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-lg shadow p-6">
            {/* Breadcrumbs */}
            <Breadcrumbs
              genreFile={genreFile}
              scope={scope}
              onScopeChange={setScope}
            />

            {/* File-level Editor */}
            {scope.level === 'file' && (
              <FileView
                genreFile={genreFile}
                onUpdateGenre={(genre) => updateGenreFile(prev => ({ ...prev, genre }))}
                onUpdateFilename={(filename) => updateGenreFile(prev => ({ ...prev, filename }))}
                onAddBook={addBook}
                onDeleteBook={deleteBook}
                onSelectBook={(bookIndex) => setScope({ level: 'book', bookIndex })}
              />
            )}

            {/* Book-level Editor */}
            {scope.level === 'book' && scope.bookIndex !== undefined && (
              <BookView
                book={genreFile.books[scope.bookIndex]}
                bookIndex={scope.bookIndex}
                genre={genreFile.genre}
                onAddPuzzle={() => addPuzzle(scope.bookIndex!)}
                onDeletePuzzle={(puzzleIndex) => deletePuzzle(scope.bookIndex!, puzzleIndex)}
                onSelectPuzzle={(puzzleIndex) => setScope({ level: 'puzzle', bookIndex: scope.bookIndex, puzzleIndex })}
                onUpdateBookName={(name) => {
                  updateGenreFile(prev => {
                    const newBooks = [...prev.books];
                    newBooks[scope.bookIndex!] = { ...newBooks[scope.bookIndex!], name };
                    return { ...prev, books: newBooks };
                  });
                }}
              />
            )}

            {/* Puzzle-level Editor */}
            {scope.level === 'puzzle' && scope.bookIndex !== undefined && scope.puzzleIndex !== undefined && (
              <PuzzleForm
                puzzle={genreFile.books[scope.bookIndex].puzzles[scope.puzzleIndex]}
                puzzleIndex={scope.puzzleIndex}
                bookIndex={scope.bookIndex}
                onUpdate={(updates) => updatePuzzle(scope.bookIndex!, scope.puzzleIndex!, updates)}
                validationErrors={validationErrors.filter(e =>
                  e.bookIndex === scope.bookIndex && e.puzzleIndex === scope.puzzleIndex
                )}
              />
            )}
          </main>
        </div>

        {/* Validation Panel */}
        {showValidation && (
          <ValidationPanel
            errors={validationErrors}
            genreFile={genreFile}
            onClose={() => setShowValidation(false)}
            onNavigate={(bookIndex, puzzleIndex) => {
              if (puzzleIndex !== undefined) {
                setScope({ level: 'puzzle', bookIndex, puzzleIndex });
              } else if (bookIndex !== undefined) {
                setScope({ level: 'book', bookIndex });
              }
              setShowValidation(false);
            }}
          />
        )}

        {/* JSON Preview Modal */}
        {showPreview && (
          <JSONPreview
            json={getScopedJSON()}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function Sidebar({ genreFile, scope, onScopeChange }: {
  genreFile: GenreFile;
  scope: ScopeState;
  onScopeChange: (scope: ScopeState) => void;
}) {
  return (
    <aside className="w-64 bg-white rounded-lg shadow p-4">
      <h2 className="font-bold text-lg mb-4">Navigation</h2>

      <div className="mb-4">
        <button
          onClick={() => onScopeChange({ level: 'file' })}
          className={`w-full text-left px-3 py-2 rounded ${scope.level === 'file' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
        >
          📁 {genreFile.filename}
        </button>
      </div>

      <div className="space-y-2">
        {genreFile.books.map((book, bookIndex) => (
          <div key={bookIndex}>
            <button
              onClick={() => onScopeChange({ level: 'book', bookIndex })}
              className={`w-full text-left px-3 py-2 rounded ${scope.level === 'book' && scope.bookIndex === bookIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
            >
              📖 {book.name || `Book ${bookIndex + 1}`}
            </button>

            {scope.bookIndex === bookIndex && (
              <div className="ml-4 mt-1 space-y-1">
                {book.puzzles.map((puzzle, puzzleIndex) => (
                  <button
                    key={puzzleIndex}
                    onClick={() => onScopeChange({ level: 'puzzle', bookIndex, puzzleIndex })}
                    className={`w-full text-left px-2 py-1 text-sm rounded ${scope.level === 'puzzle' && scope.puzzleIndex === puzzleIndex ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                  >
                    {puzzleIndex + 1}. {puzzle.title || `Puzzle ${puzzleIndex + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Breadcrumbs({ genreFile, scope, onScopeChange }: {
  genreFile: GenreFile;
  scope: ScopeState;
  onScopeChange: (scope: ScopeState) => void;
}) {
  return (
    <nav className="mb-6 text-sm text-gray-600">
      <button
        onClick={() => onScopeChange({ level: 'file' })}
        className="hover:text-blue-600 underline"
      >
        {genreFile.filename}
      </button>

      {scope.bookIndex !== undefined && (
        <>
          <span className="mx-2">/</span>
          <button
            onClick={() => onScopeChange({ level: 'book', bookIndex: scope.bookIndex })}
            className="hover:text-blue-600 underline"
          >
            {genreFile.books[scope.bookIndex]?.name || `Book ${scope.bookIndex + 1}`}
          </button>
        </>
      )}

      {scope.puzzleIndex !== undefined && (
        <>
          <span className="mx-2">/</span>
          <span className="text-gray-800">
            Puzzle {scope.puzzleIndex + 1}
          </span>
        </>
      )}
    </nav>
  );
}

function FileView({ genreFile, onUpdateGenre, onUpdateFilename, onAddBook, onDeleteBook, onSelectBook }: {
  genreFile: GenreFile;
  onUpdateGenre: (genre: string) => void;
  onUpdateFilename: (filename: string) => void;
  onAddBook: () => void;
  onDeleteBook: (bookIndex: number) => void;
  onSelectBook: (bookIndex: number) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">File Settings</h2>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block font-semibold mb-2">Filename</label>
          <input
            type="text"
            value={genreFile.filename}
            onChange={(e) => onUpdateFilename(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="myGenrePuzzles.json"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Genre</label>
          <input
            type="text"
            value={genreFile.genre}
            onChange={(e) => onUpdateGenre(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="nature, kethaneum, etc."
          />
          <p className="text-sm text-gray-500 mt-1">This genre will be applied to all puzzles in this file.</p>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">Books ({genreFile.books.length})</h3>
        <button
          onClick={onAddBook}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add Book
        </button>
      </div>

      <div className="space-y-4">
        {genreFile.books.map((book, index) => (
          <div key={index} className="border rounded p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-lg">{book.name || `Book ${index + 1}`}</h4>
                <p className="text-sm text-gray-600">{book.puzzles.length} puzzle(s)</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectBook(index)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteBook(index)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookView({ book, bookIndex, genre, onAddPuzzle, onDeletePuzzle, onSelectPuzzle, onUpdateBookName }: {
  book: Book;
  bookIndex: number;
  genre: string;
  onAddPuzzle: () => void;
  onDeletePuzzle: (puzzleIndex: number) => void;
  onSelectPuzzle: (puzzleIndex: number) => void;
  onUpdateBookName: (name: string) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <label className="block font-semibold mb-2">Book Name</label>
        <input
          type="text"
          value={book.name}
          onChange={(e) => onUpdateBookName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="Enter book name"
        />
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">Puzzles ({book.puzzles.length})</h3>
        <button
          onClick={onAddPuzzle}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add Puzzle
        </button>
      </div>

      <div className="space-y-3">
        {book.puzzles.map((puzzle, index) => (
          <div key={index} className="border rounded p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                    Part {index}
                  </span>
                  <h4 className="font-bold">{puzzle.title || `Untitled Puzzle ${index + 1}`}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Words: {puzzle.words.length > 0 ? puzzle.words.join(', ') : 'None'}
                </p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {puzzle.storyExcerpt || 'No story excerpt'}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onSelectPuzzle(index)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeletePuzzle(index)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PuzzleForm({ puzzle, puzzleIndex, bookIndex, onUpdate, validationErrors }: {
  puzzle: Puzzle;
  puzzleIndex: number;
  bookIndex: number;
  onUpdate: (updates: Partial<Puzzle>) => void;
  validationErrors: ValidationError[];
}) {
  const getError = (field: string) => validationErrors.find(e => e.field === field);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Puzzle Editor (Part {puzzleIndex})</h2>

      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">Title</label>
          <input
            type="text"
            value={puzzle.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className={`w-full px-3 py-2 border rounded ${getError('title') ? 'border-red-500' : ''}`}
            placeholder="e.g., Fruits of the Orchard - Part 1"
          />
          {getError('title') && <p className="text-red-500 text-sm mt-1">{getError('title')!.message}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-2">Book Name</label>
          <input
            type="text"
            value={puzzle.book}
            onChange={(e) => onUpdate({ book: e.target.value })}
            className={`w-full px-3 py-2 border rounded ${getError('book') ? 'border-red-500' : ''}`}
            placeholder="e.g., Fruits of the Orchard"
          />
          {getError('book') && <p className="text-red-500 text-sm mt-1">{getError('book')!.message}</p>}
          <p className="text-sm text-gray-500 mt-1">All puzzles with the same book name will be grouped together.</p>
        </div>

        <div>
          <label className="block font-semibold mb-2">Words</label>
          <textarea
            value={puzzle.words.join(', ')}
            onChange={(e) => {
              const words = e.target.value
                .split(',')
                .map(w => w.trim())
                .filter(w => w.length > 0);
              onUpdate({ words });
            }}
            className={`w-full px-3 py-2 border rounded h-24 ${getError('words') ? 'border-red-500' : ''}`}
            placeholder="Enter words separated by commas (e.g., apple, banana, cherry)"
          />
          {getError('words') && <p className="text-red-500 text-sm mt-1">{getError('words')!.message}</p>}
          <p className="text-sm text-gray-500 mt-1">Enter words separated by commas. These are the words players will search for in the puzzle.</p>
        </div>

        <div>
          <label className="block font-semibold mb-2">Story Excerpt</label>
          <textarea
            value={puzzle.storyExcerpt}
            onChange={(e) => onUpdate({ storyExcerpt: e.target.value })}
            className={`w-full px-3 py-2 border rounded h-32 ${getError('storyExcerpt') ? 'border-red-500' : ''}`}
            placeholder="Enter the story text for this puzzle part..."
          />
          {getError('storyExcerpt') && <p className="text-red-500 text-sm mt-1">{getError('storyExcerpt')!.message}</p>}
          <p className="text-sm text-gray-500 mt-1">This is the story text that will be displayed to players. Order matters as it tells a sequential story.</p>
        </div>

        <div className="bg-gray-100 p-3 rounded">
          <p className="text-sm">
            <strong>Story Part:</strong> {puzzleIndex} (auto-calculated by position)
          </p>
          <p className="text-sm">
            <strong>Genre:</strong> {puzzle.genre} (set at file level)
          </p>
        </div>
      </div>
    </div>
  );
}

function ValidationPanel({ errors, genreFile, onClose, onNavigate }: {
  errors: ValidationError[];
  genreFile: GenreFile;
  onClose: () => void;
  onNavigate: (bookIndex?: number, puzzleIndex?: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Validation Errors ({errors.length})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {errors.length === 0 ? (
            <p className="text-green-600 font-semibold">✓ All validations passed!</p>
          ) : (
            <div className="space-y-3">
              {errors.map((error, index) => {
                let location = 'File Level';
                if (error.bookIndex !== undefined) {
                  const book = genreFile.books[error.bookIndex];
                  location = book?.name || `Book ${error.bookIndex + 1}`;
                  if (error.puzzleIndex !== undefined) {
                    location += ` > Puzzle ${error.puzzleIndex + 1}`;
                  }
                }

                return (
                  <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                    <button
                      onClick={() => onNavigate(error.bookIndex, error.puzzleIndex)}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      {location}
                    </button>
                    <p className="text-sm text-gray-700">
                      <strong>{error.field}:</strong> {error.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function JSONPreview({ json, onClose }: {
  json: string;
  onClose: () => void;
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(json);
    alert('JSON copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">JSON Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
            {json}
          </pre>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
