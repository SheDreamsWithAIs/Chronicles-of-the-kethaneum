'use client';

import { useState, useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { AudioCategory } from '@/lib/audio/audioManager';
import styles from './AudioSettingsModal.module.css';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface VolumeControl {
  id: 'master' | AudioCategory;
  label: string;
  icon: string;
}

const VOLUME_CONTROLS: VolumeControl[] = [
  { id: 'master', label: 'Master Volume', icon: '🔊' },
  { id: AudioCategory.MUSIC, label: 'Music', icon: '🎵' },
  { id: AudioCategory.AMBIENT, label: 'Ambient', icon: '🌊' },
  { id: AudioCategory.SFX, label: 'Sound Effects', icon: '✨' },
  { id: AudioCategory.VOICE, label: 'Voice Lines', icon: '🗣️' },
];

export function AudioSettingsModal({
  isOpen,
  onClose,
  onSave
}: AudioSettingsModalProps) {
  const audio = useAudio();
  const [localSettings, setLocalSettings] = useState(audio.settings);

  // Update local settings when audio settings change
  useEffect(() => {
    setLocalSettings(audio.settings);
  }, [audio.settings]);

  if (!isOpen) return null;

  const handleVolumeChange = (category: 'master' | AudioCategory, value: number) => {
    const newValue = value / 100; // Convert from 0-100 to 0-1
    const updatedSettings = {
      ...localSettings,
      [`${category === 'master' ? 'master' : category}Volume`]: newValue
    };
    setLocalSettings(updatedSettings);
    // Apply immediately to audio system
    audio.updateSettings({
      [`${category === 'master' ? 'master' : category}Volume`]: newValue
    } as Partial<typeof localSettings>);
  };

  const handleMuteToggle = (category: 'master' | AudioCategory) => {
    const muteKey = `${category === 'master' ? 'master' : category}Muted` as keyof typeof localSettings;
    const newMutedState = !localSettings[muteKey];
    const updatedSettings = {
      ...localSettings,
      [muteKey]: newMutedState
    };
    setLocalSettings(updatedSettings);
    // Apply immediately to audio system
    audio.updateSettings({
      [muteKey]: newMutedState
    } as Partial<typeof localSettings>);
  };

  const handleSave = () => {
    // Settings are already applied immediately, but ensure everything is synced
    audio.updateSettings(localSettings);
    onSave?.();
    onClose();
  };

  const handleCancel = () => {
    // Revert to original settings
    const originalSettings = audio.settings;
    setLocalSettings(originalSettings);
    audio.updateSettings(originalSettings);
    onClose();
  };

  const getVolume = (category: 'master' | AudioCategory): number => {
    const volumeKey = `${category === 'master' ? 'master' : category}Volume` as keyof typeof localSettings;
    return (localSettings[volumeKey] as number) * 100; // Convert from 0-1 to 0-100
  };

  const isMuted = (category: 'master' | AudioCategory): boolean => {
    const muteKey = `${category === 'master' ? 'master' : category}Muted` as keyof typeof localSettings;
    return localSettings[muteKey] as boolean;
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.panelContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="audio-modal-title">
        <h2 className={styles.panelTitle} id="audio-modal-title">Audio Settings</h2>

        <div className={styles.settingsContainer}>
          {VOLUME_CONTROLS.map((control) => (
            <div key={control.id} className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span className={styles.controlIcon}>{control.icon}</span>
                <label className={styles.controlLabel}>{control.label}</label>
                <button
                  className={`${styles.muteButton} ${isMuted(control.id) ? styles.muted : ''}`}
                  onClick={() => handleMuteToggle(control.id)}
                  title={isMuted(control.id) ? 'Unmute' : 'Mute'}
                >
                  {isMuted(control.id) ? '🔇' : '🔊'}
                </button>
              </div>

              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getVolume(control.id)}
                  onChange={(e) => handleVolumeChange(control.id, Number(e.target.value))}
                  className={styles.slider}
                  disabled={isMuted(control.id)}
                />
                <span className={styles.volumeValue}>
                  {Math.round(getVolume(control.id))}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.infoText}>
          <p>💡 Master volume affects all audio categories</p>
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
