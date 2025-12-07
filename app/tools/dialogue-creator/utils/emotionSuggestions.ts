/**
 * Emotion suggestions based on dialogue category
 */

import type { DialogueCategory, Emotion } from '@/lib/dialogue/types';

/**
 * Map of categories to commonly used emotions
 */
export const emotionSuggestions: Record<DialogueCategory, Emotion[]> = {
  'general-welcome': [
    'warm',
    'welcoming',
    'professional',
    'formal',
  ],

  'progress-praise': [
    'encouraging',
    'proud',
    'impressed',
    'warm',
    'enthusiastic',
  ],

  'lore-sharing': [
    'explanatory',
    'mystical',
    'scholarly',
    'wise',
    'contemplative',
    'intellectual',
  ],

  'casual-advice': [
    'conspiratorial',
    'reassuring',
    'warm',
    'amused',
  ],

  'appreciation': [
    'grateful',
    'warm',
  ],

  'academic-introduction': [
    'scholarly',
    'professional',
    'formal',
    'intellectual',
    'welcoming',
  ],

  'lore-exposition': [
    'scholarly',
    'explanatory',
    'mystical',
    'contemplative',
    'wise',
  ],

  'academic-guidance': [
    'instructional',
    'professorial',
    'methodical',
    'encouraging',
  ],

  'colleague-reference': [
    'collaborative',
    'professional',
    'warm',
  ],

  'research-exposition': [
    'analytical',
    'excited',
    'scientific',
    'enthusiastic',
    'intellectual',
  ],

  'meta-humor': [
    'amused',
    'self-aware',
  ],

  'general-testing': [
    'professional',
    'methodical',
    'analytical',
  ],

  'technical-testing': [
    'analytical',
    'methodical',
  ],
};

/**
 * Get suggested emotions for a dialogue category
 */
export function getSuggestedEmotions(
  category: DialogueCategory
): Emotion[] {
  return emotionSuggestions[category] || [];
}

/**
 * Check if emotion is commonly used with category
 */
export function isCommonEmotionForCategory(
  emotion: Emotion,
  category: DialogueCategory
): boolean {
  const suggestions = emotionSuggestions[category] || [];
  return suggestions.includes(emotion);
}

