/**
 * Puzzle loader for Chronicles of the Kethaneum
 * This module handles loading puzzle data from JSON files
 */

import type { GameState, PuzzleData } from './state';
import { initializePuzzle } from './puzzleGenerator';
import type { Config } from '../core/config';

/**
 * Load the genre manifest file
 */
async function loadGenreManifest(): Promise<string[]> {
  try {
    const response = await fetch('/data/genreManifest.json');
    if (!response.ok) {
      console.warn('Failed to load genre manifest, falling back to default files');
      return [
        '/data/kethaneumPuzzles.json',
        '/data/naturePuzzles.json',
        '/data/testPuzzles.json'
      ];
    }
    const manifest = await response.json();
    return manifest.genreFiles || [];
  } catch (error) {
    console.error('Error loading genre manifest:', error);
    // Fallback to default files if manifest fails to load
    return [
      '/data/kethaneumPuzzles.json',
      '/data/naturePuzzles.json',
      '/data/testPuzzles.json'
    ];
  }
}

/**
 * Load puzzles from all available genres
 * Reads the genre file list from genreManifest.json
 */
export async function loadAllPuzzles(
  state: GameState,
  config: Config
): Promise<{ puzzles: { [genre: string]: PuzzleData[] }; newState: GameState }> {
  try {
    // Initialize puzzle storage if needed
    // Explicitly preserve currentGenre, currentBook, etc. to prevent them from being lost
    let newState: GameState = {
      ...state,
      puzzles: state.puzzles || {},
      // Preserve these fields explicitly
      currentGenre: state.currentGenre || '',
      currentBook: state.currentBook || '',
      currentPuzzleIndex: state.currentPuzzleIndex !== undefined ? state.currentPuzzleIndex : -1,
      currentStoryPart: state.currentStoryPart !== undefined ? state.currentStoryPart : -1,
    };
    
    // Load the genre manifest to get the list of files to load
    const genreFiles = await loadGenreManifest();
    
    // Load all genre files in parallel and organize puzzles by their genre field
    const loadPromises = genreFiles.map(async (filePath) => {
      try {
        // Fetch the puzzle data
        const response = await fetch(filePath);

        if (!response.ok) {
          console.warn(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
          return null;
        }

        // Parse the JSON data
        const puzzleData: PuzzleData[] = await response.json();

        if (!Array.isArray(puzzleData) || puzzleData.length === 0) {
          console.warn(`No valid puzzles found in ${filePath}`);
          return null;
        }

        // Group puzzles by their individual genre fields
        // This allows a single file to contain puzzles from multiple genres
        const puzzlesByGenre: { [genre: string]: PuzzleData[] } = {};

        puzzleData.forEach(puzzle => {
          // Make sure puzzle has required fields
          if (!puzzle.title || !puzzle.book || !puzzle.words || !Array.isArray(puzzle.words)) {
            console.warn(`Skipping invalid puzzle in ${filePath}:`, puzzle);
            return;
          }

          // Make sure puzzle has genre field
          if (!puzzle.genre) {
            console.warn(`Skipping puzzle without genre in ${filePath}:`, puzzle.title);
            return;
          }

          // Make sure puzzle has storyPart information (default to introduction)
          if (puzzle.storyPart === undefined) {
            puzzle.storyPart = 0;
          }

          // Add to the appropriate genre bucket
          if (!puzzlesByGenre[puzzle.genre]) {
            puzzlesByGenre[puzzle.genre] = [];
          }
          puzzlesByGenre[puzzle.genre].push(puzzle);
        });

        return puzzlesByGenre;
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return null;
      }
    });
    
    // Wait for all puzzles to load
    const results = await Promise.all(loadPromises);

    // Merge results into state (filter out null results)
    results.forEach((puzzlesByGenre) => {
      if (puzzlesByGenre) {
        // Each result is now a map of genre -> puzzles[]
        for (const genre in puzzlesByGenre) {
          const puzzles = puzzlesByGenre[genre];

          // If genre already exists, merge puzzles (avoid duplicates)
          if (newState.puzzles[genre]) {
            // Merge puzzles, avoiding duplicates based on title
            const existingTitles = new Set(newState.puzzles[genre].map(p => p.title));
            const newPuzzles = puzzles.filter(p => !existingTitles.has(p.title));
            newState.puzzles[genre] = [...newState.puzzles[genre], ...newPuzzles];
          } else {
            newState.puzzles[genre] = puzzles;
          }
        }
      }
    });
    
    // Build book-to-parts mapping for easier navigation
    newState = buildBookPartsMapping(newState);
    
    return { puzzles: newState.puzzles, newState };
  } catch (error) {
    console.error('Failed to load puzzles:', error);
    return { puzzles: {}, newState: state };
  }
}

/**
 * Load puzzles from files with custom paths
 */
export async function loadAllPuzzlesWithPaths(
  puzzlePaths: { [genre: string]: string },
  state: GameState
): Promise<{ puzzles: { [genre: string]: PuzzleData[] }; newState: GameState }> {
  try {
    // Initialize puzzle storage if needed
    let newState: GameState = {
      ...state,
      puzzles: state.puzzles || {},
    };
    
    // Load all genres in parallel
    const loadPromises = Object.entries(puzzlePaths).map(([genre, filePath]) => 
      loadGenrePuzzles(genre, filePath, newState)
    );
    
    // Wait for all puzzles to load
    const results = await Promise.all(loadPromises);
    
    // Merge results into state
    results.forEach(({ genre, puzzles }) => {
      newState.puzzles[genre] = puzzles;
    });
      
    // Build book-to-parts mapping for easier navigation
    newState = buildBookPartsMapping(newState);
    
    return { puzzles: newState.puzzles, newState };
  } catch (error) {
    console.error('Failed to load puzzles:', error);
    return { puzzles: {}, newState: state };
  }
}

/**
 * Load puzzles for a specific genre
 */
export async function loadGenrePuzzles(
  genre: string,
  filePath: string,
  state: GameState
): Promise<{ genre: string; puzzles: PuzzleData[] }> {
  try {
    // Fetch the puzzle data
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load puzzles for ${genre}: ${response.status} ${response.statusText}`);
    }
    
    // Parse the JSON data
    const puzzleData: PuzzleData[] = await response.json();
    
    if (!Array.isArray(puzzleData) || puzzleData.length === 0) {
      throw new Error(`No valid puzzles found for genre: ${genre}`);
    }
    
    // Process and store each puzzle
    const validPuzzles: PuzzleData[] = [];
    puzzleData.forEach(puzzle => {
      // Make sure puzzle has required fields
      if (!puzzle.title || !puzzle.book || !puzzle.words || !Array.isArray(puzzle.words)) {
        console.warn(`Skipping invalid puzzle in ${genre}:`, puzzle);
        return;
      }
      
      // Make sure puzzle has storyPart information (default to introduction)
      if (puzzle.storyPart === undefined) {
        puzzle.storyPart = 0;
      }
      
      // Add the puzzle to the list
      validPuzzles.push(puzzle);
    });
    
    return { genre, puzzles: validPuzzles };
  } catch (error) {
    console.error(`Error loading puzzles for genre ${genre}:`, error);
    throw error;
  }
}


/**
 * Load a sequential puzzle based on game progression
 */
export function loadSequentialPuzzle(
  genre: string | null,
  book: string | null,
  state: GameState,
  config: Config,
  allowReplay: boolean = false
): { success: boolean; newState: GameState; genreComplete?: boolean } {
  try {
    // Non-story modes should use their dedicated loaders
    if (state.gameMode === 'beat-the-clock' || state.gameMode === 'puzzle-only') {
      console.warn(`loadSequentialPuzzle called for ${state.gameMode} mode - use dedicated loader instead`);
      return { success: false, newState: state };
    }
    
    // Story Mode: Use existing sequential loading with story progression
    // Check if we have an uncompleted puzzle to resume
    if (state.lastUncompletedPuzzle && !genre && !book) {
      book = state.lastUncompletedPuzzle.book;
      genre = state.lastUncompletedPuzzle.genre;
    }
    
    // Helper function to get all available parts for a book across all genres
    function getAvailableParts(bookTitle: string, puzzles: { [genre: string]: PuzzleData[] }): number[] {
      const parts = new Set<number>();
      
      // Look through all genres for this book's parts
      for (const g in puzzles) {
        if (!puzzles[g]) continue;
        
        const bookPuzzles = puzzles[g].filter(p => p.book === bookTitle);
        bookPuzzles.forEach(puzzle => {
          if (puzzle.storyPart !== undefined) {
            parts.add(puzzle.storyPart);
          }
        });
      }
      
      // Return sorted array of parts
      return Array.from(parts).sort((a, b) => a - b);
    }
    
    // Helper function to check if a book is complete
    function isBookComplete(bookTitle: string, state: GameState): boolean {
      if (!state.books || !state.books[bookTitle]) return false;
      
      const availableParts = getAvailableParts(bookTitle, state.puzzles);
      if (availableParts.length === 0) return false;
      
      return availableParts.every(part => {
        const bookData = state.books[bookTitle];
        if (Array.isArray(bookData)) {
          return bookData[part] === true;
        }
        return false;
      });
    }
    
    // Helper function to check if a book is in progress
    function isBookInProgress(bookTitle: string, state: GameState): boolean {
      if (!state.books || !state.books[bookTitle]) return false;
      
      const availableParts = getAvailableParts(bookTitle, state.puzzles);
      if (availableParts.length === 0) return false;
      
      const bookData = state.books[bookTitle];
      if (Array.isArray(bookData)) {
        const hasCompleted = availableParts.some(part => bookData[part] === true);
        return hasCompleted && !isBookComplete(bookTitle, state);
      }
      return false;
    }
    
    // STEP 1: Determine which genre to use
    let selectedGenre = genre || null;
    if (!selectedGenre) {
      // Calculate genre stats
      const genreStats: { [genre: string]: { totalBooks: number; incompleteBooks: number; inProgressBooks: number; books: string[] } } = {};
      
      for (const g in state.puzzles) {
        if (!state.puzzles[g] || !Array.isArray(state.puzzles[g]) || state.puzzles[g].length === 0) {
          continue;
        }
        
        // Get unique books in this genre
        const bookSet = new Set<string>();
        state.puzzles[g].forEach(puzzle => {
          if (puzzle.book) bookSet.add(puzzle.book);
        });
        
        const books = Array.from(bookSet);
        let incompleteBooks = 0;
        let inProgressBooks = 0;
        
        books.forEach(bookTitle => {
          if (!isBookComplete(bookTitle, state)) {
            incompleteBooks++;
            
            if (isBookInProgress(bookTitle, state)) {
              inProgressBooks++;
            }
          }
        });
        
        genreStats[g] = {
          totalBooks: books.length,
          incompleteBooks,
          inProgressBooks,
          books
        };
      }
      
      // First check current genre for incomplete books
      if (state.currentGenre && genreStats[state.currentGenre] && 
          genreStats[state.currentGenre].incompleteBooks > 0) {
        selectedGenre = state.currentGenre;
      } else {
        // Find genres with incomplete books
        const genresWithIncompleteBooks = Object.keys(genreStats).filter(g => 
          genreStats[g].incompleteBooks > 0
        );
        
        if (genresWithIncompleteBooks.length > 0) {
          // Random selection from genres with incomplete books
          selectedGenre = genresWithIncompleteBooks[
            Math.floor(Math.random() * genresWithIncompleteBooks.length)
          ];
        } else {
          // All books in all genres are complete, pick a random genre
          const allGenres = Object.keys(genreStats);
          selectedGenre = allGenres[Math.floor(Math.random() * allGenres.length)];
        }
      }
    }
    
    // Validate selected genre
    if (!selectedGenre) {
      throw new Error(`No genre specified and could not auto-select a genre`);
    }
    
    if (!state.puzzles || !state.puzzles[selectedGenre] || state.puzzles[selectedGenre].length === 0) {
      throw new Error(`No puzzles found for genre: ${selectedGenre}. Available genres: ${Object.keys(state.puzzles || {}).join(', ')}`);
    }
    
    // STEP 2: Select a book within the genre
    // Get all books in THIS genre only
    const bookTitles = [...new Set(state.puzzles[selectedGenre].map(p => p.book))];
    
    let selectedBook = book;
    
    // If a book was provided, verify it exists in the selected genre
    if (selectedBook && !bookTitles.includes(selectedBook)) {
      console.warn(`Book "${selectedBook}" not found in genre "${selectedGenre}". Available books: ${bookTitles.join(', ')}`);
      // Book doesn't exist in this genre, clear it and select a new one
      selectedBook = null;
    }
    
    if (!selectedBook) {
      // Categorize books within this genre
      const completeBooks: string[] = [];
      const inProgressBooks: string[] = [];
      const unstartedBooks: string[] = [];
      
      bookTitles.forEach(bookTitle => {
        if (isBookComplete(bookTitle, state)) {
          completeBooks.push(bookTitle);
        } else if (isBookInProgress(bookTitle, state)) {
          inProgressBooks.push(bookTitle);
        } else {
          unstartedBooks.push(bookTitle);
        }
      });
      
      // Priority 1: Continue current book if it exists in this genre and is not complete
      if (state.currentBook &&
          bookTitles.includes(state.currentBook) &&
          !isBookComplete(state.currentBook, state)) {
        selectedBook = state.currentBook;
      }
      // Priority 2: Random in-progress book
      else if (inProgressBooks.length > 0) {
        selectedBook = inProgressBooks[Math.floor(Math.random() * inProgressBooks.length)];
      }
      // Priority 3: Random unstarted book
      else if (unstartedBooks.length > 0) {
        selectedBook = unstartedBooks[Math.floor(Math.random() * unstartedBooks.length)];
      }
      // Priority 4: All books complete in this genre
      else if (completeBooks.length > 0) {
        // If allowReplay is true, reset and replay a random book
        if (allowReplay) {
          selectedBook = completeBooks[Math.floor(Math.random() * completeBooks.length)];

          // Reset book completion status
          if (selectedBook && state.books && state.books[selectedBook]) {
            const availableParts = getAvailableParts(selectedBook, state.puzzles);
            availableParts.forEach(part => {
              const bookData = state.books[selectedBook!];
              if (Array.isArray(bookData)) {
                bookData[part] = false;
              }
            });
          }
        } else {
          // Genre is complete - signal to show modal instead of auto-replaying
          console.log(`All books complete in genre "${selectedGenre}". Signaling genre completion.`);
          return {
            success: false,
            newState: state,
            genreComplete: true
          };
        }
      } else {
        throw new Error(`No valid books found in genre: ${selectedGenre}`);
      }
    }
    
    // Validate selected book
    if (!selectedBook) {
      throw new Error('No book selected');
    }
    
    const bookPuzzles = state.puzzles[selectedGenre].filter(p => p.book === selectedBook);
    if (bookPuzzles.length === 0) {
      throw new Error(`No puzzles found for book: ${selectedBook}`);
    }
    
    // STEP 3: Determine which part to load next
    // Initialize book tracking if needed
    let newState: GameState = { ...state };
    if (!newState.books) {
      newState.books = {};
    }
    if (!newState.books[selectedBook] || !Array.isArray(newState.books[selectedBook])) {
      newState.books[selectedBook] = [];
    }
    
    // Get all story parts for this book
    const availableParts = getAvailableParts(selectedBook, newState.puzzles);
    if (availableParts.length === 0) {
      throw new Error(`No story parts defined for book: ${selectedBook}`);
    }
    
    // Find the next part to load
    let nextPartToLoad: number;
    
    // Case 1: Continuing current book
    if (newState.currentBook === selectedBook && 
        newState.currentStoryPart !== undefined) {
      
      // Find parts higher than current
      const higherParts = availableParts.filter(part => part > newState.currentStoryPart);
      
      if (higherParts.length > 0) {
        // Next sequential part
        nextPartToLoad = Math.min(...higherParts);
      } else {
        // No higher parts, check for incomplete parts
        const bookData = newState.books[selectedBook];
        if (Array.isArray(bookData)) {
          const incompleteParts = availableParts.filter(part => 
            !bookData[part]
          );
          
          if (incompleteParts.length > 0) {
            // Lowest incomplete part
            nextPartToLoad = Math.min(...incompleteParts);
          } else {
            // All parts complete, start from beginning
            nextPartToLoad = Math.min(...availableParts);
            bookData[nextPartToLoad] = false;
          }
        } else {
          nextPartToLoad = Math.min(...availableParts);
        }
      }
    } 
    // Case 2: New or switched book
    else {
      // Find the lowest incomplete part or start at beginning
      const bookData = newState.books[selectedBook];
      if (Array.isArray(bookData)) {
        const incompleteParts = availableParts.filter(part => 
          !bookData[part]
        );
        
        if (incompleteParts.length > 0) {
          // Start with lowest incomplete part
          nextPartToLoad = Math.min(...incompleteParts);
        } else {
          // All parts complete, start from beginning
          nextPartToLoad = Math.min(...availableParts);
          bookData[nextPartToLoad] = false;
        }
      } else {
        nextPartToLoad = Math.min(...availableParts);
      }
    }
    
    // Find the puzzle matching the selected part
    const puzzleToLoad = bookPuzzles.find(p => p.storyPart === nextPartToLoad);
    if (!puzzleToLoad) {
      throw new Error(`Could not find puzzle for book "${selectedBook}" part ${nextPartToLoad}`);
    }
    
    // STEP 4: Update state atomically
    newState.currentPuzzleIndex = newState.puzzles[selectedGenre].indexOf(puzzleToLoad);
    newState.currentGenre = selectedGenre;
    newState.currentBook = selectedBook;
    newState.currentStoryPart = nextPartToLoad;
    
    // Initialize the puzzle
    const initResult = initializePuzzle(puzzleToLoad, config, newState);
    
    if (!initResult.success) {
      throw new Error('Puzzle initialization failed');
    }
    
    return { success: true, newState: initResult.newState };
  } catch (error) {
    console.error('Error loading sequential puzzle:', error);
    
    // Add recovery mechanism
    if (state.lastUncompletedPuzzle) {
      const fallbackGenre = state.lastUncompletedPuzzle.genre;
      const fallbackBook = state.lastUncompletedPuzzle.book;
      
      if (state.puzzles[fallbackGenre]) {
        const fallbackPuzzles = state.puzzles[fallbackGenre].filter(p => p.book === fallbackBook);
        if (fallbackPuzzles.length > 0) {
          const fallbackPuzzle = fallbackPuzzles[0];
          const initResult = initializePuzzle(fallbackPuzzle, config, state);
          return { success: initResult.success, newState: initResult.newState };
        }
      }
    }
    
    return { success: false, newState: state };
  }
}

/**
 * Build a mapping of books to their available story parts
 */
export function buildBookPartsMapping(state: GameState): GameState {
  const newState: GameState = {
    ...state,
    bookPartsMap: {},
  };
  
  // Go through all genres and puzzles
  for (const genre in newState.puzzles) {
    const puzzlesInGenre = newState.puzzles[genre];
    
    puzzlesInGenre.forEach(puzzle => {
      const book = puzzle.book;
      const part = puzzle.storyPart;
      
      if (part === undefined) return;
      
      // Initialize book entry if needed
      if (!newState.bookPartsMap[book]) {
        newState.bookPartsMap[book] = [];
      }
      
      // Add this part to the array if not already present
      if (!newState.bookPartsMap[book].includes(part)) {
        newState.bookPartsMap[book].push(part);
      }
    });
  }
  
  // Sort parts for each book
  for (const book in newState.bookPartsMap) {
    newState.bookPartsMap[book].sort((a, b) => a - b);
  }
  
  return newState;
}

