'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CosmicBackground } from '@/components/shared/CosmicBackground';

// ============================================================================
// TYPES
// ============================================================================

interface TextSegment {
  text: string;
  color?: string;
  italic?: boolean;
  bold?: boolean;
}

interface Paragraph {
  segments: TextSegment[];
}

interface FormattedContent {
  title: string;
  paragraphs: Paragraph[];
}

interface ContentFile {
  name: string;
  path: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTENT_FILES: ContentFile[] = [
  {
    name: 'Backstory',
    path: '/data/backstory-content.json',
    description: 'Opening story shown when starting the game',
  },
  {
    name: 'Story End',
    path: '/data/story-end-content.json',
    description: 'Congratulations message shown at game completion',
  },
];

const PRESET_COLORS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Gold', value: '#fbbf24' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Coral', value: '#ff6b6b' },
  { name: 'Teal', value: '#4ecdc4' },
  { name: 'Rose', value: '#f472b6' },
  { name: 'Emerald', value: '#34d399' },
  { name: 'Amber', value: '#f59e0b' },
];

// ============================================================================
// UTILITIES
// ============================================================================

function createEmptySegment(): TextSegment {
  return { text: '' };
}

function createEmptyParagraph(): Paragraph {
  return { segments: [createEmptySegment()] };
}

function createEmptyContent(): FormattedContent {
  return {
    title: 'New Title',
    paragraphs: [createEmptyParagraph()],
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface SegmentEditorProps {
  segment: TextSegment;
  segmentIndex: number;
  paragraphIndex: number;
  onChange: (pIndex: number, sIndex: number, segment: TextSegment) => void;
  onDelete: (pIndex: number, sIndex: number) => void;
  canDelete: boolean;
}

function SegmentEditor({
  segment,
  segmentIndex,
  paragraphIndex,
  onChange,
  onDelete,
  canDelete,
}: SegmentEditorProps) {
  return (
    <div className="bg-[var(--primary-dark)] bg-opacity-50 rounded-lg p-4 mb-3 border border-[var(--primary-light)] border-opacity-30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--text-medium)]">Segment {segmentIndex + 1}</span>
        {canDelete && (
          <button
            onClick={() => onDelete(paragraphIndex, segmentIndex)}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500 hover:bg-opacity-20 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* Text Input */}
      <div className="mb-3">
        <label className="block text-sm text-[var(--text-medium)] mb-1">Text</label>
        <textarea
          value={segment.text}
          onChange={(e) =>
            onChange(paragraphIndex, segmentIndex, { ...segment, text: e.target.value })
          }
          className="w-full px-3 py-2 bg-[var(--primary-medium)] border border-[var(--primary-light)] rounded text-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-main)] resize-y min-h-[60px]"
          placeholder="Enter text..."
        />
      </div>

      {/* Formatting Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Bold Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={segment.bold || false}
            onChange={(e) =>
              onChange(paragraphIndex, segmentIndex, { ...segment, bold: e.target.checked || undefined })
            }
            className="w-4 h-4 accent-[var(--accent-main)]"
          />
          <span className="text-sm text-[var(--text-light)] font-bold">Bold</span>
        </label>

        {/* Italic Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={segment.italic || false}
            onChange={(e) =>
              onChange(paragraphIndex, segmentIndex, { ...segment, italic: e.target.checked || undefined })
            }
            className="w-4 h-4 accent-[var(--accent-main)]"
          />
          <span className="text-sm text-[var(--text-light)] italic">Italic</span>
        </label>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-medium)]">Color:</span>
          <select
            value={segment.color || ''}
            onChange={(e) =>
              onChange(paragraphIndex, segmentIndex, {
                ...segment,
                color: e.target.value || undefined,
              })
            }
            className="px-2 py-1 bg-[var(--primary-medium)] border border-[var(--primary-light)] rounded text-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-main)]"
          >
            <option value="">Default</option>
            {PRESET_COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>
          {segment.color && (
            <div
              className="w-6 h-6 rounded border border-[var(--primary-light)]"
              style={{ backgroundColor: segment.color }}
            />
          )}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={segment.color || '#ffffff'}
            onChange={(e) =>
              onChange(paragraphIndex, segmentIndex, { ...segment, color: e.target.value })
            }
            className="w-8 h-8 cursor-pointer rounded"
            title="Custom color"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-3 p-2 bg-[var(--primary-medium)] rounded border border-[var(--primary-light)] border-opacity-50">
        <span className="text-xs text-[var(--text-medium)] block mb-1">Preview:</span>
        <span
          style={{
            color: segment.color,
            fontWeight: segment.bold ? 'bold' : 'normal',
            fontStyle: segment.italic ? 'italic' : 'normal',
          }}
          className="text-[var(--text-light)]"
        >
          {segment.text || '(empty)'}
        </span>
      </div>
    </div>
  );
}

interface ParagraphEditorProps {
  paragraph: Paragraph;
  paragraphIndex: number;
  onSegmentChange: (pIndex: number, sIndex: number, segment: TextSegment) => void;
  onSegmentDelete: (pIndex: number, sIndex: number) => void;
  onSegmentAdd: (pIndex: number) => void;
  onParagraphDelete: (pIndex: number) => void;
  canDelete: boolean;
}

function ParagraphEditor({
  paragraph,
  paragraphIndex,
  onSegmentChange,
  onSegmentDelete,
  onSegmentAdd,
  onParagraphDelete,
  canDelete,
}: ParagraphEditorProps) {
  return (
    <div className="bg-[var(--primary-medium)] bg-opacity-90 rounded-lg p-4 mb-4 border border-[var(--primary-light)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-light)]">
          Paragraph {paragraphIndex + 1}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onSegmentAdd(paragraphIndex)}
            className="px-3 py-1 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded text-sm hover:bg-[var(--accent-light)] transition-colors font-medium"
          >
            + Add Segment
          </button>
          {canDelete && (
            <button
              onClick={() => onParagraphDelete(paragraphIndex)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 transition-colors"
            >
              Delete Paragraph
            </button>
          )}
        </div>
      </div>

      {paragraph.segments.map((segment, sIndex) => (
        <SegmentEditor
          key={sIndex}
          segment={segment}
          segmentIndex={sIndex}
          paragraphIndex={paragraphIndex}
          onChange={onSegmentChange}
          onDelete={onSegmentDelete}
          canDelete={paragraph.segments.length > 1}
        />
      ))}

      {/* Paragraph Preview */}
      <div className="mt-4 p-3 bg-[#f4e8f0] rounded border border-[var(--accent-main)] border-opacity-30">
        <span className="text-xs text-[var(--neutral-dark)] block mb-2 font-medium">
          Paragraph Preview:
        </span>
        <p className="text-[var(--neutral-dark)] leading-relaxed">
          {paragraph.segments.map((seg, i) => (
            <span
              key={i}
              style={{
                color: seg.color,
                fontWeight: seg.bold ? 'bold' : 'normal',
                fontStyle: seg.italic ? 'italic' : 'normal',
              }}
            >
              {seg.text}
            </span>
          ))}
          {paragraph.segments.every((s) => !s.text) && (
            <span className="text-gray-400">(empty paragraph)</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ContentEditorPage() {
  const [selectedFile, setSelectedFile] = useState<ContentFile | null>(null);
  const [content, setContent] = useState<FormattedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showJson, setShowJson] = useState(false);

  // Load content from file
  const loadContent = useCallback(async (file: ContentFile) => {
    setIsLoading(true);
    setSaveStatus('idle');
    try {
      const response = await fetch(file.path);
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }
      const data = await response.json();
      setContent(data);
      setSelectedFile(file);
    } catch (error) {
      console.error('Error loading content:', error);
      // Create new content if file doesn't exist
      setContent(createEmptyContent());
      setSelectedFile(file);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save content to file
  const saveContent = useCallback(async () => {
    if (!selectedFile || !content) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Get the file path without the leading /data/
      const filePath = selectedFile.path.replace('/data/', '');

      const response = await fetch('/api/manifest-manager/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: JSON.stringify(content, null, 2),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, content]);

  // Update title
  const handleTitleChange = useCallback((newTitle: string) => {
    if (!content) return;
    setContent({ ...content, title: newTitle });
  }, [content]);

  // Update segment
  const handleSegmentChange = useCallback(
    (pIndex: number, sIndex: number, newSegment: TextSegment) => {
      if (!content) return;

      const newParagraphs = [...content.paragraphs];
      newParagraphs[pIndex] = {
        ...newParagraphs[pIndex],
        segments: newParagraphs[pIndex].segments.map((seg, i) =>
          i === sIndex ? newSegment : seg
        ),
      };
      setContent({ ...content, paragraphs: newParagraphs });
    },
    [content]
  );

  // Delete segment
  const handleSegmentDelete = useCallback(
    (pIndex: number, sIndex: number) => {
      if (!content) return;

      const newParagraphs = [...content.paragraphs];
      newParagraphs[pIndex] = {
        ...newParagraphs[pIndex],
        segments: newParagraphs[pIndex].segments.filter((_, i) => i !== sIndex),
      };
      setContent({ ...content, paragraphs: newParagraphs });
    },
    [content]
  );

  // Add segment
  const handleSegmentAdd = useCallback(
    (pIndex: number) => {
      if (!content) return;

      const newParagraphs = [...content.paragraphs];
      newParagraphs[pIndex] = {
        ...newParagraphs[pIndex],
        segments: [...newParagraphs[pIndex].segments, createEmptySegment()],
      };
      setContent({ ...content, paragraphs: newParagraphs });
    },
    [content]
  );

  // Add paragraph
  const handleParagraphAdd = useCallback(() => {
    if (!content) return;
    setContent({
      ...content,
      paragraphs: [...content.paragraphs, createEmptyParagraph()],
    });
  }, [content]);

  // Delete paragraph
  const handleParagraphDelete = useCallback(
    (pIndex: number) => {
      if (!content) return;
      setContent({
        ...content,
        paragraphs: content.paragraphs.filter((_, i) => i !== pIndex),
      });
    },
    [content]
  );

  // Copy JSON to clipboard
  const copyJsonToClipboard = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
  }, [content]);

  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[var(--text-light)]">Content Editor</h1>
                <p className="text-[var(--text-medium)] mt-2">
                  Edit formatted text content for game screens
                </p>
              </div>
              <Link
                href="/tools"
                className="px-4 py-2 bg-[var(--primary-medium)] text-[var(--text-light)] rounded hover:bg-[var(--primary-light)] transition-colors"
              >
                Back to Tools
              </Link>
            </div>
          </header>

          {/* File Selection */}
          <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6 mb-6">
            <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Select Content File</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTENT_FILES.map((file) => (
                <button
                  key={file.path}
                  onClick={() => loadContent(file)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedFile?.path === file.path
                      ? 'border-[var(--accent-main)] bg-[var(--accent-main)] bg-opacity-20'
                      : 'border-[var(--primary-light)] hover:border-[var(--accent-main)] hover:bg-[var(--primary-light)]'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-[var(--text-light)]">{file.name}</h3>
                  <p className="text-sm text-[var(--text-medium)] mt-1">{file.description}</p>
                  <p className="text-xs text-[var(--text-medium)] mt-2 font-mono">{file.path}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="text-[var(--text-light)] text-xl">Loading content...</div>
            </div>
          )}

          {/* Editor */}
          {content && !isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor Panel */}
              <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-light)]">Editor</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleParagraphAdd}
                      className="px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-colors font-medium"
                    >
                      + Add Paragraph
                    </button>
                  </div>
                </div>

                {/* Title Editor */}
                <div className="mb-6">
                  <label className="block text-sm text-[var(--text-medium)] mb-2">Title</label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded-lg text-[var(--text-light)] text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-main)]"
                  />
                </div>

                {/* Paragraphs */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {content.paragraphs.map((paragraph, pIndex) => (
                    <ParagraphEditor
                      key={pIndex}
                      paragraph={paragraph}
                      paragraphIndex={pIndex}
                      onSegmentChange={handleSegmentChange}
                      onSegmentDelete={handleSegmentDelete}
                      onSegmentAdd={handleSegmentAdd}
                      onParagraphDelete={handleParagraphDelete}
                      canDelete={content.paragraphs.length > 1}
                    />
                  ))}
                </div>
              </div>

              {/* Preview & Actions Panel */}
              <div className="space-y-6">
                {/* Full Preview */}
                <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                  <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Full Preview</h2>
                  <div className="bg-[#f4e8f0] rounded-lg p-6 max-h-[400px] overflow-y-auto">
                    <h3 className="text-3xl font-semibold text-[var(--primary-dark)] text-center mb-6" style={{ fontFamily: 'cursive' }}>
                      {content.title}
                    </h3>
                    <div className="text-[var(--neutral-dark)] leading-relaxed">
                      {content.paragraphs.map((para, pIndex) => (
                        <p key={pIndex} className="mb-4 text-justify" style={{ textIndent: pIndex > 0 ? '30px' : '0' }}>
                          {para.segments.map((seg, sIndex) => (
                            <span
                              key={sIndex}
                              style={{
                                color: seg.color,
                                fontWeight: seg.bold ? 'bold' : 'normal',
                                fontStyle: seg.italic ? 'italic' : 'normal',
                              }}
                            >
                              {seg.text}
                            </span>
                          ))}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                  <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={saveContent}
                      disabled={isSaving}
                      className={`w-full px-4 py-3 rounded font-semibold transition-colors ${
                        isSaving
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-500'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save to File'}
                    </button>

                    {saveStatus === 'success' && (
                      <div className="text-green-400 text-center text-sm">Saved successfully!</div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="text-red-400 text-center text-sm">
                        Error saving. Make sure the dev server is running with API routes.
                      </div>
                    )}

                    <button
                      onClick={() => setShowJson(!showJson)}
                      className="w-full px-4 py-3 bg-[var(--primary-light)] text-[var(--text-light)] rounded font-semibold hover:bg-[var(--primary-medium)] transition-colors"
                    >
                      {showJson ? 'Hide JSON' : 'Show JSON'}
                    </button>

                    <button
                      onClick={copyJsonToClipboard}
                      className="w-full px-4 py-3 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded font-semibold hover:bg-[var(--accent-light)] transition-colors"
                    >
                      Copy JSON to Clipboard
                    </button>
                  </div>

                  {/* JSON Preview */}
                  {showJson && (
                    <div className="mt-4">
                      <pre className="bg-[var(--primary-dark)] rounded-lg p-4 text-sm text-[var(--text-light)] overflow-x-auto max-h-[300px] overflow-y-auto">
                        {JSON.stringify(content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions when no file selected */}
          {!content && !isLoading && (
            <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-[var(--text-light)] mb-2">
                Select a Content File
              </h2>
              <p className="text-[var(--text-medium)]">
                Choose a content file above to start editing. You can modify the title,
                add paragraphs, and apply formatting like colors, bold, and italic text.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
