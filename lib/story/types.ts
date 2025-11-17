/**
 * Type definitions for Story Progression System
 * These types match the story-progression-config.json structure
 */

import type { StoryBeat, LoadingGroup } from '@/lib/dialogue/types';

/**
 * Condition for progression (min/max thresholds)
 */
export interface ProgressionCondition {
  min?: number;
  max?: number;
}

/**
 * Conditions that must be met to advance storybeat
 */
export interface ProgressionConditions {
  completedPuzzles?: ProgressionCondition;
  discoveredBooks?: ProgressionCondition;
  completedBooks?: ProgressionCondition;
  [key: string]: ProgressionCondition | undefined;
}

/**
 * A single progression rule
 */
export interface ProgressionRule {
  id: string;
  fromBeat: StoryBeat;
  toBeat: StoryBeat;
  description: string;
  conditions: ProgressionConditions;
  priority: number;
}

/**
 * Music mapping configuration
 */
export interface MusicMapping {
  description: string;
  beatToPlaylist: Record<StoryBeat, string>;
  fadeDuration: number;
}

/**
 * Story event triggers configuration
 */
export interface StoryEventTriggers {
  description: string;
  beatToEvent: Record<StoryBeat, string | null>;
  onlyTriggerOnce: boolean;
}

/**
 * Character group loading configuration
 */
export interface CharacterGroupLoading {
  description: string;
  loadOnBeat: Record<StoryBeat, LoadingGroup[]>;
}

/**
 * System settings
 */
export interface ProgressionSettings {
  enableAutoProgression: boolean;
  allowManualOverride: boolean;
  enableLogging: boolean;
  checkProgressionOnPuzzleComplete: boolean;
  checkProgressionOnBookDiscovered: boolean;
}

/**
 * Complete progression configuration
 */
export interface StoryProgressionConfig {
  version: string;
  description: string;
  progressionRules: ProgressionRule[];
  musicMapping: MusicMapping;
  storyEventTriggers: StoryEventTriggers;
  characterGroupLoading: CharacterGroupLoading;
  settings: ProgressionSettings;
  notes?: Record<string, string>;
}

/**
 * Game state metrics for progression checking
 */
export interface ProgressionMetrics {
  completedPuzzles: number;
  discoveredBooks: number;
  completedBooks: number;
  [key: string]: number;
}

/**
 * Result of checking progression rules
 */
export interface ProgressionCheckResult {
  shouldAdvance: boolean;
  nextBeat: StoryBeat | null;
  triggeredRule: ProgressionRule | null;
  reason: string;
}

/**
 * Story progression manager status
 */
export interface StoryProgressionStatus {
  initialized: boolean;
  currentBeat: StoryBeat;
  autoProgressionEnabled: boolean;
  triggeredEvents: Set<string>;
  loadedCharacterGroups: LoadingGroup[];
}
