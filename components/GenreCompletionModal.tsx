'use client';

import { useMemo, useState } from 'react';
import styles from './GenreCompletionModal.module.css';

interface GenreDisplayInfo {
  title: string;
  description: string;
  icon: string;
}

interface GenreCompletionModalProps {
  isOpen: boolean;
  currentGenre: string;
  availableGenres: string[];
  onContinueSameGenre: () => void;
  onSelectNewGenre: (genre: string) => void;
  onClose: () => void;
}

function getGenreDisplayInfo(genre: string): GenreDisplayInfo {
  const genreInfo: { [key: string]: GenreDisplayInfo } = {
    "Kethaneum": {
      title: "Kethaneum Lore",
      description: "Chronicles of the nexus between realms",
      icon: "✦"
    },
    "nature": {
      title: "Natural Wisdom",
      description: "Words of the living world",
      icon: "❦"
    }
  };

  return genreInfo[genre] || {
    title: genre.charAt(0).toUpperCase() + genre.slice(1),
    description: "Knowledge constructs from across realms",
    icon: "✦"
  };
}

export function GenreCompletionModal({
  isOpen,
  currentGenre,
  availableGenres,
  onContinueSameGenre,
  onSelectNewGenre,
  onClose
}: GenreCompletionModalProps) {
  const currentGenreInfo = useMemo(() => getGenreDisplayInfo(currentGenre), [currentGenre]);

  const otherGenres = useMemo(() => {
    return availableGenres
      .filter(genre => genre !== currentGenre)
      .map(genre => ({
        genre,
        ...getGenreDisplayInfo(genre)
      }));
  }, [availableGenres, currentGenre]);

  const [showGenreSelection, setShowGenreSelection] = useState(false);

  if (!isOpen) return null;

  // Show genre selection screen
  if (showGenreSelection) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panelContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="genre-selection-title">
          <h2 className={styles.panelTitle} id="genre-selection-title">Select a New Knowledge Category</h2>

          <div className={styles.genreContainer}>
            {otherGenres.map((card) => (
              <div
                key={card.genre}
                className={styles.genreCard}
                onClick={() => onSelectNewGenre(card.genre)}
              >
                <div className={styles.cardGlow}></div>
                <div className={styles.cardContent}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <div className={styles.cardIcon}>{card.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <button className={styles.panelClose} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show main completion screen with two options
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panelContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="completion-modal-title">
        <h2 className={styles.panelTitle} id="completion-modal-title">
          {currentGenreInfo.icon} Genre Complete {currentGenreInfo.icon}
        </h2>

        <div className={styles.completionMessage}>
          <p className={styles.congratsText}>
            Congratulations, Archivist! You have completed all available books in <strong>{currentGenreInfo.title}</strong>.
          </p>
          <p className={styles.promptText}>
            How would you like to continue your journey through the archives?
          </p>
        </div>

        <div className={styles.optionsContainer}>
          <div
            className={styles.optionCard}
            onClick={onContinueSameGenre}
          >
            <div className={styles.cardGlow}></div>
            <div className={styles.cardContent}>
              <div className={styles.optionIcon}>↻</div>
              <h3>Continue This Path</h3>
              <p>Replay books from {currentGenreInfo.title} to deepen your mastery</p>
            </div>
          </div>

          <div
            className={styles.optionCard}
            onClick={() => {
              if (otherGenres.length === 0) {
                // No other genres available, just continue same genre
                onContinueSameGenre();
              } else if (otherGenres.length === 1) {
                // Only one other genre, select it directly
                onSelectNewGenre(otherGenres[0].genre);
              } else {
                // Multiple genres, show selection screen
                setShowGenreSelection(true);
              }
            }}
          >
            <div className={styles.cardGlow}></div>
            <div className={styles.cardContent}>
              <div className={styles.optionIcon}>✦</div>
              <h3>Explore New Realms</h3>
              <p>
                {otherGenres.length === 0
                  ? 'No other genres available yet'
                  : otherGenres.length === 1
                    ? `Begin your journey through ${otherGenres[0].title}`
                    : 'Choose a new knowledge category to explore'
                }
              </p>
            </div>
          </div>
        </div>

        <button className={styles.panelClose} onClick={onClose}>
          Return to Library
        </button>
      </div>
    </div>
  );
}
