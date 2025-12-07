/**
 * List of dialogue entries component
 */

'use client';

import { useState } from 'react';
import type { BanterDialogue } from '@/lib/dialogue/types';
import type { ValidationResult, TextLimits } from '../types/creator.types';
import DialogueEntryForm from './DialogueEntryForm';
import styles from '../styles/dialogue-creator.module.css';

interface DialogueEntryListProps {
  entries: BanterDialogue[];
  onAdd: () => void;
  onUpdate: (index: number, entry: BanterDialogue) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onReorder: (index: number, direction: 'up' | 'down') => void;
  errors: ValidationResult[];
  textLimits?: TextLimits | null;
}

export default function DialogueEntryList({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  errors,
  textLimits,
}: DialogueEntryListProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set([0]));

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Dialogue Entries</h2>
        <button
          type="button"
          onClick={onAdd}
          className={styles.addButton}
        >
          + Add Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No dialogue entries yet. Click "Add Entry" to create one.</p>
        </div>
      ) : (
        <div className={styles.dialogueList}>
          {entries.map((entry, index) => (
            <DialogueEntryForm
              key={index}
              entry={entry}
              index={index}
              totalEntries={entries.length}
              isExpanded={expandedIndices.has(index)}
              onChange={onUpdate}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onReorder={onReorder}
              onToggleExpand={() => toggleExpand(index)}
              errors={errors}
              textLimits={textLimits}
            />
          ))}
        </div>
      )}
    </section>
  );
}

