/**
 * Metadata panel component
 */

'use client';

import type { CharacterMetadata, RelationshipType, ScreenType } from '@/lib/dialogue/types';
import type { ValidationResult } from '../types/creator.types';
import TagInput from './TagInput';
import styles from '../styles/dialogue-creator.module.css';

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'mentor-colleague', label: 'Mentor-Colleague' },
  { value: 'academic-mentor', label: 'Academic Mentor' },
  { value: 'testing-assistant', label: 'Testing Assistant' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'supervisor', label: 'Supervisor' },
];

const SCREEN_TYPES: { value: ScreenType; label: string }[] = [
  { value: 'library', label: 'Library' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'testing', label: 'Testing' },
  { value: 'puzzle', label: 'Puzzle' },
];

interface MetadataPanelProps {
  metadata: CharacterMetadata;
  onChange: (field: keyof CharacterMetadata, value: any) => void;
  errors: ValidationResult[];
}

export default function MetadataPanel({
  metadata,
  onChange,
  errors,
}: MetadataPanelProps) {
  const getError = (field: string) =>
    errors.find((e) => e.field === `metadata.${field}`)?.message;

  const toggleScreen = (screen: ScreenType) => {
    const currentScreens = metadata.availableInScreens || [];
    if (currentScreens.includes(screen)) {
      onChange('availableInScreens', currentScreens.filter((s) => s !== screen));
    } else {
      onChange('availableInScreens', [...currentScreens, screen]);
    }
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Metadata</h2>

      <div className={styles.formGroup}>
        <label>Personality Traits</label>
        <TagInput
          tags={metadata.personalityTraits}
          onChange={(tags) => onChange('personalityTraits', tags)}
          placeholder="Add trait..."
        />
        <span className={styles.helperText}>
          Character personality traits (e.g., wise, encouraging)
        </span>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="relationship">
          Relationship to Player <span className={styles.required}>*</span>
        </label>
        <select
          id="relationship"
          value={metadata.relationshipToPlayer}
          onChange={(e) => onChange('relationshipToPlayer', e.target.value)}
          className={getError('relationshipToPlayer') ? `${styles.select} ${styles.inputError}` : styles.select}
        >
          {RELATIONSHIP_TYPES.map((rel) => (
            <option key={rel.value} value={rel.value}>
              {rel.label}
            </option>
          ))}
        </select>
        {getError('relationshipToPlayer') && (
          <span className={styles.errorMessage}>{getError('relationshipToPlayer')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          Available in Screens <span className={styles.required}>*</span>
        </label>
        <div className={styles.checkboxGroup}>
          {SCREEN_TYPES.map((screen) => (
            <label key={screen.value} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={metadata.availableInScreens?.includes(screen.value) || false}
                onChange={() => toggleScreen(screen.value)}
              />
              <span>{screen.label}</span>
            </label>
          ))}
        </div>
        {getError('availableInScreens') && (
          <span className={styles.errorMessage}>{getError('availableInScreens')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="last-updated">Last Updated</label>
        <input
          id="last-updated"
          type="text"
          value={metadata.lastUpdated}
          readOnly
          className={styles.input}
        />
        <span className={styles.helperText}>
          Automatically updated when saved
        </span>
      </div>
    </section>
  );
}

