# Story Event Editor Tool - Development Plan

**Created:** 2025-11-23
**Status:** Design Complete - Ready for Implementation
**Priority:** Medium
**Estimated Effort:** 2-3 days for MVP

---

## Table of Contents

1. [Overview](#overview)
2. [Current System Analysis](#current-system-analysis)
3. [Proposed Solution](#proposed-solution)
4. [UI Layout & Components](#ui-layout--components)
5. [Technical Implementation](#technical-implementation)
6. [User Workflows](#user-workflows)
7. [Implementation Phases](#implementation-phases)
8. [Reference Data](#reference-data)

---

## Overview

### Problem Statement

The Chronicles of the Kethaneum project has a well-defined story event system with TypeScript interfaces, but currently lacks a user-friendly tool for creating and managing story events. Content creators must manually edit JSON files, which is error-prone given:

- 62 available emotion types
- 8 story beat progression points
- Complex nested data structures
- Character ID references that must match existing characters
- Multiple validation requirements

### Goal

Create a dedicated **Story Event Editor** tool at `/tools/story-event-editor` that provides:

- Visual event creation with form-based editing
- Character and emotion selection from existing data
- Dialogue sequence management with drag-and-drop reordering
- Live preview of dialogue flow
- Validation and auto-save
- Integration with the existing character system

---

## Current System Analysis

### Key Files & Locations

```
/home/user/Chronicles-of-the-kethaneum/
├── lib/dialogue/
│   ├── DialogueManager.ts          # Main dialogue system (602 lines)
│   └── types.ts                    # All TypeScript interfaces (296 lines)
├── hooks/dialogue/
│   └── useDialogue.ts              # React hook for dialogue (130 lines)
├── public/data/
│   ├── dialogue-config.json        # System configuration
│   ├── story-events/
│   │   └── first-visit.json        # Only existing story event
│   └── characters/
│       ├── character-manifest.json
│       ├── archivist-lumina.json
│       ├── professor-lengthy-mcwordsworth.json
│       └── tester-testerson.json
└── app/tools/
    ├── page.tsx                    # Tools index
    ├── manifest-manager/           # Generic file manager
    └── genre-builder/              # Puzzle editor (pattern to follow)
```

### Story Event Data Structure

From `lib/dialogue/types.ts` (lines 169-184):

```typescript
export interface StoryEventInfo {
  id: string;                    // Unique event identifier (kebab-case)
  title: string;                 // Human-readable event title
  triggerCondition: string;      // When event triggers
  storyBeat: StoryBeat;         // Story progression point
}

export interface StoryEvent {
  storyEvent: StoryEventInfo;
  dialogue: StoryEventDialogue[];
  characters: StoryEventCharacter[];
  metadata: StoryEventMetadata;
}
```

### Story Event Dialogue Structure

From `lib/dialogue/types.ts` (lines 137-150):

```typescript
export interface StoryEventDialogue {
  sequence: number;              // Order in the dialogue
  speaker: string;               // Character ID reference
  text: string;                  // The dialogue text
  emotion: Emotion[];            // Array of emotions
  pauseAfter: boolean;           // Pause for player input
  isLastInSequence?: boolean;    // Marks end of sequence
}
```

### Character Reference Structure

```typescript
export interface StoryEventCharacter {
  id: string;                    // Must match existing character ID
  portraitFile: string;          // Portrait filename
}
```

### Metadata Structure

```typescript
export interface StoryEventMetadata {
  estimatedDuration: 'short' | 'medium' | 'long';
  storyImportance: 'introduction' | 'major' | 'minor' | 'optional';
  unlocks?: string[];            // Features/areas unlocked by event
  lastUpdated: string;           // ISO date string
}
```

### Example Story Event JSON

From `/public/data/story-events/first-visit.json`:

```json
{
  "storyEvent": {
    "id": "first-visit",
    "title": "First Steps in the Kethaneum",
    "triggerCondition": "player-enters-library-first-time",
    "storyBeat": "hook"
  },
  "dialogue": [
    {
      "sequence": 1,
      "speaker": "archivist-lumina",
      "text": "Welcome, seeker of knowledge...",
      "emotion": ["welcoming", "formal"],
      "pauseAfter": true
    }
  ],
  "characters": [
    {
      "id": "archivist-lumina",
      "portraitFile": "lumina-portrait.svg"
    }
  ],
  "metadata": {
    "estimatedDuration": "medium",
    "storyImportance": "introduction",
    "unlocks": ["library-navigation", "genre-browsing"],
    "lastUpdated": "2025-05-27"
  }
}
```

### Existing Tools to Reference

The **Genre Builder** (`/app/tools/genre-builder/`) provides a good pattern:
- Hierarchical editing (File → Book → Puzzle)
- Real-time validation
- Auto-save functionality
- Form-based data entry

---

## Proposed Solution

### Design Principles

1. **Progressive Disclosure** - Show only what's needed at each step
2. **Visual Hierarchy** - Event → Dialogue Sequences → Individual Lines
3. **Inline Editing** - Edit directly in the interface
4. **Real-time Validation** - Immediate feedback on errors
5. **Auto-save** - Prevent data loss
6. **File-based** - Generate proper JSON files

### 3-Panel Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Story Event Editor                           [New Event]    │
├──────────────┬────────────────────────┬─────────────────────┤
│              │                        │                     │
│  Event List  │   Event Editor         │   Preview Panel     │
│              │                        │                     │
│  - Browse    │   - Event Info         │   - Dialogue Flow   │
│  - Search    │   - Dialogue Sequences │   - Character List  │
│  - Filter    │   - Characters         │   - Summary Stats   │
│              │   - Metadata           │                     │
│              │                        │                     │
└──────────────┴────────────────────────┴─────────────────────┘
```

---

## UI Layout & Components

### Left Panel: Event List

**Purpose:** Browse and select story events

**Features:**
- List all `.json` files in `/public/data/story-events/`
- Show event ID and story beat badge
- Color-coded by story beat
- Filter by beat/importance
- Search by title/ID
- "New Event" button

**Visual Mockup:**
```
┌─────────────────────┐
│ [+ New Event]       │
├─────────────────────┤
│ 🔍 Search events... │
├─────────────────────┤
│ Filter: [All Beats▼]│
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │ first-visit     │ │
│ │ [HOOK]          │ │
│ │ First Steps...  │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ scholar-arrival │ │
│ │ [FIRST PLOT PT] │ │
│ │ The Scholar...  │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

### Center Panel: Event Editor

#### Section 1: Event Information

```
┌──────────────────────────────────────────────┐
│ Event Information                            │
├──────────────────────────────────────────────┤
│                                              │
│ Event ID *                                   │
│ ┌──────────────────────────────────────────┐ │
│ │ first-visit                              │ │
│ └──────────────────────────────────────────┘ │
│ ℹ️ Use kebab-case (e.g., my-event-name)      │
│                                              │
│ Title *                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ First Steps in the Kethaneum             │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Story Beat *                                 │
│ ┌──────────────────────────────────────────┐ │
│ │ hook                                   ▼ │ │
│ └──────────────────────────────────────────┘ │
│ ℹ️ Opening sequence - introduces the story   │
│                                              │
│ Trigger Condition                            │
│ ┌──────────────────────────────────────────┐ │
│ │ player-enters-library-first-time         │ │
│ └──────────────────────────────────────────┘ │
│ 💡 Examples: player-completes-puzzle,        │
│    player-reaches-level-5                    │
│                                              │
└──────────────────────────────────────────────┘
```

#### Section 2: Dialogue Sequences

```
┌──────────────────────────────────────────────┐
│ Dialogue Sequences                           │
├──────────────────────────────────────────────┤
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ [≡] Sequence #1                    [🗑️]  │ │
│ │──────────────────────────────────────────│ │
│ │                                          │ │
│ │ Speaker *                                │ │
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ Archivist Lumina                   ▼ │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ │                                          │ │
│ │ Dialogue Text *                          │ │
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ Welcome, seeker of knowledge. I am   │ │ │
│ │ │ Archivist Lumina, guardian of the    │ │ │
│ │ │ Kethaneum's ancient wisdom...        │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ │ 📊 127/300 characters (desktop limit)    │ │
│ │                                          │ │
│ │ Emotions                                 │ │
│ │ [welcoming ×] [formal ×] [+ Add]        │ │
│ │                                          │ │
│ │ ☑️ Pause after this dialogue             │ │
│ │ ☐ Last in sequence                       │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ [≡] Sequence #2                    [🗑️]  │ │
│ │ ... (collapsed or expanded)              │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [+ Add Dialogue Sequence]                    │
│                                              │
└──────────────────────────────────────────────┘
```

#### Section 3: Characters

```
┌──────────────────────────────────────────────┐
│ Characters in this Event                     │
├──────────────────────────────────────────────┤
│                                              │
│ ┌────┐ Archivist Lumina                      │
│ │ 👤 │ lumina-portrait.svg                   │
│ └────┘ (Auto-added from dialogue speakers)   │
│                                              │
│ [+ Add Additional Character]                 │
│                                              │
│ ℹ️ Characters are automatically added when   │
│    selected as dialogue speakers             │
│                                              │
└──────────────────────────────────────────────┘
```

#### Section 4: Metadata

```
┌──────────────────────────────────────────────┐
│ Event Metadata                               │
├──────────────────────────────────────────────┤
│                                              │
│ Estimated Duration *                         │
│ ○ Short   ● Medium   ○ Long                  │
│                                              │
│ Story Importance *                           │
│ ┌──────────────────────────────────────────┐ │
│ │ introduction                           ▼ │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Unlocks (Optional)                           │
│ ┌──────────────────────────────────────────┐ │
│ │ library-navigation ×                     │ │
│ │ genre-browsing ×                         │ │
│ │ [+ Add unlock...]                        │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Last Updated: 2025-11-23 (auto-set on save)  │
│                                              │
└──────────────────────────────────────────────┘
```

### Right Panel: Preview

```
┌─────────────────────────────────────┐
│ Preview                             │
├─────────────────────────────────────┤
│                                     │
│ Dialogue Flow                       │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │  ┌──┐ Archivist Lumina          │ │
│ │  │👤│ [welcoming] [formal]      │ │
│ │  └──┘                           │ │
│ │  "Welcome, seeker of knowledge. │ │
│ │   I am Archivist Lumina..."     │ │
│ │                                 │ │
│ │  ─────── ⏸️ Pause ───────        │ │
│ │                                 │ │
│ │  ┌──┐ Archivist Lumina          │ │
│ │  │👤│ [warm] [encouraging]      │ │
│ │  └──┘                           │ │
│ │  "You have arrived at a most    │ │
│ │   auspicious moment..."         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Event Summary                       │
│ ┌─────────────────────────────────┐ │
│ │ • 5 dialogue sequences          │ │
│ │ • 1 character                   │ │
│ │ • Medium duration               │ │
│ │ • Story beat: Hook              │ │
│ │ • Unlocks: 2 features           │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Emotion Selector Modal

```
┌─────────────────────────────────────────────┐
│ Select Emotions                       [×]   │
├─────────────────────────────────────────────┤
│ 🔍 Search emotions...                       │
├─────────────────────────────────────────────┤
│                                             │
│ Recently Used                               │
│ [warm] [professional] [encouraging]         │
│                                             │
│ Basic Emotions                              │
│ [warm] [professional] [encouraging] [proud] │
│ [curious] [satisfied] [amused]              │
│                                             │
│ Narrative Emotions                          │
│ [mystical] [conspiratorial] [reassuring]    │
│ [grateful] [welcoming] [formal] [wise]      │
│                                             │
│ Academic Emotions                           │
│ [scholarly] [verbose] [enthusiastic]        │
│ [analytical] [methodical] [intellectual]    │
│                                             │
│ Special Emotions                            │
│ [self-aware] [passionate] [contemplative]   │
│                                             │
├─────────────────────────────────────────────┤
│ Selected: [welcoming] [formal]              │
│                                             │
│                        [Cancel] [Apply]     │
└─────────────────────────────────────────────┘
```

---

## Technical Implementation

### File Structure

```
app/tools/story-event-editor/
├── page.tsx                     # Main editor page
├── components/
│   ├── EventList.tsx            # Left panel - event browser
│   ├── EventEditor.tsx          # Center panel - main editor
│   ├── EventInfoForm.tsx        # Event information section
│   ├── DialogueSequence.tsx     # Individual dialogue card
│   ├── DialogueList.tsx         # List of dialogue sequences
│   ├── EmotionSelector.tsx      # Emotion picker modal/dropdown
│   ├── CharacterSelector.tsx    # Character dropdown
│   ├── CharacterList.tsx        # Characters section
│   ├── MetadataForm.tsx         # Metadata section
│   ├── PreviewPanel.tsx         # Right panel - preview
│   └── ValidationSummary.tsx    # Validation errors display
├── hooks/
│   ├── useStoryEvent.ts         # Event state management
│   ├── useStoryEventList.ts     # List of all events
│   ├── useCharacters.ts         # Load character data
│   ├── useEmotions.ts           # Emotion list and categories
│   └── useValidation.ts         # Validation logic
├── lib/
│   ├── storyEventSchema.ts      # Zod validation schemas
│   ├── fileOperations.ts        # Save/load utilities
│   ├── constants.ts             # Emotions, beats, importance levels
│   └── utils.ts                 # Helper functions
└── README.md                    # Tool documentation
```

### API Routes

```
app/api/story-events/
├── route.ts                     # GET: list all events
│                                # POST: create new event
├── [id]/
│   └── route.ts                 # GET: fetch single event
│                                # PUT: update event
│                                # DELETE: delete event
└── validate/
    └── route.ts                 # POST: validate event data
```

### State Management

Use React hooks with a reducer pattern:

```typescript
// hooks/useStoryEvent.ts

interface StoryEventState {
  event: StoryEvent | null;
  isDirty: boolean;
  validationErrors: ValidationError[];
  isLoading: boolean;
  isSaving: boolean;
}

type StoryEventAction =
  | { type: 'LOAD_EVENT'; payload: StoryEvent }
  | { type: 'UPDATE_INFO'; payload: Partial<StoryEventInfo> }
  | { type: 'ADD_DIALOGUE'; payload: StoryEventDialogue }
  | { type: 'UPDATE_DIALOGUE'; payload: { index: number; dialogue: StoryEventDialogue } }
  | { type: 'REMOVE_DIALOGUE'; payload: number }
  | { type: 'REORDER_DIALOGUE'; payload: { from: number; to: number } }
  | { type: 'UPDATE_METADATA'; payload: Partial<StoryEventMetadata> }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'MARK_SAVED' }
  | { type: 'RESET' };

export function useStoryEvent() {
  const [state, dispatch] = useReducer(storyEventReducer, initialState);

  // ... action creators and selectors

  return {
    state,
    loadEvent,
    updateInfo,
    addDialogue,
    updateDialogue,
    removeDialogue,
    reorderDialogue,
    updateMetadata,
    validate,
    save,
    reset,
  };
}
```

### Validation Schema (Zod)

```typescript
// lib/storyEventSchema.ts

import { z } from 'zod';
import { STORY_BEATS, EMOTIONS, DURATIONS, IMPORTANCE_LEVELS } from './constants';

export const StoryEventInfoSchema = z.object({
  id: z.string()
    .min(1, 'Event ID is required')
    .regex(/^[a-z0-9-]+$/, 'ID must be kebab-case'),
  title: z.string().min(1, 'Title is required'),
  triggerCondition: z.string(),
  storyBeat: z.enum(STORY_BEATS),
});

export const StoryEventDialogueSchema = z.object({
  sequence: z.number().int().positive(),
  speaker: z.string().min(1, 'Speaker is required'),
  text: z.string().min(1, 'Dialogue text is required'),
  emotion: z.array(z.enum(EMOTIONS)),
  pauseAfter: z.boolean(),
  isLastInSequence: z.boolean().optional(),
});

export const StoryEventCharacterSchema = z.object({
  id: z.string().min(1),
  portraitFile: z.string().min(1),
});

export const StoryEventMetadataSchema = z.object({
  estimatedDuration: z.enum(DURATIONS),
  storyImportance: z.enum(IMPORTANCE_LEVELS),
  unlocks: z.array(z.string()).optional(),
  lastUpdated: z.string(),
});

export const StoryEventSchema = z.object({
  storyEvent: StoryEventInfoSchema,
  dialogue: z.array(StoryEventDialogueSchema).min(1, 'At least one dialogue is required'),
  characters: z.array(StoryEventCharacterSchema).min(1, 'At least one character is required'),
  metadata: StoryEventMetadataSchema,
});
```

### Key Component Examples

#### EventList.tsx

```tsx
interface EventListProps {
  events: StoryEventSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function EventList({ events, selectedId, onSelect, onCreate }: EventListProps) {
  const [search, setSearch] = useState('');
  const [beatFilter, setBeatFilter] = useState<StoryBeat | 'all'>('all');

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                           event.id.toLowerCase().includes(search.toLowerCase());
      const matchesBeat = beatFilter === 'all' || event.storyBeat === beatFilter;
      return matchesSearch && matchesBeat;
    });
  }, [events, search, beatFilter]);

  return (
    <div className="event-list">
      <button onClick={onCreate}>+ New Event</button>
      <input
        type="search"
        placeholder="Search events..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select value={beatFilter} onChange={e => setBeatFilter(e.target.value)}>
        <option value="all">All Beats</option>
        {STORY_BEATS.map(beat => (
          <option key={beat} value={beat}>{formatBeatName(beat)}</option>
        ))}
      </select>
      <ul>
        {filteredEvents.map(event => (
          <EventListItem
            key={event.id}
            event={event}
            isSelected={event.id === selectedId}
            onClick={() => onSelect(event.id)}
          />
        ))}
      </ul>
    </div>
  );
}
```

#### DialogueSequence.tsx

```tsx
interface DialogueSequenceProps {
  dialogue: StoryEventDialogue;
  index: number;
  characters: Character[];
  onUpdate: (dialogue: StoryEventDialogue) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function DialogueSequence({
  dialogue,
  index,
  characters,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: DialogueSequenceProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="dialogue-sequence">
      <div className="dialogue-header">
        <button className="drag-handle">≡</button>
        <span>Sequence #{index + 1}</span>
        <div className="actions">
          <button onClick={onMoveUp} disabled={isFirst}>↑</button>
          <button onClick={onMoveDown} disabled={isLast}>↓</button>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? '−' : '+'}
          </button>
          <button onClick={onRemove}>🗑️</button>
        </div>
      </div>

      {isExpanded && (
        <div className="dialogue-body">
          <CharacterSelector
            value={dialogue.speaker}
            characters={characters}
            onChange={speaker => onUpdate({ ...dialogue, speaker })}
          />

          <textarea
            value={dialogue.text}
            onChange={e => onUpdate({ ...dialogue, text: e.target.value })}
            placeholder="Enter dialogue text..."
          />
          <div className="char-count">
            {dialogue.text.length}/300 characters
          </div>

          <EmotionSelector
            selected={dialogue.emotion}
            onChange={emotion => onUpdate({ ...dialogue, emotion })}
          />

          <label>
            <input
              type="checkbox"
              checked={dialogue.pauseAfter}
              onChange={e => onUpdate({ ...dialogue, pauseAfter: e.target.checked })}
            />
            Pause after this dialogue
          </label>

          <label>
            <input
              type="checkbox"
              checked={dialogue.isLastInSequence ?? false}
              onChange={e => onUpdate({ ...dialogue, isLastInSequence: e.target.checked })}
            />
            Last in sequence
          </label>
        </div>
      )}
    </div>
  );
}
```

---

## User Workflows

### Creating a New Story Event

1. **Start**
   - Click "New Event" button in left panel
   - Empty form appears in center panel

2. **Fill Event Information**
   - Enter unique ID (kebab-case, validated for uniqueness)
   - Add descriptive title
   - Select story beat from dropdown (with descriptions)
   - Optionally enter trigger condition

3. **Add Dialogue Sequences**
   - Click "Add Dialogue Sequence"
   - Select speaker from character dropdown
   - Enter dialogue text (character count shown)
   - Choose emotions from selector
   - Set pause/last flags as needed
   - Repeat for each dialogue line
   - Reorder by dragging or using up/down buttons

4. **Review Characters**
   - Characters auto-populate from dialogue speakers
   - Optionally add additional characters manually

5. **Set Metadata**
   - Choose estimated duration (short/medium/long)
   - Set story importance level
   - Add unlock IDs (optional)
   - Last updated auto-sets on save

6. **Preview & Validate**
   - Review dialogue flow in preview panel
   - Check for validation errors
   - Fix any issues

7. **Save**
   - Click "Save Event"
   - File created at `/public/data/story-events/[id].json`
   - Event appears in left panel list

### Editing an Existing Event

1. Select event from left panel
2. Event loads into editor form
3. Modify any fields
4. Preview updates in real-time
5. Click "Save Event"
6. File updated, lastUpdated refreshed

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Event ID | Required, kebab-case, unique | "Event ID is required" / "ID must be kebab-case" / "Event ID already exists" |
| Title | Required | "Title is required" |
| Story Beat | Required, valid value | "Story beat is required" |
| Dialogue | At least one required | "At least one dialogue sequence is required" |
| Dialogue Speaker | Required, must exist in characters | "Speaker is required" / "Unknown character ID" |
| Dialogue Text | Required | "Dialogue text is required" |
| Duration | Required, valid value | "Duration is required" |
| Importance | Required, valid value | "Story importance is required" |

---

## Implementation Phases

### Phase 1: MVP (Core Functionality)

**Estimated Time:** 1-2 days

- [ ] Basic page layout with 3 panels
- [ ] Event list display (read from file system)
- [ ] Event information form (ID, title, beat, trigger)
- [ ] Dialogue sequence CRUD (add, edit, remove)
- [ ] Simple character dropdown (from existing characters)
- [ ] Basic emotion multi-select
- [ ] Metadata form (duration, importance, unlocks)
- [ ] Save to JSON file (API route)
- [ ] Load from JSON file
- [ ] Basic validation (required fields)

**Deliverable:** Working editor that can create and edit story events

### Phase 2: Enhanced UX

**Estimated Time:** 1 day

- [ ] Preview panel with dialogue flow
- [ ] Drag-and-drop dialogue reordering
- [ ] Auto-save to localStorage
- [ ] Character count warnings (per device type)
- [ ] Advanced emotion selector with categories and search
- [ ] Search and filter in event list
- [ ] Import existing JSON file
- [ ] Export/download JSON

**Deliverable:** Polished editor with better workflow

### Phase 3: Polish & Integration

**Estimated Time:** 0.5-1 day

- [ ] Story beat color coding
- [ ] Character portrait display
- [ ] Validation summary panel
- [ ] Keyboard shortcuts (Ctrl+S to save, etc.)
- [ ] Undo/redo support
- [ ] Better error handling and user feedback
- [ ] Loading states and animations
- [ ] Tool documentation (README)

**Deliverable:** Production-ready tool

### Phase 4: Advanced Features (Future)

- [ ] Dialogue preview mode (simulate game display)
- [ ] Branching dialogue support
- [ ] Batch operations (duplicate, bulk update)
- [ ] Version history / Git integration
- [ ] Character usage analytics
- [ ] Export to other formats (Markdown, CSV)

---

## Reference Data

### Story Beats

| Beat | Description | Color |
|------|-------------|-------|
| `hook` | Opening sequence - introduces the story | Blue (#3B82F6) |
| `first_plot_point` | First major turning point | Green (#10B981) |
| `first_pinch_point` | First pressure moment | Yellow (#F59E0B) |
| `midpoint` | Middle climax - major revelation | Purple (#8B5CF6) |
| `second_pinch_point` | Second pressure moment | Orange (#F97316) |
| `second_plot_point` | Second turning point | Pink (#EC4899) |
| `climax` | Peak action - highest tension | Red (#EF4444) |
| `resolution` | Conclusion - story wrap-up | Gray (#6B7280) |

### Available Emotions (62 types)

**Basic:**
warm, professional, encouraging, proud, curious, satisfied, amused

**Narrative:**
mystical, conspiratorial, reassuring, grateful, welcoming, formal, wise

**Academic:**
scholarly, verbose, enthusiastic, analytical, methodical, intellectual, passionate

**Special:**
self-aware, contemplative, nostalgic, dramatic, playful, sincere, determined

*(Full list available in `lib/dialogue/types.ts`)*

### Duration Values

- `short` - Quick interaction, 1-2 dialogue lines
- `medium` - Standard event, 3-5 dialogue lines
- `long` - Extended sequence, 6+ dialogue lines

### Importance Values

- `introduction` - First encounter, sets up character/location
- `major` - Key story event, significant impact
- `minor` - Supporting event, adds flavor
- `optional` - Can be skipped without affecting main story

### Text Limits (from dialogue-config.json)

| Device | Max Characters |
|--------|---------------|
| Mobile | 120 |
| Tablet | 200 |
| Desktop | 300 |

---

## Related Files

For implementation reference:

- **Types:** `lib/dialogue/types.ts`
- **Dialogue Manager:** `lib/dialogue/DialogueManager.ts`
- **Dialogue Config:** `public/data/dialogue-config.json`
- **Example Event:** `public/data/story-events/first-visit.json`
- **Characters:** `public/data/characters/`
- **Genre Builder (pattern):** `app/tools/genre-builder/`
- **Manifest Manager:** `app/tools/manifest-manager/`

---

## Notes for Implementation

1. **Follow existing patterns** - The Genre Builder provides a good template for the editor structure and state management approach.

2. **Use existing types** - Import interfaces from `lib/dialogue/types.ts` rather than redefining them.

3. **API route pattern** - Follow the same file operation patterns used by the Manifest Manager.

4. **Styling** - Use Tailwind CSS classes consistent with other tools in the project.

5. **Character integration** - Characters should be loaded from the existing character system, not duplicated.

6. **Validation** - Use Zod schemas that mirror the TypeScript interfaces for runtime validation.

7. **Auto-populate characters** - When a speaker is selected in dialogue, automatically add them to the characters array if not present.

8. **Sequence numbering** - Auto-increment sequence numbers, allow reordering.
