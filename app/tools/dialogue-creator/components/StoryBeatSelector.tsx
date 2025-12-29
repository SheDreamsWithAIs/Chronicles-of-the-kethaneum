/**
 * Story beat selector component with validation
 */

'use client';

import type { StoryBeat } from '@/lib/dialogue/types';
import styles from '../styles/dialogue-creator.module.css';

const STORY_BEATS: { value: StoryBeat | ''; label: string }[] = [
  { value: 'hook', label: 'Hook' },
  { value: 'first_plot_point', label: 'First Plot Point' },
  { value: 'first_pinch_point', label: 'First Pinch Point' },
  { value: 'midpoint', label: 'Midpoint' },
  { value: 'second_pinch_point', label: 'Second Pinch Point' },
  { value: 'second_plot_point', label: 'Second Plot Point' },
  { value: 'climax', label: 'Climax' },
  { value: 'resolution', label: 'Resolution' },
];

interface StoryBeatSelectorProps {
  value: StoryBeat | '';
  onChange: (beat: StoryBeat | '') => void;
  error?: string;
  allowEmpty?: boolean;
  label?: string;
}

export default function StoryBeatSelector({
  value,
  onChange,
  error,
  allowEmpty = false,
  label,
}: StoryBeatSelectorProps) {
  return (
    <div className={styles.formGroup}>
      {label && <label>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as StoryBeat | '')}
        className={error ? `${styles.select} ${styles.inputError}` : styles.select}
      >
        {allowEmpty && <option value="">(None)</option>}
        {STORY_BEATS.map((beat) => (
          <option key={beat.value} value={beat.value}>
            {beat.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}

