'use client';

/**
 * Library Button Component
 *
 * A button that navigates to the Library with visual notification
 * when new dialogue events are waiting.
 */

import { useStoryNotification } from '@/contexts/StoryNotificationContext';
import styles from '@/styles/story-notification.module.css';

interface LibraryButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export function LibraryButton({
  onClick,
  className = '',
  children = 'Enter the Library',
  'data-testid': dataTestId,
}: LibraryButtonProps) {
  const { hasNewDialogue } = useStoryNotification();

  const buttonClassName = hasNewDialogue
    ? `${className} ${styles.storyNotificationGlow}`
    : className;

  return (
    <button
      className={buttonClassName}
      onClick={onClick}
      data-testid={dataTestId}
      title={hasNewDialogue ? 'New dialogue event waiting!' : undefined}
    >
      {children}
    </button>
  );
}
