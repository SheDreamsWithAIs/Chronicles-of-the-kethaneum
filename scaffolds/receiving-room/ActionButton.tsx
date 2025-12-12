'use client';
import React from 'react';
import styles from './receiving-room.module.css';

export default function ActionButton({ text = 'Next', onAction }: { text?: string; onAction: () => void }) {
  return (
    <button className={styles.actionButton} onClick={onAction} aria-label={text}>
      {text}
    </button>
  );
}
