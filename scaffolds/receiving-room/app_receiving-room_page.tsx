'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CosmicBackground from './CosmicBackground';
import FormattedSegment from './FormattedSegment';
import ActionButton from './ActionButton';
import styles from './receiving-room.module.css';

type Segment = { paragraphs: string[]; actionText?: string };
type ReceivingRoomContent = { segments: Segment[] };

export default function ReceivingRoomScreen() {
  const router = useRouter();
  const [content, setContent] = useState<ReceivingRoomContent | null>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // Mock loader; replace with real loadReceivingRoomContent() if desired
    const mock: ReceivingRoomContent = {
      segments: [
        { paragraphs: ['Welcome to the receiving room.'], actionText: 'Next' },
        { paragraphs: ['A quiet place between journeys.'], actionText: 'Enter' },
      ],
    };
    const t = setTimeout(() => setContent(mock), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!content) return <div className={styles.loadingMessage}>Loading...</div>;

  const seg = content.segments[index];
  const last = index >= content.segments.length - 1;

  function handleAction() {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      if (!last) setIndex(i => i + 1);
      else router.push('/book-of-passage');
    }, 300);
  }

  return (
    <div data-testid="receiving-room-screen" className={`${styles.receivingRoomContainer} ${visible ? styles.visible : ''}`}>
      <CosmicBackground variant="backstory" starCount={150} particleCount={40} />
      <div className={styles.roomArtArea}>
        <div className={styles.roomArtPlaceholder}>
          <div className={styles.artPlaceholderContent}>Room Art</div>
          <div className={styles.artPlaceholderSubtext}>(replace with scene asset)</div>
        </div>
      </div>
      <div className={styles.storyTextArea}>
        <div className={`${styles.textContainer} ${transitioning ? styles.fadeOut : styles.fadeIn}`}>
          <FormattedSegment segment={seg} />
          <ActionButton text={seg.actionText || 'Continue'} onAction={handleAction} />
        </div>
      </div>
    </div>
  );
}
