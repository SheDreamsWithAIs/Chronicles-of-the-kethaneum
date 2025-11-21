'use client';

import { useState, useEffect, useCallback } from 'react';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

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

interface ScannedBook {
  title: string;
  genre: string;
  parts: number;
  inRegistry: boolean;
  registryId?: string;
  registryParts?: number;
  needsUpdate: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

type ModalType = 'addGenre' | 'validation' | 'editBook' | null;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BookRegistryManager() {
  const [registry, setRegistry] = useState<BookRegistry | null>(null);
  const [genreFiles, setGenreFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [scannedBooks, setScannedBooks] = useState<ScannedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [editingBook, setEditingBook] = useState<{ id: string; book: BookEntry } | null>(null);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load registry and genre files
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load registry
      const registryRes = await fetch('/api/book-registry');
      const registryData = await registryRes.json();
      if (!registryData.success) throw new Error(registryData.error);
      setRegistry(registryData.registry);

      // Load genre files
      const filesRes = await fetch('/api/book-registry?action=genreFiles');
      const filesData = await filesRes.json();
      if (!filesData.success) throw new Error(filesData.error);
      setGenreFiles(filesData.genreFiles);

    } catch (error) {
      showMessage('error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Show message helper
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Scan selected genre file
  const scanFile = async () => {
    if (!selectedFile) return;

    try {
      setScanning(true);
      const response = await fetch(`/api/book-registry?action=scan&file=${encodeURIComponent(selectedFile)}`);
      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      setScannedBooks(data.books);
      showMessage('success', `Found ${data.books.length} books in file`);
    } catch (error) {
      showMessage('error', (error as Error).message);
    } finally {
      setScanning(false);
    }
  };

  // Sync scanned books to registry
  const syncToRegistry = async (booksToSync: ScannedBook[]) => {
    try {
      const response = await fetch('/api/book-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          data: { books: booksToSync }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const messages = [];
      if (result.totalAdded > 0) messages.push(`${result.totalAdded} added`);
      if (result.totalUpdated > 0) messages.push(`${result.totalUpdated} updated`);
      if (result.totalErrors > 0) messages.push(`${result.totalErrors} errors`);

      showMessage(result.totalErrors > 0 ? 'error' : 'success', messages.join(', ') || 'No changes needed');

      // Reload data
      await loadData();
      // Re-scan to update status
      if (selectedFile) {
        await scanFile();
      }
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  };

  // Delete book
  const deleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}" (${bookId}) from the registry?`)) return;

    try {
      const response = await fetch(`/api/book-registry?bookId=${encodeURIComponent(bookId)}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      showMessage('success', `Deleted ${bookTitle}`);
      await loadData();
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  };

  // Validate registry
  const validateRegistry = async () => {
    try {
      const response = await fetch('/api/book-registry?action=validate');
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      setValidationResult({ valid: result.valid, errors: result.errors });
      setActiveModal('validation');
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter registry books for display
  const filteredBooks = registry
    ? Object.entries(registry.books)
        .filter(([id, book]) => {
          const matchesGenre = selectedGenreFilter === 'all' || book.genre === selectedGenreFilter;
          const matchesSearch = searchTerm === '' ||
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            id.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesGenre && matchesSearch;
        })
        .sort((a, b) => {
          if (a[1].genre !== b[1].genre) {
            return a[1].genre.localeCompare(b[1].genre);
          }
          return a[1].order - b[1].order;
        })
    : [];

  // Group books by genre
  const booksByGenre: Record<string, Array<[string, BookEntry]>> = {};
  filteredBooks.forEach(([id, book]) => {
    if (!booksByGenre[book.genre]) {
      booksByGenre[book.genre] = [];
    }
    booksByGenre[book.genre].push([id, book]);
  });

  // Stats
  const totalBooks = registry ? Object.keys(registry.books).length : 0;
  const totalGenres = registry ? Object.keys(registry.genres).length : 0;
  const booksNeedingSync = scannedBooks.filter(b => b.needsUpdate).length;

  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-6 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-[var(--text-light)]">Book Registry Manager</h1>
              <Link
                href="/tools"
                className="px-4 py-2 bg-[var(--neutral-medium)] text-white rounded hover:bg-[var(--neutral-dark)] transition-all font-semibold"
              >
                ← Back to Tools
              </Link>
            </div>

            <div className="flex gap-4 items-center flex-wrap">
              <button
                onClick={() => setActiveModal('addGenre')}
                className="px-4 py-2 bg-[var(--primary-light)] text-white rounded hover:bg-[var(--primary-lighter)] transition-all font-semibold"
              >
                + Add Genre
              </button>

              <button
                onClick={validateRegistry}
                className="px-4 py-2 bg-[var(--accent-dark)] text-white rounded hover:bg-[var(--accent-main)] transition-all font-semibold"
              >
                Validate Registry
              </button>

              <button
                onClick={loadData}
                className="px-4 py-2 bg-[var(--neutral-medium)] text-white rounded hover:bg-[var(--neutral-dark)] transition-all font-semibold"
              >
                Refresh
              </button>

              {message && (
                <span className={`text-sm font-semibold ${message.type === 'success' ? 'text-[var(--accent-light)]' : 'text-red-400'}`}>
                  {message.text}
                </span>
              )}
            </div>
          </header>

          {/* Scan Genre File Section */}
          <section className="mb-6 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--accent-main)] p-4">
            <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Scan Genre File</h2>
            <p className="text-[var(--text-medium)] text-sm mb-4">
              Select a genre file to scan for books. After scanning, you can sync new or changed books to the registry.
            </p>

            <div className="flex gap-4 items-center flex-wrap">
              <select
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value);
                  setScannedBooks([]);
                }}
                className="flex-1 min-w-[200px] px-4 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
              >
                <option value="">Select a genre file...</option>
                {genreFiles.map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>

              <button
                onClick={scanFile}
                disabled={!selectedFile || scanning}
                className="px-6 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? 'Scanning...' : 'Scan File'}
              </button>
            </div>

            {/* Scan Results */}
            {scannedBooks.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-[var(--text-light)]">
                    Scan Results ({scannedBooks.length} books found)
                  </h3>
                  {booksNeedingSync > 0 && (
                    <button
                      onClick={() => syncToRegistry(scannedBooks.filter(b => b.needsUpdate))}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all font-semibold"
                    >
                      Sync {booksNeedingSync} Book{booksNeedingSync !== 1 ? 's' : ''} to Registry
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scannedBooks.map((book, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        book.inRegistry && !book.needsUpdate
                          ? 'bg-green-900 bg-opacity-20 border-green-600'
                          : book.inRegistry && book.needsUpdate
                          ? 'bg-yellow-900 bg-opacity-20 border-yellow-600'
                          : 'bg-blue-900 bg-opacity-20 border-blue-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-[var(--text-light)]">{book.title}</span>
                          <span className="text-[var(--text-medium)] text-sm ml-3">
                            {book.parts} parts • {book.genre}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {book.inRegistry && !book.needsUpdate && (
                            <span className="text-green-400 text-sm">✓ In sync ({book.registryId})</span>
                          )}
                          {book.inRegistry && book.needsUpdate && (
                            <span className="text-yellow-400 text-sm">
                              ⚠ Parts changed: {book.registryParts} → {book.parts}
                            </span>
                          )}
                          {!book.inRegistry && (
                            <span className="text-blue-400 text-sm">+ New book</span>
                          )}
                          {book.needsUpdate && (
                            <button
                              onClick={() => syncToRegistry([book])}
                              className="px-3 py-1 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded text-sm font-semibold hover:bg-[var(--accent-light)] transition-all"
                            >
                              Sync
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Stats & Filters */}
          <div className="mb-6 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-4">
            <div className="flex gap-6 items-center flex-wrap">
              <div className="text-[var(--text-light)]">
                <span className="text-2xl font-bold text-[var(--accent-main)]">{totalBooks}</span>
                <span className="ml-2">Books in Registry</span>
              </div>
              <div className="text-[var(--text-light)]">
                <span className="text-2xl font-bold text-[var(--accent-main)]">{totalGenres}</span>
                <span className="ml-2">Genres</span>
              </div>

              <div className="flex-1"></div>

              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none w-64"
              />

              <select
                value={selectedGenreFilter}
                onChange={(e) => setSelectedGenreFilter(e.target.value)}
                className="px-4 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
              >
                <option value="all">All Genres</option>
                {registry && Object.entries(registry.genres).map(([id, genre]) => (
                  <option key={id} value={id}>{genre.name} ({genre.prefix})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12 text-[var(--text-medium)]">
              Loading registry...
            </div>
          )}

          {/* Registry Books */}
          {!loading && registry && (
            <div className="space-y-6">
              {Object.entries(booksByGenre).map(([genre, books]) => (
                <section
                  key={genre}
                  className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6"
                >
                  <h2 className="text-xl font-bold mb-4 text-[var(--text-light)] flex items-center gap-3">
                    <span className="px-3 py-1 bg-[var(--accent-dark)] rounded text-sm">
                      {registry.genres[genre]?.prefix || '?'}
                    </span>
                    {registry.genres[genre]?.name || genre}
                    <span className="text-[var(--text-medium)] font-normal text-sm">
                      ({books.length} books)
                    </span>
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--primary-light)]">
                          <th className="text-left py-2 px-3 text-[var(--text-medium)] font-semibold">ID</th>
                          <th className="text-left py-2 px-3 text-[var(--text-medium)] font-semibold">Title</th>
                          <th className="text-center py-2 px-3 text-[var(--text-medium)] font-semibold">Parts</th>
                          <th className="text-center py-2 px-3 text-[var(--text-medium)] font-semibold">Order</th>
                          <th className="text-right py-2 px-3 text-[var(--text-medium)] font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(([id, book]) => (
                          <tr
                            key={id}
                            className="border-b border-[var(--primary-light)] border-opacity-50 hover:bg-[var(--primary-light)] hover:bg-opacity-30 transition-all"
                          >
                            <td className="py-3 px-3 font-mono text-[var(--accent-light)]">{id}</td>
                            <td className="py-3 px-3 text-[var(--text-light)]">{book.title}</td>
                            <td className="py-3 px-3 text-center text-[var(--text-light)]">{book.parts}</td>
                            <td className="py-3 px-3 text-center text-[var(--text-medium)]">{book.order}</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  setEditingBook({ id, book });
                                  setActiveModal('editBook');
                                }}
                                className="px-3 py-1 bg-[var(--primary-lighter)] hover:bg-[var(--primary-light)] text-white rounded text-sm font-semibold transition-all mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBook(id, book.title)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-all"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}

              {filteredBooks.length === 0 && (
                <div className="text-center py-12 text-[var(--text-medium)] bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)]">
                  No books found matching your filters.
                </div>
              )}
            </div>
          )}

          {/* Modals */}
          {activeModal === 'addGenre' && (
            <AddGenreModal
              onClose={() => setActiveModal(null)}
              onSuccess={() => {
                setActiveModal(null);
                loadData();
                showMessage('success', 'Genre added successfully!');
              }}
              onError={(error) => showMessage('error', error)}
            />
          )}

          {activeModal === 'editBook' && editingBook && (
            <EditBookModal
              bookId={editingBook.id}
              book={editingBook.book}
              onClose={() => {
                setActiveModal(null);
                setEditingBook(null);
              }}
              onSuccess={() => {
                setActiveModal(null);
                setEditingBook(null);
                loadData();
                showMessage('success', 'Book updated successfully!');
              }}
              onError={(error) => showMessage('error', error)}
            />
          )}

          {activeModal === 'validation' && validationResult && (
            <ValidationModal
              result={validationResult}
              onClose={() => {
                setActiveModal(null);
                setValidationResult(null);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

function AddGenreModal({ onClose, onSuccess, onError }: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');

  const handleCreate = async () => {
    if (!id.trim() || !name.trim() || !prefix.trim()) {
      onError('All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/book-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addGenre',
          data: { id: id.trim(), name: name.trim(), prefix: prefix.trim().toUpperCase() }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create genre');
      }

      onSuccess();
    } catch (error) {
      onError((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-md w-full border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">Add New Genre</h2>
          <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Genre ID:</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="e.g., fantasy"
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Display Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fantasy & Magic"
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">ID Prefix:</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g., F"
              maxLength={2}
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
            <p className="text-sm text-[var(--text-medium)] mt-1">
              Book IDs will be: {prefix || 'X'}001, {prefix || 'X'}002, etc.
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="w-full px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
          >
            Add Genre
          </button>
        </div>
      </div>
    </div>
  );
}

function EditBookModal({ bookId, book, onClose, onSuccess, onError }: {
  bookId: string;
  book: BookEntry;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [title, setTitle] = useState(book.title);
  const [parts, setParts] = useState(String(book.parts));
  const [order, setOrder] = useState(String(book.order));

  const handleUpdate = async () => {
    if (!title.trim()) {
      onError('Title is required');
      return;
    }

    try {
      const response = await fetch('/api/book-registry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          updates: {
            title: title.trim(),
            parts: Number(parts),
            order: Number(order)
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update book');
      }

      onSuccess();
    } catch (error) {
      onError((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-md w-full border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">Edit Book</h2>
          <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Book ID:</label>
            <div className="px-3 py-2 bg-[var(--primary-dark)] text-[var(--accent-light)] border border-[var(--primary-light)] rounded font-mono">
              {bookId}
            </div>
            <p className="text-sm text-[var(--text-medium)] mt-1">Genre: {book.genre}</p>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Book Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2 text-[var(--text-light)]">Parts:</label>
              <input
                type="number"
                value={parts}
                onChange={(e) => setParts(e.target.value)}
                min="1"
                max="20"
                className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-[var(--text-light)]">Order:</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                min="1"
                className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleUpdate}
            className="w-full px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidationModal({ result, onClose }: {
  result: ValidationResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-md w-full border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">Validation Results</h2>
          <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
        </div>
        <div className="p-4">
          {result.valid ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-xl font-semibold text-[var(--accent-light)]">
                Registry is valid!
              </p>
              <p className="text-[var(--text-medium)] mt-2">
                No issues found.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-xl font-semibold text-red-400">
                  Found {result.errors.length} issue{result.errors.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((error, i) => (
                  <li
                    key={i}
                    className="px-3 py-2 bg-red-900 bg-opacity-30 border border-red-500 rounded text-sm text-red-300"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-[var(--neutral-medium)] text-white rounded hover:bg-[var(--neutral-dark)] transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
