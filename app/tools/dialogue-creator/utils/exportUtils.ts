/**
 * Export utilities for character data
 */

import type { CharacterData } from '@/lib/dialogue/types';

/**
 * Export character data to formatted JSON string
 */
export function exportCharacterToJSON(characterData: CharacterData): string {
  return JSON.stringify(characterData, null, 2);
}

