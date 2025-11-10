'use client';

import { useState } from 'react';
import styles from './GameModeModal.module.css';

export type GameMode = 'story' | 'puzzle-only' | 'beat-the-clock';

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: GameMode) => void;
  hasExistingProgress?: boolean;
}

interface ModeInfo {
  id: GameMode;
  title: string;
  description: string;
  disabled?: boolean;
}

const MODES: ModeInfo[] = [
  {
    id: 'story',
    title: 'Story Mode',
    description: 'Play through the full narrative experience. No time pressure.'
  },
  {
    id: 'puzzle-only',
    title: 'Puzzle Only Mode',
    description: 'Complete puzzles one after another. Timer runs per puzzle. (Coming Soon)',
    disabled: true
  },
  {
    id: 'beat-the-clock',
    title: 'Beat the Clock',
    description: 'Race against time across multiple small puzzles. 5 minute runs. (Coming Soon)',
    disabled: true
  }
];

export function GameModeModal({ 
  isOpen, 
  onClose, 
  onSelectMode,
  hasExistingProgress = false
}: GameModeModalProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedMode) {
      onSelectMode(selectedMode);
    }
  };

  const handleCancel = () => {
    setSelectedMode(null);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.panelContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.panelTitle}>Select Game Mode</h2>
        
        {hasExistingProgress && (
          <div className={styles.warning}>
            <p>⚠️ You have existing progress. Selecting a new mode will start a fresh game.</p>
          </div>
        )}
        
        <div className={styles.modeContainer}>
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`${styles.modeCard} ${selectedMode === mode.id ? styles.selected : ''} ${mode.disabled ? styles.disabled : ''}`}
              onClick={() => !mode.disabled && setSelectedMode(mode.id)}
            >
              <div className={styles.cardGlow}></div>
              <div className={styles.cardContent}>
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
                {mode.disabled && (
                  <span className={styles.disabledBadge}>Coming Soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.buttonContainer}>
          <button 
            className={styles.cancelButton} 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className={`${styles.confirmButton} ${!selectedMode ? styles.disabled : ''}`}
            onClick={handleConfirm}
            disabled={!selectedMode}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

