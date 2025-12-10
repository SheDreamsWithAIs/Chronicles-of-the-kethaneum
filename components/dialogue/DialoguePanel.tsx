'use client';

import { useState, useEffect } from 'react';
import styles from './dialogue.module.css';

export interface DialoguePanelProps {
  character: {
    id: string;
    name: string;
    title?: string;
    portraitFile?: string;
  };
  dialogueText: string;
  emotion?: string;
  animationState: 'entering' | 'active' | 'shifting' | 'exiting';
  position: 'top' | 'bottom';
  onAnimationComplete?: () => void;
  currentChunk?: number;
  totalChunks?: number;
}

export function DialoguePanel({
  character,
  dialogueText,
  emotion,
  animationState,
  position,
  onAnimationComplete,
  currentChunk,
  totalChunks,
}: DialoguePanelProps) {
  const [portraitError, setPortraitError] = useState(false);
  const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);

  // Handle animation completion
  useEffect(() => {
    if (animationState === 'entering' || animationState === 'shifting' || animationState === 'exiting') {
      const duration = 500; // Animation duration in ms
      const timer = setTimeout(() => {
        setHasAnimationCompleted(true);
        onAnimationComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setHasAnimationCompleted(false);
    }
  }, [animationState, onAnimationComplete]);

  // Build portrait path
  const portraitPath = character.portraitFile
    ? `/images/portraits/${character.portraitFile}`
    : null;

  // Get portrait placeholder (first initial)
  const portraitPlaceholder = character.name.charAt(0).toUpperCase();

  return (
    <div
      className={`${styles.dialoguePanel} ${styles[`dialoguePanel--${animationState}`]} ${styles[`dialoguePanel--${position}`]}`}
      data-emotion={emotion}
      role="article"
      aria-live="polite"
      aria-label={`${character.name}: ${dialogueText}`}
      data-testid="dialogue-panel"
      data-dialogue-id={`${character.id}-${currentChunk || 0}`}
    >
      <div className={styles.characterPortrait} data-testid="character-portrait">
        {portraitPath && !portraitError ? (
          <img
            src={portraitPath}
            alt={character.name}
            onError={() => setPortraitError(true)}
          />
        ) : (
          <div className={styles.portraitPlaceholder} data-testid="portrait-placeholder">
            {portraitPlaceholder}
          </div>
        )}
      </div>
      <div className={styles.dialogueContent}>
        <div className={styles.characterName} data-testid="character-name">
          {character.name}
        </div>
        {character.title && (
          <div className={styles.characterTitle}>{character.title}</div>
        )}
        <div className={styles.dialogueText} data-testid="dialogue-text">{dialogueText}</div>
        {totalChunks && totalChunks > 1 && (
          <div className={styles.chunkIndicator} data-testid="chunk-indicator">
            {currentChunk !== undefined ? currentChunk + 1 : 1}/{totalChunks}
          </div>
        )}
      </div>
    </div>
  );
}
