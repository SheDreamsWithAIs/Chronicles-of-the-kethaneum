'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'kethaneumFontSize';
const DEFAULT_FONT_SIZE = 100;
const MIN_FONT_SIZE = 75;
const MAX_FONT_SIZE = 150;

export function FontSizeInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
          document.documentElement.style.setProperty('--base-font-size', `${parsed}%`);
        } else {
          document.documentElement.style.setProperty('--base-font-size', `${DEFAULT_FONT_SIZE}%`);
        }
      } else {
        document.documentElement.style.setProperty('--base-font-size', `${DEFAULT_FONT_SIZE}%`);
      }
    }
  }, []);

  return null;
}

