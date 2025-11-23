/**
 * Component for rendering formatted backstory content
 */

import React from 'react';
import type { BackstoryContent, TextSegment } from '@/lib/utils/backstoryLoader';

interface FormattedBackstoryProps {
  content: BackstoryContent;
  className?: string;
}

/**
 * Renders a single text segment with formatting
 */
function renderSegment(segment: TextSegment, index: number): React.ReactNode {
  const { text, color, italic, bold } = segment;

  const style: React.CSSProperties = {};
  if (color) {
    style.color = color;
  }

  let element: React.ReactNode = text;

  // Apply formatting in order: bold, then italic
  if (bold) {
    element = <strong key={index}>{element}</strong>;
  }
  if (italic) {
    element = <em key={index}>{element}</em>;
  }

  // If we have a color or both bold and italic, wrap in span
  if (color || (bold && italic)) {
    element = (
      <span key={index} style={style}>
        {element}
      </span>
    );
  }

  return element;
}

/**
 * FormattedBackstory component
 * Renders backstory content loaded from JSON with formatting support
 */
export function FormattedBackstory({ content, className }: FormattedBackstoryProps) {
  return (
    <div className={className}>
      {content.paragraphs.map((paragraph, pIndex) => (
        <p key={pIndex}>
          {paragraph.segments.map((segment, sIndex) =>
            renderSegment(segment, sIndex)
          )}
        </p>
      ))}
    </div>
  );
}
