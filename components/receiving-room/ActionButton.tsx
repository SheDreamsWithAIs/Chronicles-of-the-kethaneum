'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ActionButton.module.css';

interface ActionButtonProps {
  text: string;
  onActionComplete: () => void;
  holdDuration?: number; // in milliseconds, default 1750ms (1.75 seconds)
}

export function ActionButton({ text, onActionComplete, holdDuration = 1750 }: ActionButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showHelperText, setShowHelperText] = useState(false);
  const holdStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isCompletedRef = useRef<boolean>(false);
  const helperTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indicatorCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update progress during hold
  useEffect(() => {
    if (!isHolding || holdStartTimeRef.current === null) {
      return;
    }

    const updateProgress = () => {
      if (holdStartTimeRef.current === null) return;

      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(elapsed / holdDuration, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        // Hold complete
        isCompletedRef.current = true;
        setIsHolding(false);
        setHoldProgress(0);
        holdStartTimeRef.current = null;
        onActionComplete();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHolding, holdDuration, onActionComplete]);

  const startHold = () => {
    isCompletedRef.current = false; // Reset completion flag
    setIsHolding(true);
    setHoldProgress(0);
    holdStartTimeRef.current = Date.now();
    
    // Show helper text on first click
    if (!showHelperText) {
      setShowHelperText(true);
      // Hide helper text after 3 seconds
      if (helperTextTimeoutRef.current) {
        clearTimeout(helperTextTimeoutRef.current);
      }
      helperTextTimeoutRef.current = setTimeout(() => {
        setShowHelperText(false);
      }, 3000);
    }
  };

  const cancelHold = () => {
    // Don't cancel if action has already completed
    if (isCompletedRef.current) {
      return;
    }
    
    // Check if hold is already complete before canceling
    if (holdStartTimeRef.current !== null) {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = elapsed / holdDuration;
      
      // If hold is complete or very close to complete, let it finish
      if (progress >= 0.95) {
        // Don't cancel - let the completion happen naturally
        return;
      }
    }
    
    setIsHolding(false);
    setHoldProgress(0);
    holdStartTimeRef.current = null;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Cleanup helper text timeout on unmount
  useEffect(() => {
    return () => {
      if (helperTextTimeoutRef.current) {
        clearTimeout(helperTextTimeoutRef.current);
      }
      if (indicatorCheckTimeoutRef.current) {
        clearTimeout(indicatorCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startHold();
  };

  const handleMouseUp = () => {
    cancelHold();
  };

  const handleMouseLeave = () => {
    cancelHold();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startHold();
  };

  const handleTouchEnd = () => {
    cancelHold();
  };

  const handleTouchCancel = () => {
    cancelHold();
  };

  // Keyboard support: Space or Enter to hold
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!isHolding) {
        startHold();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      cancelHold();
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      {/* Pulsing rings - outside the button */}
      <div className={`${styles.ringContainer} ${isHolding ? styles.ringContainerHolding : ''}`}>
        <div className={`${styles.pulseRing} ${styles.ring1}`}></div>
        <div className={`${styles.pulseRing} ${styles.ring2}`}></div>
        <div className={`${styles.pulseRing} ${styles.ring3}`}></div>
        <div className={`${styles.pulseRing} ${styles.ring4}`}></div>
      </div>

      {/* Helper text */}
      {showHelperText && (
        <div className={styles.helperText}>
          Hold down to advance
        </div>
      )}

      <button
        ref={buttonRef}
        className={`${styles.actionButton} ${isHolding ? styles.holding : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        data-testid="action-button"
      >
        <div className={styles.buttonContent}>
          {/* Progress indicator */}
          <div
            className={styles.progressIndicator}
            style={{
              transform: `scaleX(${Math.max(holdProgress, isHolding ? 0.02 : 0)})`,
              opacity: isHolding ? 1 : 0,
            }}
          />

          {/* Button text */}
          <span className={styles.buttonText}>{text}</span>
        </div>
      </button>
    </div>
  );
}
