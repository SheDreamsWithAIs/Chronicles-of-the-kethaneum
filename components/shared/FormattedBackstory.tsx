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
 * CSS white-space: pre-wrap handles newlines, so we don't need to convert them to <br> tags
 */
function renderSegment(segment: TextSegment, index: number): React.ReactNode {
  const { text, color, italic, bold } = segment;

  const style: React.CSSProperties = {};
  if (color) {
    style.color = color;
  }

  // CSS white-space: pre-wrap will handle newlines, so just render the text directly
  let element: React.ReactNode = text;

  // Apply formatting in order: bold, then italic
  if (bold) {
    element = <strong key={`${index}-bold`}>{element}</strong>;
  }
  if (italic) {
    element = <em key={`${index}-italic`}>{element}</em>;
  }

  // If we have a color or both bold and italic, wrap in span
  if (color || (bold && italic)) {
    element = (
      <span key={`${index}-span`} style={style}>
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
      {content.paragraphs.map((paragraph, pIndex) => {
        // Check if paragraph is empty (no segments or all segments are empty)
        const hasContent = paragraph.segments.some(seg => seg.text.trim() !== '');
        
        return (
          <p key={pIndex}>
            {hasContent ? (
              paragraph.segments.map((segment, sIndex) => (
                <React.Fragment key={sIndex}>
                  {renderSegment(segment, sIndex)}
                </React.Fragment>
              ))
            ) : (
              // Empty paragraph - render non-breaking space to preserve blank line
              '\u00A0'
            )}
          </p>
        );
      })}
    </div>
  );
}
