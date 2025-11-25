/**
 * Story Progress System Types
 *
 * This module defines the types for the story progression system that tracks
 * the player's journey through the Kethaneum narrative.
 */

import { StoryBeat } from '../dialogue/types';

// Re-export StoryBeat for convenience
export type { StoryBeat } from '../dialogue/types';

/**
 * Available trigger types for story progression.
 * These can be configured in the story-progress.json file.
 */
export type StoryTrigger =
  // Game start triggers
  | 'game_start'

  // Discovery triggers
  | 'first_book_discovered'
  | 'books_discovered_5'
  | 'books_discovered_10'
  | 'books_discovered_25'
  | 'books_discovered_50'
  | 'books_discovered_100'

  // Completion triggers
  | 'first_puzzle_complete'
  | 'first_book_complete'
  | 'puzzles_complete_10'
  | 'puzzles_complete_25'
  | 'puzzles_complete_50'
  | 'puzzles_complete_100'
  | 'books_complete_5'
  | 'books_complete_10'
  | 'books_complete_25'

  // Kethaneum-specific triggers
  | 'kethaneum_genre_revealed'
  | 'kethaneum_first_puzzle'
  | 'kethaneum_book_complete'

  // Genre mastery triggers
  | 'genre_first_complete'
  | 'genre_mastered'

  // Story beat transitions
  | 'story_beat_first_plot_point'
  | 'story_beat_first_pinch_point'
  | 'story_beat_midpoint'
  | 'story_beat_second_pinch_point'
  | 'story_beat_second_plot_point'
  | 'story_beat_climax'
  | 'story_beat_resolution'

  // Custom/extensible triggers (for future event system)
  | `custom_${string}`;

/**
 * Trigger condition configuration for the event system.
 * Allows flexible trigger definitions that can be extended.
 */
export interface TriggerCondition {
  type: StoryTrigger;
  // Optional parameters for parameterized triggers
  params?: {
    count?: number;
    genre?: string;
    bookId?: string;
    storyBeat?: StoryBeat;
  };
}

/**
 * A single story blurb that represents a moment in the player's journey.
 */
export interface StoryBlurb {
  /** Unique identifier for this blurb */
  id: string;

  /** The story beat this blurb belongs to */
  storyBeat: StoryBeat;

  /** The trigger that unlocks this blurb */
  trigger: StoryTrigger;

  /** Display title for the blurb */
  title: string;

  /** The narrative text content */
  text: string;

  /** Order within the same story beat (for sorting) */
  order: number;

  /** Optional: Additional trigger conditions for complex scenarios */
  conditions?: TriggerCondition[];

  /** Optional: Metadata for the blurb */
  metadata?: {
    author?: string;
    lastUpdated?: string;
    tags?: string[];
  };
}

/**
 * The story progress data file structure.
 */
export interface StoryProgressData {
  version: number;
  blurbs: StoryBlurb[];

  /** Configuration for trigger behavior */
  triggerConfig?: {
    /** Whether to allow multiple blurbs for the same trigger */
    allowMultiplePerTrigger: boolean;

    /** Default story beat for new games */
    defaultStoryBeat: StoryBeat;

    /** Milestone thresholds that can be customized */
    milestones?: {
      booksDiscovered: number[];
      puzzlesComplete: number[];
      booksComplete: number[];
    };
  };
}

/**
 * Tracks the player's story progress state.
 * This is stored as part of GameState and persisted in saves.
 */
export interface StoryProgressState {
  /** ID of the current journey blurb being displayed */
  currentBlurbId: string;

  /** Array of all unlocked blurb IDs (in unlock order) */
  unlockedBlurbs: string[];

  /** Current story beat the player has reached */
  currentStoryBeat: StoryBeat;

  /** Timestamp of last story progress update */
  lastUpdated: number;

  /** Track which triggers have already fired (to prevent duplicates) */
  firedTriggers: StoryTrigger[];
}

/**
 * Result of checking trigger conditions.
 */
export interface TriggerCheckResult {
  shouldTrigger: boolean;
  trigger: StoryTrigger | null;
  blurb: StoryBlurb | null;
}

/**
 * Initial/default story progress state.
 */
export const DEFAULT_STORY_PROGRESS: StoryProgressState = {
  currentBlurbId: '',
  unlockedBlurbs: [],
  currentStoryBeat: 'hook',
  lastUpdated: 0,
  firedTriggers: [],
};
