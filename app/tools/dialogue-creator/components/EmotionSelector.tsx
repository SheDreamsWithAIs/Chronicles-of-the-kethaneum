/**
 * Emotion selector component with multi-select capability
 */

'use client';

import { useState } from 'react';
import type { Emotion, DialogueCategory } from '@/lib/dialogue/types';
import { getSuggestedEmotions } from '../utils/emotionSuggestions';
import styles from '../styles/dialogue-creator.module.css';

const ALL_EMOTIONS: Emotion[] = [
  'warm',
  'professional',
  'encouraging',
  'proud',
  'explanatory',
  'mystical',
  'conspiratorial',
  'reassuring',
  'grateful',
  'scholarly',
  'verbose',
  'enthusiastic',
  'analytical',
  'professorial',
  'impressed',
  'instructional',
  'methodical',
  'passionate',
  'contemplative',
  'collaborative',
  'intellectual',
  'scientific',
  'excited',
  'theoretical',
  'apologetic',
  'self-aware',
  'amused',
  'curious',
  'satisfied',
  'welcoming',
  'formal',
  'wise',
];

interface EmotionSelectorProps {
  selectedEmotions: Emotion[];
  onChange: (emotions: Emotion[]) => void;
  suggestedForCategory?: DialogueCategory;
}

export default function EmotionSelector({
  selectedEmotions,
  onChange,
  suggestedForCategory,
}: EmotionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestedEmotions = suggestedForCategory
    ? getSuggestedEmotions(suggestedForCategory)
    : [];

  const toggleEmotion = (emotion: Emotion) => {
    if (selectedEmotions.includes(emotion)) {
      onChange(selectedEmotions.filter((e) => e !== emotion));
    } else if (selectedEmotions.length < 4) {
      onChange([...selectedEmotions, emotion]);
    }
  };

  return (
    <div className={styles.emotionSelector}>
      <div className={styles.emotionChips}>
        {selectedEmotions.map((emotion) => (
          <span key={emotion} className={styles.emotionChip}>
            {emotion}
            <button
              type="button"
              onClick={() => toggleEmotion(emotion)}
              className={styles.chipRemove}
              aria-label={`Remove ${emotion}`}
            >
              ×
            </button>
          </span>
        ))}
        {selectedEmotions.length < 4 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={styles.addEmotionButton}
          >
            + Add Emotion
          </button>
        )}
      </div>

      {isOpen && (
        <div className={styles.emotionDropdown}>
          {suggestedEmotions.length > 0 && (
            <div className={styles.suggestedEmotions}>
              <div className={styles.suggestedLabel}>Suggested:</div>
              {suggestedEmotions.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => {
                    toggleEmotion(emotion);
                    setIsOpen(false);
                  }}
                  className={
                    selectedEmotions.includes(emotion)
                      ? styles.emotionButtonSelected
                      : styles.emotionButton
                  }
                  disabled={selectedEmotions.length >= 4 && !selectedEmotions.includes(emotion)}
                >
                  {emotion}
                </button>
              ))}
            </div>
          )}

          <div className={styles.allEmotions}>
            <div className={styles.allEmotionsLabel}>All Emotions:</div>
            <div className={styles.emotionGrid}>
              {ALL_EMOTIONS.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => {
                    toggleEmotion(emotion);
                    setIsOpen(false);
                  }}
                  className={
                    selectedEmotions.includes(emotion)
                      ? styles.emotionButtonSelected
                      : styles.emotionButton
                  }
                  disabled={selectedEmotions.length >= 4 && !selectedEmotions.includes(emotion)}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

