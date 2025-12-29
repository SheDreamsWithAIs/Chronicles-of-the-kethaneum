/**
 * Character template utilities
 */

import type {
  Character,
  CharacterMetadata,
  BanterDialogue,
  Emotion,
  DialogueCategory,
  StoryBeat,
} from '@/lib/dialogue/types';
import { generateDialogueId } from './idGenerator';

/**
 * Get blank character template
 */
export function getCharacterTemplate(): Character {
  return {
    id: '',
    name: '',
    title: '',
    description: '',
    portraitFile: '',
    loadingGroup: 'introduction_characters',
    retireAfter: 'never',
    specialties: [],
  };
}

/**
 * Get blank metadata template
 */
export function getMetadataTemplate(): CharacterMetadata {
  return {
    personalityTraits: [],
    relationshipToPlayer: 'colleague',
    availableInScreens: ['library'],
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Get blank dialogue entry template
 */
export function getDialogueEntryTemplate(existingIds: string[] = []): BanterDialogue {
  return {
    id: generateDialogueId('general-welcome', existingIds),
    text: '',
    emotion: [],
    category: 'general-welcome',
    availableFrom: 'hook',
  };
}

