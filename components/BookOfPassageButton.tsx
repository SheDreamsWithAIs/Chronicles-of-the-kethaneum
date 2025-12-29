'use client';

/**
 * Book of Passage Button Component
 *
 * A button that navigates to the Book of Passage with visual notification
 * when new story content is available.
 */

import { useStoryNotification } from '@/contexts/StoryNotificationContext';
import styles from '@/styles/story-notification.module.css';

interface BookOfPassageButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export function BookOfPassageButton({
  onClick,
  className = '',
  children = 'Back to Book of Passage',
  'data-testid': dataTestId,
}: BookOfPassageButtonProps) {
  const { hasNewStory } = useStoryNotification();

  const buttonClassName = hasNewStory
    ? `${className} ${styles.storyNotificationGlow}`
    : className;

  return (
    <button
      className={buttonClassName}
      onClick={onClick}
      data-testid={dataTestId}
      title={hasNewStory ? 'New story content available!' : undefined}
    >
      {children}
    </button>
  );
}
