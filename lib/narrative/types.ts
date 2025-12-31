/**
 * Type definitions for the narrative orchestration system.
 */

/**
 * Narrative orchestration state.
 * Tracks story event unlocking, completion, and debt counter.
 */
export interface NarrativeOrchestrationState {
  /** Total number of Kethaneum puzzles completed */
  kethaneumPuzzlesCompleted: number;
  /** Number of unlocked but uncompleted story events (the "debt") */
  storyEventDebt: number;
  /** Total number of story events completed */
  storyEventsCompleted: number;
  /** Array of story event IDs that are unlocked but not yet completed */
  unlockedStoryEvents: string[];
  /** Array of story event IDs that have been completed */
  completedStoryEvents: string[];
  /** Most recently unlocked story event ID (used for messaging) */
  lastStoryEventUnlocked: string | null;
}

/**
 * Default narrative orchestration state.
 */
export const DEFAULT_NARRATIVE_ORCHESTRATION: NarrativeOrchestrationState = {
  kethaneumPuzzlesCompleted: 0,
  storyEventDebt: 0,
  storyEventsCompleted: 0,
  unlockedStoryEvents: [],
  completedStoryEvents: [],
  lastStoryEventUnlocked: null
};
