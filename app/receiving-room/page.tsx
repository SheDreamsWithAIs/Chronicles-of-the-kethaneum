'use client';

import { useState, useEffect, useRef } from 'react';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { FormattedSegment } from '@/components/receiving-room/FormattedSegment';
import { ActionButton } from '@/components/receiving-room/ActionButton';
import { navigateTo } from '@/lib/utils/navigation';
import { loadReceivingRoomContent, type ReceivingRoomContent } from '@/lib/utils/receivingRoomLoader';
import { PageLoader } from '@/components/shared/PageLoader';
import { usePageLoader } from '@/hooks/usePageLoader';
import styles from './receiving-room.module.css';

export default function ReceivingRoomScreen() {
  const storyAreaRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<ReceivingRoomContent | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hideContentForExit, setHideContentForExit] = useState(false);
  const hasSetVisitFlag = useRef(false);
  const { isLoading: pageLoading, setLoading } = usePageLoader({
    minDisplayTime: 300,
    dependencies: [],
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load receiving room content
    setLoading('content', true);
    loadReceivingRoomContent().then((loadedContent) => {
      if (loadedContent) {
        setContent(loadedContent);
      } else {
        console.error('Failed to load receiving room content');
      }
      setLoading('content', false);
    });
  }, [setLoading]);

  const handleActionComplete = () => {
    if (!content) return;

    // Check if this is the last segment
    const isLastSegment = currentSegmentIndex === content.segments.length - 1;
    
    if (isLastSegment) {
      // Last segment - navigate to book of passage
      setIsTransitioning(true);
      setHideContentForExit(true);
      setLoading('transition', true);
      // Use a small delay for transition, then navigate
      setTimeout(() => {
        navigateTo('/book-of-passage');
      }, 300);
    } else {
      // Not the last segment - move to next segment
      setIsTransitioning(true);
      setLoading('transition', true);
      setTimeout(() => {
        setCurrentSegmentIndex(currentSegmentIndex + 1);
        setIsTransitioning(false);
        setLoading('transition', false);
      }, 300);
    }
  };

  const currentSegment = content?.segments[currentSegmentIndex];

  // Reset scroll to top whenever the segment changes
  useEffect(() => {
    if (storyAreaRef.current) {
      storyAreaRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentSegmentIndex]);

  if (!content || !currentSegment) {
    return (
      <>
        <div className={styles.receivingRoomContainer}>
          <CosmicBackground variant="backstory" starCount={150} particleCount={40} />
          <div className={styles.loadingMessage}>Loading...</div>
        </div>
        <PageLoader isLoading={true} variant="backstory" message="Preparing the receiving room..." />
      </>
    );
  }

  return (
    <>
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
        <div className={styles.storyTextArea} ref={storyAreaRef}>
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

      <PageLoader
        isLoading={pageLoading || hideContentForExit}
        variant="backstory"
        message="Preparing the receiving room..."
      />
    </>
  );
}
