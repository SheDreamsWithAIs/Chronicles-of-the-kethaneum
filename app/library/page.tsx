'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { GenreSelectionModal } from '@/components/GenreSelectionModal';
import { useGameState } from '@/hooks/useGameState';
import { usePuzzle } from '@/hooks/usePuzzle';
import styles from './library.module.css';

export default function LibraryScreen() {
  const router = useRouter();
  const [showDialogue, setShowDialogue] = useState(false);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const { state, setState } = useGameState();
  const { loadSequential, loadAll } = usePuzzle(state, setState);

  // Restrict access to Story Mode only
  useEffect(() => {
    if (state.gameMode !== 'story') {
      // Redirect to puzzle screen for non-story modes
      router.push('/puzzle');
    }
  }, [state.gameMode, router]);

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
      return selectGenre(prevState, genre);
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

  const handleStartConversation = () => {
    setShowDialogue(true);
  };

  const handleBookOfPassage = () => {
    router.push('/book-of-passage');
  };

  const handleReturnToMenu = () => {
    router.push('/');
  };

  const handleLibraryOptions = () => {
    // Disabled for now - will open options modal when implemented
    console.log('Options menu clicked (disabled)');
  };

  return (
    <div className={styles.libraryContainer}>
      <CosmicBackground variant="library" starCount={300} particleCount={25} />
      
      <GenreSelectionModal
        isOpen={showGenreModal}
        onClose={handleCloseGenreModal}
        onSelectGenre={handleSelectGenre}
        availableGenres={availableGenres}
        kethaneumRevealed={state.kethaneumRevealed}
      />

      {showDialogue && (
        <div className={styles.dialogueOverlay} onClick={() => setShowDialogue(false)}>
          <div className={styles.dialoguePanel} onClick={(e) => e.stopPropagation()}>
            <button className={styles.dialogueClose} onClick={() => setShowDialogue(false)}>×</button>
            <div className={styles.characterPortrait}>Portrait</div>
            <div className={styles.dialogueContent}>
              <div className={styles.characterName}>Archivist Lumina</div>
              <div className={styles.dialogueText}>
                Welcome, new Assistant Archivist! I am Lumina, keeper of the western archives. The Kethaneum has chosen you for reasons that may not yet be clear, but I sense great potential within you.
              </div>
              <div className={styles.dialogueControls}>
                <button className={styles.dialogueButton} onClick={() => setShowDialogue(false)}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
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
          <button className={`${styles.libraryButton} ${styles.primary}`} onClick={handleBrowseArchives}>
            Browse the Archives
          </button>
          
          <button className={styles.libraryButton} onClick={handleStartConversation}>
            Start a Conversation
          </button>
          
          <button className={styles.libraryButton} onClick={handleBookOfPassage}>
            Look at your Book of Passage
          </button>
          
          <button className={styles.libraryButton} onClick={handleReturnToMenu}>
            Return to Main Menu
          </button>
          
          <button 
            className={`${styles.libraryButton} ${styles.disabled}`} 
            onClick={handleLibraryOptions}
            disabled
          >
            Open the Options Menu
          </button>
        </div>
      </div>
    </div>
  );
}

