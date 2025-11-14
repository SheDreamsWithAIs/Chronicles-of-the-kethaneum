'use client';

import { useMemo } from 'react';
import styles from './GenreSelectionModal.module.css';

interface GenreDisplayInfo {
  title: string;
  description: string;
  icon: string;
}

interface GenreSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGenre: (genre: string) => void;
  availableGenres: string[];
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
      icon: "🍃"
    }
  };

  return genreInfo[genre] || {
    title: genre.charAt(0).toUpperCase() + genre.slice(1),
    description: "Knowledge constructs from across realms",
    icon: "✦"
  };
}

export function GenreSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectGenre,
  availableGenres 
}: GenreSelectionModalProps) {
  const genreCards = useMemo(() => {
    return availableGenres.map(genre => ({
      genre,
      ...getGenreDisplayInfo(genre)
    }));
  }, [availableGenres]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panelContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="genre-modal-title">
        <h2 className={styles.panelTitle} id="genre-modal-title">Select a Knowledge Category</h2>
        
        <div className={styles.genreContainer}>
          {genreCards.map((card) => (
            <div
              key={card.genre}
              className={styles.genreCard}
              onClick={() => onSelectGenre(card.genre)}
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
          Return to Archives
        </button>
      </div>
    </div>
  );
}

