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
 */
export const STORY_EVENT_UNLOCK_REQUIREMENTS: StoryEventUnlockRequirement[] = [
  {
    eventId: "first-visit",
    requiredKethaneumPuzzles: 1,
    requiredNormalPuzzles: 7,
    order: 1
  },
  {
    eventId: "first-kethaneum-puzzle",
    requiredKethaneumPuzzles: 2,
    requiredNormalPuzzles: 10,
    order: 2
  }
  // Add more story events here as they are created
  // Example:
  // {
  //   eventId: "midpoint-revelation",
  //   requiredKethaneumPuzzles: 3,
  //   requiredNormalPuzzles: 15,
  //   order: 3
  // }
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
    /** Message when a story event has just unlocked (debt just increased) */
    debtZero: string;
    /** Message when player has skipped one story event */
    debtOne: string;
    /** Message when debt threshold is reached (Kethaneum puzzles blocked) */
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
    debtZero: "Something important vies for your attention",
    debtOne: "Something is drawing you to seek out other information",
    debtThreshold: "The energy of the Kethaneum feels urgent, yet you feel a stagnation. Perhaps you should look elsewhere for answers."
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
