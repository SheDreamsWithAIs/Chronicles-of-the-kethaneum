/**
 * Story Progress Manager
 *
 * Manages the player's story progression through the Kethaneum narrative.
 * Handles loading blurbs, checking trigger conditions, and updating progress state.
 */

import {
  StoryBlurb,
  StoryProgressData,
  StoryProgressState,
  StoryTrigger,
  TriggerCheckResult,
  DEFAULT_STORY_PROGRESS,
  StoryBeat,
} from './types';

// Import GameState type - we'll use a minimal interface to avoid circular deps
interface MinimalGameState {
  discoveredBooks: Set<string>;
  completedPuzzles: number;
  completedBooks: number;
  kethaneumRevealed: boolean;
  currentGenre: string;
  storyProgress?: StoryProgressState;
  books: { [bookTitle: string]: boolean[] | { complete?: boolean } };
}

/**
 * StoryProgressManager singleton class
 */
class StoryProgressManagerClass {
  private blurbs: StoryBlurb[] = [];
  private blurbsById: Map<string, StoryBlurb> = new Map();
  private blurbsByTrigger: Map<StoryTrigger, StoryBlurb[]> = new Map();
  private loaded: boolean = false;
  private loading: Promise<void> | null = null;
  private config: StoryProgressData['triggerConfig'] | null = null;

  /**
   * Load story progress data from JSON file
   */
  async loadBlurbs(): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.loading) {
      return this.loading;
    }

    if (this.loaded) {
      return;
    }

    this.loading = this._doLoad();
    await this.loading;
    this.loading = null;
  }

  private async _doLoad(): Promise<void> {
    try {
      const response = await fetch('/data/story-progress.json');
      if (!response.ok) {
        throw new Error(`Failed to load story progress: ${response.status}`);
      }

      const data: StoryProgressData = await response.json();
      this.blurbs = data.blurbs;
      this.config = data.triggerConfig || null;

      // Build lookup maps
      this.blurbsById.clear();
      this.blurbsByTrigger.clear();

      for (const blurb of this.blurbs) {
        this.blurbsById.set(blurb.id, blurb);

        const triggerBlurbs = this.blurbsByTrigger.get(blurb.trigger) || [];
        triggerBlurbs.push(blurb);
        this.blurbsByTrigger.set(blurb.trigger, triggerBlurbs);
      }

      // Sort blurbs within each trigger by order
      for (const [trigger, triggerBlurbs] of this.blurbsByTrigger) {
        triggerBlurbs.sort((a, b) => a.order - b.order);
        this.blurbsByTrigger.set(trigger, triggerBlurbs);
      }

      this.loaded = true;
      console.log(`[StoryProgressManager] Loaded ${this.blurbs.length} story blurbs`);
    } catch (error) {
      console.error('[StoryProgressManager] Failed to load blurbs:', error);
      // Initialize with empty data to prevent repeated failures
      this.blurbs = [];
      this.loaded = true;
    }
  }

  /**
   * Check if blurbs are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get a blurb by its ID
   */
  getBlurbById(id: string): StoryBlurb | null {
    return this.blurbsById.get(id) || null;
  }

  /**
   * Get blurbs for a specific trigger
   */
  getBlurbsForTrigger(trigger: StoryTrigger): StoryBlurb[] {
    return this.blurbsByTrigger.get(trigger) || [];
  }

  /**
   * Get the first unprocessed blurb for a trigger within the current story beat
   */
  getBlurbForTrigger(
    trigger: StoryTrigger,
    currentBeat: StoryBeat,
    firedTriggers: StoryTrigger[]
  ): StoryBlurb | null {
    const blurbs = this.getBlurbsForTrigger(trigger);

    // Find first blurb that:
    // 1. Matches or is before the current story beat
    // 2. Hasn't been fired yet (unless allowMultiplePerTrigger)
    for (const blurb of blurbs) {
      const beatOrder = this.getStoryBeatOrder(blurb.storyBeat);
      const currentBeatOrder = this.getStoryBeatOrder(currentBeat);

      if (beatOrder <= currentBeatOrder) {
        // Check if this specific blurb's trigger hasn't been fired
        // (we track by trigger, not by blurb ID, for simplicity)
        if (!firedTriggers.includes(trigger) || this.config?.allowMultiplePerTrigger) {
          return blurb;
        }
      }
    }

    return null;
  }

  /**
   * Get numeric order for story beats (for comparison)
   */
  private getStoryBeatOrder(beat: StoryBeat): number {
    const order: Record<StoryBeat, number> = {
      hook: 0,
      first_plot_point: 1,
      first_pinch_point: 2,
      midpoint: 3,
      second_pinch_point: 4,
      second_plot_point: 5,
      climax: 6,
      resolution: 7,
    };
    return order[beat] ?? 0;
  }

  /**
   * Check trigger conditions based on game state changes
   * Returns the trigger that should fire, if any
   */
  checkTriggerConditions(
    state: MinimalGameState,
    previousState?: MinimalGameState
  ): TriggerCheckResult {
    const storyProgress = state.storyProgress || DEFAULT_STORY_PROGRESS;
    const firedTriggers = storyProgress.firedTriggers;

    // Helper to check and return result
    const checkTrigger = (trigger: StoryTrigger): TriggerCheckResult | null => {
      if (firedTriggers.includes(trigger)) {
        return null; // Already fired
      }
      const blurb = this.getBlurbForTrigger(trigger, storyProgress.currentStoryBeat, firedTriggers);
      if (blurb) {
        return { shouldTrigger: true, trigger, blurb };
      }
      return null;
    };

    const discoveredCount = state.discoveredBooks.size;
    const completedPuzzles = state.completedPuzzles;
    const completedBooks = this.countCompletedBooks(state);
    const prevDiscoveredCount = previousState?.discoveredBooks.size || 0;
    const prevCompletedPuzzles = previousState?.completedPuzzles || 0;
    const prevCompletedBooks = previousState ? this.countCompletedBooks(previousState) : 0;

    // Check game_start (only if no blurbs unlocked yet)
    if (storyProgress.unlockedBlurbs.length === 0) {
      const result = checkTrigger('game_start');
      if (result) return result;
    }

    // Check first_book_discovered
    if (discoveredCount >= 1 && prevDiscoveredCount === 0) {
      const result = checkTrigger('first_book_discovered');
      if (result) return result;
    }

    // Check first_puzzle_complete
    if (completedPuzzles >= 1 && prevCompletedPuzzles === 0) {
      const result = checkTrigger('first_puzzle_complete');
      if (result) return result;
    }

    // Check first_book_complete
    if (completedBooks >= 1 && prevCompletedBooks === 0) {
      const result = checkTrigger('first_book_complete');
      if (result) return result;
    }

    // Check milestone triggers - books discovered
    const discoveryMilestones = [5, 10, 25, 50, 100];
    for (const milestone of discoveryMilestones) {
      if (discoveredCount >= milestone && prevDiscoveredCount < milestone) {
        const trigger = `books_discovered_${milestone}` as StoryTrigger;
        const result = checkTrigger(trigger);
        if (result) return result;
      }
    }

    // Check milestone triggers - puzzles complete
    const puzzleMilestones = [10, 25, 50, 100];
    for (const milestone of puzzleMilestones) {
      if (completedPuzzles >= milestone && prevCompletedPuzzles < milestone) {
        const trigger = `puzzles_complete_${milestone}` as StoryTrigger;
        const result = checkTrigger(trigger);
        if (result) return result;
      }
    }

    // Check milestone triggers - books complete
    const bookCompleteMilestones = [5, 10, 25];
    for (const milestone of bookCompleteMilestones) {
      if (completedBooks >= milestone && prevCompletedBooks < milestone) {
        const trigger = `books_complete_${milestone}` as StoryTrigger;
        const result = checkTrigger(trigger);
        if (result) return result;
      }
    }

    // Check kethaneum_genre_revealed
    if (state.kethaneumRevealed && !previousState?.kethaneumRevealed) {
      const result = checkTrigger('kethaneum_genre_revealed');
      if (result) return result;
    }

    // Check kethaneum_first_puzzle
    if (state.currentGenre === 'kethaneum' && previousState?.currentGenre !== 'kethaneum') {
      const result = checkTrigger('kethaneum_first_puzzle');
      if (result) return result;
    }

    // No trigger matched
    return { shouldTrigger: false, trigger: null, blurb: null };
  }

  /**
   * Count completed books from game state
   */
  private countCompletedBooks(state: MinimalGameState): number {
    let count = 0;
    for (const bookTitle of state.discoveredBooks) {
      const bookData = state.books[bookTitle];
      if (Array.isArray(bookData)) {
        // Check if all parts are complete
        if (bookData.length > 0 && bookData.every((part) => part === true)) {
          count++;
        }
      } else if (bookData && typeof bookData === 'object' && bookData.complete) {
        count++;
      }
    }
    return count;
  }

  /**
   * Unlock a blurb and return updated story progress state
   */
  unlockBlurb(blurbId: string, currentProgress: StoryProgressState): StoryProgressState {
    const blurb = this.getBlurbById(blurbId);
    if (!blurb) {
      console.warn(`[StoryProgressManager] Blurb not found: ${blurbId}`);
      return currentProgress;
    }

    // Don't re-unlock
    if (currentProgress.unlockedBlurbs.includes(blurbId)) {
      return currentProgress;
    }

    const newProgress: StoryProgressState = {
      ...currentProgress,
      currentBlurbId: blurbId,
      unlockedBlurbs: [...currentProgress.unlockedBlurbs, blurbId],
      firedTriggers: [...currentProgress.firedTriggers, blurb.trigger],
      lastUpdated: Date.now(),
    };

    console.log(`[StoryProgressManager] Unlocked blurb: ${blurb.title} (${blurbId})`);
    return newProgress;
  }

  /**
   * Advance the story beat and return updated progress
   */
  advanceStoryBeat(
    currentProgress: StoryProgressState,
    newBeat: StoryBeat
  ): StoryProgressState {
    const beatTrigger = `story_beat_${newBeat}` as StoryTrigger;

    return {
      ...currentProgress,
      currentStoryBeat: newBeat,
      lastUpdated: Date.now(),
      // Note: The beat trigger will be checked separately via checkTriggerConditions
    };
  }

  /**
   * Get current journey blurb
   */
  getCurrentBlurb(storyProgress: StoryProgressState): StoryBlurb | null {
    if (!storyProgress.currentBlurbId) {
      return null;
    }
    return this.getBlurbById(storyProgress.currentBlurbId);
  }

  /**
   * Get all unlocked blurbs in order (for story history)
   */
  getStoryHistory(storyProgress: StoryProgressState): StoryBlurb[] {
    const history: StoryBlurb[] = [];
    for (const blurbId of storyProgress.unlockedBlurbs) {
      const blurb = this.getBlurbById(blurbId);
      if (blurb) {
        history.push(blurb);
      }
    }
    return history;
  }

  /**
   * Check if story history has any entries
   */
  hasStoryHistory(storyProgress: StoryProgressState): boolean {
    return storyProgress.unlockedBlurbs.length > 0;
  }

  /**
   * Initialize story progress for a new game
   */
  initializeProgress(): StoryProgressState {
    return { ...DEFAULT_STORY_PROGRESS };
  }

  /**
   * Get all available triggers (for debugging/admin)
   */
  getAllTriggers(): StoryTrigger[] {
    return Array.from(this.blurbsByTrigger.keys());
  }

  /**
   * Get all blurbs (for debugging/admin)
   */
  getAllBlurbs(): StoryBlurb[] {
    return [...this.blurbs];
  }

  /**
   * Get configuration
   */
  getConfig(): StoryProgressData['triggerConfig'] | null {
    return this.config;
  }
}

// Export singleton instance
export const storyProgressManager = new StoryProgressManagerClass();

// Export class for testing
export { StoryProgressManagerClass };
