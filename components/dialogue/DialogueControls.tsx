'use client';

import styles from './dialogue.module.css';

interface DialogueControlsProps {
  onContinue: () => void;
  disabled?: boolean;
  buttonText?: string;
}

export function DialogueControls({
  onContinue,
  disabled = false,
  buttonText = 'Continue',
}: DialogueControlsProps) {
  return (
    <button
      className={styles.continueButton}
      onClick={onContinue}
      disabled={disabled}
      data-testid="continue-btn"
    >
      {buttonText}
    </button>
  );
}