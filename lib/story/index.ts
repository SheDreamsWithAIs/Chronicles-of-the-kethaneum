/**
 * Story System
 *
 * This module provides two complementary story systems:
 * 1. Story Blurb System - Displays narrative moments based on triggers
 * 2. Story Progression System - Advances storybeats based on game metrics
 */

export * from './types';

// Story Blurb System (displays narrative text)
export { storyProgressManager, StoryProgressManagerClass } from './storyProgressManager';

// Story Progression System (advances storybeats)
export { storyProgressionManager, StoryProgressionManager } from './StoryProgressionManager';
