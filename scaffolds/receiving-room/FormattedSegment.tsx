'use client';
import React from 'react';

export default function FormattedSegment({ segment }: { segment: { paragraphs: string[] } }) {
  return (
    <div className="formattedText">
      {segment.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}
