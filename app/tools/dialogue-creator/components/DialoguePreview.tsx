/**
 * Dialogue preview component
 */

'use client';

import { useState } from 'react';
import type { Character, BanterDialogue, StoryBeat } from '@/lib/dialogue/types';
import styles from '../styles/dialogue-creator.module.css';

const STORY_BEAT_ORDER: StoryBeat[] = [
  'hook',
  'first_plot_point',
  'first_pinch_point',
  'midpoint',
  'second_pinch_point',
  'second_plot_point',
  'climax',
  'resolution',
];

interface DialoguePreviewProps {
  character: Character;
  dialogueEntries: BanterDialogue[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function DialoguePreview({
  character,
  dialogueEntries,
  currentIndex,
  onIndexChange,
}: DialoguePreviewProps) {
  const [filterBeat, setFilterBeat] = useState<StoryBeat | 'all'>('all');

  const filteredEntries = dialogueEntries.filter((entry) => {
    if (filterBeat === 'all') return true;

    const availableFrom = entry.availableFrom;
    const availableUntil = entry.availableUntil;

    const currentBeatIndex = STORY_BEAT_ORDER.indexOf(filterBeat);
    const fromBeatIndex = STORY_BEAT_ORDER.indexOf(availableFrom);
    const untilBeatIndex = availableUntil
      ? STORY_BEAT_ORDER.indexOf(availableUntil)
      : Infinity;

    return currentBeatIndex >= fromBeatIndex && currentBeatIndex < untilBeatIndex;
  });

  const currentEntry = filteredEntries[currentIndex] || filteredEntries[0];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredEntries.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  return (
    <div className={styles.previewPanel}>
      <h2 className={styles.panelTitle}>Live Preview</h2>

      <div className={styles.previewControls}>
        <label>Filter by Story Beat:</label>
        <select
          value={filterBeat}
          onChange={(e) => {
            setFilterBeat(e.target.value as StoryBeat | 'all');
            onIndexChange(0);
          }}
          className={styles.select}
        >
          <option value="all">All Dialogue</option>
          {STORY_BEAT_ORDER.map((beat) => (
            <option key={beat} value={beat}>
              {beat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.dialoguePreviewPanel}>
        <div className={styles.previewPortrait}>
          {character.portraitFile ? (
            <div className={styles.portraitPlaceholder}>
              {character.portraitFile}
            </div>
          ) : (
            <div className={styles.portraitPlaceholder}>Portrait</div>
          )}
        </div>

        <div className={styles.previewContent}>
          <div className={styles.previewCharacterName}>{character.name}</div>
          <div className={styles.previewCharacterTitle}>{character.title}</div>

          {currentEntry ? (
            <>
              <div className={styles.previewDialogueText}>{currentEntry.text}</div>

              <div className={styles.previewEmotions}>
                {currentEntry.emotion.map((emotion) => (
                  <span key={emotion} className={styles.emotionChip}>
                    {emotion}
                  </span>
                ))}
              </div>

              <div className={styles.previewMeta}>
                <span>Category: {currentEntry.category}</span>
                <span>
                  Available: {currentEntry.availableFrom}
                  {currentEntry.availableUntil && ` - ${currentEntry.availableUntil}`}
                </span>
              </div>
            </>
          ) : (
            <div className={styles.previewEmpty}>
              No dialogue available for this story beat
            </div>
          )}

          <div className={styles.previewControls}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={styles.previewButton}
            >
              Previous
            </button>
            <span>
              {filteredEntries.length > 0
                ? `${currentIndex + 1} / ${filteredEntries.length}`
                : '0 / 0'}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= filteredEntries.length - 1}
              className={styles.previewButton}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className={styles.previewInfo}>
        <p>
          <strong>Total Dialogue Entries:</strong> {dialogueEntries.length}
        </p>
        <p>
          <strong>Available at Current Beat:</strong> {filteredEntries.length}
        </p>
      </div>
    </div>
  );
}

