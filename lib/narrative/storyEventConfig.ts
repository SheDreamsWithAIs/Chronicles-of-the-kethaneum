/**
 * Configuration for story event unlocking and narrative orchestration.
 *
 * This file defines:
 * - Story event unlock requirements (Kethaneum + normal puzzle thresholds)
 * - Narrative orchestration configuration (intervals, debt threshold, messaging)
 */

export interface StoryEventUnlockRequirement {
  /** Story event ID - must match the 'id' field in story-events/*.json */
  eventId: string;
  /** Number of Kethaneum puzzles required to unlock this event */
  requiredKethaneumPuzzles: number;
  /** Number of normal (non-Kethaneum) puzzles required to unlock this event */
  requiredNormalPuzzles: number;
  /** Sequential order of this event (1, 2, 3...) - events unlock in order */
  order: number;
}

/**
 * Story event unlock requirements.
 * Events unlock ONE AT A TIME in sequential order when thresholds are met.
 * Each unlock increments the debt counter.
 *
 * Alpha build target: 5 story events total
 */
export const STORY_EVENT_UNLOCK_REQUIREMENTS: StoryEventUnlockRequirement[] = [
  {
    eventId: "first-visit",             // Tutorial event, appears early
    requiredKethaneumPuzzles: 0,        // No Kethaneum required
    requiredNormalPuzzles: 0,           // No normal puzzles required (unlocked immediately)
    order: 1
  },
  {
    eventId: "second-encounter",
    requiredKethaneumPuzzles: 1,        // After completing 1 Kethaneum puzzle
    requiredNormalPuzzles: 7,           // After completing 7 normal puzzles
    order: 2
  },
  {
    eventId: "pattern-recognition",
    requiredKethaneumPuzzles: 2,        // After completing 2 Kethaneum puzzles
    requiredNormalPuzzles: 15,          // After completing 15 normal puzzles
    order: 3
  },
  {
    eventId: "midpoint-revelation",
    requiredKethaneumPuzzles: 3,        // After completing 3 Kethaneum puzzles
    requiredNormalPuzzles: 22,          // After completing 22 normal puzzles
    order: 4
  },
  {
    eventId: "climactic-understanding",
    requiredKethaneumPuzzles: 4,        // After completing 4 Kethaneum puzzles
    requiredNormalPuzzles: 30,          // After completing 30 normal puzzles
    order: 5
  }
];

export interface NarrativeOrchestrationConfig {
  /** Kethaneum puzzle insertion interval */
  kethaneumPuzzleInterval: {
    /** Minimum number of normal puzzles between Kethaneum puzzles */
    min: number;
    /** Maximum number of normal puzzles between Kethaneum puzzles */
    max: number;
  };
  /** Maximum number of uncompleted story events before gating Kethaneum puzzles */
  storyEventDebtThreshold: number;
  /** Whether to show narrative debt messages in win modal */
  enableMessaging: boolean;
  /** Message text for different debt levels */
  messageTypes: {
    /** Message when debt = 1 (one uncompleted story event) */
    debtOne: string;
    /** Message when debt >= 2 (threshold reached, Kethaneum puzzles blocked) */
    debtThreshold: string;
  };
}

/**
 * Default narrative orchestration configuration.
 * Can be overridden per game mode or via settings.
 */
export const DEFAULT_NARRATIVE_CONFIG: NarrativeOrchestrationConfig = {
  kethaneumPuzzleInterval: {
    min: 5,
    max: 7
  },
  storyEventDebtThreshold: 2,
  enableMessaging: true,
  messageTypes: {
    debtOne: "Something is drawing you to seek out other information",
    debtThreshold: "The energy of the Kethaneum feels urgent like it is drawing your attention elsewhere."
  }
};

/**
 * Gets the next story event that should unlock based on completion order.
 * Returns null if no more events are available.
 */
export function getNextStoryEventRequirement(
  completedEventIds: string[],
  unlockedEventIds: string[]
): StoryEventUnlockRequirement | null {
  // Filter out already completed or unlocked events
  const availableEvents = STORY_EVENT_UNLOCK_REQUIREMENTS
    .filter(req => !completedEventIds.includes(req.eventId))
    .filter(req => !unlockedEventIds.includes(req.eventId))
    .sort((a, b) => a.order - b.order);

  return availableEvents.length > 0 ? availableEvents[0] : null;
}

/**
 * Validates that story event unlock requirements are properly ordered.
 * Throws error if order numbers are duplicated or non-sequential.
 */
export function validateStoryEventConfig(): void {
  const orders = STORY_EVENT_UNLOCK_REQUIREMENTS.map(req => req.order);
  const uniqueOrders = new Set(orders);

  if (orders.length !== uniqueOrders.size) {
    throw new Error("Story event unlock requirements have duplicate order numbers");
  }

  const sortedOrders = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i] !== i + 1) {
      throw new Error(`Story event unlock requirements have non-sequential order numbers. Expected ${i + 1}, got ${sortedOrders[i]}`);
    }
  }
}

// Validate configuration on module load (development safety)
if (process.env.NODE_ENV === 'development') {
  validateStoryEventConfig();
}
