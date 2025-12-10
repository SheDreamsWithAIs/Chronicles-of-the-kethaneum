/**
 * DialogueManager for Chronicles of the Kethaneum
 * Handles character banter and story event dialogue systems
 * Converted to TypeScript for Next.js integration
 */

import { fetchAsset } from '@/lib/utils/assetPath';
import type { GameState } from '@/lib/game/state';
import { StoryEventTriggerChecker } from './StoryEventTriggerChecker';
import type {
  StoryBeat,
  LoadingGroup,
  CharacterData,
  BanterDialogue,
  DialogueConfig,
  BanterResult,
  CharacterAvailability,
  AvailableCharactersResult,
  DialogueManagerStatus,
} from './types';

export class DialogueManager {
  private config: DialogueConfig | null = null;
  private characters: Map<string, CharacterData> = new Map();
  private storyEvents: Map<string, any> = new Map();
  private loadedGroups: Set<LoadingGroup> = new Set();
  private recentlyUsedCharacters: Set<string> = new Set();
  private currentStoryBeat: StoryBeat = 'hook';
  private isInitialized: boolean = false;

  /**
   * Simple event emission for UI integration
   */
  private emit(eventName: string, data: any): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent(`dialogueManager:${eventName}`, {
      detail: data,
    });
    document.dispatchEvent(event);
  }

  /**
   * Initialize the dialogue system
   */
  async initialize(): Promise<boolean> {
    try {
      // Load configuration first
      await this.loadConfiguration();

      // Load initial character groups
      await this.loadCharacterGroup('introduction_characters');

      // Load story events
      await this.loadStoryEvents();

      this.isInitialized = true;
      return true;
    } catch (error) {
      this.handleError('initialization', error);
      return false;
    }
  }

  /**
   * Load dialogue configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const response = await fetchAsset('/data/dialogue-config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }

      this.config = await response.json();
    } catch (error) {
      console.error('Error loading dialogue configuration:', error);
      // Use fallback configuration
      this.config = this.getFallbackConfig();
    }
  }

  /**
   * Get fallback configuration if main config fails to load
   */
  private getFallbackConfig(): DialogueConfig {
    return {
      system: {
        version: '1.0.0',
        enableLogging: true,
        fallbackOnError: true,
      },
      paths: {
        charactersDirectory: '/data/characters/',
        storyEventsDirectory: '/data/story-events/',
        characterPortraitsDirectory: '/images/portraits/',
      },
      storyStructure: {
        storyBeats: {
          HOOK: 'hook',
          FIRST_PLOT_POINT: 'first_plot_point',
          FIRST_PINCH_POINT: 'first_pinch_point',
          MIDPOINT: 'midpoint',
          SECOND_PINCH_POINT: 'second_pinch_point',
          SECOND_PLOT_POINT: 'second_plot_point',
          CLIMAX: 'climax',
          RESOLUTION: 'resolution',
        },
        defaultStoryBeat: 'hook',
        enableSeasonalDialogue: false,
        characterRetirement: {
          introduction_characters: 'never',
          regular_contacts: 'never',
          essential_library_staff: 'never',
          extended_library_staff: 'never',
          long_term_scholars: 'never',
          visiting_scholars: 'second_plot_point',
          visiting_dignitaries: 'resolution',
          knowledge_contributors: 'midpoint',
          special_event_characters: 'never',
        },
      },
      behavior: {
        banterSelection: {
          method: 'random',
          avoidRepeats: true,
          resetAfterAllSeen: true,
          recentAvoidanceWindow: 3,
        },
        storyEvents: {
          triggerMethod: 'external',
          autoAdvanceDelay: 0,
          allowSkipping: true,
        },
        errorHandling: {
          missingCharacterAction: 'useDefault',
          missingStoryAction: 'skipGracefully',
          corruptFileAction: 'logAndContinue',
        },
      },
      display: {
        textLimits: {
          mobile: {
            maxCharsPerScreen: 120,
            estimatedWordsPerScreen: 20,
          },
          tablet: {
            maxCharsPerScreen: 200,
            estimatedWordsPerScreen: 35,
          },
          desktop: {
            maxCharsPerScreen: 300,
            estimatedWordsPerScreen: 50,
          },
        },
        animationSettings: {
          textRevealSpeed: 'medium',
          panelTransitionDuration: 500,
          characterPortraitFadeTime: 300,
        },
      },
    };
  }

  /**
   * Load characters from a specific loading group
   */
  async loadCharacterGroup(groupName: LoadingGroup): Promise<void> {
    if (this.loadedGroups.has(groupName)) {
      return;
    }

    try {
      // Load character manifest to discover available files
      const filenames = await this.loadCharacterManifest();

      // Load each file and check if it belongs to this group
      for (const filename of filenames) {
        try {
          const characterData = await this.loadAndValidateCharacterFile(filename);
          if (characterData && characterData.character.loadingGroup === groupName) {
            // Store character data
            this.characters.set(characterData.character.id, characterData);
          }
        } catch (error) {
          this.handleError('character-file-loading', error);
        }
      }

      this.loadedGroups.add(groupName);
    } catch (error) {
      this.handleError('character-loading', error);
    }
  }

  /**
   * Load the character manifest file
   */
  private async loadCharacterManifest(): Promise<string[]> {
    try {
      if (!this.config) {
        throw new Error('Configuration not loaded');
      }

      const manifestPath = this.config.paths.charactersDirectory + 'character-manifest.json';
      const response = await fetchAsset(manifestPath);

      if (!response.ok) {
        throw new Error(`Failed to load character manifest: ${response.status}`);
      }

      const filenames = await response.json();

      // Validate manifest is an array
      if (!Array.isArray(filenames)) {
        throw new Error('Invalid manifest structure: expected array of filenames');
      }

      return filenames;
    } catch (error) {
      this.handleError('manifest-loading', error);
      // Return fallback array for our existing character
      return ['archivist-lumina.json'];
    }
  }

  /**
   * Load and validate a character file
   */
  private async loadAndValidateCharacterFile(filename: string): Promise<CharacterData | null> {
    try {
      if (!this.config) {
        throw new Error('Configuration not loaded');
      }

      const basePath = this.config.paths.charactersDirectory;
      const response = await fetchAsset(`${basePath}${filename}`);

      if (!response.ok) {
        throw new Error(`Failed to load character file: ${response.status}`);
      }

      const characterData = await response.json();

      // Validate character data structure
      if (!this.validateCharacterData(characterData)) {
        throw new Error(`Invalid character data structure in ${filename}`);
      }

      return characterData;
    } catch (error) {
      this.handleError('character-file-loading', error);
      return null;
    }
  }

  /**
   * Validate character data structure
   */
  private validateCharacterData(characterData: any): characterData is CharacterData {
    if (!characterData || typeof characterData !== 'object') {
      return false;
    }

    const character = characterData.character;
    if (!character || !character.id || !character.name) {
      return false;
    }

    const dialogue = characterData.banterDialogue;
    if (!Array.isArray(dialogue)) {
      return false;
    }

    // Validate each dialogue entry has required fields
    for (const entry of dialogue) {
      if (!entry.id || !entry.text || !Array.isArray(entry.emotion)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load all story events from the story-events directory
   */
  private async loadStoryEvents(): Promise<void> {
    try {
      if (!this.config) {
        throw new Error('Configuration not loaded');
      }

      // Load story event manifest
      const eventFiles = await this.loadStoryEventManifest();

      // Load each story event file
      for (const filename of eventFiles) {
        const storyEvent = await this.loadAndValidateStoryEventFile(filename);
        if (storyEvent && storyEvent.storyEvent?.id) {
          this.storyEvents.set(storyEvent.storyEvent.id, storyEvent);
        }
      }


      // Initialize story event trigger checker index for performance
      // This indexes events by story beat so we only check relevant events
      if (typeof window !== 'undefined') {
        // Dynamic import to avoid circular dependency
        import('./StoryEventTriggerChecker').then(({ StoryEventTriggerChecker }) => {
          StoryEventTriggerChecker.initializeIndex();
        });
      }

      // Emit event that story events are loaded
      this.emit('storyEventsLoaded', {
        count: this.storyEvents.size,
        eventIds: Array.from(this.storyEvents.keys()),
      });
    } catch (error) {
      this.handleError('story-events-loading', error);
    }
  }

  /**
   * Load story event manifest (list of event files)
   */
  private async loadStoryEventManifest(): Promise<string[]> {
    try {
      if (!this.config) {
        throw new Error('Configuration not loaded');
      }

      const manifestPath = this.config.paths.storyEventsDirectory + 'event-manifest.json';
      const response = await fetchAsset(manifestPath);

      if (!response.ok) {
        // If no manifest, try to load known events directly
        console.warn('[DialogueManager] No story event manifest found, loading default events');
        return ['first-visit.json'];
      }

      const filenames = await response.json();

      if (!Array.isArray(filenames)) {
        throw new Error('Invalid manifest structure: expected array of filenames');
      }

      return filenames;
    } catch (error) {
      this.handleError('story-event-manifest-loading', error);
      // Return default events
      return ['first-visit.json'];
    }
  }

  /**
   * Load and validate a story event file
   */
  private async loadAndValidateStoryEventFile(filename: string): Promise<any | null> {
    try {
      if (!this.config) {
        throw new Error('Configuration not loaded');
      }

      const basePath = this.config.paths.storyEventsDirectory;
      const response = await fetchAsset(`${basePath}${filename}`);

      if (!response.ok) {
        throw new Error(`Failed to load story event file: ${response.status}`);
      }

      const storyEventData = await response.json();

      // Validate story event data structure
      if (!this.validateStoryEventData(storyEventData)) {
        throw new Error(`Invalid story event data structure in ${filename}`);
      }

      return storyEventData;
    } catch (error) {
      this.handleError('story-event-file-loading', error);
      return null;
    }
  }

  /**
   * Validate story event data structure
   */
  private validateStoryEventData(eventData: any): boolean {
    if (!eventData || typeof eventData !== 'object') {
      return false;
    }

    const storyEvent = eventData.storyEvent;
    if (!storyEvent || !storyEvent.id || !storyEvent.title) {
      return false;
    }

    const dialogue = eventData.dialogue;
    if (!Array.isArray(dialogue) || dialogue.length === 0) {
      return false;
    }

    // Validate each dialogue entry has required fields
    for (const entry of dialogue) {
      if (!entry.speaker || !entry.text || typeof entry.sequence !== 'number') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get a story event by ID
   */
  getStoryEvent(eventId: string): any | null {
    return this.storyEvents.get(eventId) || null;
  }

  /**
   * Get character data by character ID
   */
  getCharacterById(characterId: string): CharacterData | null {
    return this.characters.get(characterId) || null;
  }

  /**
   * Get dialogue configuration
   */
  getConfig(): DialogueConfig | null {
    return this.config;
  }

  /**
   * Get first available story event
   * Checks trigger conditions and filters out completed events
   * Requires GameState to properly evaluate trigger conditions
   */
  getAvailableStoryEvent(currentState: GameState, completedEvents?: string[]): any | null {
    try {
      const availableEvents = this.getAvailableStoryEvents(currentState, completedEvents);
      
      if (availableEvents.length === 0) {
        return null;
      }

      // Return first available event (full StoryEvent object)
      const eventId = availableEvents[0];
      const event = this.getStoryEvent(eventId);
      
      // Validate that the returned event matches the requested ID
      if (!event) {
        throw new Error(`Story event not found: ${eventId}`);
      }
      
      const returnedEventId = event.storyEvent?.id;
      if (returnedEventId !== eventId) {
        throw new Error(
          `Event ID mismatch in getAvailableStoryEvent: requested '${eventId}' but got '${returnedEventId}'`
        );
      }
      
      return event;
    } catch (error) {
      console.error('[DialogueManager] Error in getAvailableStoryEvent:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Get all loaded story events
   * Used by StoryEventTriggerChecker to check against state
   */
  getAllStoryEvents(): Map<string, any> {
    return this.storyEvents;
  }

  /**
   * Check if DialogueManager is initialized
   */
  getInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if a story event should be triggered based on conditions
   * Returns the event ID if available, null otherwise
   */
  checkForAvailableStoryEvent(triggerCondition: string, currentBeat?: StoryBeat): string | null {
    for (const [eventId, eventData] of this.storyEvents.entries()) {
      const event = eventData.storyEvent;

      // Check if trigger condition matches
      if (event.triggerCondition === triggerCondition) {
        // Check if story beat matches (if specified)
        if (event.storyBeat && currentBeat && event.storyBeat !== currentBeat) {
          continue;
        }

        // Event is available - emit notification
        this.emit('storyEventAvailable', {
          eventId,
          title: event.title,
          triggerCondition,
          storyBeat: event.storyBeat,
        });

        return eventId;
      }
    }

    return null;
  }

  /**
   * Get all available story events for current conditions
   * Uses StoryEventTriggerChecker to verify trigger conditions are satisfied
   * Filters out completed events if provided
   */
  getAvailableStoryEvents(currentState: GameState, completedEvents?: string[]): string[] {
    try {
      // Use StoryEventTriggerChecker to get events that satisfy trigger conditions
      const triggerCheckedEvents = StoryEventTriggerChecker.checkCurrentlyAvailableEvents(currentState);
      
      // Validate completedEvents is an array if provided
      if (completedEvents !== undefined && !Array.isArray(completedEvents)) {
        console.error('[DialogueManager] completedEvents is not an array:', completedEvents);
        completedEvents = [];
      }

      // Filter out completed events if provided
      const filteredEvents = completedEvents && completedEvents.length > 0
        ? triggerCheckedEvents.filter((eventId) => !completedEvents.includes(eventId))
        : triggerCheckedEvents;

      // Filtered events (after removing completed)

      return filteredEvents;
    } catch (error) {
      console.error('[DialogueManager] Error in getAvailableStoryEvents:', error);
      return [];
    }
  }

  /**
   * Filter dialogue entries based on current story beat availability
   */
  private filterDialogueByStoryBeat(
    dialogueEntries: BanterDialogue[],
    currentStoryBeat: StoryBeat
  ): BanterDialogue[] {
    if (!Array.isArray(dialogueEntries)) {
      return [];
    }

    return dialogueEntries.filter((entry) => {
      // If no availableFrom specified, assume always available
      const availableFrom = entry.availableFrom || 'hook';
      // If no availableUntil specified, assume available indefinitely
      const availableUntil = entry.availableUntil;

      // Check if current story beat meets the availability window
      return this.isStoryBeatInRange(currentStoryBeat, availableFrom, availableUntil);
    });
  }

  /**
   * Check if current story beat falls within availability range
   */
  private isStoryBeatInRange(
    currentBeat: StoryBeat,
    availableFrom: StoryBeat,
    availableUntil?: StoryBeat
  ): boolean {
    if (!this.config) return false;

    // Story beat order from config
    const beatOrder = Object.values(this.config.storyStructure.storyBeats);

    const currentIndex = beatOrder.indexOf(currentBeat);
    const fromIndex = beatOrder.indexOf(availableFrom);

    // If either beat is not found in the order, log warning and return false
    if (currentIndex === -1 || fromIndex === -1) {
      console.warn('Invalid story beat in range check:', {
        currentBeat,
        availableFrom,
        availableUntil,
      });
      return false;
    }

    // If availableUntil not specified, available indefinitely
    if (!availableUntil) {
      return currentIndex >= fromIndex;
    }

    const untilIndex = beatOrder.indexOf(availableUntil);
    // If until beat is not found, warn but continue with from check only
    if (untilIndex === -1) {
      console.warn('Invalid availableUntil beat:', availableUntil);
      return currentIndex >= fromIndex;
    }

    return currentIndex >= fromIndex && currentIndex <= untilIndex;
  }

  /**
   * Get random character banter for the current story beat
   * This is the main function that the game will call
   */
  getRandomBanter(storyBeat: StoryBeat | null = null): BanterResult {
    try {
      if (!this.isInitialized) {
        console.warn('DialogueManager not initialized - cannot get random banter');
        return {
          success: false,
          error: 'DialogueManager not initialized',
          dialogue: null,
        };
      }

      // Get available characters for current story beat
      const availabilityResult = this.getAvailableCharacters(storyBeat);

      if (
        !availabilityResult.availableCharacters ||
        availabilityResult.availableCharacters.length === 0
      ) {
        return {
          success: false,
          error: 'No characters available for current story beat',
          dialogue: null,
        };
      }

      // Select character using weighted random selection
      const selectedCharacter = this.selectCharacterWeighted(
        availabilityResult.availableCharacters
      );

      if (!selectedCharacter) {
        return {
          success: false,
          error: 'Character selection failed',
          dialogue: null,
        };
      }

      // Random dialogue selection from available dialogue
      const availableDialogue = selectedCharacter.availableDialogue;
      const randomDialogueIndex = Math.floor(Math.random() * availableDialogue.length);
      const selectedDialogue = availableDialogue[randomDialogueIndex];

      // Add character to recently used list
      this.addToRecentlyUsed(selectedCharacter.characterId);

      // Return complete banter object ready for UI
      return {
        success: true,
        error: null,
        dialogue: {
          characterId: selectedCharacter.characterId,
          character: selectedCharacter.characterData.character.name,
          text: selectedDialogue.text,
          emotion: selectedDialogue.emotion,
          category: selectedDialogue.category,
        },
      };
    } catch (error) {
      this.handleError('random-banter-generation', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dialogue: null,
      };
    }
  }

  /**
   * Get characters available for the current story beat
   */
  private getAvailableCharacters(storyBeat: StoryBeat | null = null): AvailableCharactersResult {
    const currentBeat = storyBeat || this.currentStoryBeat;
    const availableCharacters: CharacterAvailability[] = [];
    const debugInfo = {
      totalCharactersChecked: this.characters.size,
      excludedByGroup: [] as Array<{ characterId: string; reason: string }>,
      excludedByDialogue: [] as Array<{ characterId: string; reason: string }>,
      loadedGroups: Array.from(this.loadedGroups),
      currentStoryBeat: currentBeat,
    };

    for (const [characterId, characterData] of this.characters) {
      const loadingGroup = characterData.character.loadingGroup;

      if (!this.loadedGroups.has(loadingGroup)) {
        debugInfo.excludedByGroup.push({
          characterId,
          reason: `Group '${loadingGroup}' not loaded`,
        });
        continue;
      }

      const availableDialogue = this.filterDialogueByStoryBeat(
        characterData.banterDialogue,
        currentBeat
      );

      if (availableDialogue.length === 0) {
        debugInfo.excludedByDialogue.push({
          characterId,
          reason: `No dialogue available at '${currentBeat}'`,
        });
        continue;
      }

      availableCharacters.push({
        characterId,
        characterData,
        availableDialogue,
      });
    }

    return {
      availableCharacters,
      debugInfo,
    };
  }

  /**
   * Add a character to the recently used list
   */
  private addToRecentlyUsed(characterId: string): void {
    // Remove if already exists (to update position)
    this.recentlyUsedCharacters.delete(characterId);

    // Add to the set
    this.recentlyUsedCharacters.add(characterId);

    // Get avoidance window from config (default to 3)
    const avoidanceWindow =
      this.config?.behavior?.banterSelection?.recentAvoidanceWindow || 3;

    // Keep only the most recent characters within the window
    if (this.recentlyUsedCharacters.size > avoidanceWindow) {
      const charactersArray = Array.from(this.recentlyUsedCharacters);
      const oldestCharacter = charactersArray[0];
      this.recentlyUsedCharacters.delete(oldestCharacter);
    }
  }

  /**
   * Select character using weighted random selection that avoids recent characters
   */
  private selectCharacterWeighted(
    availableCharacters: CharacterAvailability[]
  ): CharacterAvailability | null {
    if (!availableCharacters || availableCharacters.length === 0) {
      return null;
    }

    if (availableCharacters.length === 1) {
      return availableCharacters[0];
    }

    // Create weighted selection array
    const weightedChoices: CharacterAvailability[] = [];

    availableCharacters.forEach((character) => {
      const isRecent = this.recentlyUsedCharacters.has(character.characterId);
      const weight = isRecent ? 1 : 3;

      for (let i = 0; i < weight; i++) {
        weightedChoices.push(character);
      }
    });

    // Random selection
    const randomIndex = Math.floor(Math.random() * weightedChoices.length);
    return weightedChoices[randomIndex];
  }

  /**
   * Update current story beat (affects banter dialogue availability)
   */
  setStoryBeat(newStoryBeat: StoryBeat): boolean {
    try {
      // Validate story beat against config
      if (!this.isValidStoryBeat(newStoryBeat)) {
        console.warn(`Invalid story beat: ${newStoryBeat}`);
        return false;
      }

      const previousBeat = this.currentStoryBeat;
      this.currentStoryBeat = newStoryBeat;

      // Emit event for UI integration
      this.emit('beatChanged', {
        previousBeat,
        newBeat: newStoryBeat,
        timestamp: new Date().toISOString(),
      });

      // Future hook: Check for new character groups to load
      this.checkForGroupLoading(newStoryBeat);

      // Future hook: Check for character retirements
      this.checkForCharacterRetirements(newStoryBeat);

      return true;
    } catch (error) {
      this.handleError('story-beat-update', error);
      return false;
    }
  }

  /**
   * Validate if story beat exists in configuration
   */
  private isValidStoryBeat(storyBeat: StoryBeat): boolean {
    if (!this.config?.storyStructure?.storyBeats) {
      console.warn('Story structure not loaded');
      return false;
    }

    const validBeats = Object.values(this.config.storyStructure.storyBeats);
    return validBeats.includes(storyBeat);
  }

  /**
   * Check for new character groups to load (placeholder for future)
   */
  private checkForGroupLoading(storyBeat: StoryBeat): void {
    // Placeholder - will implement when we have more character groups
  }

  /**
   * Check for character retirements (placeholder for future)
   */
  private checkForCharacterRetirements(storyBeat: StoryBeat): void {
    // Placeholder - will implement when we have retirement logic
  }

  /**
   * Handle errors with configurable responses
   */
  private handleError(context: string, error: unknown): void {
    console.error(`DialogueManager error in ${context}:`, error);
    // Could implement error reporting here in the future
  }

  /**
   * Get system status for debugging
   */
  getStatus(): DialogueManagerStatus {
    return {
      initialized: this.isInitialized,
      currentStoryBeat: this.currentStoryBeat,
      loadedGroups: Array.from(this.loadedGroups),
      charactersLoaded: this.characters.size,
      storyEventsLoaded: this.storyEvents.size,
      recentlyUsedCharacters: Array.from(this.recentlyUsedCharacters),
    };
  }
}

// Create and export singleton instance
export const dialogueManager = new DialogueManager();
