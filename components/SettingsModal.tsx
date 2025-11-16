'use client';

import React, { useState } from 'react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'audio' | 'display' | 'gameplay' | 'accessibility';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'audio', label: 'Audio', icon: '🔊' },
  { id: 'display', label: 'Display', icon: '🎨' },
  { id: 'gameplay', label: 'Gameplay', icon: '🎮' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('audio');

  // Audio settings state
  const [masterVolume, setMasterVolume] = useState(70);
  const [musicVolume, setMusicVolume] = useState(80);
  const [ambientVolume, setAmbientVolume] = useState(60);
  const [sfxVolume, setSfxVolume] = useState(70);
  const [masterMuted, setMasterMuted] = useState(false);

  // Display settings state
  const [brightness, setBrightness] = useState(100);
  const [particleQuality, setParticleQuality] = useState('high');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Gameplay settings state
  const [difficulty, setDifficulty] = useState('medium');
  const [showTimer, setShowTimer] = useState(true);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Accessibility settings state
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [colorblindMode, setColorblindMode] = useState('none');
  const [dyslexicFont, setDyslexicFont] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderAudioTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Volume Controls</h3>
        <p className={styles.sectionDescription}>Adjust audio levels for different sound categories</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>🔊</span>
            Master Volume
          </label>
          <span className={styles.value}>{masterVolume}%</span>
        </div>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className={styles.slider}
          />
          <button
            className={`${styles.muteButton} ${masterMuted ? styles.muted : ''}`}
            onClick={() => setMasterMuted(!masterMuted)}
          >
            {masterMuted ? '🔇' : '🔊'}
          </button>
        </div>
        <p className={styles.helpText}>Master volume affects all other audio categories</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>🎵</span>
            Music Volume
          </label>
          <span className={styles.value}>{musicVolume}%</span>
        </div>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className={styles.slider}
          />
          <button className={styles.testButton}>Test</button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>🌙</span>
            Ambient Volume
          </label>
          <span className={styles.value}>{ambientVolume}%</span>
        </div>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min="0"
            max="100"
            value={ambientVolume}
            onChange={(e) => setAmbientVolume(Number(e.target.value))}
            className={styles.slider}
          />
          <button className={styles.testButton}>Test</button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>⚡</span>
            Sound Effects Volume
          </label>
          <span className={styles.value}>{sfxVolume}%</span>
        </div>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVolume}
            onChange={(e) => setSfxVolume(Number(e.target.value))}
            className={styles.slider}
          />
          <button className={styles.testButton}>Test</button>
        </div>
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Visual Settings</h3>
        <p className={styles.sectionDescription}>Customize the appearance and performance of the game</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>☀️</span>
            Brightness
          </label>
          <span className={styles.value}>{brightness}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="150"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>✨</span>
            Particle Effects
          </label>
          <span className={styles.value}>{particleQuality}</span>
        </div>
        <div className={styles.segmentedControl}>
          <button
            className={particleQuality === 'none' ? styles.active : ''}
            onClick={() => setParticleQuality('none')}
          >
            None
          </button>
          <button
            className={particleQuality === 'low' ? styles.active : ''}
            onClick={() => setParticleQuality('low')}
          >
            Low
          </button>
          <button
            className={particleQuality === 'medium' ? styles.active : ''}
            onClick={() => setParticleQuality('medium')}
          >
            Medium
          </button>
          <button
            className={particleQuality === 'high' ? styles.active : ''}
            onClick={() => setParticleQuality('high')}
          >
            High
          </button>
        </div>
        <p className={styles.helpText}>Lower settings improve performance on slower devices</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>🖥️</span>
            Fullscreen Mode
          </label>
          <button
            className={`${styles.toggle} ${fullscreen ? styles.toggleOn : ''}`}
            onClick={() => setFullscreen(!fullscreen)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>🎬</span>
            Reduce Motion
          </label>
          <button
            className={`${styles.toggle} ${reduceMotion ? styles.toggleOn : ''}`}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
        <p className={styles.helpText}>Minimize animations for reduced visual distraction</p>
      </div>
    </div>
  );

  const renderGameplayTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Game Settings</h3>
        <p className={styles.sectionDescription}>Configure your gameplay experience</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>⚔️</span>
            Difficulty
          </label>
          <span className={styles.value}>{difficulty}</span>
        </div>
        <div className={styles.segmentedControl}>
          <button
            className={difficulty === 'easy' ? styles.active : ''}
            onClick={() => setDifficulty('easy')}
          >
            Easy
          </button>
          <button
            className={difficulty === 'medium' ? styles.active : ''}
            onClick={() => setDifficulty('medium')}
          >
            Medium
          </button>
          <button
            className={difficulty === 'hard' ? styles.active : ''}
            onClick={() => setDifficulty('hard')}
          >
            Hard
          </button>
        </div>
        <div className={styles.difficultyInfo}>
          <div className={styles.difficultyDetail}>
            <span className={styles.detailLabel}>Grid Size:</span>
            <span className={styles.detailValue}>
              {difficulty === 'easy' ? '8×8' : difficulty === 'medium' ? '10×10' : '12×12'}
            </span>
          </div>
          <div className={styles.difficultyDetail}>
            <span className={styles.detailLabel}>Time Limit:</span>
            <span className={styles.detailValue}>
              {difficulty === 'easy' ? '4 min' : difficulty === 'medium' ? '3 min' : '2.5 min'}
            </span>
          </div>
          <div className={styles.difficultyDetail}>
            <span className={styles.detailLabel}>Word Count:</span>
            <span className={styles.detailValue}>
              {difficulty === 'easy' ? '6 words' : difficulty === 'medium' ? '8 words' : '10 words'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>⏱️</span>
            Show Timer
          </label>
          <button
            className={`${styles.toggle} ${showTimer ? styles.toggleOn : ''}`}
            onClick={() => setShowTimer(!showTimer)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
        <p className={styles.helpText}>Display countdown timer during timed puzzles</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>💡</span>
            Enable Hints
          </label>
          <button
            className={`${styles.toggle} ${hintsEnabled ? styles.toggleOn : ''}`}
            onClick={() => setHintsEnabled(!hintsEnabled)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
        <p className={styles.helpText}>Allow hint system to help find words</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>💾</span>
            Auto-Save Progress
          </label>
          <button
            className={`${styles.toggle} ${autoSave ? styles.toggleOn : ''}`}
            onClick={() => setAutoSave(!autoSave)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
        <p className={styles.helpText}>Automatically save your progress after each puzzle</p>
      </div>
    </div>
  );

  const renderAccessibilityTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Accessibility Options</h3>
        <p className={styles.sectionDescription}>Make the game more comfortable and accessible</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>📝</span>
            Font Size
          </label>
          <span className={styles.value}>{fontSize}</span>
        </div>
        <div className={styles.segmentedControl}>
          <button
            className={fontSize === 'small' ? styles.active : ''}
            onClick={() => setFontSize('small')}
          >
            Small
          </button>
          <button
            className={fontSize === 'medium' ? styles.active : ''}
            onClick={() => setFontSize('medium')}
          >
            Medium
          </button>
          <button
            className={fontSize === 'large' ? styles.active : ''}
            onClick={() => setFontSize('large')}
          >
            Large
          </button>
          <button
            className={fontSize === 'xlarge' ? styles.active : ''}
            onClick={() => setFontSize('xlarge')}
          >
            X-Large
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>🌗</span>
            High Contrast Mode
          </label>
          <button
            className={`${styles.toggle} ${highContrast ? styles.toggleOn : ''}`}
            onClick={() => setHighContrast(!highContrast)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
        <p className={styles.helpText}>Increase contrast for better readability</p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <label className={styles.label}>
            <span className={styles.icon}>🎨</span>
            Colorblind Mode
          </label>
          <span className={styles.value}>{colorblindMode}</span>
        </div>
        <div className={styles.dropdown}>
          <select
            value={colorblindMode}
            onChange={(e) => setColorblindMode(e.target.value)}
            className={styles.select}
          >
            <option value="none">None</option>
            <option value="protanopia">Protanopia (Red-Blind)</option>
            <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
            <option value="tritanopia">Tritanopia (Blue-Blind)</option>
          </select>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>
            <span className={styles.icon}>📖</span>
            Dyslexia-Friendly Font
          </label>
          <button
            className={`${styles.toggle} ${dyslexicFont ? styles.toggleOn : ''}`}
            onClick={() => setDyslexicFont(!dyslexicFont)}
          >
            <span className={styles.toggleThumb}></span>
          </button>
        </div>
        <p className={styles.helpText}>Use OpenDyslexic font for easier reading</p>
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>ℹ️</span>
        <p>More accessibility features coming soon, including screen reader support and keyboard navigation improvements.</p>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.panel} onClick={handlePanelClick} role="dialog" aria-labelledby="settings-title">
        <div className={styles.header}>
          <h2 id="settings-title" className={styles.title}>⚙️ Settings</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'audio' && renderAudioTab()}
          {activeTab === 'display' && renderDisplayTab()}
          {activeTab === 'gameplay' && renderGameplayTab()}
          {activeTab === 'accessibility' && renderAccessibilityTab()}
        </div>

        <div className={styles.footer}>
          <button className={styles.resetButton}>
            🔄 Reset to Defaults
          </button>
          <div className={styles.footerActions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.saveButton} onClick={onClose}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
