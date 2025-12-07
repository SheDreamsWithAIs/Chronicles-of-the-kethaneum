'use client';

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useFontSize } from '@/hooks/useFontSize';
import { saveProgress } from '@/lib/save/unifiedSaveSystem';
import { AudioSettingsModal } from './AudioSettingsModal';
import styles from './SettingsMenu.module.css';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTitle: () => void;
  context: 'puzzle' | 'library';
  onResumeGame?: () => void;
  onReturnToPause?: () => void;
  onReturnToLibrary?: () => void;
}

export function SettingsMenu({
  isOpen,
  onClose,
  onNavigateToTitle,
  context,
  onResumeGame,
  onReturnToPause,
  onReturnToLibrary,
}: SettingsMenuProps) {
  const { state } = useGameState();
  const { fontSize, setFontSize, resetFontSize, minFontSize, maxFontSize } = useFontSize();
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      await saveProgress(state);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save game:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
  };

  const handleAudioSettingsClose = () => {
    setShowAudioSettings(false);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panelContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="settings-modal-title">
          <h2 className={styles.panelTitle} id="settings-modal-title">Settings</h2>

          <div className={styles.settingsContainer}>
            {/* Audio Settings Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Audio</h3>
              <button
                className={styles.actionButton}
                onClick={() => setShowAudioSettings(true)}
              >
                Open Audio Settings
              </button>
            </div>

            {/* Manual Save Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Save Game</h3>
              <button
                className={styles.actionButton}
                onClick={handleManualSave}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'success' && 'Saved!'}
                {saveStatus === 'error' && 'Error Saving'}
                {saveStatus === 'idle' && 'Save Game'}
              </button>
              {saveStatus === 'success' && (
                <p className={styles.statusMessage}>Game saved successfully!</p>
              )}
              {saveStatus === 'error' && (
                <p className={styles.statusMessageError}>Failed to save game. Please try again.</p>
              )}
            </div>

            {/* Font Size Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Font Size</h3>
              <div className={styles.fontSizeControl}>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min={minFontSize}
                    max={maxFontSize}
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.fontSizeValue}>
                    {fontSize}%
                  </span>
                </div>
                <button
                  className={styles.resetButton}
                  onClick={resetFontSize}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className={styles.navigationContainer}>
            {context === 'puzzle' && (
              <>
                <button
                  className={`${styles.navButton} ${styles.primaryButton}`}
                  onClick={() => {
                    onClose();
                    onResumeGame?.();
                  }}
                >
                  Resume Game
                </button>
                <button
                  className={`${styles.navButton} ${styles.secondaryButton}`}
                  onClick={() => {
                    onClose();
                    onReturnToPause?.();
                  }}
                >
                  Back to Pause Menu
                </button>
              </>
            )}
            {context === 'library' && (
              <button
                className={`${styles.navButton} ${styles.primaryButton}`}
                onClick={() => {
                  onClose();
                  onReturnToLibrary?.();
                }}
              >
                Return to Library
              </button>
            )}
            <button
              className={`${styles.navButton} ${styles.secondaryButton}`}
              onClick={() => {
                onClose();
                onNavigateToTitle();
              }}
            >
              Navigate to Title Screen
            </button>
          </div>
        </div>
      </div>

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <AudioSettingsModal
          isOpen={showAudioSettings}
          onClose={handleAudioSettingsClose}
        />
      )}
    </>
  );
}

