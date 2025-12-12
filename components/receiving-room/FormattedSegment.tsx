/**
 * Component for rendering formatted text segments in the receiving room
 */

import React from 'react';
import type { Paragraph, TextSegment } from '@/lib/utils/formattedContentLoader';

interface FormattedSegmentProps {
  paragraphs: Paragraph[];
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
 * FormattedSegment component
 * Renders multiple paragraphs with formatted text segments
 */
export function FormattedSegment({ paragraphs, className }: FormattedSegmentProps) {
  return (
    <div className={className}>
      {paragraphs.map((paragraph, pIndex) => (
        <p key={pIndex}>
          {paragraph.segments.map((segment, sIndex) =>
            renderSegment(segment, sIndex)
          )}
        </p>
      ))}
    </div>
  );
}