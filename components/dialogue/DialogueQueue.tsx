'use client';

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { DialoguePanel, DialoguePanelProps } from './DialoguePanel';
import styles from './dialogue.module.css';

export interface DialogueEntry {
  id: string;
  character: {
    id: string;
    name: string;
    title?: string;
    portraitFile?: string;
  };
  text: string;
  emotion?: string;
  chunks?: string[];
  currentChunk?: number;
}

type AnimationState = 'entering' | 'active' | 'shifting' | 'exiting';

interface DialogueQueueProps {
  isActive: boolean;
  onQueueEmpty?: () => void;
  onContinue?: () => void;
}

export interface DialogueQueueRef {
  addDialogue: (entry: DialogueEntry) => void;
  handleContinue: () => void;
  clear: () => void;
}

const ANIMATION_DURATIONS = {
  panelEnter: 500,
  panelShift: 500,
  panelExit: 500,
  stagger: 100,
};

export const DialogueQueue = forwardRef<DialogueQueueRef, DialogueQueueProps>(
  ({ isActive, onQueueEmpty, onContinue }, ref) => {
    const [queue, setQueue] = useState<DialogueEntry[]>([]);
    const [animationStates, setAnimationStates] = useState<Map<string, AnimationState>>(new Map());
    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionLockRef = useRef(false);
    const pendingDialogueRef = useRef<DialogueEntry | null>(null);
    const hadDialogueRef = useRef(false);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addDialogue: (entry: DialogueEntry) => {
        addDialogue(entry);
      },
      handleContinue: () => {
        handleContinue();
      },
      clear: () => {
        clear();
      },
    }));

    const setAnimationState = (entryId: string, state: AnimationState) => {
      setAnimationStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(entryId, state);
        return newMap;
      });
    };

    const addDialogue = async (entry: DialogueEntry) => {
      try {
        // Validate entry
        if (!entry || !entry.id || !entry.character || !entry.text) {
          console.error('[DialogueQueue] Invalid dialogue entry:', entry);
          return;
        }

        // Prevent duplicate entries
        if (queue.some(e => e.id === entry.id)) {
          console.warn(`[DialogueQueue] Duplicate entry ignored: ${entry.id}`);
          return;
        }

        if (transitionLockRef.current) {
          // Queue the dialogue to be added after transition completes
          // Only queue if it's not already pending
          if (!pendingDialogueRef.current || pendingDialogueRef.current.id !== entry.id) {
            pendingDialogueRef.current = entry;
          }
          return;
        }

        setIsTransitioning(true);
        transitionLockRef.current = true;

        if (queue.length >= 2) {
          // Remove oldest (top) panel
          const topEntry = queue[0];
        setAnimationState(topEntry.id, 'exiting');
        
        // Shift middle panel up
        const middleEntry = queue[1];
        setAnimationState(middleEntry.id, 'shifting');

        // Wait for stagger delay
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATIONS.stagger));

        // Add new panel at bottom
        const newQueue = [queue[1], entry];
        setQueue(newQueue);
        setAnimationState(entry.id, 'entering');

        // Clean up after animations complete
        // Add small delay to ensure flexbox has repositioned before removing transform
        setTimeout(() => {
          // Use requestAnimationFrame to ensure DOM has updated
          requestAnimationFrame(() => {
            setAnimationState(middleEntry.id, 'active');
            setAnimationState(entry.id, 'active');
            // Remove top entry from animation states
            setAnimationStates((prev) => {
              const newMap = new Map(prev);
              newMap.delete(topEntry.id);
              return newMap;
            });
            setIsTransitioning(false);
            transitionLockRef.current = false;
            
            // Process any pending dialogue
            if (pendingDialogueRef.current) {
              const pending = pendingDialogueRef.current;
              pendingDialogueRef.current = null;
              addDialogue(pending);
            }
          });
          }, ANIMATION_DURATIONS.panelEnter);
        } else if (queue.length === 1) {
          // Shift existing panel up
          const existingEntry = queue[0];
          
          // Update queue order FIRST so flexbox can reposition naturally
          const newQueue = [queue[0], entry];
          setQueue(newQueue);
          
          // Apply shift state (opacity fade) immediately
          setAnimationState(existingEntry.id, 'shifting');

          // Wait for stagger delay
          await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATIONS.stagger));

          // Add new panel animation
          setAnimationState(entry.id, 'entering');

          // Clean up after animations complete
          setTimeout(() => {
            setAnimationState(existingEntry.id, 'active');
            setAnimationState(entry.id, 'active');
            setIsTransitioning(false);
            transitionLockRef.current = false;
            
            // Process any pending dialogue
            if (pendingDialogueRef.current) {
              const pending = pendingDialogueRef.current;
              pendingDialogueRef.current = null;
              addDialogue(pending);
            }
          }, ANIMATION_DURATIONS.panelEnter);
        } else {
          // First panel
          console.log('[DialogueQueue] Adding first panel to empty queue');
          hadDialogueRef.current = true; // Mark that we've had dialogue
          setQueue([entry]);
          setAnimationState(entry.id, 'entering');

          // Clean up after animation completes
          setTimeout(() => {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
              setAnimationState(entry.id, 'active');
              setIsTransitioning(false);
              transitionLockRef.current = false;
              
              // Process any pending dialogue
              if (pendingDialogueRef.current) {
                const pending = pendingDialogueRef.current;
                pendingDialogueRef.current = null;
                addDialogue(pending);
              }
            });
          }, ANIMATION_DURATIONS.panelEnter);
        }
      } catch (error) {
        console.error('[DialogueQueue] Error adding dialogue:', error);
        // Reset transition state on error
        setIsTransitioning(false);
        transitionLockRef.current = false;
        // Try to recover by clearing pending dialogue
        pendingDialogueRef.current = null;
      }
    };

    const updatePanelChunk = (entryId: string, newChunkIndex: number) => {
      setQueue((prevQueue) =>
        prevQueue.map((entry) =>
          entry.id === entryId
            ? { ...entry, currentChunk: newChunkIndex }
            : entry
        )
      );
    };

    const getCurrentChunkText = (entry: DialogueEntry): string => {
      if (entry.chunks && entry.chunks.length > 0) {
        const chunkIndex = entry.currentChunk ?? 0;
        return entry.chunks[chunkIndex] || entry.text;
      }
      return entry.text;
    };

    const handleContinue = () => {
      console.log('[DialogueQueue] handleContinue called', {
        isTransitioning,
        queueLength: queue.length,
      });
      if (isTransitioning || queue.length === 0) {
        console.log('[DialogueQueue] handleContinue early return', {
          isTransitioning,
          queueLength: queue.length,
        });
        return;
      }

      const bottomPanel = queue[queue.length - 1];
      console.log('[DialogueQueue] Bottom panel:', {
        id: bottomPanel.id,
        hasChunks: !!bottomPanel.chunks,
        currentChunk: bottomPanel.currentChunk,
        chunksLength: bottomPanel.chunks?.length,
      });

      // Check if bottom panel has more chunks
      if (bottomPanel.chunks && bottomPanel.currentChunk !== undefined) {
        const currentChunk = bottomPanel.currentChunk;
        if (currentChunk < bottomPanel.chunks.length - 1) {
          // Show next chunk
          console.log('[DialogueQueue] Advancing chunk', currentChunk + 1);
          updatePanelChunk(bottomPanel.id, currentChunk + 1);
          return;
        }
      }

      // No more chunks, trigger parent to advance dialogue
      console.log('[DialogueQueue] No more chunks, calling onContinue');
      onContinue?.();
    };

    const clear = () => {
      console.log('[DialogueQueue] clear() called', {
        queueLength: queue.length,
        hadDialogue: hadDialogueRef.current,
        isTransitioning,
      });
      setQueue([]);
      setAnimationStates(new Map());
      setIsTransitioning(false);
      transitionLockRef.current = false;
      hadDialogueRef.current = false; // Reset when explicitly cleared
    };

    // Track when queue has had dialogue
    useEffect(() => {
      if (queue.length > 0) {
        console.log('[DialogueQueue] Queue has content, setting hadDialogue=true', {
          queueLength: queue.length,
          entryIds: queue.map(e => e.id),
        });
        hadDialogueRef.current = true;
      }
    }, [queue.length]);

    // Reset hadDialogue when conversation becomes inactive
    useEffect(() => {
      if (!isActive) {
        console.log('[DialogueQueue] Conversation inactive, resetting hadDialogue');
        hadDialogueRef.current = false;
      }
    }, [isActive]);

    // Check if queue becomes empty and notify parent
    // Only fire if queue had content before becoming empty (prevents firing on initial empty state)
    useEffect(() => {
      console.log('[DialogueQueue] Queue state check', {
        isActive,
        queueLength: queue.length,
        isTransitioning,
        hadDialogue: hadDialogueRef.current,
      });

      if (isActive && hadDialogueRef.current && queue.length === 0 && !isTransitioning) {
        console.log('[DialogueQueue] Queue became empty after having content - calling onQueueEmpty');
        onQueueEmpty?.();
      } else if (isActive && queue.length === 0 && !hadDialogueRef.current && !isTransitioning) {
        console.log('[DialogueQueue] Queue is empty but never had content - NOT calling onQueueEmpty (preventing premature close)');
      }
    }, [queue.length, isActive, isTransitioning, onQueueEmpty]);

    if (!isActive || queue.length === 0) {
      return null;
    }

    return (
      <div className={styles.dialogueQueueContainer}>
        {queue.map((entry, index) => {
          const animationState = animationStates.get(entry.id) || 'active';
          const position = index === 0 ? 'top' : 'bottom';
          // Use combination of entry.id and index to ensure unique keys
          const uniqueKey = `${entry.id}-${index}`;

          return (
            <DialoguePanel
              key={uniqueKey}
              character={entry.character}
              dialogueText={getCurrentChunkText(entry)}
              emotion={entry.emotion}
              animationState={animationState}
              position={position}
              currentChunk={entry.currentChunk}
              totalChunks={entry.chunks?.length}
              onAnimationComplete={() => {
                // Animation completion handled in addDialogue
              }}
            />
          );
        })}
      </div>
    );
  }
);

DialogueQueue.displayName = 'DialogueQueue';