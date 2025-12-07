/**
 * Type definitions for the Dialogue Creator Tool
 * Extends the dialogue system types with tool-specific types
 */

import type {
  Character,
  CharacterData,
  CharacterMetadata,
  BanterDialogue,
  StoryBeat,
  LoadingGroup,
  Emotion,
  DialogueCategory,
  RelationshipType,
  ScreenType,
} from '@/lib/dialogue/types';

export type { Character, CharacterData, CharacterMetadata, BanterDialogue };

/**
 * Validation result for form fields
 */
export interface ValidationResult {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

/**
 * Character template data
 */
export interface CharacterTemplate {
  name: string;
  description: string;
  character: Partial<Character>;
  metadata: Partial<CharacterMetadata>;
  sampleDialogue: Array<{
    category: DialogueCategory;
    text: string;
    emotion: Emotion[];
  }>;
}

/**
 * Dialogue creator state
 */
export interface DialogueCreatorState {
  character: Character;
  dialogueEntries: BanterDialogue[];
  metadata: CharacterMetadata;
  validationResults: ValidationResult[];
  isDirty: boolean;
  currentPreviewIndex: number;
  loadedCharacterId: string | null;
}

/**
 * Text limits from config
 */
export interface TextLimits {
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
}

