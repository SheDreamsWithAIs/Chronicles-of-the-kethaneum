'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import styles from './credits.module.css';

export default function CreditsScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBackToTitle = () => {
    router.push('/');
  };

  const moonPhases = [
    { type: 'new', className: styles.moonPhaseNew },
    { type: 'waxing', className: styles.moonPhaseWaxing },
    { type: 'full', className: styles.moonPhaseFull },
    { type: 'waning', className: styles.moonPhaseWaning }
  ];

  return (
    <div className={`${styles.creditsContainer} ${isVisible ? styles.visible : ''}`} data-testid="credits-screen">
      <CosmicBackground variant="title" starCount={150} particleCount={40} />

      <div className={styles.creditsScreen}>
        <div className={styles.bookContainer}>
          <div className={styles.bookSpine}></div>
          
          <div className={styles.bookContent}>
            <div className={styles.pageDecoration}>✦</div>

            <h1 className={styles.creditsTitle}>Credits</h1>

            <div className={styles.creditsContent} data-testid="credits-content">
              <section className={styles.creditsSection}>
                <h2 className={styles.sectionTitle}>Created By</h2>
                <p className={styles.creatorName}>Jess Burton</p>
                <p className={styles.creatorNote}>
                  Everything you see here was created alongside AI collaborators.
                </p>
              </section>

              <section className={styles.creditsSection}>
                <h2 className={styles.sectionTitle}>AI Collaborators</h2>
                <div className={styles.aiList}>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Holiday</span>
                    <span className={styles.aiModel}>Anthropic Claude - Opus Model</span>
                  </div>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Sonny</span>
                    <span className={styles.aiModel}>Anthropic Claude - Sonnet Model</span>
                  </div>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Aethon</span>
                    <span className={styles.aiModel}>OpenAI ChatGPT - Various</span>
                  </div>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Blueberry</span>
                    <span className={styles.aiModel}>OpenAI ChatGPT - o4 Model</span>
                  </div>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Oliver</span>
                    <span className={styles.aiModel}>Replika</span>
                  </div>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Rommie</span>
                    <span className={styles.aiModel}>Google Gemini - Various</span>
                  </div>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Phoenix</span>
                    <span className={styles.aiModel}>Cursor IDE - Composer 1</span>
                  </div>
                </div>
              </section>

              <section className={styles.creditsSection}>
                <h2 className={styles.sectionTitle}>Other AI Tools</h2>
                <div className={styles.aiList}>
                  <div className={styles.aiEntry}>
                    <span className={styles.aiName}>Suno AI</span>
                    <span className={styles.aiModel}>Music</span>
                  </div>
                </div>
              </section>

              <section className={styles.creditsSection}>
                <p className={styles.footerNote}>
                  <em>Thank you for playing Chronicles of the Kethaneum.</em>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <div className={styles.buttonOrnament}>
          <div className={styles.ornamentContainer}>
            <div className={styles.moonPhases}>
              {moonPhases.slice(0, 2).map((moon, index) => (
                <div key={index} className={`${styles.moonPhase} ${moon.className}`}></div>
              ))}
            </div>
            
            <button className={styles.backButton} onClick={handleBackToTitle} data-testid="back-to-title-btn">
              Back to Title Screen
            </button>
            
            <div className={styles.moonPhases}>
              {moonPhases.slice(2, 4).map((moon, index) => (
                <div key={index + 2} className={`${styles.moonPhase} ${moon.className}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

