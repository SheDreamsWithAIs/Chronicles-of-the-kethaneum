/**
 * Story Event Unlock Checker
 *
 * Handles the logic for unlocking story events based on puzzle completion thresholds.
 * Story events unlock ONE AT A TIME in sequential order.
 */

import { GameState } from '@/lib/game/state';
import {
  STORY_EVENT_UNLOCK_REQUIREMENTS,
  getNextStoryEventRequirement
} from './storyEventConfig';

export interface StoryEventUnlockResult {
  /** The story event ID that was unlocked */
  eventId: string;
  /** Whether the event was successfully unlocked */
  wasUnlocked: boolean;
  /** Optional reason for unlock success/failure (for debugging) */
  reason?: string;
}

/**
 * Checks if any story events should be unlocked based on current puzzle completion.
 * Story events unlock ONE AT A TIME in sequential order.
 *
 * @param state - Current game state
 * @returns The next story event to unlock, or null if none qualify
 */
export function checkStoryEventUnlock(state: GameState): StoryEventUnlockResult | null {
  const {
    completedPuzzles,
    narrativeOrchestration
  } = state;

  if (!narrativeOrchestration) {
    // Narrative orchestration not initialized (shouldn't happen in production)
    return null;
  }

  const {
    kethaneumPuzzlesCompleted,
    unlockedStoryEvents,
    completedStoryEvents
  } = narrativeOrchestration;

  // Calculate normal puzzle count (total puzzles - Kethaneum puzzles)
  const normalPuzzlesCompleted = completedPuzzles - kethaneumPuzzlesCompleted;

  // Get the next story event in sequence that hasn't been unlocked or completed
  const nextEventRequirement = getNextStoryEventRequirement(
    completedStoryEvents,
    unlockedStoryEvents
  );

  if (!nextEventRequirement) {
    // No more story events to unlock
    return null;
  }

  // Check if requirements are met
  const meetsKethaneumReq = kethaneumPuzzlesCompleted >= nextEventRequirement.requiredKethaneumPuzzles;
  const meetsNormalReq = normalPuzzlesCompleted >= nextEventRequirement.requiredNormalPuzzles;

  if (meetsKethaneumReq && meetsNormalReq) {
    return {
      eventId: nextEventRequirement.eventId,
      wasUnlocked: true,
      reason: `Met requirements: ${kethaneumPuzzlesCompleted}/${nextEventRequirement.requiredKethaneumPuzzles} Kethaneum, ${normalPuzzlesCompleted}/${nextEventRequirement.requiredNormalPuzzles} normal`
    };
  }

  // Requirements not met yet
  return null;
}

/**
 * Marks a story event as unlocked (increments debt).
 * This adds the event to the unlocked list and increases the debt counter.
 *
 * @param state - Current game state
 * @param eventId - Story event ID to unlock
 * @returns Updated game state with event unlocked
 */
export function unlockStoryEvent(state: GameState, eventId: string): GameState {
  if (!state.narrativeOrchestration) {
    console.error('Cannot unlock story event: narrativeOrchestration not initialized');
    return state;
  }

  // Check if already unlocked or completed
  if (state.narrativeOrchestration.unlockedStoryEvents.includes(eventId)) {
    console.warn(`Story event ${eventId} is already unlocked`);
    return state;
  }

  if (state.narrativeOrchestration.completedStoryEvents.includes(eventId)) {
    console.warn(`Story event ${eventId} is already completed`);
    return state;
  }

  return {
    ...state,
    narrativeOrchestration: {
      ...state.narrativeOrchestration,
      storyEventDebt: state.narrativeOrchestration.storyEventDebt + 1,
      unlockedStoryEvents: [
        ...state.narrativeOrchestration.unlockedStoryEvents,
        eventId
      ],
      lastStoryEventUnlocked: eventId
    }
  };
}

/**
 * Marks a story event as completed (decrements debt).
 * This moves the event from unlocked to completed and decreases the debt counter.
 *
 * @param state - Current game state
 * @param eventId - Story event ID that was completed
 * @returns Updated game state with event completed
 */
export function completeStoryEvent(state: GameState, eventId: string): GameState {
  console.log(`[completeStoryEvent] Called with eventId: ${eventId}`);
  console.log(`[completeStoryEvent] narrativeOrchestration:`, state.narrativeOrchestration);

  if (!state.narrativeOrchestration) {
    console.error('[completeStoryEvent] Cannot complete story event: narrativeOrchestration not initialized');
    return state;
  }

  // Check if event is in unlocked list
  const unlockedEvents = state.narrativeOrchestration.unlockedStoryEvents;
  console.log(`[completeStoryEvent] unlockedEvents:`, unlockedEvents);
  console.log(`[completeStoryEvent] Checking if '${eventId}' is in unlocked list:`, unlockedEvents.includes(eventId));

  if (!unlockedEvents.includes(eventId)) {
    console.warn(`[completeStoryEvent] Story event '${eventId}' is not in unlocked list [${unlockedEvents.join(', ')}], cannot complete`);
    return state;
  }

  // Check if already completed
  const completedEvents = state.narrativeOrchestration.completedStoryEvents;
  console.log(`[completeStoryEvent] completedEvents:`, completedEvents);

  if (completedEvents.includes(eventId)) {
    console.warn(`[completeStoryEvent] Story event ${eventId} is already completed`);
    return state;
  }

  const oldDebt = state.narrativeOrchestration.storyEventDebt;
  const newDebt = Math.max(0, oldDebt - 1);

  console.log(`[completeStoryEvent] Updating state - debt: ${oldDebt} -> ${newDebt}`);

  const newState = {
    ...state,
    narrativeOrchestration: {
      ...state.narrativeOrchestration,
      storyEventDebt: newDebt,
      unlockedStoryEvents: unlockedEvents.filter(id => id !== eventId),
      completedStoryEvents: [...completedEvents, eventId],
      storyEventsCompleted: state.narrativeOrchestration.storyEventsCompleted + 1
    },
    // Also add to dialogue.completedStoryEvents for backwards compatibility
    dialogue: {
      ...state.dialogue,
      completedStoryEvents: [
        ...(state.dialogue?.completedStoryEvents || []),
        eventId
      ]
    }
  };

  console.log(`[completeStoryEvent] New state narrativeOrchestration:`, newState.narrativeOrchestration);
  return newState;
}

/**
 * Gets debug info about story event unlock status.
 * Useful for development and troubleshooting.
 */
export function getStoryEventDebugInfo(state: GameState): {
  normalPuzzlesCompleted: number;
  kethaneumPuzzlesCompleted: number;
  storyEventDebt: number;
  nextEventRequirement: any;
  meetsRequirements: boolean;
} {
  if (!state.narrativeOrchestration) {
    return {
      normalPuzzlesCompleted: 0,
      kethaneumPuzzlesCompleted: 0,
      storyEventDebt: 0,
      nextEventRequirement: null,
      meetsRequirements: false
    };
  }

  const normalPuzzlesCompleted = state.completedPuzzles - state.narrativeOrchestration.kethaneumPuzzlesCompleted;
  const nextEventRequirement = getNextStoryEventRequirement(
    state.narrativeOrchestration.completedStoryEvents,
    state.narrativeOrchestration.unlockedStoryEvents
  );

  const meetsRequirements = nextEventRequirement
    ? (state.narrativeOrchestration.kethaneumPuzzlesCompleted >= nextEventRequirement.requiredKethaneumPuzzles &&
       normalPuzzlesCompleted >= nextEventRequirement.requiredNormalPuzzles)
    : false;

  return {
    normalPuzzlesCompleted,
    kethaneumPuzzlesCompleted: state.narrativeOrchestration.kethaneumPuzzlesCompleted,
    storyEventDebt: state.narrativeOrchestration.storyEventDebt,
    nextEventRequirement,
    meetsRequirements
  };
}
