/**
 * StoryEventPlayer - Orchestrates multi-character story event sequences
 * Handles dialogue progression, text chunking, and character data resolution
 */

import type { DialogueManager } from './DialogueManager';
import type { StoryEvent, StoryEventDialogue, StoryEventCharacter } from './types';
import type { CharacterData } from './types';
import type { DialogueEntry } from '@/components/dialogue/DialogueQueue';

export class StoryEventPlayer {
  private storyEvent: StoryEvent | null = null;
  private currentSequence: number = 0;
  private dialogueManager: DialogueManager;
  private playbackMode: 'auto' | 'manual' | 'hybrid' = 'manual';
  private isPaused: boolean = false;
  private onDialogueEmit?: (entry: DialogueEntry) => void;
  private onComplete?: () => void;

  constructor(dialogueManager: DialogueManager) {
    this.dialogueManager = dialogueManager;
  }

  /**
   * Load story event from DialogueManager
   */
  async loadStoryEvent(eventId: string): Promise<void> {
    const event = this.dialogueManager.getStoryEvent(eventId);
    if (!event) {
      throw new Error(`Story event not found: ${eventId}`);
    }
    
    // Validate that the loaded event ID matches the requested ID
    const loadedEventId = event.storyEvent?.id;
    if (loadedEventId !== eventId) {
      throw new Error(
        `Event ID mismatch in loadStoryEvent: requested '${eventId}' but loaded '${loadedEventId}'`
      );
    }
    
    this.storyEvent = event;
    this.currentSequence = 0;
    this.isPaused = false;
  }

  /**
   * Start playing the story event
   */
  start(): void {
    if (!this.storyEvent) {
      throw new Error('No story event loaded');
    }
    this.emitNextDialogue();
  }

  /**
   * Get next dialogue in sequence
   */
  next(): DialogueEntry | null {
    if (!this.storyEvent || this.currentSequence >= this.storyEvent.dialogue.length) {
      return null;
    }

    const dialogueData = this.storyEvent.dialogue[this.currentSequence];
    const characterId = dialogueData.speaker;

    // Look up full character data from DialogueManager
    const fullCharacterData = this.dialogueManager.getCharacterById(characterId);

    if (!fullCharacterData) {
      console.error(`Character ${characterId} not found in DialogueManager`);
      // Skip this dialogue entry
      this.currentSequence++;
      return this.next();
    }

    // Get portraitFile from story event (may override character file)
    const storyEventChar = this.storyEvent.characters.find(
      (c: StoryEventCharacter) => c.id === characterId
    );
    const portraitFile =
      storyEventChar?.portraitFile || fullCharacterData.character.portraitFile;

    // Chunk the text
    const chunks = this.chunkText(dialogueData.text);

    // Create dialogue entry
    const entry: DialogueEntry = {
      id: `${this.storyEvent.storyEvent.id}-${this.currentSequence}`,
      character: {
        id: fullCharacterData.character.id,
        name: fullCharacterData.character.name,
        title: fullCharacterData.character.title,
        portraitFile,
      },
      text: dialogueData.text,
      emotion: dialogueData.emotion[0], // Use first emotion
      chunks,
      currentChunk: 0,
    };

    this.currentSequence++;
    return entry;
  }

  /**
   * Emit next dialogue to queue
   */
  private emitNextDialogue(): void {
    if (this.isPaused) return;

    const entry = this.next();
    if (entry) {
      this.onDialogueEmit?.(entry);
    } else {
      // Story event complete
      this.onComplete?.();
    }
  }

  /**
   * Manual advancement (called by Continue button)
   */
  advance(): void {
    if (this.playbackMode === 'manual' || this.playbackMode === 'hybrid') {
      this.emitNextDialogue();
    }
  }

  /**
   * Pause/resume playback
   */
  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.emitNextDialogue();
  }

  /**
   * Reset to beginning
   */
  reset(): void {
    this.currentSequence = 0;
    this.isPaused = false;
  }

  /**
   * Status checks
   */
  getCurrentSequence(): number {
    return this.currentSequence;
  }

  isComplete(): boolean {
    return this.storyEvent
      ? this.currentSequence >= this.storyEvent.dialogue.length
      : true;
  }

  /**
   * Set callbacks
   */
  onDialogue(callback: (entry: DialogueEntry) => void): void {
    this.onDialogueEmit = callback;
  }

  onCompleted(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Apply text chunking based on dialogue config
   */
  private chunkText(text: string): string[] {
    const config = this.dialogueManager.getConfig();
    if (!config) {
      // Fallback: no chunking
      return [text];
    }

    // Detect device type (simplified - could be enhanced)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet =
      typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    const maxLength = config.display.textLimits[deviceType].maxCharsPerScreen;

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // Single sentence exceeds limit - break by words
          const words = sentence.split(' ');
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + word).length > maxLength) {
              if (wordChunk) {
                chunks.push(wordChunk.trim());
                wordChunk = word;
              } else {
                // Single word exceeds limit - just add it
                chunks.push(word);
                wordChunk = '';
              }
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word;
            }
          }
          if (wordChunk) currentChunk = wordChunk;
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Preload portraits for story event characters
   */
  async preloadPortraits(): Promise<void> {
    if (!this.storyEvent) return;

    const portraitPromises = this.storyEvent.characters
      .filter((c) => c.portraitFile)
      .map((c) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't fail if image missing
          img.src = `/images/portraits/${c.portraitFile}`;
        });
      });

    await Promise.all(portraitPromises);
  }
}