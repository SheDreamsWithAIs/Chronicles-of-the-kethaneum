/**
 * Utility for loading and parsing backstory content
 */

import { fetchAsset } from './assetPath';

/**
 * Represents a text segment with optional formatting
 */
export interface TextSegment {
  text: string;
  color?: string;
  italic?: boolean;
  bold?: boolean;
}

/**
 * Represents a paragraph made up of text segments
 */
export interface Paragraph {
  segments: TextSegment[];
}

/**
 * Represents the complete backstory content
 */
export interface BackstoryContent {
  title: string;
  paragraphs: Paragraph[];
}

/**
 * Load backstory content from JSON file
 */
export async function loadBackstoryContent(): Promise<BackstoryContent | null> {
  try {
    const response = await fetchAsset('/data/backstory-content.json');

    if (!response.ok) {
      console.error('Failed to load backstory content:', response.status, response.statusText);
      return null;
    }

    const content: BackstoryContent = await response.json();

    // Validate the content structure
    if (!content.title || !Array.isArray(content.paragraphs)) {
      console.error('Invalid backstory content structure');
      return null;
    }

    return content;
  } catch (error) {
    console.error('Error loading backstory content:', error);
    return null;
  }
}
