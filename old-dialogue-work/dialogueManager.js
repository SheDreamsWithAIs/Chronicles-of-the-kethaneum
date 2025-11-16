/**
 * DialogueManager for Chronicles of the Kethaneum
 * Handles character banter and story event dialogue systems
 */

class DialogueManager {
  constructor() {
    this.config = null;
    this.characters = new Map(); // character-id -> character data
    this.storyEvents = new Map(); // event-id -> story event data
    this.loadedGroups = new Set(); // track which loading groups are loaded
    this.recentlyUsedCharacters = new Set(); // track recent character interactions
    this.currentStoryBeat = 'hook'; // track story progression
    this.isInitialized = false;
  }
  /**
   * Simple event emission for UI integration
   * @param {string} eventName - Name of event to emit
   * @param {any} data - Data to send with event
   */
  emit(eventName, data) {
    // Create custom event
    const event = new CustomEvent(`dialogueManager:${eventName}`, {
      detail: data
    });

    // Dispatch on document for global listening
    document.dispatchEvent(event);
  }
  /**
   * Initialize the dialogue system
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      // Load configuration first
      await this.loadConfiguration();

      // Load initial character groups
      await this.loadCharacterGroup('introduction_characters');

      this.isInitialized = true;
      return true;
    } catch (error) {
      this.handleError('initialization', error);
      return false;
    }
  }

  /**
   * Load dialogue configuration
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    try {
      const response = await fetch('scripts/dialogue/dialogue-config.json');
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
   * @returns {Object} - Fallback config
   */
  getFallbackConfig() {
    return {
      paths: {
        charactersDirectory: 'scripts/dialogue/characters/',
        storyEventsDirectory: 'scripts/dialogue/story-events/'
      },
      storyStructure: {
        storyBeats: {
          HOOK: 'hook',
          FIRST_PLOT_POINT: 'first_plot_point'
        },
        defaultStoryBeat: 'hook'
      },
      behavior: {
        banterSelection: {
          method: 'random',
          avoidRepeats: true,
          recentAvoidanceWindow: 3
        },
        errorHandling: {
          missingCharacterAction: 'useDefault',
          missingStoryAction: 'skipGracefully'
        }
      }
    };
  }

  /**
   * Load characters from a specific loading group
   * @param {string} groupName - Loading group to load
   * @returns {Promise<void>}
   */
  async loadCharacterGroup(groupName) {
    if (this.loadedGroups.has(groupName)) {
      return;
    }

    try {
      // Load character manifest to discover available files
      const filenames = await this.loadCharacterManifest();

      // Load each file and check if it belongs to this group
      const groupCharacters = [];
      for (const filename of filenames) {
        try {
          const characterData = await this.loadAndValidateCharacterFile(filename);
          if (characterData && characterData.character.loadingGroup === groupName) {
            groupCharacters.push(characterData);
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
   * @returns {Promise<Array<string>>} - Array of character filenames
   */
  async loadCharacterManifest() {
    try {
      const manifestPath = this.config.paths.charactersDirectory + 'character-manifest.json';
      const response = await fetch(manifestPath);

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
      return ["archivist-lumina.json"];
    }
  }

  /**
   * Load and validate a character file
   * @param {string} filename - Character filename to load
   * @returns {Promise<Object|null>} - Character data or null if invalid
   */
  async loadAndValidateCharacterFile(filename) {
    try {
      const basePath = this.config.paths.charactersDirectory;
      const response = await fetch(`${basePath}${filename}`);

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
   * @param {Object} characterData - Character data to validate
   * @returns {boolean} - Whether data is valid
   */
  validateCharacterData(characterData) {
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
 * Filter dialogue entries based on current story beat availability
 * @param {Array} dialogueEntries - Array of dialogue objects
 * @param {string} currentStoryBeat - Current story beat
 * @returns {Array} - Filtered dialogue entries
 */
  filterDialogueByStoryBeat(dialogueEntries, currentStoryBeat) {
    if (!Array.isArray(dialogueEntries)) {
      return [];
    }
    
    return dialogueEntries.filter(entry => {
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
   * @param {string} currentBeat - Current story beat
   * @param {string} availableFrom - Starting availability beat
   * @param {string} availableUntil - Ending availability beat (optional)
   * @returns {boolean} - Whether current beat is in range
   */
  isStoryBeatInRange(currentBeat, availableFrom, availableUntil) {
    // Story beat order from config
    const beatOrder = Object.values(this.config.storyStructure.storyBeats);
    
    // Use current story beat from class if not provided
    const actualCurrentBeat = currentBeat === this.currentStoryBeat ? currentBeat : this.currentStoryBeat;

    const currentIndex = beatOrder.indexOf(actualCurrentBeat);
    const fromIndex = beatOrder.indexOf(availableFrom);

    // If either beat is not found in the order, log warning and return false
    if (currentIndex === -1 || fromIndex === -1) {
      console.warn('Invalid story beat in range check:', {
        currentBeat: actualCurrentBeat,
        availableFrom,
        availableUntil
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
 * @param {string} storyBeat - Optional story beat (uses current if not provided)
 * @returns {Object|null} - Complete banter object ready for UI or null if none available
 */
  getRandomBanter(storyBeat = null) {
    try {
      if (!this.isInitialized) {
        console.warn('DialogueManager not initialized - cannot get random banter');
        return null;
      }

      // Get available characters for current story beat
      const availabilityResult = this.getAvailableCharacters(storyBeat);

      if (!availabilityResult.availableCharacters || availabilityResult.availableCharacters.length === 0) {
        return {
          success: false,
          error: 'No characters available for current story beat',
          dialogue: null
        };
      }

      // Select character using weighted random selection
      const selectedCharacter = this.selectCharacterWeighted(availabilityResult.availableCharacters);

      if (!selectedCharacter) {
        return {
          success: false,
          error: 'Character selection failed',
          dialogue: null
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
          category: selectedDialogue.category
        }
      };

    } catch (error) {
      this.handleError('random-banter-generation', error);
      return {
        success: false,
        error: error.message,
        dialogue: null
      };
    }
  }

  /**
 * Get characters available for the current story beat
 * @param {string} storyBeat - Current story beat (optional, uses current if not provided)
 * @returns {Object} - Available characters with debug info
 */
  getAvailableCharacters(storyBeat = null) {
    const currentBeat = storyBeat || this.currentStoryBeat;
    const availableCharacters = [];
    const debugInfo = {
      totalCharactersChecked: this.characters.size,
      excludedByGroup: [],
      excludedByDialogue: [],
      loadedGroups: Array.from(this.loadedGroups),
      currentStoryBeat: currentBeat
    };

    for (const [characterId, characterData] of this.characters) {
      const loadingGroup = characterData.character.loadingGroup;

      if (!this.loadedGroups.has(loadingGroup)) {
        debugInfo.excludedByGroup.push({ characterId, reason: `Group '${loadingGroup}' not loaded` });
        continue;
      }

      const availableDialogue = this.filterDialogueByStoryBeat(
        characterData.banterDialogue,
        currentBeat
      );

      if (availableDialogue.length === 0) {
        debugInfo.excludedByDialogue.push({ characterId, reason: `No dialogue available at '${currentBeat}'` });
        continue;
      }

      availableCharacters.push({
        characterId,
        characterData,
        availableDialogue
      });
    }

    return {
      availableCharacters,
      debugInfo
    };
  }

  /**
   * Add a character to the recently used list
   * @param {string} characterId - Character ID to add
   */
  addToRecentlyUsed(characterId) {
    // Remove if already exists (to update position)
    this.recentlyUsedCharacters.delete(characterId);

    // Add to the set
    this.recentlyUsedCharacters.add(characterId);

    // Get avoidance window from config (default to 3)
    const avoidanceWindow = this.config?.behavior?.banterSelection?.recentAvoidanceWindow || 3;

    // Keep only the most recent characters within the window
    if (this.recentlyUsedCharacters.size > avoidanceWindow) {
      const charactersArray = Array.from(this.recentlyUsedCharacters);
      const oldestCharacter = charactersArray[0];
      this.recentlyUsedCharacters.delete(oldestCharacter);
    }
  }

  /**
   * Select character using weighted random selection that avoids recent characters
   * @param {Array} availableCharacters - Array of available character objects
   * @returns {Object|null} - Selected character object or null
   */
  selectCharacterWeighted(availableCharacters) {
    if (!availableCharacters || availableCharacters.length === 0) {
      return null;
    }

    if (availableCharacters.length === 1) {
      return availableCharacters[0];
    }

    // Create weighted selection array (no logging)
    const weightedChoices = [];

    availableCharacters.forEach(character => {
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
   * Trigger a story event
   * @param {string} eventId - Story event ID to trigger
   * @returns {Object|null} - Story event data or null
   */
  triggerStoryEvent(eventId) {
    if (!this.isInitialized) {
      console.warn('DialogueManager not initialized');
      return null;
    }

    try {
      // Placeholder implementation - will be expanded in later steps
      return null;
    } catch (error) {
      console.error(`Error triggering story event '${eventId}':`, error);
      this.handleError('story-event', error);
      return null;
    }
  }

  /**
 * Update current story beat (affects banter dialogue availability)
 * @param {string} newStoryBeat - New story beat to set
 * @returns {boolean} - Whether update was successful
 */
  setStoryBeat(newStoryBeat) {
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
      timestamp: new Date().toISOString()
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
   * @param {string} storyBeat - Story beat to validate
   * @returns {boolean} - Whether story beat is valid
   */
  isValidStoryBeat(storyBeat) {
    if (!this.config?.storyStructure?.storyBeats) {
      console.warn('Story structure not loaded');
      return false;
    }

    const validBeats = Object.values(this.config.storyStructure.storyBeats);
    return validBeats.includes(storyBeat);
  }

  /**
   * Check for new character groups to load (placeholder for future)
   * @param {string} storyBeat - Current story beat
   */
  checkForGroupLoading(storyBeat) {
    // Placeholder - will implement when we have more character groups
  }

  /**
   * Check for character retirements (placeholder for future)
   * @param {string} storyBeat - Current story beat
   */
  checkForCharacterRetirements(storyBeat) {
    // Placeholder - will implement when we have retirement logic
  }

  /**
   * Handle errors with configurable responses
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  handleError(context, error) {
    const errorAction = this.config?.behavior?.errorHandling || {};

    console.error(`DialogueManager error in ${context}:`, error);

    // Could implement error reporting here in the future
  }

  /**
   * Get system status for debugging
   * @returns {Object} - System status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      currentStoryBeat: this.currentStoryBeat,
      loadedGroups: Array.from(this.loadedGroups),
      charactersLoaded: this.characters.size,
      storyEventsLoaded: this.storyEvents.size,
      recentlyUsedCharacters: Array.from(this.recentlyUsedCharacters)
    };
  }
}

// Create and export singleton instance
const dialogueManager = new DialogueManager();

// Export for module system
export { DialogueManager, dialogueManager };