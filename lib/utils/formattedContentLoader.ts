/**
 * Utility for loading and parsing formatted text content
 *
 * This module provides a generic system for loading text content with
 * formatting support (colors, italics, bold) from JSON files.
 *
 * Used by: Backstory screen, Story End screen, and future content screens
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
 * Represents formatted text content with a title and paragraphs
 */
export interface FormattedContent {
  title: string;
  paragraphs: Paragraph[];
}

/**
 * Available content files that can be loaded
 */
export type ContentType = 'backstory' | 'story-end';

/**
 * Map of content types to their file paths
 */
const CONTENT_PATHS: Record<ContentType, string> = {
  'backstory': '/data/game-start-and-end-screen-content/backstory-content.json',
  'story-end': '/data/game-start-and-end-screen-content/story-end-content.json',
};

/**
 * Load formatted content from a predefined content type
 * @param contentType - The type of content to load
 * @returns The formatted content or null if loading fails
 */
export async function loadFormattedContent(contentType: ContentType): Promise<FormattedContent | null> {
  const path = CONTENT_PATHS[contentType];
  if (!path) {
    console.error(`Unknown content type: ${contentType}`);
    return null;
  }
  return loadFormattedContentFromPath(path);
}

/**
 * Load formatted content from a custom file path
 * @param filePath - The path to the content JSON file (relative to public/)
 * @returns The formatted content or null if loading fails
 */
export async function loadFormattedContentFromPath(filePath: string): Promise<FormattedContent | null> {
  try {
    const response = await fetchAsset(filePath);

    if (!response.ok) {
      console.error(`Failed to load content from ${filePath}:`, response.status, response.statusText);
      return null;
    }

    const content: FormattedContent = await response.json();

    // Validate the content structure
    if (!content.title || !Array.isArray(content.paragraphs)) {
      console.error(`Invalid content structure in ${filePath}`);
      return null;
    }

    // Validate paragraphs have segments
    for (const paragraph of content.paragraphs) {
      if (!Array.isArray(paragraph.segments)) {
        console.error(`Invalid paragraph structure in ${filePath}: missing segments array`);
        return null;
      }
      for (const segment of paragraph.segments) {
        if (typeof segment.text !== 'string') {
          console.error(`Invalid segment in ${filePath}: missing or invalid text field`);
          return null;
        }
      }
    }

    return content;
  } catch (error) {
    console.error(`Error loading content from ${filePath}:`, error);
    return null;
  }
}

// Legacy export for backward compatibility with backstory page
export type BackstoryContent = FormattedContent;
export const loadBackstoryContent = () => loadFormattedContent('backstory');
