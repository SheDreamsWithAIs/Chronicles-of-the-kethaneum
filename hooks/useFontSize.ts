'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'kethaneumFontSize';
const DEFAULT_FONT_SIZE = 100; // 100% = default size
const MIN_FONT_SIZE = 75;
const MAX_FONT_SIZE = 150;

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<number>(DEFAULT_FONT_SIZE);

  // Load font size from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
          setFontSizeState(parsed);
          applyFontSize(parsed);
        }
      }
    }
  }, []);

  const applyFontSize = (percentage: number) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--base-font-size', `${percentage}%`);
    }
  };

  const setFontSize = (percentage: number) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, percentage));
    setFontSizeState(clamped);
    applyFontSize(clamped);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, clamped.toString());
    }
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const getFontSize = (): number => {
    return fontSize;
  };

  return {
    fontSize,
    setFontSize,
    resetFontSize,
    getFontSize,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    defaultFontSize: DEFAULT_FONT_SIZE,
  };
}

