/**
 * Utility for loading backstory content
 *
 * This is a compatibility wrapper around formattedContentLoader.
 * New code should use formattedContentLoader directly.
 */

export {
  loadBackstoryContent,
  type BackstoryContent,
  type TextSegment,
  type Paragraph,
} from './formattedContentLoader';
