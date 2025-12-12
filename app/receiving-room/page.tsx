'use client';

import { useState, useEffect, useRef } from 'react';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { FormattedSegment } from '@/components/receiving-room/FormattedSegment';
import { ActionButton } from '@/components/receiving-room/ActionButton';
import { navigateTo } from '@/lib/utils/navigation';
import { loadReceivingRoomContent, type ReceivingRoomContent } from '@/lib/utils/receivingRoomLoader';
import styles from './receiving-room.module.css';

export default function ReceivingRoomScreen() {
  const [content, setContent] = useState<ReceivingRoomContent | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasSetVisitFlag = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load receiving room content
    loadReceivingRoomContent().then((loadedContent) => {
      if (loadedContent) {
        setContent(loadedContent);
      } else {
        console.error('Failed to load receiving room content');
      }
    });
  }, []);

  const handleActionComplete = () => {
    if (!content) return;

    // Check if this is the last segment
    const isLastSegment = currentSegmentIndex === content.segments.length - 1;
    
    if (isLastSegment) {
      // Last segment - navigate to book of passage
      setIsTransitioning(true);
      // Use a small delay for transition, then navigate
      setTimeout(() => {
        navigateTo('/book-of-passage');
      }, 300);
    } else {
      // Not the last segment - move to next segment
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSegmentIndex(currentSegmentIndex + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const currentSegment = content?.segments[currentSegmentIndex];

  if (!content || !currentSegment) {
    return (
      <div className={styles.receivingRoomContainer}>
        <CosmicBackground variant="backstory" starCount={150} particleCount={40} />
        <div className={styles.loadingMessage}>Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.receivingRoomContainer} ${isVisible ? styles.visible : ''}`}
      data-testid="receiving-room-screen"
    >
      <CosmicBackground variant="backstory" starCount={150} particleCount={40} />

      <div className={styles.receivingRoomContent}>
        {/* Room Art Area - Placeholder for now */}
        <div className={styles.roomArtArea}>
          <div className={styles.roomArtPlaceholder}>
            <div className={styles.artPlaceholderContent}>
              [ Receiving Room Artwork Will Display Here ]<br />
              <span className={styles.artPlaceholderSubtext}>
                The mysterious chamber where your journey begins
              </span>
            </div>
          </div>
        </div>

        {/* Story Text Area */}
        <div className={styles.storyTextArea}>
          <div 
            className={`${styles.textContainer} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}
            key={currentSegmentIndex}
          >
            <FormattedSegment 
              paragraphs={currentSegment.paragraphs}
              className={styles.formattedText}
            />
          </div>
        </div>

        {/* Action Button Area */}
        <div className={styles.actionButtonArea}>
          <ActionButton
            text={currentSegment.actionButton.text}
            onActionComplete={handleActionComplete}
          />
        </div>
      </div>
    </div>
  );
}