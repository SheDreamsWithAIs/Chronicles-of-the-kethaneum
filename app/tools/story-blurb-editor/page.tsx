'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CosmicBackground } from '@/components/shared/CosmicBackground';

// ============================================================================
// TYPES
// ============================================================================

type StoryBeat =
  | 'hook'
  | 'first_plot_point'
  | 'first_pinch_point'
  | 'midpoint'
  | 'second_pinch_point'
  | 'second_plot_point'
  | 'climax'
  | 'resolution';

interface StoryBlurb {
  id: string;
  storyBeat: StoryBeat;
  trigger: string;
  title: string;
  text: string;
  order: number;
  metadata?: {
    author?: string;
    lastUpdated?: string;
    tags?: string[];
  };
}

interface TriggerConfig {
  allowMultiplePerTrigger: boolean;
  defaultStoryBeat: StoryBeat;
  milestones?: {
    booksDiscovered: number[];
    puzzlesComplete: number[];
    booksComplete: number[];
  };
}

interface StoryProgressData {
  version: number;
  triggerConfig: TriggerConfig;
  blurbs: StoryBlurb[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORY_BEATS: { value: StoryBeat; label: string; description: string }[] = [
  { value: 'hook', label: 'Hook', description: 'Introduction and early discoveries' },
  { value: 'first_plot_point', label: 'First Plot Point', description: 'Major revelation, Kethaneum revealed' },
  { value: 'first_pinch_point', label: 'First Pinch Point', description: 'Mystery deepens, tension rises' },
  { value: 'midpoint', label: 'Midpoint', description: 'Major milestone, turning point' },
  { value: 'second_pinch_point', label: 'Second Pinch Point', description: 'Stakes raised, danger revealed' },
  { value: 'second_plot_point', label: 'Second Plot Point', description: 'Final preparation' },
  { value: 'climax', label: 'Climax', description: 'Confrontation with main challenge' },
  { value: 'resolution', label: 'Resolution', description: 'Victory, new beginning' },
];

const TRIGGER_OPTIONS: { value: string; label: string; category: string }[] = [
  // Game start
  { value: 'game_start', label: 'Game Start', category: 'Start' },
  // Discovery triggers
  { value: 'first_book_discovered', label: 'First Book Discovered', category: 'Discovery' },
  { value: 'books_discovered_5', label: '5 Books Discovered', category: 'Discovery' },
  { value: 'books_discovered_10', label: '10 Books Discovered', category: 'Discovery' },
  { value: 'books_discovered_25', label: '25 Books Discovered', category: 'Discovery' },
  { value: 'books_discovered_50', label: '50 Books Discovered', category: 'Discovery' },
  { value: 'books_discovered_100', label: '100 Books Discovered', category: 'Discovery' },
  // Completion triggers
  { value: 'first_puzzle_complete', label: 'First Puzzle Complete', category: 'Completion' },
  { value: 'first_book_complete', label: 'First Book Complete', category: 'Completion' },
  { value: 'puzzles_complete_10', label: '10 Puzzles Complete', category: 'Completion' },
  { value: 'puzzles_complete_25', label: '25 Puzzles Complete', category: 'Completion' },
  { value: 'puzzles_complete_50', label: '50 Puzzles Complete', category: 'Completion' },
  { value: 'puzzles_complete_100', label: '100 Puzzles Complete', category: 'Completion' },
  { value: 'books_complete_5', label: '5 Books Complete', category: 'Completion' },
  { value: 'books_complete_10', label: '10 Books Complete', category: 'Completion' },
  { value: 'books_complete_25', label: '25 Books Complete', category: 'Completion' },
  // Kethaneum triggers
  { value: 'kethaneum_genre_revealed', label: 'Kethaneum Genre Revealed', category: 'Kethaneum' },
  { value: 'kethaneum_first_puzzle', label: 'First Kethaneum Puzzle', category: 'Kethaneum' },
  { value: 'kethaneum_book_complete', label: 'Kethaneum Book Complete', category: 'Kethaneum' },
  // Story beat triggers
  { value: 'story_beat_first_plot_point', label: 'Story Beat: First Plot Point', category: 'Story Beat' },
  { value: 'story_beat_first_pinch_point', label: 'Story Beat: First Pinch Point', category: 'Story Beat' },
  { value: 'story_beat_midpoint', label: 'Story Beat: Midpoint', category: 'Story Beat' },
  { value: 'story_beat_second_pinch_point', label: 'Story Beat: Second Pinch Point', category: 'Story Beat' },
  { value: 'story_beat_second_plot_point', label: 'Story Beat: Second Plot Point', category: 'Story Beat' },
  { value: 'story_beat_climax', label: 'Story Beat: Climax', category: 'Story Beat' },
  { value: 'story_beat_resolution', label: 'Story Beat: Resolution', category: 'Story Beat' },
  // Genre triggers
  { value: 'genre_first_complete', label: 'First Genre Complete', category: 'Genre' },
  { value: 'genre_mastered', label: 'Genre Mastered', category: 'Genre' },
];

const AUTOSAVE_DELAY = 2000;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StoryBlurbEditorPage() {
  const [data, setData] = useState<StoryProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'autosaved'>('idle');
  const [selectedBlurb, setSelectedBlurb] = useState<StoryBlurb | null>(null);
  const [filterBeat, setFilterBeat] = useState<StoryBeat | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/data/story-progress.json');
      if (!response.ok) throw new Error('Failed to load');
      const jsonData: StoryProgressData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Error loading story progress data:', error);
      // Initialize with empty data
      setData({
        version: 1,
        triggerConfig: {
          allowMultiplePerTrigger: false,
          defaultStoryBeat: 'hook',
          milestones: {
            booksDiscovered: [5, 10, 25, 50, 100],
            puzzlesComplete: [10, 25, 50, 100],
            booksComplete: [5, 10, 25],
          },
        },
        blurbs: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save data to file
  const saveData = useCallback(async (isAutosave = false) => {
    if (!data) return;

    setIsSaving(true);
    if (!isAutosave) setSaveStatus('idle');

    try {
      const response = await fetch('/api/manifest-manager/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'story-progress.json',
          content: JSON.stringify(data, null, 2),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setHasUnsavedChanges(false);
      setSaveStatus(isAutosave ? 'autosaved' : 'success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  // Filtered and sorted blurbs
  const filteredBlurbs = useMemo(() => {
    if (!data) return [];

    let blurbs = [...data.blurbs];

    // Filter by beat
    if (filterBeat !== 'all') {
      blurbs = blurbs.filter(b => b.storyBeat === filterBeat);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      blurbs = blurbs.filter(
        b =>
          b.title.toLowerCase().includes(query) ||
          b.text.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.trigger.toLowerCase().includes(query)
      );
    }

    // Sort by beat order then by order within beat
    const beatOrder = STORY_BEATS.map(b => b.value);
    return blurbs.sort((a, b) => {
      const beatDiff = beatOrder.indexOf(a.storyBeat) - beatOrder.indexOf(b.storyBeat);
      if (beatDiff !== 0) return beatDiff;
      return a.order - b.order;
    });
  }, [data, filterBeat, searchQuery]);

  // Group blurbs by beat for display
  const blurbsByBeat = useMemo(() => {
    const grouped: Record<StoryBeat, StoryBlurb[]> = {
      hook: [],
      first_plot_point: [],
      first_pinch_point: [],
      midpoint: [],
      second_pinch_point: [],
      second_plot_point: [],
      climax: [],
      resolution: [],
    };

    for (const blurb of filteredBlurbs) {
      grouped[blurb.storyBeat].push(blurb);
    }

    return grouped;
  }, [filteredBlurbs]);

  // Add new blurb
  const addBlurb = useCallback(() => {
    if (!data) return;

    const newId = `blurb_${Date.now()}`;
    const newBlurb: StoryBlurb = {
      id: newId,
      storyBeat: filterBeat !== 'all' ? filterBeat : 'hook',
      trigger: 'game_start',
      title: 'New Blurb',
      text: 'Enter your story text here...',
      order: data.blurbs.length + 1,
      metadata: {
        lastUpdated: new Date().toISOString(),
        tags: [],
      },
    };

    setData({
      ...data,
      blurbs: [...data.blurbs, newBlurb],
    });
    setSelectedBlurb(newBlurb);
    setHasUnsavedChanges(true);
  }, [data, filterBeat]);

  // Update blurb
  const updateBlurb = useCallback(
    (blurbId: string, updates: Partial<StoryBlurb>) => {
      if (!data) return;

      const updatedBlurbs = data.blurbs.map(b =>
        b.id === blurbId
          ? {
              ...b,
              ...updates,
              metadata: {
                ...b.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }
          : b
      );

      setData({ ...data, blurbs: updatedBlurbs });
      setHasUnsavedChanges(true);

      // Update selected blurb if it's the one being edited
      if (selectedBlurb?.id === blurbId) {
        setSelectedBlurb(updatedBlurbs.find(b => b.id === blurbId) || null);
      }
    },
    [data, selectedBlurb]
  );

  // Delete blurb
  const deleteBlurb = useCallback(
    (blurbId: string) => {
      if (!data) return;
      if (!confirm('Are you sure you want to delete this blurb?')) return;

      const updatedBlurbs = data.blurbs.filter(b => b.id !== blurbId);
      setData({ ...data, blurbs: updatedBlurbs });
      setHasUnsavedChanges(true);

      if (selectedBlurb?.id === blurbId) {
        setSelectedBlurb(null);
      }
    },
    [data, selectedBlurb]
  );

  // Duplicate blurb
  const duplicateBlurb = useCallback(
    (blurb: StoryBlurb) => {
      if (!data) return;

      const newBlurb: StoryBlurb = {
        ...blurb,
        id: `${blurb.id}_copy_${Date.now()}`,
        title: `${blurb.title} (Copy)`,
        order: blurb.order + 0.5,
        metadata: {
          ...blurb.metadata,
          lastUpdated: new Date().toISOString(),
        },
      };

      setData({ ...data, blurbs: [...data.blurbs, newBlurb] });
      setSelectedBlurb(newBlurb);
      setHasUnsavedChanges(true);
    },
    [data]
  );

  // Update trigger config
  const updateConfig = useCallback(
    (updates: Partial<TriggerConfig>) => {
      if (!data) return;

      setData({
        ...data,
        triggerConfig: { ...data.triggerConfig, ...updates },
      });
      setHasUnsavedChanges(true);
    },
    [data]
  );

  // Format story beat for display
  const formatBeat = (beat: StoryBeat) => {
    const found = STORY_BEATS.find(b => b.value === beat);
    return found?.label || beat;
  };

  // Get trigger label
  const getTriggerLabel = (trigger: string) => {
    const found = TRIGGER_OPTIONS.find(t => t.value === trigger);
    return found?.label || trigger;
  };

  // Copy JSON to clipboard
  const copyJson = useCallback(() => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('JSON copied to clipboard!');
  }, [data]);

  if (isLoading) {
    return (
      <>
        <CosmicBackground variant="library" />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--text-light)] text-xl">Loading story progress data...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-[var(--text-light)]">Story Blurb Editor</h1>
                <p className="text-[var(--text-medium)] mt-2">
                  Manage story progression blurbs and triggers
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-yellow-400">(unsaved changes)</span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="px-4 py-2 bg-[var(--primary-medium)] text-[var(--text-light)] rounded hover:bg-[var(--primary-light)] transition-colors"
                >
                  {showConfig ? 'Hide Config' : 'Show Config'}
                </button>
                <button
                  onClick={copyJson}
                  className="px-4 py-2 bg-[var(--primary-medium)] text-[var(--text-light)] rounded hover:bg-[var(--primary-light)] transition-colors"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => saveData(false)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    isSaving
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-500'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <Link
                  href="/tools"
                  className="px-4 py-2 bg-[var(--primary-medium)] text-[var(--text-light)] rounded hover:bg-[var(--primary-light)] transition-colors"
                >
                  Back to Tools
                </Link>
              </div>
            </div>

            {/* Save Status */}
            {saveStatus !== 'idle' && (
              <div className={`mt-2 text-sm ${
                saveStatus === 'success' || saveStatus === 'autosaved'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {saveStatus === 'success' && 'Saved successfully!'}
                {saveStatus === 'autosaved' && 'Autosaved!'}
                {saveStatus === 'error' && 'Error saving. Make sure the dev server is running.'}
              </div>
            )}
          </header>

          {/* Trigger Config Panel */}
          {showConfig && data && (
            <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6 mb-6">
              <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">Trigger Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-medium)] mb-2">
                    Allow Multiple Per Trigger
                  </label>
                  <select
                    value={data.triggerConfig.allowMultiplePerTrigger ? 'true' : 'false'}
                    onChange={e =>
                      updateConfig({ allowMultiplePerTrigger: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                  >
                    <option value="false">No (One blurb per trigger)</option>
                    <option value="true">Yes (Multiple blurbs per trigger)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-medium)] mb-2">
                    Default Story Beat
                  </label>
                  <select
                    value={data.triggerConfig.defaultStoryBeat}
                    onChange={e => updateConfig({ defaultStoryBeat: e.target.value as StoryBeat })}
                    className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                  >
                    {STORY_BEATS.map(beat => (
                      <option key={beat.value} value={beat.value}>
                        {beat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blurbs List Panel */}
            <div className="lg:col-span-2 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search blurbs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                  />
                </div>
                <select
                  value={filterBeat}
                  onChange={e => setFilterBeat(e.target.value as StoryBeat | 'all')}
                  className="px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                >
                  <option value="all">All Story Beats</option>
                  {STORY_BEATS.map(beat => (
                    <option key={beat.value} value={beat.value}>
                      {beat.label} ({blurbsByBeat[beat.value]?.length || 0})
                    </option>
                  ))}
                </select>
                <button
                  onClick={addBlurb}
                  className="px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded font-semibold hover:bg-[var(--accent-light)] transition-colors"
                >
                  + Add Blurb
                </button>
              </div>

              {/* Stats */}
              <div className="text-sm text-[var(--text-medium)] mb-4">
                {filteredBlurbs.length} blurb{filteredBlurbs.length !== 1 ? 's' : ''}
                {filterBeat !== 'all' && ` in ${formatBeat(filterBeat)}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>

              {/* Blurbs List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {STORY_BEATS.map(beat => {
                  const beatBlurbs = blurbsByBeat[beat.value];
                  if (filterBeat !== 'all' && filterBeat !== beat.value) return null;
                  if (beatBlurbs.length === 0) return null;

                  return (
                    <div key={beat.value}>
                      <h3 className="text-sm font-semibold text-[var(--accent-main)] mb-2 sticky top-0 bg-[var(--primary-medium)] py-1">
                        {beat.label} ({beatBlurbs.length})
                      </h3>
                      <div className="space-y-2">
                        {beatBlurbs.map(blurb => (
                          <div
                            key={blurb.id}
                            onClick={() => setSelectedBlurb(blurb)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedBlurb?.id === blurb.id
                                ? 'bg-[var(--accent-main)] bg-opacity-20 border border-[var(--accent-main)]'
                                : 'bg-[var(--primary-dark)] hover:bg-[var(--primary-light)] border border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[var(--text-light)] truncate">
                                  {blurb.title}
                                </h4>
                                <p className="text-xs text-[var(--text-medium)] mt-1 truncate">
                                  {blurb.text}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs px-2 py-0.5 bg-[var(--primary-light)] rounded text-[var(--text-medium)]">
                                    {getTriggerLabel(blurb.trigger)}
                                  </span>
                                  <span className="text-xs text-[var(--text-medium)]">
                                    Order: {blurb.order}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    duplicateBlurb(blurb);
                                  }}
                                  className="p-1 text-[var(--text-medium)] hover:text-[var(--text-light)] transition-colors"
                                  title="Duplicate"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    deleteBlurb(blurb.id);
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredBlurbs.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-medium)]">
                    No blurbs found. Click &quot;Add Blurb&quot; to create one.
                  </div>
                )}
              </div>
            </div>

            {/* Editor Panel */}
            <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-light)] mb-4">
                {selectedBlurb ? 'Edit Blurb' : 'Select a Blurb'}
              </h2>

              {selectedBlurb ? (
                <div className="space-y-4">
                  {/* ID (readonly) */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">ID</label>
                    <input
                      type="text"
                      value={selectedBlurb.id}
                      onChange={e => updateBlurb(selectedBlurb.id, { id: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)] font-mono text-sm"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedBlurb.title}
                      onChange={e => updateBlurb(selectedBlurb.id, { title: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                    />
                  </div>

                  {/* Story Beat */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">Story Beat</label>
                    <select
                      value={selectedBlurb.storyBeat}
                      onChange={e =>
                        updateBlurb(selectedBlurb.id, { storyBeat: e.target.value as StoryBeat })
                      }
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                    >
                      {STORY_BEATS.map(beat => (
                        <option key={beat.value} value={beat.value}>
                          {beat.label} - {beat.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trigger */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">Trigger</label>
                    <select
                      value={selectedBlurb.trigger}
                      onChange={e => updateBlurb(selectedBlurb.id, { trigger: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                    >
                      {Object.entries(
                        TRIGGER_OPTIONS.reduce((acc, t) => {
                          if (!acc[t.category]) acc[t.category] = [];
                          acc[t.category].push(t);
                          return acc;
                        }, {} as Record<string, typeof TRIGGER_OPTIONS>)
                      ).map(([category, triggers]) => (
                        <optgroup key={category} label={category}>
                          {triggers.map(t => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Order */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">Order</label>
                    <input
                      type="number"
                      value={selectedBlurb.order}
                      onChange={e =>
                        updateBlurb(selectedBlurb.id, { order: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                    />
                  </div>

                  {/* Text */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">Text</label>
                    <textarea
                      value={selectedBlurb.text}
                      onChange={e => updateBlurb(selectedBlurb.id, { text: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)] resize-y"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm text-[var(--text-medium)] mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={selectedBlurb.metadata?.tags?.join(', ') || ''}
                      onChange={e =>
                        updateBlurb(selectedBlurb.id, {
                          metadata: {
                            ...selectedBlurb.metadata,
                            tags: e.target.value
                              .split(',')
                              .map(t => t.trim())
                              .filter(t => t),
                          },
                        })
                      }
                      placeholder="e.g., introduction, milestone, achievement"
                      className="w-full px-3 py-2 bg-[var(--primary-dark)] border border-[var(--primary-light)] rounded text-[var(--text-light)]"
                    />
                  </div>

                  {/* Preview */}
                  <div className="mt-6 pt-4 border-t border-[var(--primary-light)]">
                    <h3 className="text-sm font-semibold text-[var(--text-medium)] mb-2">Preview</h3>
                    <div className="bg-[#f4e8f0] rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-[#e6a817] mb-2">
                        {selectedBlurb.title}
                      </h4>
                      <p className="text-[#2d1b4e] italic">{selectedBlurb.text}</p>
                      <div className="mt-2 text-xs text-[#4a3870]">
                        {formatBeat(selectedBlurb.storyBeat)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--text-medium)]">
                  <div className="text-6xl mb-4">📖</div>
                  <p>Select a blurb from the list to edit it, or click &quot;Add Blurb&quot; to create a new one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
