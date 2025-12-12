/**
 * Utility for loading receiving room content
 */

import { fetchAsset } from './assetPath';
import type { Paragraph, TextSegment } from './formattedContentLoader';

/**
 * Represents an action button for a segment
 */
export interface ActionButton {
  text: string;
}

/**
 * Represents a single segment in the receiving room story
 */
export interface ReceivingRoomSegment {
  paragraphs: Paragraph[];
  actionButton: ActionButton;
}

/**
 * Represents the complete receiving room content
 */
export interface ReceivingRoomContent {
  title: string;
  segments: ReceivingRoomSegment[];
}

/**
 * Load receiving room content from JSON
 * @returns The receiving room content or null if loading fails
 */
export async function loadReceivingRoomContent(): Promise<ReceivingRoomContent | null> {
  try {
    const response = await fetchAsset('/data/receiving-room/receiving-room-content.json');

    if (!response.ok) {
      console.error(`Failed to load receiving room content:`, response.status, response.statusText);
      return null;
    }

    const content: ReceivingRoomContent = await response.json();

    // Validate the content structure
    if (!content.title || !Array.isArray(content.segments)) {
      console.error('Invalid receiving room content structure: missing title or segments');
      return null;
    }

    // Validate segments
    for (const segment of content.segments) {
      if (!Array.isArray(segment.paragraphs)) {
        console.error('Invalid segment structure: missing paragraphs array');
        return null;
      }

      // Validate paragraphs have segments
      for (const paragraph of segment.paragraphs) {
        if (!Array.isArray(paragraph.segments)) {
          console.error('Invalid paragraph structure: missing segments array');
          return null;
        }
        for (const textSegment of paragraph.segments) {
          if (typeof textSegment.text !== 'string') {
            console.error('Invalid segment: missing or invalid text field');
            return null;
          }
        }
      }

      // Validate action button
      if (!segment.actionButton || typeof segment.actionButton.text !== 'string') {
        console.error('Invalid segment: missing or invalid actionButton');
        return null;
      }
    }

    return content;
  } catch (error) {
    console.error('Error loading receiving room content:', error);
    return null;
  }
}
