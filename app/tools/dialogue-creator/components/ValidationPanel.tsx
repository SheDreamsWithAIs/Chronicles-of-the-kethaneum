/**
 * Validation panel component
 */

'use client';

import type { ValidationResult } from '../types/creator.types';
import styles from '../styles/dialogue-creator.module.css';

interface ValidationPanelProps {
  results: ValidationResult[];
  onFieldClick?: (field: string) => void;
}

export default function ValidationPanel({
  results,
  onFieldClick,
}: ValidationPanelProps) {
  const errors = results.filter((r) => r.severity === 'error');
  const warnings = results.filter((r) => r.severity === 'warning');
  const info = results.filter((r) => r.severity === 'info');

  if (results.length === 0) {
    return (
      <div className={styles.validationPanel}>
        <div className={styles.validationSuccess}>
          ✓ All validations passed
        </div>
      </div>
    );
  }

  return (
    <div className={styles.validationPanel}>
      <div className={styles.validationHeader}>
        <h3>Validation</h3>
        <div className={styles.validationSummary}>
          {errors.length > 0 && (
            <span className={styles.errorBadge}>{errors.length} errors</span>
          )}
          {warnings.length > 0 && (
            <span className={styles.warningBadge}>{warnings.length} warnings</span>
          )}
          {info.length > 0 && (
            <span className={styles.infoBadge}>{info.length} info</span>
          )}
        </div>
      </div>

      <div className={styles.validationList}>
        {errors.map((result, index) => (
          <div
            key={index}
            className={styles.validationError}
            onClick={() => onFieldClick?.(result.field)}
          >
            <strong>Error:</strong> {result.message}
            <span className={styles.validationField}>{result.field}</span>
          </div>
        ))}

        {warnings.map((result, index) => (
          <div
            key={index}
            className={styles.validationWarning}
            onClick={() => onFieldClick?.(result.field)}
          >
            <strong>Warning:</strong> {result.message}
            <span className={styles.validationField}>{result.field}</span>
          </div>
        ))}

        {info.map((result, index) => (
          <div
            key={index}
            className={styles.validationInfo}
            onClick={() => onFieldClick?.(result.field)}
          >
            <strong>Info:</strong> {result.message}
            <span className={styles.validationField}>{result.field}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

