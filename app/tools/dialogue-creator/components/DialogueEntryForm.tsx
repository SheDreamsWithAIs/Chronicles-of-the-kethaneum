/**
 * Single dialogue entry form component
 */

'use client';

import { useState } from 'react';
import type { BanterDialogue, DialogueCategory } from '@/lib/dialogue/types';
import type { ValidationResult, TextLimits } from '../types/creator.types';
import EmotionSelector from './EmotionSelector';
import StoryBeatSelector from './StoryBeatSelector';
import styles from '../styles/dialogue-creator.module.css';

const DIALOGUE_CATEGORIES: { value: DialogueCategory; label: string }[] = [
  { value: 'general-welcome', label: 'General Welcome' },
  { value: 'progress-praise', label: 'Progress Praise' },
  { value: 'lore-sharing', label: 'Lore Sharing' },
  { value: 'casual-advice', label: 'Casual Advice' },
  { value: 'appreciation', label: 'Appreciation' },
  { value: 'academic-introduction', label: 'Academic Introduction' },
  { value: 'lore-exposition', label: 'Lore Exposition' },
  { value: 'academic-guidance', label: 'Academic Guidance' },
  { value: 'colleague-reference', label: 'Colleague Reference' },
  { value: 'research-exposition', label: 'Research Exposition' },
  { value: 'meta-humor', label: 'Meta Humor' },
  { value: 'general-testing', label: 'General Testing' },
  { value: 'technical-testing', label: 'Technical Testing' },
];

interface DialogueEntryFormProps {
  entry: BanterDialogue;
  index: number;
  totalEntries: number;
  isExpanded: boolean;
  onChange: (index: number, entry: BanterDialogue) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onReorder: (index: number, direction: 'up' | 'down') => void;
  onToggleExpand: () => void;
  errors: ValidationResult[];
  textLimits?: TextLimits | null;
}

export default function DialogueEntryForm({
  entry,
  index,
  totalEntries,
  isExpanded,
  onChange,
  onDelete,
  onDuplicate,
  onReorder,
  onToggleExpand,
  errors,
  textLimits,
}: DialogueEntryFormProps) {
  const getError = (field: string) =>
    errors.find((e) => e.field === `dialogue.${index}.${field}`)?.message;

  const handleUpdate = (field: keyof BanterDialogue, value: any) => {
    onChange(index, { ...entry, [field]: value });
  };

  const getCharCountColor = (count: number) => {
    if (!textLimits) return '';
    if (count <= textLimits.mobile.maxCharsPerScreen) return styles.countGood;
    if (count <= textLimits.mobile.maxCharsPerScreen + 20) return styles.countWarning;
    return styles.countExceeded;
  };

  return (
    <div className={styles.dialogueEntry}>
      <div className={styles.entryHeader} onClick={onToggleExpand}>
        <span className={styles.entryNumber}>Entry {index + 1}</span>
        <span className={styles.entryPreview}>
          {entry.text.slice(0, 50) || '(empty)'}...
        </span>
        <div className={styles.entryActions} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onReorder(index, 'up')}
            disabled={index === 0}
            title="Move up"
            className={styles.actionButton}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onReorder(index, 'down')}
            disabled={index === totalEntries - 1}
            title="Move down"
            className={styles.actionButton}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            title="Duplicate"
            className={styles.actionButton}
          >
            ⎘
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            disabled={totalEntries === 1}
            title="Delete"
            className={styles.actionButton}
          >
            🗑
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.entryContent}>
          <div className={styles.formGroup}>
            <label>
              Dialogue ID <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={entry.id}
              onChange={(e) => handleUpdate('id', e.target.value)}
              className={getError('id') ? styles.inputError : styles.input}
              placeholder="dialogue-entry-id"
            />
            {getError('id') && (
              <span className={styles.errorMessage}>{getError('id')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              Category <span className={styles.required}>*</span>
            </label>
            <select
              value={entry.category}
              onChange={(e) => handleUpdate('category', e.target.value as DialogueCategory)}
              className={getError('category') ? `${styles.select} ${styles.inputError}` : styles.select}
            >
              {DIALOGUE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {getError('category') && (
              <span className={styles.errorMessage}>{getError('category')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              Emotions <span className={styles.required}>*</span>
            </label>
            <EmotionSelector
              selectedEmotions={entry.emotion}
              onChange={(emotions) => handleUpdate('emotion', emotions)}
              suggestedForCategory={entry.category}
            />
            {getError('emotion') && (
              <span className={styles.errorMessage}>{getError('emotion')}</span>
            )}
            <span className={styles.helperText}>
              Select 1-2 emotions (max 4)
            </span>
          </div>

          <div className={styles.formGroup}>
            <label>
              Dialogue Text <span className={styles.required}>*</span>
            </label>
            <textarea
              value={entry.text}
              onChange={(e) => handleUpdate('text', e.target.value)}
              className={getError('text') ? styles.inputError : styles.textarea}
              placeholder="Enter dialogue text..."
              rows={4}
            />
            <div className={styles.charCountDisplay}>
              <span className={getCharCountColor(entry.text.length)}>
                {entry.text.length} characters
              </span>
              {textLimits && (
                <span className={styles.helperText}>
                  Recommended: Mobile {textLimits.mobile.maxCharsPerScreen} | Tablet {textLimits.tablet.maxCharsPerScreen} | Desktop {textLimits.desktop.maxCharsPerScreen}
                </span>
              )}
            </div>
            {getError('text') && (
              <span className={styles.errorMessage}>{getError('text')}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <StoryBeatSelector
              value={entry.availableFrom}
              onChange={(beat) => handleUpdate('availableFrom', beat)}
              error={getError('availableFrom')}
              label="Available From *"
            />

            <StoryBeatSelector
              value={entry.availableUntil || ''}
              onChange={(beat) => handleUpdate('availableUntil', beat || undefined)}
              error={getError('availableUntil')}
              allowEmpty
              label="Available Until"
            />
          </div>
          {entry.availableUntil && (
            <span className={styles.helperText}>
              Leave empty for permanent availability
            </span>
          )}
        </div>
      )}
    </div>
  );
}

