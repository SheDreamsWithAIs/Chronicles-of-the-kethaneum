/**
 * Story Event Trigger Checker
 * 
 * Centralized utility for checking story events against game state transitions.
 * Automatically checks all loaded story events after puzzle completion to determine
 * which events should trigger based on their triggerCondition strings.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Indexes events by story beat for O(1) filtering
 * - Only checks events relevant to current story beat
 * - Pre-compiles regex patterns for faster matching
 * - Early exits when conditions can't match
 */

import type { GameState } from '@/lib/game/state';
import type { StoryBeat } from './types';
import { dialogueManager } from './DialogueManager';
import { defaultPuzzleSelectionConfig } from '@/lib/game/puzzleSelectionConfig';

interface IndexedEvent {
  eventId: string;
  triggerCondition: string;
  storyBeat?: StoryBeat;
}

/**
 * Event index for fast lookups
 * Built once when events are loaded, reused for all checks
 */
class EventIndex {
  // Index by story beat - only check events for current beat
  private byBeat: Map<StoryBeat | 'any', IndexedEvent[]> = new Map();
  
  // Index by trigger pattern type for faster filtering
  private byPattern: Map<string, IndexedEvent[]> = new Map();
  
  // All events (fallback)
  private allEvents: IndexedEvent[] = [];
  
  // Pre-compiled regex patterns
  private static readonly PATTERNS = {
    puzzleMilestone: /^puzzle-milestone-(\d+)$/,
    kethaneumMilestone: /^kethaneum-puzzle-milestone-(\d+)$/,
    booksComplete: /^books-complete-(\d+)$/,
    kethaneumBook: /^kethaneum-book-complete-(.+)$/,
  };
  
  /**
   * Build index from all loaded events
   * Call this once after events are loaded
   */
  buildIndex(): void {
    this.byBeat.clear();
    this.byPattern.clear();
    this.allEvents = [];
    
    const allEvents = dialogueManager.getAllStoryEvents();
    
    for (const [eventId, eventData] of allEvents.entries()) {
      const triggerCondition = eventData.storyEvent?.triggerCondition;
      if (!triggerCondition) continue;
      
      const indexedEvent: IndexedEvent = {
        eventId,
        triggerCondition,
        storyBeat: eventData.storyEvent?.storyBeat,
      };
      
      this.allEvents.push(indexedEvent);
      
      // Index by story beat
      const beat = indexedEvent.storyBeat || 'any';
      if (!this.byBeat.has(beat)) {
        this.byBeat.set(beat, []);
      }
      this.byBeat.get(beat)!.push(indexedEvent);
      
      // Index by pattern type (for potential future optimization)
      const patternType = this.getPatternType(triggerCondition);
      if (!this.byPattern.has(patternType)) {
        this.byPattern.set(patternType, []);
      }
      this.byPattern.get(patternType)!.push(indexedEvent);
    }
    
  }
  
  /**
   * Get events relevant to current story beat
   * Much faster than checking all events
   */
  getEventsForBeat(beat: StoryBeat): IndexedEvent[] {
    const events: IndexedEvent[] = [];
    
    // Get events for this specific beat
    const beatEvents = this.byBeat.get(beat) || [];
    events.push(...beatEvents);
    
    // Get events without beat restriction (available for any beat)
    const anyBeatEvents = this.byBeat.get('any') || [];
    events.push(...anyBeatEvents);
    
    return events;
  }
  
  /**
   * Determine pattern type for indexing
   */
  private getPatternType(triggerCondition: string): string {
    if (triggerCondition === 'first-puzzle-complete') return 'first-puzzle';
    if (triggerCondition === 'first-kethaneum-puzzle-complete') return 'first-kethaneum-puzzle';
    if (triggerCondition === 'first-book-complete') return 'first-book';
    if (EventIndex.PATTERNS.puzzleMilestone.test(triggerCondition)) return 'puzzle-milestone';
    if (EventIndex.PATTERNS.kethaneumMilestone.test(triggerCondition)) return 'kethaneum-milestone';
    if (EventIndex.PATTERNS.booksComplete.test(triggerCondition)) return 'books-complete';
    if (EventIndex.PATTERNS.kethaneumBook.test(triggerCondition)) return 'kethaneum-book';
    return 'other';
  }
  
  /**
   * Get pre-compiled regex patterns
   */
  static getPatterns() {
    return EventIndex.PATTERNS;
  }
}

// Singleton index instance
let eventIndex: EventIndex | null = null;
let indexBuilt = false;

export class StoryEventTriggerChecker {
  /**
   * Initialize the event index (call once after events are loaded)
   */
  static initializeIndex(): void {
    if (!indexBuilt) {
      eventIndex = new EventIndex();
      eventIndex.buildIndex();
      indexBuilt = true;
    }
  }
  
  /**
   * Rebuild index (call if events are reloaded)
   */
  static rebuildIndex(): void {
    indexBuilt = false;
    eventIndex = null;
    this.initializeIndex();
  }
  
  /**
   * Check all loaded story events against current state transitions
   * Returns array of event IDs that should trigger
   * 
   * OPTIMIZED: Only checks events for current story beat
   */
  static checkAvailableEvents(
    currentState: GameState,
    previousState?: GameState
  ): string[] {
    // Ensure index is built
    if (!indexBuilt) {
      this.initializeIndex();
    }
    
    if (!eventIndex) {
      console.warn('[StoryEventTriggerChecker] Event index not initialized');
      return [];
    }
    
    const triggeredEvents: string[] = [];
    const currentBeat = currentState.storyProgress?.currentStoryBeat || 'hook';
    
    // OPTIMIZATION: Only check events relevant to current beat
    // This reduces checks from ~50 to ~5-10 events typically
    const relevantEvents = eventIndex.getEventsForBeat(currentBeat);
    
    // Early exit if no relevant events
    if (relevantEvents.length === 0) {
      return [];
    }
    
    // Check only relevant events
    for (const indexedEvent of relevantEvents) {
      // Check if trigger condition matches state transition
      if (this.matchesTriggerCondition(
        indexedEvent.triggerCondition,
        currentState,
        previousState
      )) {
        triggeredEvents.push(indexedEvent.eventId);
      }
    }
    
    return triggeredEvents;
  }

  /**
   * Check which events are currently available based on current state (not transitions)
   * Used for page load checks - verifies if trigger conditions are currently satisfied
   * 
   * OPTIMIZED: Only checks events for current story beat
   */
  static checkCurrentlyAvailableEvents(
    currentState: GameState
  ): string[] {
    // Ensure index is built
    if (!indexBuilt) {
      this.initializeIndex();
    }
    
    if (!eventIndex) {
      console.warn('[StoryEventTriggerChecker] Event index not initialized');
      return [];
    }
    
    const availableEvents: string[] = [];
    const currentBeat = currentState.storyProgress?.currentStoryBeat || 'hook';
    
    // OPTIMIZATION: Only check events relevant to current beat
    const relevantEvents = eventIndex.getEventsForBeat(currentBeat);
    
    // Early exit if no relevant events
    if (relevantEvents.length === 0) {
      return [];
    }
    
    // Check only relevant events
    for (const indexedEvent of relevantEvents) {
      // Check if trigger condition is currently satisfied (not a transition check)
      const isSatisfied = this.isTriggerConditionCurrentlySatisfied(
        indexedEvent.triggerCondition,
        currentState
      );
      
      if (isSatisfied) {
        availableEvents.push(indexedEvent.eventId);
        // Trigger satisfied
      } else {
        // Trigger not satisfied
      }
    }
    
    
    return availableEvents;
  }
  
  /**
   * Check if a trigger condition string matches current state transition
   * Uses pre-compiled regex patterns for better performance
   */
  private static matchesTriggerCondition(
    triggerCondition: string,
    currentState: GameState,
    previousState?: GameState
  ): boolean {
    const patterns = EventIndex.getPatterns();
    
    // Pattern: "first-puzzle-complete"
    if (triggerCondition === 'first-puzzle-complete') {
      return currentState.completedPuzzles === 1 && 
             (!previousState || previousState.completedPuzzles === 0);
    }
    
    // Pattern: "puzzle-milestone-{N}"
    const milestoneMatch = triggerCondition.match(patterns.puzzleMilestone);
    if (milestoneMatch) {
      const milestone = parseInt(milestoneMatch[1], 10);
      return currentState.completedPuzzles >= milestone &&
             (!previousState || previousState.completedPuzzles < milestone);
    }
    
    // Pattern: "first-kethaneum-puzzle-complete"
    if (triggerCondition === 'first-kethaneum-puzzle-complete') {
      const kethaneumGenre = defaultPuzzleSelectionConfig.kethaneumGenreName;
      const currentKethaneum = currentState.completedPuzzlesByGenre?.[kethaneumGenre]?.size || 0;
      const prevKethaneum = previousState?.completedPuzzlesByGenre?.[kethaneumGenre]?.size || 0;
      return currentKethaneum === 1 && prevKethaneum === 0;
    }
    
    // Pattern: "kethaneum-puzzle-milestone-{N}"
    const kethaneumMilestoneMatch = triggerCondition.match(patterns.kethaneumMilestone);
    if (kethaneumMilestoneMatch) {
      const milestone = parseInt(kethaneumMilestoneMatch[1], 10);
      const kethaneumGenre = defaultPuzzleSelectionConfig.kethaneumGenreName;
      const currentKethaneum = currentState.completedPuzzlesByGenre?.[kethaneumGenre]?.size || 0;
      const prevKethaneum = previousState?.completedPuzzlesByGenre?.[kethaneumGenre]?.size || 0;
      return currentKethaneum >= milestone && prevKethaneum < milestone;
    }
    
    // Pattern: "first-book-complete" (any book, not just Kethaneum)
    if (triggerCondition === 'first-book-complete') {
      return currentState.completedBooks === 1 &&
             (!previousState || previousState.completedBooks === 0);
    }
    
    // Pattern: "books-complete-{N}" (milestone for overall books completed)
    const booksCompleteMatch = triggerCondition.match(patterns.booksComplete);
    if (booksCompleteMatch) {
      const milestone = parseInt(booksCompleteMatch[1], 10);
      return currentState.completedBooks >= milestone &&
             (!previousState || previousState.completedBooks < milestone);
    }
    
    // Pattern: "kethaneum-book-complete-{bookTitle}"
    const kethaneumBookMatch = triggerCondition.match(patterns.kethaneumBook);
    if (kethaneumBookMatch) {
      const bookTitle = kethaneumBookMatch[1];
      // Check if all puzzles in this Kethaneum book are completed
      const kethaneumGenre = defaultPuzzleSelectionConfig.kethaneumGenreName;
      const kethaneumPuzzles = currentState.puzzles?.[kethaneumGenre] || [];
      const completedKethaneum = currentState.completedPuzzlesByGenre?.[kethaneumGenre] || new Set();
      
      // Find all puzzles for this book
      const bookPuzzles = kethaneumPuzzles.filter(p => p.book === bookTitle);
      // Check if all puzzles in this book are completed
      const allCompleted = bookPuzzles.length > 0 && 
                           bookPuzzles.every(p => completedKethaneum.has(p.title));
      const prevAllCompleted = previousState 
        ? (() => {
            const prevKethaneumPuzzles = previousState.puzzles?.[kethaneumGenre] || [];
            const prevCompletedKethaneum = previousState.completedPuzzlesByGenre?.[kethaneumGenre] || new Set();
            const prevBookPuzzles = prevKethaneumPuzzles.filter(p => p.book === bookTitle);
            return prevBookPuzzles.length > 0 && 
                   prevBookPuzzles.every(p => prevCompletedKethaneum.has(p.title));
          })()
        : false;
      
      return allCompleted && !prevAllCompleted;
    }
    
    // Context-specific triggers (should be checked manually)
    // "player-enters-library-first-time" - checked in library page
    
    return false;
  }

  /**
   * Check if a trigger condition is currently satisfied (not a transition check)
   * Used for page load checks to see if events should be available
   */
  private static isTriggerConditionCurrentlySatisfied(
    triggerCondition: string,
    currentState: GameState
  ): boolean {
    const patterns = EventIndex.getPatterns();
    
    // Pattern: "first-puzzle-complete" - check if exactly 1 puzzle completed
    if (triggerCondition === 'first-puzzle-complete') {
      return currentState.completedPuzzles === 1;
    }
    
    // Pattern: "puzzle-milestone-{N}" - check if milestone reached
    const milestoneMatch = triggerCondition.match(patterns.puzzleMilestone);
    if (milestoneMatch) {
      const milestone = parseInt(milestoneMatch[1], 10);
      return currentState.completedPuzzles >= milestone;
    }
    
    // Pattern: "first-kethaneum-puzzle-complete" - check if exactly 1 Kethaneum puzzle completed
    if (triggerCondition === 'first-kethaneum-puzzle-complete') {
      const kethaneumGenre = defaultPuzzleSelectionConfig.kethaneumGenreName;
      const completedKethaneum = currentState.completedPuzzlesByGenre?.[kethaneumGenre];
      const currentKethaneum = completedKethaneum?.size || 0;
      const result = currentKethaneum === 1;
      
      // Checking first-kethaneum-puzzle-complete
      {
        kethaneumGenre,
        completedKethaneum: completedKethaneum ? Array.from(completedKethaneum) : 'undefined',
        currentKethaneum,
        result,
      });
      
      return result;
    }
    
    // Pattern: "kethaneum-puzzle-milestone-{N}" - check if milestone reached
    const kethaneumMilestoneMatch = triggerCondition.match(patterns.kethaneumMilestone);
    if (kethaneumMilestoneMatch) {
      const milestone = parseInt(kethaneumMilestoneMatch[1], 10);
      const kethaneumGenre = defaultPuzzleSelectionConfig.kethaneumGenreName;
      const currentKethaneum = currentState.completedPuzzlesByGenre?.[kethaneumGenre]?.size || 0;
      return currentKethaneum >= milestone;
    }
    
    // Pattern: "first-book-complete" - check if exactly 1 book completed
    if (triggerCondition === 'first-book-complete') {
      return currentState.completedBooks === 1;
    }
    
    // Pattern: "books-complete-{N}" - check if milestone reached
    const booksCompleteMatch = triggerCondition.match(patterns.booksComplete);
    if (booksCompleteMatch) {
      const milestone = parseInt(booksCompleteMatch[1], 10);
      return currentState.completedBooks >= milestone;
    }
    
    // Pattern: "kethaneum-book-complete-{bookTitle}" - check if all puzzles in book completed
    const kethaneumBookMatch = triggerCondition.match(patterns.kethaneumBook);
    if (kethaneumBookMatch) {
      const bookTitle = kethaneumBookMatch[1];
      const kethaneumGenre = defaultPuzzleSelectionConfig.kethaneumGenreName;
      const kethaneumPuzzles = currentState.puzzles?.[kethaneumGenre] || [];
      const completedKethaneum = currentState.completedPuzzlesByGenre?.[kethaneumGenre] || new Set();
      
      // Find all puzzles for this book
      const bookPuzzles = kethaneumPuzzles.filter(p => p.book === bookTitle);
      // Check if all puzzles in this book are completed
      return bookPuzzles.length > 0 && 
             bookPuzzles.every(p => completedKethaneum.has(p.title));
    }
    
    // Pattern: "player-enters-library-first-time" - check if Library not visited yet
    if (triggerCondition === 'player-enters-library-first-time') {
      return !currentState.dialogue?.hasVisitedLibrary;
    }
    
    return false;
  }
}
