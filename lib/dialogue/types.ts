/**
 * TypeScript type definitions for the Chronicles of the Kethaneum Dialogue System
 * Based on the original dialogue system structure
 */

// Story beat progression types
export type StoryBeat =
  | 'hook'
  | 'first_plot_point'
  | 'first_pinch_point'
  | 'midpoint'
  | 'second_pinch_point'
  | 'second_plot_point'
  | 'climax'
  | 'resolution';

// Character loading group types
export type LoadingGroup =
  | 'introduction_characters'
  | 'regular_contacts'
  | 'essential_library_staff'
  | 'extended_library_staff'
  | 'long_term_scholars'
  | 'visiting_scholars'
  | 'visiting_dignitaries'
  | 'knowledge_contributors'
  | 'special_event_characters';

// Emotion types for dialogue
export type Emotion =
  | 'warm'
  | 'professional'
  | 'encouraging'
  | 'proud'
  | 'explanatory'
  | 'mystical'
  | 'conspiratorial'
  | 'reassuring'
  | 'grateful'
  | 'scholarly'
  | 'verbose'
  | 'enthusiastic'
  | 'analytical'
  | 'professorial'
  | 'impressed'
  | 'instructional'
  | 'methodical'
  | 'passionate'
  | 'contemplative'
  | 'collaborative'
  | 'intellectual'
  | 'scientific'
  | 'excited'
  | 'theoretical'
  | 'apologetic'
  | 'self-aware'
  | 'amused'
  | 'curious'
  | 'satisfied'
  | 'welcoming'
  | 'formal'
  | 'wise';

// Dialogue category types
export type DialogueCategory =
  | 'general-welcome'
  | 'progress-praise'
  | 'lore-sharing'
  | 'casual-advice'
  | 'appreciation'
  | 'academic-introduction'
  | 'lore-exposition'
  | 'academic-guidance'
  | 'colleague-reference'
  | 'research-exposition'
  | 'meta-humor'
  | 'general-testing'
  | 'technical-testing';

// Screen availability types
export type ScreenType = 'library' | 'tutorial' | 'testing' | 'puzzle';

// Relationship types
export type RelationshipType =
  | 'mentor-colleague'
  | 'academic-mentor'
  | 'testing-assistant'
  | 'colleague'
  | 'supervisor';

/**
 * Single banter dialogue entry
 */
export interface BanterDialogue {
  id: string;
  text: string;
  emotion: Emotion[];
  category: DialogueCategory;
  availableFrom: StoryBeat;
  availableUntil?: StoryBeat;
}

/**
 * Character metadata
 */
export interface CharacterMetadata {
  personalityTraits: string[];
  relationshipToPlayer: RelationshipType;
  availableInScreens: ScreenType[];
  lastUpdated: string;
}

/**
 * Character definition
 */
export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  portraitFile: string;
  loadingGroup: LoadingGroup;
  retireAfter: StoryBeat | 'never';
  specialties: string[];
}

/**
 * Complete character data structure
 */
export interface CharacterData {
  character: Character;
  banterDialogue: BanterDialogue[];
  metadata: CharacterMetadata;
}

/**
 * Story event dialogue sequence entry
 */
export interface StoryEventDialogue {
  sequence: number;
  speaker: string; // character ID
  text: string;
  emotion: Emotion[];
  pauseAfter: boolean;
  isLastInSequence?: boolean;
}

/**
 * Character reference in story events
 */
export interface StoryEventCharacter {
  id: string;
  portraitFile: string;
}

/**
 * Story event metadata
 */
export interface StoryEventMetadata {
  estimatedDuration: 'short' | 'medium' | 'long';
  storyImportance: 'introduction' | 'major' | 'minor' | 'optional';
  unlocks?: string[];
  lastUpdated: string;
}

/**
 * Story event definition
 */
export interface StoryEventInfo {
  id: string;
  title: string;
  triggerCondition: string;
  storyBeat: StoryBeat;
}

/**
 * Complete story event structure
 */
export interface StoryEvent {
  storyEvent: StoryEventInfo;
  dialogue: StoryEventDialogue[];
  characters: StoryEventCharacter[];
  metadata: StoryEventMetadata;
}

/**
 * Dialogue configuration - system settings
 */
export interface DialogueConfig {
  system: {
    version: string;
    enableLogging: boolean;
    fallbackOnError: boolean;
  };
  paths: {
    charactersDirectory: string;
    storyEventsDirectory: string;
    characterPortraitsDirectory: string;
  };
  display: {
    textLimits: {
      mobile: {
        maxCharsPerScreen: number;
        estimatedWordsPerScreen: number;
      };
      tablet: {
        maxCharsPerScreen: number;
        estimatedWordsPerScreen: number;
      };
      desktop: {
        maxCharsPerScreen: number;
        estimatedWordsPerScreen: number;
      };
    };
    animationSettings: {
      textRevealSpeed: 'slow' | 'medium' | 'fast';
      panelTransitionDuration: number;
      characterPortraitFadeTime: number;
    };
  };
  storyStructure: {
    storyBeats: Record<string, StoryBeat>;
    defaultStoryBeat: StoryBeat;
    enableSeasonalDialogue: boolean;
    characterRetirement: Record<LoadingGroup, StoryBeat | 'never'>;
  };
  behavior: {
    banterSelection: {
      method: 'random' | 'sequential' | 'weighted';
      avoidRepeats: boolean;
      resetAfterAllSeen: boolean;
      recentAvoidanceWindow: number;
    };
    storyEvents: {
      triggerMethod: 'external' | 'automatic';
      autoAdvanceDelay: number;
      allowSkipping: boolean;
    };
    errorHandling: {
      missingCharacterAction: 'useDefault' | 'skip' | 'error';
      missingStoryAction: 'skipGracefully' | 'error';
      corruptFileAction: 'logAndContinue' | 'error';
    };
  };
}

/**
 * Banter result returned by DialogueManager
 */
export interface BanterResult {
  success: boolean;
  error: string | null;
  dialogue: {
    characterId: string;
    character: string;
    text: string;
    emotion: Emotion[];
    category: DialogueCategory;
  } | null;
}

/**
 * Character availability info
 */
export interface CharacterAvailability {
  characterId: string;
  characterData: CharacterData;
  availableDialogue: BanterDialogue[];
}

/**
 * Available characters result with debug info
 */
export interface AvailableCharactersResult {
  availableCharacters: CharacterAvailability[];
  debugInfo: {
    totalCharactersChecked: number;
    excludedByGroup: Array<{ characterId: string; reason: string }>;
    excludedByDialogue: Array<{ characterId: string; reason: string }>;
    loadedGroups: string[];
    currentStoryBeat: StoryBeat;
  };
}

/**
 * DialogueManager status info
 */
export interface DialogueManagerStatus {
  initialized: boolean;
  currentStoryBeat: StoryBeat;
  loadedGroups: string[];
  charactersLoaded: number;
  storyEventsLoaded: number;
  recentlyUsedCharacters: string[];
}
