'use client';

import { useEffect, useState } from 'react';
import { CosmicBackground } from './CosmicBackground';
import { getRoutePath } from '@/lib/utils/navigation';
import styles from './PageLoader.module.css';

interface PageLoaderProps {
  isLoading: boolean;
  variant?: 'title' | 'backstory' | 'book' | 'library' | 'puzzle';
  message?: string;
  tagline?: string;
  minDisplayTime?: number;
}

export function PageLoader({
  isLoading,
  variant = 'title',
  message,
  tagline = "A story is never just a story.",
  minDisplayTime = 300,
}: PageLoaderProps) {
  // Don't render at all when not loading (the hook handles minDisplayTime)
  if (!isLoading) {
    return null;
  }

  return (
    <div className={styles.loaderOverlay} data-testid="page-loader">
      <CosmicBackground variant={variant} starCount={150} particleCount={40} />
      <div className={styles.loaderContent}>
        <div className={styles.logoContainer}>
          <div className={styles.logoWrapper}>
            <img
              src={getRoutePath('/images/logo-glow.png')}
              alt="Chronicles of the Kethaneum Logo"
              className={styles.logoGlow}
            />
          </div>
        </div>
        {tagline && (
          <div className={styles.tagline}>{tagline}</div>
        )}
        {message && (
          <div className={styles.loadingMessage}>{message}</div>
        )}
      </div>
    </div>
  );
}
