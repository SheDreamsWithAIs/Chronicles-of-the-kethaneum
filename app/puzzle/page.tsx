'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { GameStatsModal } from '@/components/GameStatsModal';
import { GenreCompletionModal } from '@/components/GenreCompletionModal';
import { useGameState } from '@/hooks/useGameState';
import { usePuzzle } from '@/hooks/usePuzzle';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameModeHandlers } from '@/hooks/useGameModeHandlers';
import { usePuzzleLoading } from '@/hooks/usePuzzleLoading';
import { useStoryTimer, usePuzzleOnlyTimer, useBeatTheClockTimer } from '@/hooks/useTimer';
import { startBeatTheClockRun, endBeatTheClockRun } from '@/lib/game/logic';
import { getConfig } from '@/lib/core/config';
import type { Cell } from '@/lib/game/state';
import styles from './puzzle.module.css';

export default function PuzzleScreen() {
  const router = useRouter();
  const { state, setState, isReady } = useGameState();
  const { loadSequential, loadAll, initialize, loadRandom, restorePuzzleOnly, loadBeatTheClock, loadWithSelection, markCompleted } = usePuzzle(state, setState);
  const config = getConfig();
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsModalIsWin, setStatsModalIsWin] = useState(false);
  const [showGenreCompletionModal, setShowGenreCompletionModal] = useState(false);
  const [puzzleStartTime, setPuzzleStartTime] = useState<number | null>(null);
  // Track if we're transitioning between puzzles to prevent timer restart
  const isTransitioningRef = useRef(false);
  
  // Wrapper for loadBeatTheClock that sets transition flag
  const loadBeatTheClockWithTransition = useCallback(async () => {
    isTransitioningRef.current = true;
    console.log('[puzzle.page] Setting transition flag - loading puzzle');
    try {
      const result = await loadBeatTheClock();
      // Wait a tick for state to update before clearing flag
      await new Promise(resolve => setTimeout(resolve, 0));
      isTransitioningRef.current = false;
      console.log('[puzzle.page] Clearing transition flag - puzzle loaded');
      return result;
    } catch (error) {
      isTransitioningRef.current = false;
      console.log('[puzzle.page] Clearing transition flag - error loading puzzle');
      throw error;
    }
  }, [loadBeatTheClock]);
  
  // Use mode-specific handlers hook
  const { handleWin, handleLose, handleRunTimerExpired, updateStateRef } = useGameModeHandlers({
    state,
    setState,
    puzzleStartTime,
    loadBeatTheClock: loadBeatTheClockWithTransition,
    setPuzzleStartTime,
    setStatsModalIsWin,
    setShowStatsModal,
    markCompleted,
  });
  
  // Use puzzle loading hook
  const { loadPuzzleForMode } = usePuzzleLoading({
    state,
    setState,
    isReady,
    loadAll,
    loadBeatTheClock: loadBeatTheClockWithTransition,
    loadRandom,
    restorePuzzleOnly,
    loadSequential,
    loadWithSelection,
    initialize,
    setPuzzleStartTime,
    router,
  });
  
  // Get game logic functions (word selection only - timer logic is separate)
  const { checkWord } = useGameLogic(
    state,
    setState,
    handleWin,
    handleLose,
    handleRunTimerExpired,
    updateStateRef
  );
  
  // Get mode-specific timer hooks
  const storyTimer = useStoryTimer(state, setState);
  const puzzleOnlyTimer = usePuzzleOnlyTimer(state, setState, handleLose);
  const beatTheClockTimer = useBeatTheClockTimer(state, setState, handleLose, handleRunTimerExpired);
  
  // Select appropriate timer based on game mode (memoized to prevent recreation)
  const timer = useMemo(() => {
    return state.gameMode === 'story' 
      ? storyTimer 
      : state.gameMode === 'puzzle-only' 
      ? puzzleOnlyTimer 
      : beatTheClockTimer;
  }, [state.gameMode, storyTimer, puzzleOnlyTimer, beatTheClockTimer]);

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [storyOpen, setStoryOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Use refs to track selection during drag without causing re-renders
  const selectedCellsRef = useRef<Set<string>>(new Set());
  const isDraggingRef = useRef(false);

  // Expose game state to window for Cypress testing (development only)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__GAME_STATE__ = state;
      (window as any).__UPDATE_GAME_STATE__ = setState;
      (window as any).__CHECK_WORD__ = checkWord;
    }
  }, [state, setState, checkWord]);

  // Load puzzle if not already loaded
  useEffect(() => {
    if (!state.grid || state.grid.length === 0) {
      loadPuzzleForMode().then((result) => {
        if (result?.genreComplete) {
          setShowGenreCompletionModal(true);
        }
      });
    }
  }, [isReady, state.currentGenre, state.currentPuzzleIndex, state.grid?.length, loadPuzzleForMode]); // Re-run when ready, genre, puzzle index, or grid changes

  // Start timer when puzzle is loaded
  useEffect(() => {
    // Don't start timer if we're transitioning between puzzles
    if (isTransitioningRef.current) {
      console.log('[puzzle.page] Timer not started - transitioning between puzzles');
      return;
    }
    
    if (state.grid && state.grid.length > 0 && !state.timer && !state.paused && !state.gameOver) {
      if (state.gameMode === 'story') {
        // Story mode: initialize decorative timer
        if (state.timeRemaining === undefined || state.timeRemaining === 0) {
          storyTimer.initialize();
        }
      } else {
        // Puzzle-only and beat-the-clock: start countdown timer
        if (state.timeRemaining > 0) {
          console.log('[puzzle.page] Starting timer - grid exists, no timer, not paused, not gameOver, timeRemaining:', state.timeRemaining);
          if (state.gameMode === 'puzzle-only') {
            puzzleOnlyTimer.start();
          } else if (state.gameMode === 'beat-the-clock') {
            beatTheClockTimer.start();
          }
        }
      }
    } else {
      if (state.grid && state.grid.length > 0) {
        console.log('[puzzle.page] Timer not started - timer:', state.timer ? 'exists' : 'null', 'paused:', state.paused, 'gameOver:', state.gameOver, 'timeRemaining:', state.timeRemaining, 'transitioning:', isTransitioningRef.current);
      }
    }
  }, [state.grid?.length, state.timer, state.paused, state.gameOver, state.gameMode, state.timeRemaining, storyTimer, puzzleOnlyTimer, beatTheClockTimer]);

  // Get current puzzle data
  const gridData = state.grid || [];
  const wordList = state.wordList || [];
  const currentPuzzle = state.currentGenre && state.puzzles[state.currentGenre] 
    ? state.puzzles[state.currentGenre][state.currentPuzzleIndex] 
    : null;

  // Precompute found word cells for performance
  const foundWordCells = useMemo(() => {
    const foundCells = new Set<string>();
    wordList.forEach(word => {
      if (word.found) {
        const [startRow, startCol] = [word.row, word.col];
        const [dRow, dCol] = word.direction;
        
        for (let i = 0; i < word.word.length; i++) {
          foundCells.add(`${startRow + (dRow * i)}-${startCol + (dCol * i)}`);
        }
      }
    });
    return foundCells;
  }, [wordList]);

  // Calculate cells between two points (supports horizontal, vertical, and diagonal)
  const getCellsBetween = useCallback((start: { row: number; col: number }, end: { row: number; col: number }): Set<string> => {
    const cells = new Set<string>();
    if (!gridData || gridData.length === 0 || !gridData[0]) return cells;
    
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;
    
    // Determine direction
    const rowStep = rowDiff === 0 ? 0 : rowDiff > 0 ? 1 : -1;
    const colStep = colDiff === 0 ? 0 : colDiff > 0 ? 1 : -1;
    
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
    
    for (let i = 0; i <= steps; i++) {
      const row = start.row + (rowStep * i);
      const col = start.col + (colStep * i);
      if (row >= 0 && row < gridData.length && col >= 0 && col < gridData[0].length) {
        cells.add(`${row}-${col}`);
      }
    }
    
    return cells;
  }, [gridData]);

  const handleCellClick = (row: number, col: number) => {
    // Only handle click if not dragging
    if (!isDragging) {
      const cellKey = `${row}-${col}`;
      const newSelected = new Set(selectedCells);
      
      if (newSelected.has(cellKey)) {
        newSelected.delete(cellKey);
      } else {
        newSelected.add(cellKey);
      }
      
      setSelectedCells(newSelected);
    }
  };

  const handleDragStart = (row: number, col: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragStart({ row, col });
    // Add initial cell to selection
    const cellKey = `${row}-${col}`;
    const newSelection = new Set([cellKey]);
    selectedCellsRef.current = newSelection;
    prevSelectionRef.current = new Set();
    setSelectedCells(newSelection);
  };

  // Track previous selection to only update changed cells
  const prevSelectionRef = useRef<Set<string>>(new Set());

  // Clear visual selection
  const clearSelectionVisual = useCallback(() => {
    if (!gridRef.current) return;
    
    const grid = gridRef.current.querySelector(`.${styles.wordGrid}`) as HTMLElement;
    if (!grid) return;
    
    const prevSelection = prevSelectionRef.current;
    
    // Remove selected class from all previously selected cells
    prevSelection.forEach(cellKey => {
      const cell = grid.querySelector(`button[data-cell-key="${cellKey}"]`) as HTMLElement;
      if (cell) {
        cell.classList.remove(styles.selected);
      }
    });
    
    prevSelectionRef.current = new Set();
  }, []);

  // Update selection visually using DOM manipulation instead of state updates
  const updateSelectionVisual = useCallback((cells: Set<string>) => {
    if (!gridRef.current) return;
    
    const grid = gridRef.current.querySelector(`.${styles.wordGrid}`) as HTMLElement;
    if (!grid) return;
    
    const prevSelection = prevSelectionRef.current;
    
    // Remove selected class only from cells that are no longer selected
    prevSelection.forEach(cellKey => {
      if (!cells.has(cellKey)) {
        const cell = grid.querySelector(`button[data-cell-key="${cellKey}"]`) as HTMLElement;
        if (cell) {
          cell.classList.remove(styles.selected);
        }
      }
    });
    
    // Add selected class only to newly selected cells
    cells.forEach(cellKey => {
      if (!prevSelection.has(cellKey)) {
        const cell = grid.querySelector(`button[data-cell-key="${cellKey}"]`) as HTMLElement;
        if (cell) {
          cell.classList.add(styles.selected);
        }
      }
    });
    
    // Update ref for next comparison
    prevSelectionRef.current = new Set(cells);
  }, []);

  const handleDragMove = useCallback((row: number, col: number) => {
    if (!isDraggingRef.current || !dragStart) return;
    
    const cells = getCellsBetween(dragStart, { row, col });
    selectedCellsRef.current = cells;
    
    // Update visual selection directly via DOM (no re-render)
    updateSelectionVisual(cells);
  }, [dragStart, getCellsBetween, updateSelectionVisual]);

  // Throttle mouse move updates using requestAnimationFrame
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<{ row: number; col: number } | null>(null);

  const throttledDragMove = useCallback((row: number, col: number) => {
    // Skip if same cell
    if (lastUpdateRef.current?.row === row && lastUpdateRef.current?.col === col) {
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      handleDragMove(row, col);
      lastUpdateRef.current = { row, col };
      rafRef.current = null;
    });
  }, [handleDragMove]);

  const handleDragEnd = useCallback(() => {
    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastUpdateRef.current = null;

    // Use ref value instead of state
    const finalSelection = selectedCellsRef.current;
    
    if (isDraggingRef.current && dragStart && finalSelection.size > 0) {
      // Convert selected cells to Cell[] format for word checking
      const cells: Cell[] = Array.from(finalSelection).map(key => {
        const [row, col] = key.split('-').map(Number);
        return {
          row,
          col,
          value: gridData[row]?.[col] || ''
        };
      });

      // Check if the selection forms a word
      if (cells.length > 0) {
        const wordFound = checkWord(cells);
        // Always clear visual selection after checking
        // If word found, it will be styled as "found" via React state update
        // If not found, cells should be deselected
        clearSelectionVisual();
      } else {
        // No cells selected, clear visual
        clearSelectionVisual();
      }
    } else {
      // No drag happened, clear visual selection
      clearSelectionVisual();
    }
    
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragStart(null);
    setSelectedCells(new Set());
    selectedCellsRef.current = new Set();
    prevSelectionRef.current = new Set();
  }, [dragStart, gridData, checkWord, clearSelectionVisual]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Get cell coordinates from mouse/touch event
  const getCellFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): { row: number; col: number } | null => {
    const target = e.target as HTMLElement;
    const button = target.closest('button[data-cell-key]');
    if (!button) return null;
    
    const key = button.getAttribute('data-cell-key');
    if (!key) return null;
    
    const [row, col] = key.split('-').map(Number);
    return { row, col };
  }, []);

  // Get cell from coordinates relative to grid
  const getCellFromCoordinates = useCallback((x: number, y: number): { row: number; col: number } | null => {
    if (!gridRef.current || !gridData || gridData.length === 0 || !gridData[0]) return null;
    
    const grid = gridRef.current.querySelector(`.${styles.wordGrid}`) as HTMLElement;
    if (!grid) return null;
    
    const rect = grid.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    if (relativeX < 0 || relativeY < 0 || relativeX > rect.width || relativeY > rect.height) {
      return null;
    }
    
    const cellWidth = rect.width / gridData[0].length;
    const cellHeight = rect.height / gridData.length;
    
    const col = Math.floor(relativeX / cellWidth);
    const row = Math.floor(relativeY / cellHeight);
    
    if (row >= 0 && row < gridData.length && col >= 0 && col < gridData[0].length) {
      return { row, col };
    }
    
    return null;
  }, [gridData]);

  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    handleDragStart(row, col);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      // Try to get cell from event target first
      let cell = getCellFromEvent(e);
      
      // If not found, calculate from coordinates
      if (!cell) {
        cell = getCellFromCoordinates(e.clientX, e.clientY);
      }
      
      if (cell) {
        throttledDragMove(cell.row, cell.col);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      handleDragEnd();
    }
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleDragEnd();
    }
  };

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    e.preventDefault();
    handleDragStart(row, col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      
      // Try to get cell from element under touch
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const button = element?.closest('button[data-cell-key]') as HTMLElement;
      
      if (button) {
        const key = button.getAttribute('data-cell-key');
        if (key) {
          const [row, col] = key.split('-').map(Number);
          throttledDragMove(row, col);
        }
      } else {
        // Fallback to coordinate calculation
        const cell = getCellFromCoordinates(touch.clientX, touch.clientY);
        if (cell) {
          throttledDragMove(cell.row, cell.col);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      handleDragEnd();
    }
  };

  const getCellClass = useCallback((row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    let classes = styles.gridCell;
    
    if (selectedCells.has(cellKey)) classes += ` ${styles.selected}`;
    
    // Use precomputed found word cells for better performance
    if (foundWordCells.has(cellKey)) classes += ` ${styles.found}`;
    
    return classes;
  }, [selectedCells, foundWordCells]);

  const handlePause = useCallback(() => {
    // Stop timer immediately first
    if (state.gameMode === 'story') {
      storyTimer.pause();
    } else if (state.gameMode === 'puzzle-only') {
      puzzleOnlyTimer.pause();
    } else {
      beatTheClockTimer.pause();
    }
    setIsPaused(true);
  }, [state.gameMode, storyTimer, puzzleOnlyTimer, beatTheClockTimer]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    if (state.gameMode === 'story') {
      storyTimer.resume();
    } else if (state.gameMode === 'puzzle-only') {
      puzzleOnlyTimer.resume();
    } else {
      beatTheClockTimer.resume();
    }
  }, [state.gameMode, storyTimer, puzzleOnlyTimer, beatTheClockTimer]);

  const handleBackToBookOfPassage = () => {
    router.push('/book-of-passage');
  };

  const handleBackToLibrary = () => {
    router.push('/library');
  };

  const handleBackToMainMenu = () => {
    router.push('/');
  };

  const handleOptions = () => {
    // TODO: Open options modal when implemented
    console.log('Options clicked');
  };

  // Stats modal handlers
  const handleNextPuzzle = useCallback(async () => {
    console.log('[puzzle.page.handleNextPuzzle] Closing modal and loading next puzzle');
    setShowStatsModal(false);
    if (state.gameMode === 'puzzle-only') {
      // Clear timer before loading new puzzle to prevent stale callbacks
      puzzleOnlyTimer.clear();
      // Load a completely new random puzzle from any genre
      if (!state.puzzles || Object.keys(state.puzzles).length === 0) {
        await loadAll();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const success = loadRandom();
      if (success) {
        setPuzzleStartTime(Date.now());
      }
    } else if (state.gameMode === 'story') {
      // Story mode: Load next puzzle using selection system with Kethaneum weaving
      storyTimer.clear();
      if (!state.puzzles || Object.keys(state.puzzles).length === 0) {
        await loadAll();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const result = loadWithSelection();
      if (result.success) {
        setPuzzleStartTime(Date.now());

        // Show genre completion modal if genre is exhausted
        if (result.message && result.message.includes('completed all puzzles')) {
          setShowGenreCompletionModal(true);
        }
      } else {
        console.warn('Failed to load next puzzle:', result.message);
      }
    }
  }, [state.gameMode, state.puzzles, loadRandom, loadAll, loadWithSelection, puzzleOnlyTimer, storyTimer]);

  const handleRestartPuzzle = useCallback(() => {
    console.log('[puzzle.page.handleRestartPuzzle] Closing modal and restarting puzzle');
    setShowStatsModal(false);
    // Reset puzzle state and reload current puzzle
    setState({
      ...state,
      wordList: state.wordList.map(w => ({ ...w, found: false })),
      selectedCells: [],
      timeRemaining: config.timeLimit,
      gameOver: false,
    });
    setPuzzleStartTime(Date.now());
    if (state.gameMode === 'puzzle-only') {
      puzzleOnlyTimer.start();
    } else if (state.gameMode === 'beat-the-clock') {
      beatTheClockTimer.start();
    }
    // Story mode doesn't use start() - it uses initialize()
  }, [state, setState, config, state.gameMode, puzzleOnlyTimer, beatTheClockTimer]);

  const handleStartFreshRun = useCallback(async () => {
    console.log('[puzzle.page.handleStartFreshRun] Closing modal and starting fresh run');
    setShowStatsModal(false);
    // Reset run timer and load new puzzle
    const runState = startBeatTheClockRun(state);
    setState({
      ...runState,
      sessionStats: null, // Reset stats
    });
    await loadBeatTheClock();
    setPuzzleStartTime(Date.now());
  }, [state, setState, loadBeatTheClock]);

  // Genre completion modal handlers
  const handleContinueSameGenre = useCallback(async () => {
    console.log('[puzzle.page.handleContinueSameGenre] Replaying books in current genre');
    setShowGenreCompletionModal(false);

    // Load sequential puzzle with allowReplay flag
    const { success } = loadSequential(state.currentGenre, null, true);
    if (success) {
      setPuzzleStartTime(Date.now());
    }
  }, [state.currentGenre, loadSequential]);

  const handleSelectNewGenre = useCallback(async (newGenre: string) => {
    console.log('[puzzle.page.handleSelectNewGenre] Switching to new genre:', newGenre);
    setShowGenreCompletionModal(false);

    // Update state with new genre and clear book/puzzle index
    setState(prevState => ({
      ...prevState,
      currentGenre: newGenre,
      currentBook: '',
      currentPuzzleIndex: -1,
      currentStoryPart: -1,
    }));

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 0));

    // Load first puzzle in new genre
    const { success } = loadSequential(newGenre, null, false);
    if (success) {
      setPuzzleStartTime(Date.now());
    }
  }, [setState, loadSequential]);

  const handleCloseGenreCompletionModal = useCallback(() => {
    console.log('[puzzle.page.handleCloseGenreCompletionModal] Closing modal and returning to library');
    setShowGenreCompletionModal(false);
    router.push('/library');
  }, [router]);

  // Handle Escape key to pause/resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPaused) {
          handleResume();
        } else {
          handlePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused, handlePause, handleResume]); // Include dependencies for pause/resume handlers

  return (
    <div className={styles.puzzleContainer} data-testid="puzzle-screen">
      <CosmicBackground variant="puzzle" starCount={450} particleCount={0} />
      
      {/* Timer display - Story Mode shows decorative full bar, others show countdown */}
      {state.gameMode !== 'story' && (
        <div className={styles.mobileTimer}>
          <div 
            className={styles.mobileTimerBar} 
            style={{ width: `${Math.max(0, Math.min(100, (state.timeRemaining / config.timeLimit) * 100))}%` }}
          />
        </div>
      )}
      
      {/* Beat the Clock run timer */}
      {state.gameMode === 'beat-the-clock' && state.runStartTime && (
        <div className={styles.runTimer}>
          Run Time: {Math.floor((state.runDuration - state.timeRemaining) / 60)}:{(state.runDuration - state.timeRemaining) % 60 < 10 ? '0' : ''}{(state.runDuration - state.timeRemaining) % 60} / {Math.floor(state.runDuration / 60)}:00
        </div>
      )}

      <div className={styles.puzzleContent}>
        <div className={styles.puzzleHeader}>
          <h1 className={styles.bookTitle}>
            {currentPuzzle ? currentPuzzle.title : 'Loading Puzzle...'}
          </h1>
          
          {/* Desktop Timer - Story Mode shows decorative full bar, others show countdown */}
          {state.gameMode === 'story' ? (
            <div className={styles.desktopTimer}>
              <div 
                className={styles.timerBar}
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <div className={styles.desktopTimer}>
              <div 
                className={styles.timerBar}
                style={{ width: `${Math.max(0, Math.min(100, (state.timeRemaining / config.timeLimit) * 100))}%` }}
              />
            </div>
          )}
        </div>

        {/* Mobile Story Button - Only visible on mobile and Story Mode */}
        {state.gameMode === 'story' && (
          <button 
            className={styles.mobileStoryButton}
            onClick={() => setStoryOpen(true)}
            aria-label="View Story"
          >
            📖 Story
          </button>
        )}

        {/* Story Panel Flyaway Menu - Mobile - Only visible in Story Mode */}
        {state.gameMode === 'story' && (
          <div 
            className={`${styles.storyFlyaway} ${storyOpen ? styles.open : ''}`}
            onClick={() => setStoryOpen(false)}
          >
            <div 
              className={styles.storyFlyawayContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.storyContent}>
                {currentPuzzle?.storyExcerpt ? (
                  <>
                    {currentPuzzle.book && (
                      <p><em>From "{currentPuzzle.book}"{currentPuzzle.storyPart !== undefined ? ` - Part ${currentPuzzle.storyPart + 1}` : ''}:</em></p>
                    )}
                    <p>{currentPuzzle.storyExcerpt}</p>
                  </>
                ) : (
                  <p>No story content available for this puzzle.</p>
                )}
              </div>
              <button 
                className={styles.storyCloseButton}
                onClick={() => setStoryOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className={styles.gameLayout}>
          {/* Desktop Story Panel - Only visible on desktop and Story Mode */}
          {state.gameMode === 'story' && (
            <div className={styles.storyPanel}>
              <div className={styles.storyContent}>
                {currentPuzzle?.storyExcerpt ? (
                  <>
                    {currentPuzzle.book && (
                      <p><em>From "{currentPuzzle.book}"{currentPuzzle.storyPart !== undefined ? ` - Part ${currentPuzzle.storyPart + 1}` : ''}:</em></p>
                    )}
                    <p>{currentPuzzle.storyExcerpt}</p>
                  </>
                ) : (
                  <p>No story content available for this puzzle.</p>
                )}
              </div>
            </div>
          )}

          <div className={styles.gameMain}>
            <div 
              className={styles.gridContainer}
              ref={gridRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className={styles.wordGrid}>
                {gridData && gridData.length > 0 && gridData[0] ? (
                  gridData.map((row, rowIndex) => 
                    row.map((letter, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        data-cell-key={`${rowIndex}-${colIndex}`}
                        className={getCellClass(rowIndex, colIndex)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                      onMouseMove={(e) => {
                        if (isDraggingRef.current) {
                          e.preventDefault();
                          throttledDragMove(rowIndex, colIndex);
                        }
                      }}
                        onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                      >
                        {letter}
                      </button>
                    ))
                  )
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#dcd0c0' }}>
                    Loading puzzle...
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.wordsPanel} hidden md:block`}>
              <h3 className={styles.wordsTitle}>Find These Words:</h3>
              <ul className={styles.wordList} data-testid="word-list">
                {wordList.map((word, index) => (
                  <li 
                    key={`${word.word}-${index}`}
                    className={word.found ? styles.found : ''}
                  >
                    {word.word}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`${styles.mobileWords} md:hidden`}>
            <ul className={styles.wordList} data-testid="mobile-word-list">
              {wordList.map((word, index) => (
                <li 
                  key={`${word.word}-${index}`}
                  className={word.found ? styles.found : ''}
                >
                  {word.word}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.puzzleControls}>
          <button
            className={`${styles.controlBtn} ${styles.primary}`}
            onClick={handlePause}
            data-testid="pause-btn"
          >
            Pause
          </button>
        </div>
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className={styles.pauseOverlay} onClick={handleResume} data-testid="pause-overlay">
          <div
            className={styles.pauseMenu}
            onClick={(e) => e.stopPropagation()}
            data-testid="pause-menu"
          >
            <h2 className={styles.pauseTitle}>Paused</h2>
            
            <div className={styles.pauseButtons}>
              <button
                className={`${styles.pauseBtn} ${styles.primary}`}
                onClick={handleResume}
                data-testid="resume-btn"
              >
                Resume
              </button>

              <button
                className={styles.pauseBtn}
                onClick={handleBackToBookOfPassage}
                data-testid="back-to-book-btn"
              >
                Back to Book of Passage
              </button>

              <button
                className={styles.pauseBtn}
                onClick={handleBackToLibrary}
                data-testid="back-to-library-btn"
              >
                Back to Library
              </button>

              <button
                className={styles.pauseBtn}
                onClick={handleBackToMainMenu}
                data-testid="back-to-menu-btn"
              >
                Back to Main Menu
              </button>

              <button
                className={`${styles.pauseBtn} ${styles.disabled}`}
                onClick={handleOptions}
                disabled
                data-testid="options-btn"
              >
                Options
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Stats Modal */}
      <GameStatsModal
        isOpen={showStatsModal}
        mode={state.gameMode}
        isWin={statsModalIsWin}
        sessionStats={state.sessionStats}
        onNextPuzzle={(state.gameMode === 'puzzle-only' || state.gameMode === 'story') ? handleNextPuzzle : undefined}
        onRestartPuzzle={handleRestartPuzzle}
        onStartFreshRun={state.gameMode === 'beat-the-clock' ? handleStartFreshRun : undefined}
        onMainMenu={handleBackToMainMenu}
        onBackToLibrary={state.gameMode === 'story' ? handleBackToLibrary : undefined}
        onBackToBookOfPassage={state.gameMode === 'story' ? handleBackToBookOfPassage : undefined}
      />

      {/* Genre Completion Modal */}
      <GenreCompletionModal
        isOpen={showGenreCompletionModal}
        currentGenre={state.currentGenre}
        availableGenres={Object.keys(state.puzzles || {}).filter(
          genre => state.puzzles[genre] && state.puzzles[genre].length > 0
        )}
        onContinueSameGenre={handleContinueSameGenre}
        onSelectNewGenre={handleSelectNewGenre}
        onClose={handleCloseGenreCompletionModal}
      />
    </div>
  );
}

