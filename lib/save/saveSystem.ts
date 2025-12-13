/**
 * Optimized Save System for Chronicles of the Kethaneum
 *
 * Uses compact storage format with:
 * - Short book IDs instead of full titles (4 chars vs 20-40 chars)
 * - Bitmap encoding for part completion (1-2 bytes vs arrays)
 * - Versioned format for future migrations
 *
 * Storage reduction: ~70-80% compared to original format
 */

import { bookRegistry } from '../book/bookRegistry';
import {
  encodeParts,
  decodeParts,
  getCompletedCount,
  isBookCompleted,
} from '../book/progressBitmap';
import type { GameState } from '../game/state';
import type { StoryProgressState } from '../story/types';
import type { AudioSettings } from '../audio/audioManager';
import { audioManager } from '../audio/audioManager';

// ============================================================================
// Types - Optimized Storage Format
// ============================================================================

/**
 * Compact storage format for localStorage
 * Uses short property names to minimize storage
 */
export interface OptimizedProgress {
  /** Version number for migrations */
  v: number;
  /** Discovered book IDs (comma-separated) */
  d: string;
  /** Progress bitmaps per book ID */
  p: { [bookId: string]: number };
  /** Completed puzzle IDs by genre */
  g: { [genre: string]: string[] };
  /** Game mode: 's' = story, 'p' = puzzle-only, 'b' = beat-the-clock */
  m: string;
  /** Total completed puzzles count */
  n: number;
  /** Current state (optional) */
  c?: OptimizedCurrentState;
  /** Puzzle selection state (optional) */
  s?: OptimizedSelectionState;
  /** Story progress (optional) */
  sp?: StoryProgressState;
  /** Dialogue/completed story events (optional) */
  dl?: string[];
  /** Dialogue: has visited library (optional) */
  dlv?: boolean;
  /** Audio settings (optional) */
  a?: OptimizedAudioSettings;
}

/**
 * Compact current puzzle state
 */
export interface OptimizedCurrentState {
  /** Current genre */
  g: string;
  /** Current book ID */
  b: string;
  /** Current part index */
  p: number;
  /** Current puzzle index */
  i: number;
}

/**
 * Compact puzzle selection state
 */
export interface OptimizedSelectionState {
  /** Selected genre */
  g: string;
  /** Next Kethaneum index */
  k: number;
  /** Puzzles since last Kethaneum */
  p: number;
  /** Next Kethaneum interval */
  i: number;
  /** Kethaneum revealed */
  r: boolean;
  /** Genre exhausted */
  e: boolean;
}

/**
 * Compact audio settings
 */
export interface OptimizedAudioSettings {
  /** Master volume (0-1) */
  mv: number;
  /** Music volume (0-1) */
  mu: number;
  /** Ambient volume (0-1) */
  av: number;
  /** SFX volume (0-1) */
  sv: number;
  /** Voice volume (0-1) */
  vv: number;
  /** Master muted */
  mm: boolean;
  /** Music muted */
  mum: boolean;
  /** Ambient muted */
  am: boolean;
  /** SFX muted */
  sm: boolean;
  /** Voice muted */
  vm: boolean;
}

// ============================================================================
// Types - Decoded Progress (for application use)
// ============================================================================

/**
 * Decoded progress with full book information
 */
export interface DecodedBookProgress {
  bookId: string;
  title: string;
  genre: string;
  totalParts: number;
  completedParts: boolean[];
  progressBitmap: number;
  isComplete: boolean;
  completionPercentage: number;
}

/**
 * Full decoded progress for application use
 */
export interface DecodedProgress {
  version: number;
  discoveredBooks: Map<string, DecodedBookProgress>;
  completedPuzzlesByGenre: Map<string, Set<string>>;
  gameMode: 'story' | 'puzzle-only' | 'beat-the-clock';
  completedPuzzlesCount: number;
  currentState?: {
    genre: string;
    bookId: string;
    bookTitle: string;
    part: number;
    puzzleIndex: number;
  };
  completedStoryEvents?: string[];
  hasVisitedLibrary?: boolean;
  selectionState?: {
    selectedGenre: string;
    nextKethaneumIndex: number;
    puzzlesSinceLastKethaneum: number;
    nextKethaneumInterval: number;
    kethaneumRevealed: boolean;
    genreExhausted: boolean;
  };
  storyProgress?: StoryProgressState;
  audioSettings?: AudioSettings;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kethaneumProgress';
const CURRENT_VERSION = 2; // Version 2 = optimized format

const GAME_MODE_MAP: { [key: string]: 'story' | 'puzzle-only' | 'beat-the-clock' } = {
  s: 'story',
  p: 'puzzle-only',
  b: 'beat-the-clock',
};

const GAME_MODE_REVERSE: { [key: string]: string } = {
  story: 's',
  'puzzle-only': 'p',
  'beat-the-clock': 'b',
};

// ============================================================================
// Save Functions
// ============================================================================

/**
 * Save game progress in optimized format
 */
export async function saveOptimizedProgress(state: GameState): Promise<void> {
  try {
    if (typeof localStorage === 'undefined') return;

    // Ensure registry is loaded for title-to-ID conversion
    await bookRegistry.loadRegistry();

    // Build discovered books list (as IDs)
    // Primary source: discoveredBooks set
    // Secondary: books map entries WITH actual progress/complete, registry-verified
    const discoveredTitles = new Set<string>();
    const progressMap: { [bookId: string]: number } = {};

    if (state.discoveredBooks && state.discoveredBooks instanceof Set) {
      for (const title of state.discoveredBooks) {
        discoveredTitles.add(title);
      }
    }

    if (state.books && typeof state.books === 'object') {
      for (const title of Object.keys(state.books)) {
        const bookData = state.books[title];
        const bookId = bookRegistry.getBookIdByTitleSync(title);
        if (!bookId) continue; // ignore unknown/ghost titles not in registry

        const hasProgress =
          (Array.isArray(bookData) && bookData.some(Boolean)) ||
          (bookData && typeof bookData === 'object' && bookData.complete === true);

        if (hasProgress) {
          discoveredTitles.add(title);
        }
      }
    }

    // Convert titles to IDs and build progress map (default 0 for known discoveries)
    for (const title of discoveredTitles) {
      const bookId = bookRegistry.getBookIdByTitleSync(title);
      if (!bookId) continue;

      const bookData = state.books?.[title];
      if (Array.isArray(bookData)) {
        progressMap[bookId] = encodeParts(bookData);
      } else if (bookData && typeof bookData === 'object' && bookData.complete) {
        const book = bookRegistry.getBookSync(bookId);
        if (book) {
          progressMap[bookId] = (1 << book.parts) - 1;
        }
      } else {
        // Known discovery with no progress yet
        progressMap[bookId] = 0;
      }
    }

    const discoveredIds = Array.from(discoveredTitles)
      .map(title => bookRegistry.getBookIdByTitleSync(title))
      .filter((id): id is string => !!id);

    // Convert completed puzzles by genre (titles to IDs where possible)
    const completedByGenre: { [genre: string]: string[] } = {};
    if (state.completedPuzzlesByGenre) {
      for (const [genre, titlesSet] of Object.entries(state.completedPuzzlesByGenre)) {
        if (titlesSet instanceof Set) {
          const ids: string[] = [];
          for (const title of titlesSet) {
            const bookId = bookRegistry.getBookIdByTitleSync(title);
            // Store ID if found, otherwise store original title (for puzzles not in registry)
            ids.push(bookId || title);
          }
          if (ids.length > 0) {
            completedByGenre[genre] = ids;
          }
        }
      }
    }

    // Build optimized progress object
    const optimized: OptimizedProgress = {
      v: CURRENT_VERSION,
      d: discoveredIds.join(','),
      p: progressMap,
      g: completedByGenre,
      m: GAME_MODE_REVERSE[state.gameMode] || 's',
      n: state.completedPuzzles || 0,
    };

    // Add current state if playing
    if (state.currentBook && state.currentStoryPart !== undefined && state.currentStoryPart >= 0) {
      const currentBookId = bookRegistry.getBookIdByTitleSync(state.currentBook);
      if (currentBookId) {
        optimized.c = {
          g: state.currentGenre || '',
          b: currentBookId,
          p: state.currentStoryPart,
          i: state.currentPuzzleIndex || 0,
        };
      }
    }

    // Add selection state
    // Always save selection state if we have a currentGenre or selectedGenre
    // This ensures we preserve genre information even if selectedGenre is empty
    if (state.selectedGenre || state.currentGenre || state.nextKethaneumIndex > 0 || state.kethaneumRevealed) {
      optimized.s = {
        g: state.selectedGenre || state.currentGenre || '', // Fallback to currentGenre if selectedGenre is empty
        k: state.nextKethaneumIndex || 0,
        p: state.puzzlesSinceLastKethaneum || 0,
        i: state.nextKethaneumInterval || 3,
        r: state.kethaneumRevealed || false,
        e: state.genreExhausted || false,
      };
    }

    // Add story progress
    if (state.storyProgress) {
      optimized.sp = state.storyProgress;
    }

    // Add dialogue state (completed story events)
    if (state.dialogue?.completedStoryEvents && state.dialogue.completedStoryEvents.length > 0) {
      optimized.dl = state.dialogue.completedStoryEvents;
    }

    // Add hasVisitedLibrary flag
    if (state.dialogue?.hasVisitedLibrary) {
      optimized.dlv = true;
    }

    // Add audio settings
    const audioSettings = audioManager.getSettings();
    optimized.a = {
      mv: audioSettings.masterVolume,
      mu: audioSettings.musicVolume,
      av: audioSettings.ambientVolume,
      sv: audioSettings.sfxVolume,
      vv: audioSettings.voiceVolume,
      mm: audioSettings.masterMuted,
      mum: audioSettings.musicMuted,
      am: audioSettings.ambientMuted,
      sm: audioSettings.sfxMuted,
      vm: audioSettings.voiceMuted,
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(optimized));
  } catch (error) {
    console.error('Failed to save optimized progress:', error);
    throw error;
  }
}

// ============================================================================
// Load Functions
// ============================================================================

/**
 * Load and decode optimized progress
 */
export async function loadOptimizedProgress(): Promise<DecodedProgress | null> {
  try {
    if (typeof localStorage === 'undefined') return null;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved);

    // Check if this is optimized format (has version field)
    if (!('v' in data) || data.v < 2) {
      // This is old format - needs migration
      return null;
    }

    return await decodeOptimizedProgress(data as OptimizedProgress);
  } catch (error) {
    console.error('Failed to load optimized progress:', error);
    return null;
  }
}

/**
 * Decode optimized progress into usable format
 */
export async function decodeOptimizedProgress(
  data: OptimizedProgress
): Promise<DecodedProgress> {
  await bookRegistry.loadRegistry();

  // Decode discovered books
  const discoveredBooks = new Map<string, DecodedBookProgress>();
  const bookIds = data.d ? data.d.split(',').filter(Boolean) : [];

  for (const bookId of bookIds) {
    const book = await bookRegistry.getBook(bookId);
    if (!book) continue;

    const bitmap = data.p[bookId] || 0;
    const completedParts = decodeParts(bitmap, book.parts);
    const completedCount = getCompletedCount(bitmap);

    discoveredBooks.set(bookId, {
      bookId,
      title: book.title,
      genre: book.genre,
      totalParts: book.parts,
      completedParts,
      progressBitmap: bitmap,
      isComplete: isBookCompleted(bitmap, book.parts),
      completionPercentage: Math.round((completedCount / book.parts) * 100),
    });
  }

  // Decode completed puzzles by genre
  const completedPuzzlesByGenre = new Map<string, Set<string>>();
  for (const [genre, ids] of Object.entries(data.g || {})) {
    completedPuzzlesByGenre.set(genre, new Set(ids));
  }

  // Build decoded progress
  const decoded: DecodedProgress = {
    version: data.v,
    discoveredBooks,
    completedPuzzlesByGenre,
    gameMode: GAME_MODE_MAP[data.m] || 'story',
    completedPuzzlesCount: data.n || 0,
  };

  // Decode current state
  if (data.c) {
    const book = await bookRegistry.getBook(data.c.b);
    decoded.currentState = {
      genre: data.c.g,
      bookId: data.c.b,
      bookTitle: book?.title || '',
      part: data.c.p,
      puzzleIndex: data.c.i,
    };
  }

  // Decode selection state
  if (data.s) {
    decoded.selectionState = {
      selectedGenre: data.s.g,
      nextKethaneumIndex: data.s.k,
      puzzlesSinceLastKethaneum: data.s.p,
      nextKethaneumInterval: data.s.i,
      kethaneumRevealed: data.s.r,
      genreExhausted: data.s.e,
    };
  }

  // Decode story progress
  if (data.sp) {
    decoded.storyProgress = data.sp;
  }

  // Decode dialogue state (completed story events)
  if (data.dl && Array.isArray(data.dl)) {
    decoded.completedStoryEvents = data.dl;
  }

  // Decode hasVisitedLibrary flag
  if (data.dlv === true) {
    decoded.hasVisitedLibrary = true;
  }

  // Decode audio settings
  if (data.a) {
    decoded.audioSettings = {
      masterVolume: data.a.mv,
      musicVolume: data.a.mu,
      ambientVolume: data.a.av,
      sfxVolume: data.a.sv,
      voiceVolume: data.a.vv,
      masterMuted: data.a.mm,
      musicMuted: data.a.mum,
      ambientMuted: data.a.am,
      sfxMuted: data.a.sm,
      voiceMuted: data.a.vm,
    };
  }

  return decoded;
}

// ============================================================================
// Conversion to GameState format
// ============================================================================

/**
 * Convert decoded progress back to GameState-compatible format
 * This allows the existing game logic to work without changes
 */
export async function convertToGameStateFormat(
  decoded: DecodedProgress
): Promise<{
  books: { [title: string]: boolean[] | { complete?: boolean } };
  discoveredBooks: Set<string>;
  bookPartsMap: { [bookTitle: string]: number[] };
  bookProgress: { [title: string]: number };
  completedPuzzlesByGenre: { [genre: string]: Set<string> };
  completedBooks: number;
  completedPuzzles: number;
  currentGenre: string;
  currentBook: string;
  currentStoryPart: number;
  currentPuzzleIndex: number;
  gameMode: 'story' | 'puzzle-only' | 'beat-the-clock';
  selectedGenre: string;
  nextKethaneumIndex: number;
  puzzlesSinceLastKethaneum: number;
  nextKethaneumInterval: number;
  kethaneumRevealed: boolean;
  genreExhausted: boolean;
  storyProgress?: StoryProgressState;
  dialogue?: {
    completedStoryEvents: string[];
  };
  audioSettings?: AudioSettings;
}> {
  const books: { [title: string]: boolean[] | { complete?: boolean } } = {};
  const discoveredBooks = new Set<string>();
  const bookProgress: { [title: string]: number } = {};
  const bookPartsMap: { [title: string]: number[] } = {};

  // Convert each discovered book
  for (const [_, bookData] of decoded.discoveredBooks) {
    discoveredBooks.add(bookData.title);

    if (bookData.isComplete) {
      books[bookData.title] = { complete: true };
    } else {
      books[bookData.title] = bookData.completedParts;
    }

    // Calculate current progress (index of next incomplete part)
    const nextIncomplete = bookData.completedParts.findIndex((c) => !c);
    bookProgress[bookData.title] = nextIncomplete === -1
      ? bookData.totalParts
      : nextIncomplete;

    // Build parts map using known total parts (0-based indices)
    if (!bookPartsMap[bookData.title]) {
      bookPartsMap[bookData.title] = Array.from({ length: bookData.totalParts }, (_, idx) => idx);
    }
  }

  // Convert completed puzzles by genre (IDs back to titles where possible)
  const completedPuzzlesByGenre: { [genre: string]: Set<string> } = {};
  for (const [genre, ids] of decoded.completedPuzzlesByGenre) {
    const titles = new Set<string>();
    for (const id of ids) {
      const book = await bookRegistry.getBook(id);
      titles.add(book?.title || id);
    }
    completedPuzzlesByGenre[genre] = titles;
  }

  // Extract values from decoded progress
  const currentGenre = decoded.currentState?.genre || '';
  let selectedGenre = decoded.selectionState?.selectedGenre || '';
  
  // Fallback: If selectedGenre is empty but currentGenre exists, use currentGenre
  // This handles old save files that don't have selectedGenre saved
  if (!selectedGenre && currentGenre) {
    selectedGenre = currentGenre;
  }

  return {
    books,
    discoveredBooks,
    bookPartsMap,
    bookProgress,
    completedPuzzlesByGenre,
    completedBooks: decoded.discoveredBooks.size,
    completedPuzzles: decoded.completedPuzzlesCount,
    currentGenre,
    currentBook: decoded.currentState?.bookTitle || '',
    currentStoryPart: decoded.currentState?.part ?? -1,
    currentPuzzleIndex: decoded.currentState?.puzzleIndex ?? -1,
    gameMode: decoded.gameMode,
    selectedGenre,
    nextKethaneumIndex: decoded.selectionState?.nextKethaneumIndex || 0,
    puzzlesSinceLastKethaneum: decoded.selectionState?.puzzlesSinceLastKethaneum || 0,
    nextKethaneumInterval: decoded.selectionState?.nextKethaneumInterval || 3,
    kethaneumRevealed: decoded.selectionState?.kethaneumRevealed || false,
    genreExhausted: decoded.selectionState?.genreExhausted || false,
    storyProgress: decoded.storyProgress,
    dialogue: decoded.completedStoryEvents || decoded.hasVisitedLibrary !== undefined
      ? {
          completedStoryEvents: decoded.completedStoryEvents ?? [],
          hasVisitedLibrary: decoded.hasVisitedLibrary ?? false,
        }
      : undefined,
    audioSettings: decoded.audioSettings,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if saved data is in optimized format
 */
export function isOptimizedFormat(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const data = JSON.parse(saved);
    return 'v' in data && data.v >= 2;
  } catch {
    return false;
  }
}

/**
 * Get the current save format version
 */
export function getSaveVersion(): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 0;

    const data = JSON.parse(saved);
    return data.v || 1; // Version 1 = original format (no version field)
  } catch {
    return 0;
  }
}

/**
 * Get estimated storage size of current save
 */
export function getStorageSize(): { bytes: number; formatted: string } {
  try {
    if (typeof localStorage === 'undefined') return { bytes: 0, formatted: '0 B' };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { bytes: 0, formatted: '0 B' };

    const bytes = new Blob([saved]).size;
    const formatted =
      bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    return { bytes, formatted };
  } catch {
    return { bytes: 0, formatted: '0 B' };
  }
}

/**
 * Clear all saved progress
 */
export function clearOptimizedProgress(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get raw saved data (for debugging)
 */
export function getRawSavedData(): OptimizedProgress | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// ============================================================================
// Simplified Unified API (single format)
// ============================================================================

export interface LoadResult {
  data: Partial<GameState> | null;
  audioSettings?: AudioSettings;
  version: number;
}

export async function saveProgress(state: GameState): Promise<void> {
  return saveOptimizedProgress(state);
}

export async function loadProgress(): Promise<LoadResult> {
  try {
    const decoded = await loadOptimizedProgress();
    const fallbackAudio = loadAudioSettings();
    if (!decoded) {
      return { data: null, version: CURRENT_VERSION, audioSettings: fallbackAudio || undefined };
    }

    const gameStateData = await convertToGameStateFormat(decoded);

    if (decoded.audioSettings) {
      (gameStateData as any).audioSettings = decoded.audioSettings;
    }

    return {
      data: gameStateData,
      audioSettings: decoded.audioSettings || fallbackAudio || undefined,
      version: decoded.version ?? CURRENT_VERSION,
    };
  } catch (error) {
    console.error('Failed to load progress:', error);
    return { data: null, version: CURRENT_VERSION, audioSettings: loadAudioSettings() || undefined };
  }
}

export function clearProgress(): void {
  clearOptimizedProgress();
  cleanupLegacyKeys();
}

export function hasSaveData(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getSaveInfo(): {
  version: number;
  storageSize: { bytes: number; formatted: string };
  hasData: boolean;
} {
  return {
    version: CURRENT_VERSION,
    storageSize: getStorageSize(),
    hasData: hasSaveData(),
  };
}

export function getRawSaveData(): OptimizedProgress | null {
  return getRawSavedData();
}

/**
 * Removes legacy keys that are no longer used.
 * Safe to call in client-only contexts; guarded for SSR/static.
 */
export function cleanupLegacyKeys(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('kethaneumProgress_backup_v1');
  localStorage.removeItem('kethaneumProgress_backup_timestamp');
  localStorage.removeItem('kethaneumAudioSettings');
}

/**
 * Fallback audio settings helpers (kept for compatibility with components
 * that still read/write audio separately from the main save blob).
 */
export function saveAudioSettings(settings: AudioSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('kethaneumAudioSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save audio settings:', error);
  }
}

export function loadAudioSettings(): AudioSettings | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const savedSettings = localStorage.getItem('kethaneumAudioSettings');
    if (!savedSettings) return null;
    return JSON.parse(savedSettings) as AudioSettings;
  } catch (error) {
    console.error('Failed to load audio settings:', error);
    return null;
  }
}

export function clearAudioSettings(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('kethaneumAudioSettings');
  } catch (error) {
    console.error('Failed to clear audio settings:', error);
  }
}
