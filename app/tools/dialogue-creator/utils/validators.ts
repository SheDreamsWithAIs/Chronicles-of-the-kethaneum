/**
 * Validation functions for character and dialogue data
 */

import type {
  Character,
  BanterDialogue,
  CharacterMetadata,
  StoryBeat,
  LoadingGroup,
  DialogueCategory,
  Emotion,
} from '@/lib/dialogue/types';
import type { ValidationResult, TextLimits } from '../types/creator.types';

const STORY_BEAT_ORDER: StoryBeat[] = [
  'hook',
  'first_plot_point',
  'first_pinch_point',
  'midpoint',
  'second_pinch_point',
  'second_plot_point',
  'climax',
  'resolution',
];

const VALID_LOADING_GROUPS: LoadingGroup[] = [
  'introduction_characters',
  'regular_contacts',
  'essential_library_staff',
  'extended_library_staff',
  'long_term_scholars',
  'visiting_scholars',
  'visiting_dignitaries',
  'knowledge_contributors',
  'special_event_characters',
];

const VALID_DIALOGUE_CATEGORIES: DialogueCategory[] = [
  'general-welcome',
  'progress-praise',
  'lore-sharing',
  'casual-advice',
  'appreciation',
  'academic-introduction',
  'lore-exposition',
  'academic-guidance',
  'colleague-reference',
  'research-exposition',
  'meta-humor',
  'general-testing',
  'technical-testing',
];

/**
 * Validate character ID
 */
export function validateCharacterId(id: string, existingIds: string[] = []): ValidationResult | null {
  if (!id) {
    return {
      severity: 'error',
      field: 'character.id',
      message: 'Character ID is required',
    };
  }

  if (id.length < 2 || id.length > 50) {
    return {
      severity: 'error',
      field: 'character.id',
      message: 'Character ID must be between 2 and 50 characters',
    };
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    return {
      severity: 'error',
      field: 'character.id',
      message: 'Character ID can only contain lowercase letters, numbers, and hyphens',
    };
  }

  if (existingIds.includes(id)) {
    return {
      severity: 'error',
      field: 'character.id',
      message: 'This character ID is already in use',
    };
  }

  return null;
}

/**
 * Validate character name
 */
export function validateCharacterName(name: string): ValidationResult | null {
  if (!name || name.trim().length === 0) {
    return {
      severity: 'error',
      field: 'character.name',
      message: 'Character name is required',
    };
  }

  if (name.length < 2 || name.length > 50) {
    return {
      severity: 'error',
      field: 'character.name',
      message: 'Character name must be between 2 and 50 characters',
    };
  }

  return null;
}

/**
 * Validate character title
 */
export function validateCharacterTitle(title: string): ValidationResult | null {
  if (!title || title.trim().length === 0) {
    return {
      severity: 'error',
      field: 'character.title',
      message: 'Character title is required',
    };
  }

  if (title.length > 100) {
    return {
      severity: 'error',
      field: 'character.title',
      message: 'Character title must be 100 characters or less',
    };
  }

  return null;
}

/**
 * Validate character description
 */
export function validateCharacterDescription(description: string): ValidationResult | null {
  if (!description || description.trim().length === 0) {
    return {
      severity: 'error',
      field: 'character.description',
      message: 'Character description is required',
    };
  }

  if (description.length < 20) {
    return {
      severity: 'error',
      field: 'character.description',
      message: 'Character description must be at least 20 characters',
    };
  }

  if (description.length > 500) {
    return {
      severity: 'error',
      field: 'character.description',
      message: 'Character description must be 500 characters or less',
    };
  }

  return null;
}

/**
 * Validate loading group
 */
export function validateLoadingGroup(group: LoadingGroup | string): ValidationResult | null {
  if (!group) {
    return {
      severity: 'error',
      field: 'character.loadingGroup',
      message: 'Loading group is required',
    };
  }

  if (!VALID_LOADING_GROUPS.includes(group as LoadingGroup)) {
    return {
      severity: 'error',
      field: 'character.loadingGroup',
      message: 'Invalid loading group',
    };
  }

  return null;
}

/**
 * Validate retire after
 */
export function validateRetireAfter(retireAfter: StoryBeat | 'never' | string): ValidationResult | null {
  if (!retireAfter) {
    return {
      severity: 'error',
      field: 'character.retireAfter',
      message: 'Retire after is required',
    };
  }

  if (retireAfter === 'never') {
    return null;
  }

  if (!STORY_BEAT_ORDER.includes(retireAfter as StoryBeat)) {
    return {
      severity: 'error',
      field: 'character.retireAfter',
      message: 'Invalid story beat',
    };
  }

  return null;
}

/**
 * Validate dialogue ID
 */
export function validateDialogueId(
  id: string,
  index: number,
  allDialogueIds: string[]
): ValidationResult | null {
  if (!id) {
    return {
      severity: 'error',
      field: `dialogue.${index}.id`,
      message: 'Dialogue ID is required',
    };
  }

  if (id.length < 3 || id.length > 50) {
    return {
      severity: 'error',
      field: `dialogue.${index}.id`,
      message: 'Dialogue ID must be between 3 and 50 characters',
    };
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    return {
      severity: 'error',
      field: `dialogue.${index}.id`,
      message: 'Dialogue ID can only contain lowercase letters, numbers, and hyphens',
    };
  }

  // Check for duplicates (excluding current index)
  const duplicateCount = allDialogueIds.filter((existingId, idx) => 
    existingId === id && idx !== index
  ).length;

  if (duplicateCount > 0) {
    return {
      severity: 'error',
      field: `dialogue.${index}.id`,
      message: 'Dialogue ID must be unique within this character',
    };
  }

  return null;
}

/**
 * Validate dialogue text
 */
export function validateDialogueText(
  text: string,
  index: number,
  textLimits?: TextLimits
): ValidationResult | null {
  if (!text || text.trim().length === 0) {
    return {
      severity: 'error',
      field: `dialogue.${index}.text`,
      message: 'Dialogue text is required',
    };
  }

  if (text.length < 10) {
    return {
      severity: 'error',
      field: `dialogue.${index}.text`,
      message: 'Dialogue text must be at least 10 characters',
    };
  }

  if (text.length > 1000) {
    return {
      severity: 'error',
      field: `dialogue.${index}.text`,
      message: 'Dialogue text must be 1000 characters or less',
    };
  }

  if (textLimits) {
    if (text.length > textLimits.mobile.maxCharsPerScreen) {
      const within20 = text.length <= textLimits.mobile.maxCharsPerScreen + 20;
      return {
        severity: within20 ? 'warning' : 'error',
        field: `dialogue.${index}.text`,
        message: `Text exceeds mobile recommended length (${textLimits.mobile.maxCharsPerScreen} chars)`,
      };
    }
  }

  return null;
}

/**
 * Validate emotions
 */
export function validateEmotions(
  emotions: Emotion[],
  index: number
): ValidationResult | null {
  if (!emotions || emotions.length === 0) {
    return {
      severity: 'error',
      field: `dialogue.${index}.emotion`,
      message: 'At least one emotion is required',
    };
  }

  if (emotions.length > 4) {
    return {
      severity: 'error',
      field: `dialogue.${index}.emotion`,
      message: 'Maximum 4 emotions allowed',
    };
  }

  if (emotions.length > 2) {
    return {
      severity: 'warning',
      field: `dialogue.${index}.emotion`,
      message: `Most dialogue uses 1-2 emotions (currently using ${emotions.length})`,
    };
  }

  return null;
}

/**
 * Validate dialogue category
 */
export function validateDialogueCategory(
  category: DialogueCategory | string,
  index: number
): ValidationResult | null {
  if (!category) {
    return {
      severity: 'error',
      field: `dialogue.${index}.category`,
      message: 'Dialogue category is required',
    };
  }

  if (!VALID_DIALOGUE_CATEGORIES.includes(category as DialogueCategory)) {
    return {
      severity: 'error',
      field: `dialogue.${index}.category`,
      message: 'Invalid dialogue category',
    };
  }

  return null;
}

/**
 * Validate story beat availability
 */
export function validateStoryBeatAvailability(
  availableFrom: StoryBeat | string,
  availableUntil: StoryBeat | string | undefined,
  index: number
): ValidationResult | null {
  if (!availableFrom) {
    return {
      severity: 'error',
      field: `dialogue.${index}.availableFrom`,
      message: 'Available from is required',
    };
  }

  if (!STORY_BEAT_ORDER.includes(availableFrom as StoryBeat)) {
    return {
      severity: 'error',
      field: `dialogue.${index}.availableFrom`,
      message: 'Invalid story beat',
    };
  }

  if (availableUntil) {
    if (!STORY_BEAT_ORDER.includes(availableUntil as StoryBeat)) {
      return {
        severity: 'error',
        field: `dialogue.${index}.availableUntil`,
        message: 'Invalid story beat',
      };
    }

    const fromIndex = STORY_BEAT_ORDER.indexOf(availableFrom as StoryBeat);
    const untilIndex = STORY_BEAT_ORDER.indexOf(availableUntil as StoryBeat);

    if (untilIndex <= fromIndex) {
      return {
        severity: 'error',
        field: `dialogue.${index}.availableUntil`,
        message: 'Available until must be after available from',
      };
    }
  }

  return null;
}

/**
 * Validate metadata
 */
export function validateMetadata(metadata: CharacterMetadata): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!metadata.relationshipToPlayer) {
    results.push({
      severity: 'error',
      field: 'metadata.relationshipToPlayer',
      message: 'Relationship to player is required',
    });
  }

  if (!metadata.availableInScreens || metadata.availableInScreens.length === 0) {
    results.push({
      severity: 'error',
      field: 'metadata.availableInScreens',
      message: 'At least one screen must be selected',
    });
  }

  return results;
}

/**
 * Validate complete character data
 */
export function validateCharacter(
  character: Character,
  dialogueEntries: BanterDialogue[],
  metadata: CharacterMetadata,
  textLimits?: TextLimits,
  existingCharacterIds: string[] = []
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Validate character fields
  const characterIdResult = validateCharacterId(character.id, existingCharacterIds);
  if (characterIdResult) results.push(characterIdResult);

  const nameResult = validateCharacterName(character.name);
  if (nameResult) results.push(nameResult);

  const titleResult = validateCharacterTitle(character.title);
  if (titleResult) results.push(titleResult);

  const descResult = validateCharacterDescription(character.description);
  if (descResult) results.push(descResult);

  const groupResult = validateLoadingGroup(character.loadingGroup);
  if (groupResult) results.push(groupResult);

  const retireResult = validateRetireAfter(character.retireAfter);
  if (retireResult) results.push(retireResult);

  // Validate dialogue entries
  const allDialogueIds = dialogueEntries.map(d => d.id);
  dialogueEntries.forEach((entry, index) => {
    const idResult = validateDialogueId(entry.id, index, allDialogueIds);
    if (idResult) results.push(idResult);

    const textResult = validateDialogueText(entry.text, index, textLimits);
    if (textResult) results.push(textResult);

    const emotionResult = validateEmotions(entry.emotion, index);
    if (emotionResult) results.push(emotionResult);

    const categoryResult = validateDialogueCategory(entry.category, index);
    if (categoryResult) results.push(categoryResult);

    const beatResult = validateStoryBeatAvailability(
      entry.availableFrom,
      entry.availableUntil,
      index
    );
    if (beatResult) results.push(beatResult);
  });

  // Validate metadata
  const metadataResults = validateMetadata(metadata);
  results.push(...metadataResults);

  // Quality checks
  if (dialogueEntries.length < 3) {
    results.push({
      severity: 'warning',
      field: 'dialogue',
      message: `Only ${dialogueEntries.length} dialogue entries. Recommended minimum: 3`,
    });
  }

  const hasHook = dialogueEntries.some(d => d.availableFrom === 'hook');
  const hasFirstPlot = dialogueEntries.some(d => d.availableFrom === 'first_plot_point');
  if (!hasHook && !hasFirstPlot) {
    results.push({
      severity: 'warning',
      field: 'dialogue',
      message: 'No dialogue available in early game (hook or first_plot_point)',
    });
  }

  return results;
}

