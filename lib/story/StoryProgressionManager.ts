/**
 * Story Progression Manager for Chronicles of the Kethaneum
 *
 * This is the "conductor" that coordinates all narrative systems:
 * - Monitors game progress (puzzles, books discovered)
 * - Checks progression rules
 * - Advances storybeats when conditions are met
 * - Triggers music changes, story events, and character loading
 *
 * Design Philosophy:
 * - All rules are configurable via JSON
 * - Systems remain independent
 * - Clone repo + swap config = new game
 */

import { fetchAsset } from '@/lib/utils/assetPath';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import { audioManager, AudioCategory } from '@/lib/audio/audioManager';
import type { StoryBeat, LoadingGroup } from '@/lib/dialogue/types';
import type {
  StoryProgressionConfig,
  ProgressionMetrics,
  ProgressionCheckResult,
  ProgressionRule,
  StoryProgressionStatus,
} from './types';

export class StoryProgressionManager {
  private config: StoryProgressionConfig | null = null;
  private isInitialized: boolean = false;
  private currentBeat: StoryBeat = 'hook';
  private triggeredEvents: Set<string> = new Set();
  private loadedCharacterGroups: Set<LoadingGroup> = new Set();

  /**
   * Initialize the story progression system
   */
  async initialize(): Promise<boolean> {
    try {
      // Load configuration
      await this.loadConfiguration();

      // Get current storybeat from dialogue manager
      const dialogueStatus = dialogueManager.getStatus();
      if (dialogueStatus.initialized) {
        this.currentBeat = dialogueStatus.currentStoryBeat;
      }

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.log('Story Progression Manager initialized successfully');

      // Initial music setup for current beat
      // Only update music if it's not already playing the correct playlist
      // This prevents music from restarting when navigating between screens
      this.updateMusic(this.currentBeat);

      return true;
    } catch (error) {
      console.error('Failed to initialize Story Progression Manager:', error);
      return false;
    }
  }

  /**
   * Load progression configuration from JSON
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const response = await fetchAsset('/data/story-progression-config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }

      this.config = await response.json();
      this.log('Configuration loaded:', this.config);
    } catch (error) {
      console.error('Error loading story progression configuration:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for storybeat changes
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for storybeat changes from dialogue manager
    document.addEventListener('dialogueManager:beatChanged', ((event: CustomEvent) => {
      const { newBeat, previousBeat } = event.detail;
      this.log(`Storybeat changed: ${previousBeat} → ${newBeat}`);
      this.currentBeat = newBeat;

      // Handle beat change
      this.onStoryBeatChanged(newBeat, previousBeat);
    }) as EventListener);
  }

  /**
   * Handle storybeat change - coordinate all systems
   */
  private async onStoryBeatChanged(newBeat: StoryBeat, previousBeat: StoryBeat): Promise<void> {
    if (!this.config) return;

    this.log(`Processing storybeat change to: ${newBeat}`);

    // 1. Update music
    await this.updateMusic(newBeat);

    // 2. Trigger story event (if configured)
    await this.triggerStoryEvent(newBeat);

    // 3. Load new character groups (if configured)
    await this.loadCharacterGroups(newBeat);

    // 4. Emit event for other systems (including blurb system)
    this.emit('storyProgressionChanged', {
      previousBeat,
      newBeat,
      timestamp: new Date().toISOString(),
    });

    // 5. Emit beat-specific trigger for blurb system
    // This allows story blurbs with triggers like 'story_beat_first_plot_point' to fire
    const beatTrigger = `story_beat_${newBeat}`;
    this.emit('beatTrigger', {
      trigger: beatTrigger,
      beat: newBeat,
      timestamp: new Date().toISOString(),
    });

    this.log(`Emitted beat trigger: ${beatTrigger}`);
  }

  /**
   * Check game state and advance storybeat if conditions are met
   * This is called from game logic when puzzles complete or books are discovered
   */
  public checkAndAdvanceStory(metrics: ProgressionMetrics): ProgressionCheckResult {
    if (!this.isInitialized || !this.config) {
      return {
        shouldAdvance: false,
        nextBeat: null,
        triggeredRule: null,
        reason: 'Story progression system not initialized',
      };
    }

    // Check if auto-progression is enabled
    if (!this.config.settings.enableAutoProgression) {
      return {
        shouldAdvance: false,
        nextBeat: null,
        triggeredRule: null,
        reason: 'Auto-progression is disabled',
      };
    }

    // Find applicable rule for current beat
    const applicableRule = this.findApplicableRule(this.currentBeat, metrics);

    if (!applicableRule) {
      return {
        shouldAdvance: false,
        nextBeat: null,
        triggeredRule: null,
        reason: 'No applicable rules met',
      };
    }

    // Advance the storybeat
    const success = this.advanceStorybeat(applicableRule.toBeat);

    if (success) {
      this.log(`Story advanced: ${this.currentBeat} → ${applicableRule.toBeat}`);
      return {
        shouldAdvance: true,
        nextBeat: applicableRule.toBeat,
        triggeredRule: applicableRule,
        reason: applicableRule.description,
      };
    }

    return {
      shouldAdvance: false,
      nextBeat: null,
      triggeredRule: null,
      reason: 'Failed to advance storybeat',
    };
  }

  /**
   * Find the first applicable progression rule
   */
  private findApplicableRule(
    currentBeat: StoryBeat,
    metrics: ProgressionMetrics
  ): ProgressionRule | null {
    if (!this.config) return null;

    // Filter rules that apply to current beat
    const applicableRules = this.config.progressionRules
      .filter(rule => rule.fromBeat === currentBeat)
      .sort((a, b) => a.priority - b.priority); // Sort by priority

    // Find first rule where all conditions are met
    for (const rule of applicableRules) {
      if (this.checkRuleConditions(rule, metrics)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Check if all conditions in a rule are met
   */
  private checkRuleConditions(rule: ProgressionRule, metrics: ProgressionMetrics): boolean {
    for (const [metricName, condition] of Object.entries(rule.conditions)) {
      if (!condition) continue;

      const metricValue = metrics[metricName];
      if (metricValue === undefined) continue;

      // Check min threshold
      if (condition.min !== undefined && metricValue < condition.min) {
        return false;
      }

      // Check max threshold
      if (condition.max !== undefined && metricValue > condition.max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Advance to a new storybeat
   */
  private advanceStorybeat(newBeat: StoryBeat): boolean {
    if (!this.isInitialized) {
      console.warn('Cannot advance storybeat: system not initialized');
      return false;
    }

    // Update dialogue manager (this will emit beatChanged event)
    const success = dialogueManager.setStoryBeat(newBeat);

    if (success) {
      this.currentBeat = newBeat;
    }

    return success;
  }

  /**
   * Update music based on storybeat
   */
  private async updateMusic(beat: StoryBeat): Promise<void> {
    if (!this.config) return;

    const playlistId = this.config.musicMapping.beatToPlaylist[beat];
    if (!playlistId) {
      this.log(`No music configured for beat: ${beat}`);
      return;
    }

    try {
      const fadeDuration = this.config.musicMapping.fadeDuration || 2000;

      // Check if playlist exists before trying to play
      const playlist = audioManager.getPlaylist(playlistId);
      if (!playlist) {
        this.log(`Playlist not found: ${playlistId}, skipping music change`);
        return;
      }

      // Check if playlist has any loaded tracks
      const hasLoadedTracks = playlist.tracks.some(track => {
        // Check if track is loaded by checking if it exists in audioManager's tracks
        return audioManager.getPlaylist(playlistId)?.tracks.some(t => {
          // We need to check if the track is actually loaded
          // The audioManager doesn't expose tracks directly, so we'll try to play and let it handle gracefully
          return true; // Let playPlaylist handle the check
        });
      });

      // Check current playlist - don't interrupt if it's already playing the same playlist
      const currentInfo = audioManager.getCurrentPlaylistInfo();
      if (currentInfo?.playlistId === playlistId) {
        this.log(`Playlist "${playlistId}" is already playing, skipping music change`);
        return;
      }

      // Check mute state before playing - don't play if muted
      if (audioManager.isMuted('master') || audioManager.isMuted(AudioCategory.MUSIC)) {
        this.log(`Music is muted, skipping playlist playback`);
        return;
      }

      // Try to play the playlist (it will gracefully skip if no tracks are loaded)
      await audioManager.playPlaylist(playlistId, 0, fadeDuration);
      this.log(`Music changed to playlist: ${playlistId}`);
    } catch (error) {
      console.error(`Failed to play playlist ${playlistId}:`, error);
    }
  }

  /**
   * Trigger story event for storybeat
   */
  private async triggerStoryEvent(beat: StoryBeat): Promise<void> {
    if (!this.config) return;

    const eventId = this.config.storyEventTriggers.beatToEvent[beat];
    if (!eventId) {
      this.log(`No story event configured for beat: ${beat}`);
      return;
    }

    // Check if event should only trigger once
    if (this.config.storyEventTriggers.onlyTriggerOnce && this.triggeredEvents.has(eventId)) {
      this.log(`Story event ${eventId} already triggered, skipping`);
      return;
    }

    this.log(`Triggering story event: ${eventId}`);
    this.triggeredEvents.add(eventId);

    // Emit event for UI to handle
    this.emit('storyEventTriggered', {
      eventId,
      storyBeat: beat,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Load character groups for storybeat
   */
  private async loadCharacterGroups(beat: StoryBeat): Promise<void> {
    if (!this.config) return;

    const groupsToLoad = this.config.characterGroupLoading.loadOnBeat[beat];
    if (!groupsToLoad || groupsToLoad.length === 0) {
      this.log(`No character groups to load for beat: ${beat}`);
      return;
    }

    for (const group of groupsToLoad) {
      if (!this.loadedCharacterGroups.has(group)) {
        try {
          await dialogueManager.loadCharacterGroup(group);
          this.loadedCharacterGroups.add(group);
          this.log(`Loaded character group: ${group}`);
        } catch (error) {
          console.error(`Failed to load character group ${group}:`, error);
        }
      }
    }
  }

  /**
   * Manually set storybeat (for testing or manual override)
   */
  public setStorybeat(beat: StoryBeat): boolean {
    if (!this.config?.settings.allowManualOverride) {
      console.warn('Manual override is disabled in configuration');
      return false;
    }

    return this.advanceStorybeat(beat);
  }

  /**
   * Get current status
   */
  public getStatus(): StoryProgressionStatus {
    return {
      initialized: this.isInitialized,
      currentBeat: this.currentBeat,
      autoProgressionEnabled: this.config?.settings.enableAutoProgression ?? false,
      triggeredEvents: new Set(this.triggeredEvents),
      loadedCharacterGroups: Array.from(this.loadedCharacterGroups) as LoadingGroup[],
    };
  }

  /**
   * Enable or disable auto-progression at runtime
   */
  public setAutoProgression(enabled: boolean): void {
    if (this.config) {
      this.config.settings.enableAutoProgression = enabled;
      this.log(`Auto-progression ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Reset triggered events (for testing)
   */
  public resetTriggeredEvents(): void {
    this.triggeredEvents.clear();
    this.log('Triggered events reset');
  }

  /**
   * Emit custom event
   */
  private emit(eventName: string, data: any): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent(`storyProgression:${eventName}`, {
      detail: data,
    });
    document.dispatchEvent(event);
  }

  /**
   * Log helper (respects config setting)
   */
  private log(...args: any[]): void {
    if (this.config?.settings.enableLogging) {
      console.log('[StoryProgressionManager]', ...args);
    }
  }
}

// Create and export singleton instance
export const storyProgressionManager = new StoryProgressionManager();
