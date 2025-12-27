'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { PageLoader } from '@/components/shared/PageLoader';
import { GenreSelectionModal } from '@/components/GenreSelectionModal';
import { SettingsMenu } from '@/components/SettingsMenu';
import { useGameState } from '@/hooks/useGameState';
import { usePuzzle } from '@/hooks/usePuzzle';
import { useStoryNotification } from '@/contexts/StoryNotificationContext';
import { useDialogue } from '@/hooks/dialogue/useDialogue';
import { usePageLoader } from '@/hooks/usePageLoader';
import { dialogueManager } from '@/lib/dialogue/DialogueManager';
import { StoryEventTriggerChecker } from '@/lib/dialogue/StoryEventTriggerChecker';
import { DialogueQueue, DialogueQueueRef, DialogueEntry } from '@/components/dialogue/DialogueQueue';
import { DialogueControls } from '@/components/dialogue/DialogueControls';
import { StoryEventPlayer } from '@/lib/dialogue/StoryEventPlayer';
import { chunkText } from '@/lib/dialogue/chunkText';
import styles from './library.module.css';
import dialogueStyles from '@/components/dialogue/dialogue.module.css';
import notificationStyles from '@/styles/story-notification.module.css';

export default function LibraryScreen() {
  const router = useRouter();

  // Page loading state management - initialize FIRST to show loader immediately
  const { isLoading: pageLoading, setLoading } = usePageLoader({
    minDisplayTime: 500,
  });

  const [conversationActive, setConversationActive] = useState(false);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const { state, setState, isReady: gameStateReady } = useGameState();
  const { loadSequential, loadAll } = usePuzzle(state, setState);
  const { hasNewDialogue, clearNewDialogue, setNewDialogueAvailable } = useStoryNotification();
  const { isInitialized, initialize } = useDialogue();
  const dialogueQueueRef = useRef<DialogueQueueRef | null>(null);
  const eventPlayerRef = useRef<StoryEventPlayer | null>(null);
  const currentEventIdRef = useRef<string | null>(null);
  // Track completed events immediately via ref to avoid React state timing issues
  const completedEventsRef = useRef<string[]>([]);

  // Track loading conditions - use useEffect but set immediately
  useEffect(() => {
    setLoading('gameState', !gameStateReady);
  }, [gameStateReady, setLoading]);

  useEffect(() => {
    setLoading('dialogue', !isInitialized);
  }, [isInitialized, setLoading]);

  useEffect(() => {
    // Only check puzzles if state exists
    if (state) {
      const puzzlesLoaded = state.puzzles && Object.keys(state.puzzles).length > 0;
      setLoading('puzzles', !puzzlesLoaded);
    } else {
      setLoading('puzzles', true);
    }
  }, [state, state?.puzzles, setLoading]);

  useEffect(() => {
    // Check if storyProgress exists and has required properties
    if (state) {
      const storyProgressReady = state.storyProgress &&
        typeof state.storyProgress === 'object' &&
        'currentStoryBeat' in state.storyProgress;
      setLoading('storyProgress', !storyProgressReady);
    } else {
      setLoading('storyProgress', true);
    }
  }, [state, state?.storyProgress, setLoading]);

  // Sync completed events ref with state when state loads/changes
  // Always sync, even if array is empty, to ensure ref is up-to-date
  // This ensures the ref has the latest state value for synchronous access
  useEffect(() => {
    const stateCompleted = state.dialogue?.completedStoryEvents || [];
    // Only update if different to avoid unnecessary updates
    if (completedEventsRef.current.length !== stateCompleted.length ||
      !stateCompleted.every(id => completedEventsRef.current.includes(id)) ||
      !completedEventsRef.current.every(id => stateCompleted.includes(id))) {
      completedEventsRef.current = stateCompleted;
    }
  }, [state.dialogue?.completedStoryEvents]);

  // Validate state updates match ref - detect when state doesn't persist
  // This helps catch cases where state updates fail or are reset
  useEffect(() => {
    const stateCompleted = state.dialogue?.completedStoryEvents || [];
    const refCompleted = completedEventsRef.current || [];

    // If ref has more events than state, state update may have failed
    if (refCompleted.length > stateCompleted.length) {
      const missingInState = refCompleted.filter(id => !stateCompleted.includes(id));
      if (missingInState.length > 0) {
        console.error('[Library] State validation failed: ref has completed events not in state', {
          refCompleted,
          stateCompleted,
          missingInState,
        });
      }
    }

    // If state has events not in ref, sync ref (state is authoritative)
    if (stateCompleted.length > refCompleted.length) {
      const missingInRef = stateCompleted.filter(id => !refCompleted.includes(id));
      if (missingInRef.length > 0) {
        console.warn('[Library] State has events not in ref, syncing ref', {
          stateCompleted,
          refCompleted,
          missingInRef,
        });
        completedEventsRef.current = [...stateCompleted];
      }
    }
  }, [state.dialogue?.completedStoryEvents]);

  // Check for available story events when library loads (including after refresh)
  // This restores the notification state after page refresh
  // Uses StoryEventTriggerChecker to properly check if events are available based on game state
  useEffect(() => {
    // Wait for game state to be ready before checking
    if (!state.storyProgress || !dialogueManager.getInitialized()) return;

    // Use StoryEventTriggerChecker to check if any events are currently available
    // This checks if trigger conditions are currently satisfied (not transitions)
    const triggeredEventIds = StoryEventTriggerChecker.checkCurrentlyAvailableEvents(state);

    // Filter out completed events
    const completedEvents = completedEventsRef.current.length > 0
      ? completedEventsRef.current
      : (state.dialogue?.completedStoryEvents || []);

    const availableEventIds = triggeredEventIds.filter(
      eventId => !completedEvents.includes(eventId)
    );

    if (availableEventIds.length > 0) {
      setNewDialogueAvailable();
    } else {
      // No available events - clear notification if it exists
      clearNewDialogue();
    }
  }, [state.storyProgress?.currentStoryBeat, state.dialogue?.completedStoryEvents, state.completedPuzzlesByGenre, setNewDialogueAvailable, clearNewDialogue]);

  // Note: We don't clear the notification when visiting the library anymore
  // The notification will persist until the player actually starts the conversation
  // This ensures it survives page refreshes

  // Restrict access to Story Mode only
  useEffect(() => {
    if (state.gameMode !== 'story') {
      // Redirect to puzzle screen for non-story modes
      router.push('/puzzle');
    }
  }, [state.gameMode, router]);

  // Initialize dialogue system
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Load puzzles on mount if not already loaded
  useEffect(() => {
    if (!state.puzzles || Object.keys(state.puzzles).length === 0) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleBrowseArchives = () => {
    setShowGenreModal(true);
  };

  const handleSelectGenre = async (genre: string) => {
    setShowGenreModal(false);

    // Ensure puzzles are loaded
    if (!state.puzzles || Object.keys(state.puzzles).length === 0) {
      await loadAll();
    }

    // Get updated state after loadAll (it updates state internally)
    // We need to wait a tick for state to update
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify genre exists and update state using the new selection system
    setState(prevState => {
      if (!prevState.puzzles || !prevState.puzzles[genre] || prevState.puzzles[genre].length === 0) {
        console.error(`Genre "${genre}" not found. Available genres:`, Object.keys(prevState.puzzles || {}));
        return prevState; // Don't update if genre not found
      }

      // Import and use the selectGenre function from puzzle selector
      // Note: This will be a dynamic import since we're in a setState callback
      const { selectGenre } = require('@/lib/game/puzzleSelector');
      const updatedState = selectGenre(prevState, genre);

      // Check if we're selecting the same genre with an incomplete puzzle
      const isSameGenre = prevState.currentGenre === genre;
      const hasValidPuzzleIndex = prevState.currentPuzzleIndex !== undefined &&
        prevState.currentPuzzleIndex >= 0;
      let shouldClearCurrentState = true;
      let shouldPreserveBook = false;

      if (isSameGenre && hasValidPuzzleIndex && prevState.puzzles[genre]) {
        const currentPuzzle = prevState.puzzles[genre][prevState.currentPuzzleIndex];
        const completedSet = prevState.completedPuzzlesByGenre?.[genre];
        const isCompleted = currentPuzzle &&
          completedSet &&
          completedSet.has(currentPuzzle.title);

        if (!isCompleted) {
          // Puzzle is incomplete - keep current state so restore logic can load same puzzle
          shouldClearCurrentState = false;
        } else {
          // Puzzle is completed - preserve currentBook so selector can continue the book series
          // Clear puzzleIndex and storyPart so restore logic doesn't trigger
          shouldClearCurrentState = false;
          shouldPreserveBook = true;
        }
      }

      // Clear the grid to force puzzle page to load a new puzzle
      // This ensures loadPuzzleForMode doesn't return early due to existing grid
      const clearedState = {
        ...updatedState,
        grid: [],
        wordList: [],
        selectedCells: [],
        gameOver: false,
        ...(shouldClearCurrentState ? {
          // Different genre or no saved puzzle - clear everything
          currentGenre: '',
          currentBook: '',
          currentPuzzleIndex: -1,
          currentStoryPart: -1,
        } : shouldPreserveBook ? {
          // Completed puzzle + same genre - preserve book, clear puzzle index and story part
          currentPuzzleIndex: -1,
          currentStoryPart: -1,
          // currentBook and currentGenre are preserved from updatedState
        } : {
          // Incomplete puzzle - preserve everything (no clearing needed)
        }),
      };

      return clearedState;
    });

    // Wait for state update, then navigate
    await new Promise(resolve => setTimeout(resolve, 0));
    router.push('/puzzle');
  };

  const handleCloseGenreModal = () => {
    setShowGenreModal(false);
  };

  // Get available genres from loaded puzzles
  const availableGenres = Object.keys(state.puzzles || {}).filter(
    genre => state.puzzles[genre] && state.puzzles[genre].length > 0
  );

  const handleStartConversation = async () => {
    if (!dialogueManager) {
      console.error('[Library] Dialogue system not ready');
      return;
    }

    setConversationActive(true);

    // Wait for DialogueQueue to mount and ref to be available
    // Use multiple requestAnimationFrame calls and a small timeout to ensure React has rendered
    let retries = 0;
    while (!dialogueQueueRef.current && retries < 10) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      retries++;
    }

    // Final check with a small timeout as fallback
    if (!dialogueQueueRef.current) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!dialogueQueueRef.current) {
      console.error('DialogueQueue ref not available after waiting');
      setConversationActive(false);
      return;
    }

    // CRITICAL: Clear the queue before starting any new conversation (story event or banter)
    // This ensures old panels from previous conversations don't persist
    try {
      dialogueQueueRef.current.clear();
    } catch (error) {
      console.error('[Library] Error clearing dialogue queue:', error);
      // Continue anyway - better to have stale panels than to fail completely
    }
    // Don't clear notification here - it should only clear when ALL unlocked story events are completed

    const currentBeat = state.storyProgress?.currentStoryBeat || 'hook';

    try {
      // Check for available story events first (filter out completed ones)
      // State is the source of truth (persisted), but ref may have more recent updates
      // Use union of both to ensure we don't miss any completed events
      const stateCompleted = state.dialogue?.completedStoryEvents || [];
      const refCompleted = completedEventsRef.current || [];

      // If ref has more events than state, it means state hasn't updated yet
      // In this case, use ref as source of truth (it was updated synchronously)
      // Otherwise, use state (it's persisted and authoritative)
      const allCompleted = Array.from(new Set([...stateCompleted, ...refCompleted]));

      // Update ref to match state if state has more (state is authoritative for persistence)
      // But don't overwrite ref if it has more recent data (state update pending)
      if (stateCompleted.length >= refCompleted.length) {
        // State has equal or more - state is authoritative, sync ref
        completedEventsRef.current = [...stateCompleted];
      } else {
        // Ref has more - state update is pending, keep ref but it will sync via useEffect
        // Don't overwrite ref here, let useEffect handle it when state catches up
      }

      // Use the union to ensure we don't miss any completed events
      const completedEvents = allCompleted.length > 0 ? allCompleted : stateCompleted;

      // Check for available story events

      // Validate completedEvents is an array
      if (!Array.isArray(completedEvents)) {
        console.error('[Library] completedEvents is not an array:', completedEvents);
        throw new Error('completedEvents must be an array');
      }

      // Get available event, filtering out completed ones
      // Now uses StoryEventTriggerChecker internally to verify trigger conditions
      let availableEvent: any = null;
      try {
        // Defensive check: ensure completedEvents is valid before querying
        if (!Array.isArray(completedEvents)) {
          throw new Error(`completedEvents must be an array, got: ${typeof completedEvents}`);
        }

        availableEvent = dialogueManager.getAvailableStoryEvent(state, completedEvents);

        // Validate event structure if one was returned
        if (availableEvent) {
          const eventId = availableEvent.storyEvent?.id;
          if (!eventId) {
            throw new Error('Available event missing storyEvent.id');
          }

          // CRITICAL: Double-check that returned event is not completed
          const isCompleted = completedEvents.includes(eventId);
          if (isCompleted) {
            const error = new Error(
              `Event '${eventId}' is marked as completed (in: ${JSON.stringify(completedEvents)}) but was returned by getAvailableStoryEvent. This should never happen.`
            );
            console.error('[Library] CRITICAL ERROR:', error);
            // Clean up and end conversation on error
            setConversationActive(false);
            throw error;
          }

        }
      } catch (error) {
        console.error('[Library] Error getting available story event:', error);
        // Clean up and end conversation on error
        setConversationActive(false);
        throw error;
      }

      if (availableEvent) {
        // Validate event structure before proceeding
        const eventId = availableEvent.storyEvent?.id;
        if (!eventId) {
          throw new Error('Available event missing storyEvent.id');
        }

        // Play story event sequence
        const player = new StoryEventPlayer(dialogueManager);
        currentEventIdRef.current = eventId;

        // Set up dialogue callback BEFORE loading/starting
        player.onDialogue((entry: DialogueEntry) => {
          try {
            if (!entry || !entry.id) {
              console.error('[Library] Invalid dialogue entry received:', entry);
              return;
            }

            if (dialogueQueueRef.current) {
              dialogueQueueRef.current.addDialogue(entry);
            } else {
              console.error('[Library] dialogueQueueRef.current is null when trying to add dialogue!');
              // Try to recover - end conversation if ref is lost
              setConversationActive(false);
            }
          } catch (error) {
            console.error('[Library] Error in onDialogue callback:', error);
            // End conversation on error to prevent stuck state
            setConversationActive(false);
          }
        });

        player.onCompleted(async () => {
          try {
            // Mark event as completed in game state immediately
            if (!currentEventIdRef.current) {
              console.error('[Library] onCompleted called but currentEventIdRef is null!');
              setConversationActive(false);
              return;
            }

            const completedId = currentEventIdRef.current;

            // Mark event as completed and check for remaining events
            try {
              // Validate completedId is valid
              if (!completedId || typeof completedId !== 'string') {
                throw new Error(`Invalid completedId: ${completedId}`);
              }

              setState((prevState) => {
                try {
                  // Ensure dialogue object exists
                  const prevDialogue = prevState.dialogue || {};
                  const completedEvents = prevDialogue.completedStoryEvents || [];

                  // Validate completedEvents is an array
                  if (!Array.isArray(completedEvents)) {
                    const error = new Error(
                      `prevState.dialogue.completedStoryEvents is not an array: ${typeof completedEvents}, value: ${JSON.stringify(completedEvents)}`
                    );
                    console.error('[Library] State validation error:', error);
                    // Return previous state on error to prevent corruption
                    return prevState;
                  }

                  // Check if already completed (shouldn't happen, but defensive)
                  const wasAlreadyCompleted = completedEvents.includes(completedId);
                  if (wasAlreadyCompleted) {
                    console.warn(`[Library] Event '${completedId}' was already marked as completed, skipping update`);
                    return prevState;
                  }

                  // Calculate updated completed events list
                  const updatedCompletedEvents = [...completedEvents, completedId];

                  // Validate the updated array
                  if (!Array.isArray(updatedCompletedEvents)) {
                    throw new Error('Failed to create updated completed events array');
                  }

                  // Build updated state for checking remaining events
                  // Use prevState from setState callback which has the latest state
                  const updatedStateForCheck = {
                    ...prevState,
                    dialogue: {
                      ...prevDialogue,
                      completedStoryEvents: updatedCompletedEvents,
                    },
                  };

                  try {
                    // Get remaining events (already filtered by completion and trigger conditions)
                    const remainingEvents = dialogueManager.getAvailableStoryEvents(updatedStateForCheck, updatedCompletedEvents);

                    // Clear notification if all unlocked events are done
                    if (remainingEvents.length === 0) {
                      setTimeout(() => {
                        try {
                          clearNewDialogue();
                        } catch (error) {
                          console.error('[Library] Error clearing notification:', error);
                        }
                      }, 0);
                    }
                  } catch (error) {
                    console.error('[Library] Error checking remaining events:', error);
                    // Don't throw - this is non-critical
                  }

                  // Update ref immediately for synchronous access
                  completedEventsRef.current = updatedCompletedEvents;

                  // Always return updated state to ensure persistence
                  // Initialize dialogue object if it doesn't exist
                  const newState = {
                    ...prevState,
                    dialogue: {
                      ...prevDialogue,
                      completedStoryEvents: updatedCompletedEvents,
                      // Mark library as visited when first-visit completes
                      hasVisitedLibrary: completedId === 'first-visit'
                        ? true
                        : prevDialogue.hasVisitedLibrary ?? false,
                    },
                  };

                  // Validate new state structure
                  if (!newState.dialogue || !Array.isArray(newState.dialogue.completedStoryEvents)) {
                    throw new Error('Failed to create valid new state with dialogue');
                  }

                  return newState;
                } catch (error) {
                  console.error('[Library] Error in setState callback:', error);
                  // Return previous state on error to prevent corruption
                  return prevState;
                }
              });

              // Wait for state to propagate and save
              await new Promise(resolve => setTimeout(resolve, 100));

              // Verify ref was updated
              if (!completedEventsRef.current.includes(completedId)) {
                const error = new Error(
                  `completedEventsRef was not updated! Expected '${completedId}' in ${JSON.stringify(completedEventsRef.current)}`
                );
                console.error('[Library] CRITICAL:', error);
                throw error;
              }


            } catch (error) {
              console.error('[Library] Error updating state:', error);
              // Re-throw to ensure error is handled upstream
              throw error;
            }

            // Wait a moment for state update and to ensure dialogue has been displayed
            await new Promise(resolve => setTimeout(resolve, 200));

            // Clear the dialogue queue
            try {
              if (dialogueQueueRef.current) {
                dialogueQueueRef.current.clear();
              }
            } catch (error) {
              console.error('[Library] Error clearing dialogue queue:', error);
            }

            // Clean up and end conversation
            currentEventIdRef.current = null;
            eventPlayerRef.current = null;

            // Small delay before ending conversation to prevent race conditions
            await new Promise(resolve => setTimeout(resolve, 50));
            setConversationActive(false);
          } catch (error) {
            console.error('[Library] Error in onCompleted callback:', error);
            // Ensure conversation ends even on error
            setConversationActive(false);
            currentEventIdRef.current = null;
            eventPlayerRef.current = null;
          }
        });

        // Load and validate event with error handling
        try {
          await player.loadStoryEvent(eventId);
          // loadStoryEvent() validates the event ID internally and throws if mismatch
          eventPlayerRef.current = player;
        } catch (error) {
          console.error('[Library] Error loading story event:', error);
          // Clean up state on error
          currentEventIdRef.current = null;
          eventPlayerRef.current = null;
          setConversationActive(false);

          // Re-throw to prevent further execution
          throw error;
        }

        // Ensure ref is still available before starting
        if (!dialogueQueueRef.current) {
          console.error('[Library] DialogueQueue ref lost before starting player');
          setConversationActive(false);
          currentEventIdRef.current = null;
          eventPlayerRef.current = null;
          return;
        }

        // Verify story event has dialogue entries before starting
        if (!availableEvent.dialogue || availableEvent.dialogue.length === 0) {
          console.error('[Library] Story event has no dialogue entries:', eventId);
          setConversationActive(false);
          currentEventIdRef.current = null;
          eventPlayerRef.current = null;
          return;
        }

        // Start the player immediately - this will emit the first dialogue via emitNextDialogue()
        // The callback will add it to the queue, making the panel appear right away
        try {
          player.start();
        } catch (error) {
          console.error('[Library] Error starting story event player:', error);
          setConversationActive(false);
          currentEventIdRef.current = null;
          eventPlayerRef.current = null;
          throw error;
        }

        // Preload portraits in the background (non-blocking) - portraits will appear when ready
        player.preloadPortraits().catch((error) => {
          console.error('[Library] Error preloading portraits:', error);
          // Don't block dialogue if portraits fail to load
        });

        // Give the dialogue time to be added to the queue
        // The callback should fire synchronously, but give it a moment to process
        await new Promise(resolve => setTimeout(resolve, 150));

        // Verify dialogue was added (debugging)
        if (!dialogueQueueRef.current) {
          console.warn('[Library] DialogueQueue ref lost after starting player');
          setConversationActive(false);
          currentEventIdRef.current = null;
          eventPlayerRef.current = null;
        }
      } else {
        // Show random character banter
        try {
          const banter = dialogueManager.getRandomBanter(currentBeat);

          if (!banter || !banter.success || !banter.dialogue) {
            console.error('[Library] Failed to get banter:', banter?.error || 'Unknown error');
            setConversationActive(false);
            return;
          }

          const characterData = dialogueManager.getCharacterById(banter.dialogue.characterId);
          if (!characterData) {
            console.error(`[Library] Character ${banter.dialogue.characterId} not found for banter`);
            setConversationActive(false);
            return;
          }

          // Apply smart chunking to banter text with error handling
          let chunks: string[];
          try {
            chunks = chunkText(banter.dialogue.text);
            if (!chunks || chunks.length === 0) {
              console.warn('[Library] Chunking returned empty array for banter, using original text');
              chunks = [banter.dialogue.text];
            }
          } catch (error) {
            console.error('[Library] Error chunking banter text:', error);
            // Fallback: use original text as single chunk
            chunks = [banter.dialogue.text];
          }

          const entry: DialogueEntry = {
            id: `banter-${Date.now()}`,
            character: {
              id: characterData.character.id,
              name: characterData.character.name,
              title: characterData.character.title,
              portraitFile: characterData.character.portraitFile,
            },
            text: banter.dialogue.text,
            emotion: banter.dialogue.emotion[0],
            chunks,
            currentChunk: 0,
          };


          if (dialogueQueueRef.current) {
            dialogueQueueRef.current.addDialogue(entry);

            // Give dialogue time to be added to queue
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.error('[Library] DialogueQueue ref is null when trying to add banter');
            setConversationActive(false);
            return;
          }
        } catch (error) {
          console.error('[Library] Error showing banter:', error);
          setConversationActive(false);
        }
      }
    } catch (error) {
      console.error('[Library] Error starting conversation:', error);
      // Clean up on error
      setConversationActive(false);
      currentEventIdRef.current = null;
      eventPlayerRef.current = null;
      // Try to clear queue if ref is available
      try {
        dialogueQueueRef.current?.clear();
      } catch (clearError) {
        console.error('[Library] Error clearing queue on error:', clearError);
      }
    }
  };

  const handleContinueDialogue = () => {
    if (!eventPlayerRef.current) {
      // No event player means this is banter - just end the conversation and clear queue
      // No event player (banter), ending conversation
      dialogueQueueRef.current?.clear();
      setConversationActive(false);
      return;
    }

    // CRITICAL: Always call advance() - it will trigger onComplete() when next() returns null
    // The previous check for isComplete() was preventing onComplete() from being called
    // because isComplete() becomes true after the last dialogue is returned, but we still
    // need to call advance() one more time to trigger the completion callback
    // Call advance() - this will call emitNextDialogue(), which calls next()
    // When next() returns null (no more dialogue), emitNextDialogue() calls onComplete()
    eventPlayerRef.current.advance();
  };

  const handleEndConversation = () => {
    setConversationActive(false);
    dialogueQueueRef.current?.clear();
    eventPlayerRef.current = null;
    currentEventIdRef.current = null;
  };

  const handleBookOfPassage = () => {
    router.push('/book-of-passage');
  };

  const handleReturnToMenu = () => {
    router.push('/');
  };

  const handleLibrarySettings = () => {
    setShowSettingsMenu(true);
  };

  return (
    <div className={styles.libraryContainer}>
      <PageLoader
        isLoading={pageLoading}
        variant="library"
        message="Loading the Library Archives..."
      />
      <CosmicBackground variant="library" starCount={300} particleCount={25} />

      <GenreSelectionModal
        isOpen={showGenreModal}
        onClose={handleCloseGenreModal}
        onSelectGenre={handleSelectGenre}
        availableGenres={availableGenres}
        kethaneumRevealed={state.kethaneumRevealed}
      />

      {/* Always render DialogueQueue so ref is available, control visibility with isActive */}
      <DialogueQueue
        ref={dialogueQueueRef}
        isActive={conversationActive}
        onQueueEmpty={handleEndConversation}
        onContinue={handleContinueDialogue}
      />
      {conversationActive && (
        <>
          <div
            className={dialogueStyles.dialogueOverlay}
            onClick={handleEndConversation}
            data-testid="dialogue-overlay"
          />
          <div className={dialogueStyles.dialogueControlsOverlay}>
            <DialogueControls
              onContinue={() => {
                dialogueQueueRef.current?.handleContinue();
              }}
              disabled={!dialogueQueueRef.current}
            />
          </div>
        </>
      )}

      <div className={styles.libraryScreen}>
        <h1 className={styles.screenTitle}>The Library Archives</h1>

        <div className={styles.libraryArtContainer}>
          <div className={styles.libraryArtPlaceholder}>
            [ Library Artwork Will Display Here ]<br />
            <span style={{ fontSize: '16px', opacity: 0.5 }}>Vast halls of cosmic knowledge stretching into infinity</span>
          </div>
        </div>

        <div className={styles.libraryActions}>
          <button
            className={`${styles.libraryButton} ${styles.primary}`}
            onClick={handleBrowseArchives}
            data-testid="browse-archives-btn"
          >
            Browse the Archives
          </button>

          <button
            className={`${styles.libraryButton} ${hasNewDialogue ? notificationStyles.storyNotificationGlowExternal : ''}`}
            onClick={handleStartConversation}
            title={hasNewDialogue ? 'New story event waiting!' : undefined}
            data-testid="start-conversation-btn"
          >
            Start a Conversation
          </button>

          <button className={styles.libraryButton} onClick={handleBookOfPassage}>
            Look at your Book of Passage
          </button>

          <button className={styles.libraryButton} onClick={handleReturnToMenu}>
            Return to Main Menu
          </button>

          <button
            className={styles.libraryButton}
            onClick={handleLibrarySettings}
          >
            Open Settings
          </button>
        </div>
      </div>

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        onNavigateToTitle={() => router.push('/')}
        context="library"
        onReturnToLibrary={() => {
          // Already on library screen, just close menu
        }}
      />
    </div>
  );
}
