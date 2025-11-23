'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  { name: 'Default', value: '' },
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
// UTILITIES: Convert between HTML and FormattedContent
// ============================================================================

/**
 * Convert FormattedContent to HTML for the editor
 */
function contentToHtml(content: FormattedContent): string {
  return content.paragraphs.map(para => {
    const segments = para.segments.map(seg => {
      let html = seg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (seg.bold) {
        html = `<strong>${html}</strong>`;
      }
      if (seg.italic) {
        html = `<em>${html}</em>`;
      }
      if (seg.color) {
        html = `<span style="color: ${seg.color}">${html}</span>`;
      }

      return html;
    }).join('');

    return segments;
  }).join('\n\n');
}

/**
 * Parse a single text node or element into segments
 */
function parseNode(node: Node, inheritedStyles: { bold: boolean; italic: boolean; color: string }): TextSegment[] {
  const segments: TextSegment[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text) {
      const segment: TextSegment = { text };
      if (inheritedStyles.bold) segment.bold = true;
      if (inheritedStyles.italic) segment.italic = true;
      if (inheritedStyles.color) segment.color = inheritedStyles.color;
      segments.push(segment);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Update inherited styles based on element
    const newStyles = { ...inheritedStyles };

    if (tagName === 'strong' || tagName === 'b') {
      newStyles.bold = true;
    }
    if (tagName === 'em' || tagName === 'i') {
      newStyles.italic = true;
    }
    if (tagName === 'span' && element.style.color) {
      newStyles.color = element.style.color;
    }
    // Handle font element (from execCommand)
    if (tagName === 'font' && element.getAttribute('color')) {
      newStyles.color = element.getAttribute('color') || '';
    }

    // Recursively parse children
    for (const child of Array.from(node.childNodes)) {
      segments.push(...parseNode(child, newStyles));
    }
  }

  return segments;
}

/**
 * Merge adjacent segments with the same formatting
 */
function mergeSegments(segments: TextSegment[]): TextSegment[] {
  if (segments.length === 0) return segments;

  const merged: TextSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    // Check if same formatting
    if (
      current.bold === seg.bold &&
      current.italic === seg.italic &&
      current.color === seg.color
    ) {
      current.text += seg.text;
    } else {
      merged.push(current);
      current = { ...seg };
    }
  }
  merged.push(current);

  // Clean up undefined properties
  return merged.map(seg => {
    const clean: TextSegment = { text: seg.text };
    if (seg.bold) clean.bold = true;
    if (seg.italic) clean.italic = true;
    if (seg.color) clean.color = seg.color;
    return clean;
  });
}

/**
 * Convert HTML from the editor to FormattedContent
 */
function htmlToContent(html: string, title: string): FormattedContent {
  // Create a temporary container to parse the HTML
  const container = document.createElement('div');
  container.innerHTML = html;

  // Split by double newlines (paragraph breaks)
  // First, normalize the content - replace <br> with newlines
  let text = container.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div><div>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '');

  // Split into paragraphs by double newlines
  const paragraphTexts = text.split(/\n\n+/);

  const paragraphs: Paragraph[] = paragraphTexts
    .map(pText => {
      // Create a temp element to parse this paragraph's HTML
      const pContainer = document.createElement('div');
      pContainer.innerHTML = pText.replace(/\n/g, ' ');

      const segments = parseNode(pContainer, { bold: false, italic: false, color: '' });
      const mergedSegments = mergeSegments(segments);

      // Filter out empty segments
      const nonEmpty = mergedSegments.filter(s => s.text.trim() !== '');

      return { segments: nonEmpty.length > 0 ? nonEmpty : [{ text: '' }] };
    })
    .filter(p => p.segments.some(s => s.text.trim() !== ''));

  return {
    title,
    paragraphs: paragraphs.length > 0 ? paragraphs : [{ segments: [{ text: '' }] }]
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AUTOSAVE_DELAY = 2000; // 2 seconds

export default function ContentEditorPage() {
  const [selectedFile, setSelectedFile] = useState<ContentFile | null>(null);
  const [content, setContent] = useState<FormattedContent | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'autosaved'>('idle');
  const [currentJson, setCurrentJson] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  // Load content from file
  const loadContent = useCallback(async (file: ContentFile) => {
    setIsLoading(true);
    setSaveStatus('idle');
    setHasUnsavedChanges(false);
    // Clear any pending autosave
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    try {
      const response = await fetch(file.path);
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }
      const data: FormattedContent = await response.json();
      setContent(data);
      setTitle(data.title);
      setSelectedFile(file);
      const jsonStr = JSON.stringify(data, null, 2);
      setCurrentJson(jsonStr);
      lastSavedContentRef.current = jsonStr;
    } catch (error) {
      console.error('Error loading content:', error);
      const emptyContent: FormattedContent = { title: 'New Title', paragraphs: [{ segments: [{ text: '' }] }] };
      setContent(emptyContent);
      setTitle('New Title');
      setSelectedFile(file);
      const jsonStr = JSON.stringify(emptyContent, null, 2);
      setCurrentJson(jsonStr);
      lastSavedContentRef.current = jsonStr;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Populate editor with content after it renders
  useEffect(() => {
    if (content && !isLoading && editorRef.current) {
      editorRef.current.innerHTML = contentToHtml(content);
    }
  }, [content, isLoading]);

  // Get current content from editor
  const getCurrentContent = useCallback((): FormattedContent => {
    if (!editorRef.current) {
      return content || { title, paragraphs: [{ segments: [{ text: '' }] }] };
    }
    return htmlToContent(editorRef.current.innerHTML, title);
  }, [content, title]);

  // Save content to file
  const saveContent = useCallback(async (isAutosave = false) => {
    if (!selectedFile) return;

    const currentContent = getCurrentContent();
    const jsonStr = JSON.stringify(currentContent, null, 2);

    // Skip save if content hasn't changed
    if (jsonStr === lastSavedContentRef.current) {
      return;
    }

    setIsSaving(true);
    if (!isAutosave) {
      setSaveStatus('idle');
    }

    try {
      const filePath = selectedFile.path.replace('/data/', '');

      const response = await fetch('/api/manifest-manager/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: jsonStr,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }

      setContent(currentContent);
      lastSavedContentRef.current = jsonStr;
      setHasUnsavedChanges(false);
      setSaveStatus(isAutosave ? 'autosaved' : 'success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, getCurrentContent]);

  // Update JSON preview and trigger autosave
  const handleEditorChange = useCallback(() => {
    if (!editorRef.current) return;

    const currentContent = getCurrentContent();
    const jsonStr = JSON.stringify(currentContent, null, 2);
    setCurrentJson(jsonStr);

    // Check if content has changed from last save
    if (jsonStr !== lastSavedContentRef.current) {
      setHasUnsavedChanges(true);

      // Clear existing autosave timeout
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      // Set new autosave timeout
      autosaveTimeoutRef.current = setTimeout(() => {
        saveContent(true);
      }, AUTOSAVE_DELAY);
    }
  }, [getCurrentContent, saveContent]);

  // Also trigger autosave on title change
  useEffect(() => {
    if (!content || isLoading) return;

    const currentContent = getCurrentContent();
    const jsonStr = JSON.stringify(currentContent, null, 2);
    setCurrentJson(jsonStr);

    if (jsonStr !== lastSavedContentRef.current) {
      setHasUnsavedChanges(true);

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        saveContent(true);
      }, AUTOSAVE_DELAY);
    }
  }, [title, content, isLoading, getCurrentContent, saveContent]);

  // Formatting commands
  const applyBold = useCallback(() => {
    document.execCommand('bold', false);
    editorRef.current?.focus();
    handleEditorChange();
  }, [handleEditorChange]);

  const applyItalic = useCallback(() => {
    document.execCommand('italic', false);
    editorRef.current?.focus();
    handleEditorChange();
  }, [handleEditorChange]);

  const applyColor = useCallback((color: string) => {
    if (color) {
      document.execCommand('foreColor', false, color);
    } else {
      document.execCommand('removeFormat', false);
    }
    setSelectedColor(color);
    editorRef.current?.focus();
    handleEditorChange();
  }, [handleEditorChange]);

  const removeFormatting = useCallback(() => {
    document.execCommand('removeFormat', false);
    editorRef.current?.focus();
    handleEditorChange();
  }, [handleEditorChange]);

  // Undo last change
  const applyUndo = useCallback(() => {
    document.execCommand('undo', false);
    editorRef.current?.focus();
    // Update JSON preview after undo
    setTimeout(handleEditorChange, 0);
  }, [handleEditorChange]);

  // Copy JSON to clipboard
  const copyJsonToClipboard = useCallback(() => {
    navigator.clipboard.writeText(currentJson);
  }, [currentJson]);

  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[var(--text-light)]">Game Screen Content Editor</h1>
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
                <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Editor</h2>

                {/* Title Editor */}
                <div className="mb-4">
                  <label className="block text-sm text-[var(--text-medium)] mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded-lg text-[var(--text-light)] text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-main)]"
                  />
                </div>

                {/* Formatting Toolbar */}
                <div className="mb-4 p-3 bg-[var(--primary-dark)] rounded-lg border border-[var(--primary-light)] flex flex-wrap items-center gap-2">
                  <button
                    onClick={applyUndo}
                    className="px-3 py-2 bg-[var(--primary-light)] hover:bg-[var(--accent-main)] hover:text-[var(--primary-dark)] rounded transition-colors"
                    title="Undo (Ctrl+Z)"
                  >
                    Undo
                  </button>

                  <div className="h-6 w-px bg-[var(--primary-light)] mx-2" />

                  <button
                    onClick={applyBold}
                    className="px-3 py-2 bg-[var(--primary-light)] hover:bg-[var(--accent-main)] hover:text-[var(--primary-dark)] rounded font-bold transition-colors"
                    title="Bold (Ctrl+B)"
                  >
                    B
                  </button>
                  <button
                    onClick={applyItalic}
                    className="px-3 py-2 bg-[var(--primary-light)] hover:bg-[var(--accent-main)] hover:text-[var(--primary-dark)] rounded italic transition-colors"
                    title="Italic (Ctrl+I)"
                  >
                    I
                  </button>

                  <div className="h-6 w-px bg-[var(--primary-light)] mx-2" />

                  <select
                    value={selectedColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="px-3 py-2 bg-[var(--primary-light)] rounded text-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-main)]"
                    title="Text Color"
                  >
                    {PRESET_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="color"
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-10 h-10 cursor-pointer rounded border-0"
                    title="Custom Color"
                  />

                  <div className="h-6 w-px bg-[var(--primary-light)] mx-2" />

                  <button
                    onClick={removeFormatting}
                    className="px-3 py-2 bg-[var(--primary-light)] hover:bg-red-500 hover:text-white rounded transition-colors text-sm"
                    title="Remove Formatting"
                  >
                    Clear Format
                  </button>
                </div>

                {/* Content Editor (contenteditable) */}
                <div className="mb-4">
                  <label className="block text-sm text-[var(--text-medium)] mb-2">
                    Content <span className="text-xs opacity-70">(Two blank lines = new paragraph)</span>
                    {hasUnsavedChanges && (
                      <span className="ml-2 text-yellow-400 text-xs">(unsaved changes)</span>
                    )}
                  </label>
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorChange}
                    className="w-full min-h-[300px] max-h-[500px] overflow-y-auto px-4 py-3 bg-[#f4e8f0] border border-[var(--primary-light)] rounded-lg text-[var(--neutral-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-main)] leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap' }}
                    suppressContentEditableWarning
                  />
                </div>

                <p className="text-xs text-[var(--text-medium)] mb-4">
                  <strong>Tips:</strong> Select text and use the toolbar to apply formatting.
                  Press Enter twice to create a new paragraph.
                </p>
              </div>

              {/* JSON Preview & Actions Panel */}
              <div className="space-y-6">
                {/* JSON Preview */}
                <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-light)]">JSON Preview</h2>
                    <button
                      onClick={copyJsonToClipboard}
                      className="px-3 py-1 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded text-sm font-semibold hover:bg-[var(--accent-light)] transition-colors"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="bg-[var(--primary-dark)] rounded-lg p-4 text-sm text-[var(--text-light)] overflow-x-auto max-h-[400px] overflow-y-auto font-mono">
                    {currentJson}
                  </pre>
                </div>

                {/* Actions */}
                <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                  <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => saveContent(false)}
                      disabled={isSaving}
                      className={`w-full px-4 py-3 rounded font-semibold transition-colors ${
                        isSaving
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-500'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save Now'}
                    </button>

                    {saveStatus === 'success' && (
                      <div className="text-green-400 text-center text-sm">Saved successfully!</div>
                    )}
                    {saveStatus === 'autosaved' && (
                      <div className="text-blue-400 text-center text-sm">Autosaved!</div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="text-red-400 text-center text-sm">
                        Error saving. Make sure the dev server is running with API routes.
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-medium)] mt-4">
                    Changes are automatically saved after 2 seconds of inactivity.
                  </p>
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
                Choose a content file above to start editing. You can type naturally,
                select text to format it, and use two blank lines to create paragraphs.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
