# Dialogue Creator Tool - Design Document

**Project:** Chronicles of the Kethaneum
**Feature:** Character Dialogue Creation UI Tool
**Created:** 2025-11-18
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Current Dialogue System Architecture](#current-dialogue-system-architecture)
3. [Tool Design](#tool-design)
4. [Technical Implementation Plan](#technical-implementation-plan)
5. [Validation Rules](#validation-rules)
6. [Smart Features](#smart-features)
7. [Implementation Checklist](#implementation-checklist)
8. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose
A web-based UI tool that enables easy creation and editing of character dialogue files with validation, preview, and export capabilities. This tool will significantly reduce the time and technical knowledge needed to create new characters for the game.

### Goals
- **Reduce friction** - Non-technical writers can create characters without touching JSON
- **Ensure quality** - Built-in validation catches errors before they reach the game
- **Speed development** - Create characters in minutes instead of hours
- **Maintain consistency** - Enforces dialogue system structure and best practices

### Integration
The tool will be integrated into the Next.js application as a dedicated admin/authoring page at `/admin/dialogue-creator`.

---

## Current Dialogue System Architecture

### File Structure

```
public/data/
├── dialogue-config.json              # System-wide configuration
├── characters/
│   ├── character-manifest.json       # Index of all characters
│   ├── archivist-lumina.json        # Character file example
│   ├── tester-testerson.json
│   └── professor-lengthy-mcwordsworth.json
└── story-events/
    └── first-visit.json              # Multi-character dialogue sequences
```

### Character File Schema

**Location:** `public/data/characters/{character-id}.json`

```json
{
  "character": {
    "id": "archivist-lumina",
    "name": "Archivist Lumina",
    "title": "Senior Archivist of Interdimensional Collections",
    "description": "A wise and experienced archivist who has dedicated...",
    "portraitFile": "lumina-portrait.svg",
    "loadingGroup": "introduction_characters",
    "retireAfter": "never",
    "specialties": ["interdimensional_cataloging", "knowledge_organization"]
  },
  "banterDialogue": [
    {
      "id": "welcome-general",
      "text": "Welcome to the Kethaneum, Assistant Archivist...",
      "emotion": ["warm", "professional"],
      "category": "general-welcome",
      "availableFrom": "hook",
      "availableUntil": "first_plot_point"
    }
  ],
  "metadata": {
    "personalityTraits": ["wise", "encouraging", "slightly-mystical"],
    "relationshipToPlayer": "mentor-colleague",
    "availableInScreens": ["library", "tutorial"],
    "lastUpdated": "2025-05-27"
  }
}
```

### TypeScript Type Definitions

**Location:** `lib/dialogue/types.ts`

#### Key Types

**StoryBeat** (8 story progression stages):
- `hook`
- `first_plot_point`
- `first_pinch_point`
- `midpoint`
- `second_pinch_point`
- `second_plot_point`
- `climax`
- `resolution`

**LoadingGroup** (9 character groups):
- `introduction_characters`
- `regular_contacts`
- `essential_library_staff`
- `extended_library_staff`
- `long_term_scholars`
- `visiting_scholars`
- `visiting_dignitaries`
- `knowledge_contributors`
- `special_event_characters`

**Emotion** (30+ emotion types):
- `warm`, `professional`, `encouraging`, `proud`
- `explanatory`, `mystical`, `conspiratorial`, `reassuring`
- `grateful`, `scholarly`, `verbose`, `enthusiastic`
- `analytical`, `professorial`, `impressed`, `instructional`
- `methodical`, `passionate`, `contemplative`, `collaborative`
- `intellectual`, `scientific`, `excited`, `theoretical`
- `apologetic`, `self-aware`, `amused`, `curious`
- `satisfied`, `welcoming`, `formal`, `wise`

**DialogueCategory** (13 categories):
- `general-welcome`
- `progress-praise`
- `lore-sharing`
- `casual-advice`
- `appreciation`
- `academic-introduction`
- `lore-exposition`
- `academic-guidance`
- `colleague-reference`
- `research-exposition`
- `meta-humor`
- `general-testing`
- `technical-testing`

**RelationshipType** (5 types):
- `mentor-colleague`
- `academic-mentor`
- `testing-assistant`
- `colleague`
- `supervisor`

**ScreenType** (4 types):
- `library`
- `tutorial`
- `testing`
- `puzzle`

### Dialogue System Components

#### DialogueManager
**Location:** `lib/dialogue/DialogueManager.ts`

Singleton class that handles:
- Loading character files from JSON
- Filtering dialogue by story beat
- Weighted random selection
- Character group lazy-loading
- Story progression tracking

#### useDialogue Hook
**Location:** `hooks/dialogue/useDialogue.ts`

React hook providing:
- `isInitialized` - System ready status
- `currentDialogue` - Active dialogue data
- `getRandomBanter()` - Get random dialogue
- `setStoryBeat()` - Update story progression
- Error handling and status info

### Character Text Limits

From `dialogue-config.json`:

```json
"textLimits": {
  "mobile": {
    "maxCharsPerScreen": 180,
    "estimatedWordsPerScreen": 30
  },
  "tablet": {
    "maxCharsPerScreen": 300,
    "estimatedWordsPerScreen": 50
  },
  "desktop": {
    "maxCharsPerScreen": 400,
    "estimatedWordsPerScreen": 65
  }
}
```

---

## Tool Design

### Core Features

#### 1. Character Information Panel
Captures all character metadata:

**Fields:**
- **Character ID** (auto-generated from name, editable)
  - Validation: lowercase, numbers, hyphens only
  - Example: `archivist-lumina`
- **Character Name** (text input, required)
  - Min: 2 chars, Max: 50 chars
  - Example: `Archivist Lumina`
- **Title** (text input, required)
  - Max: 100 chars
  - Character counter shown
  - Example: `Senior Archivist of Interdimensional Collections`
- **Description** (textarea, required)
  - Min: 20 chars, Max: 500 chars
  - Character counter shown
  - Example: `A wise and experienced archivist who has dedicated her life...`
- **Portrait File** (dropdown + file upload preview)
  - Lists existing portrait files
  - Upload new portrait option
  - Preview thumbnail shown
- **Loading Group** (dropdown, required)
  - All 9 loading groups
  - Helper text explains when group loads
- **Retire After** (dropdown, required)
  - All 8 story beats + "never"
  - Helper text explains character retirement
- **Specialties** (tag input)
  - Add/remove tags dynamically
  - Free-form text tags
  - Example: `interdimensional_cataloging`, `knowledge_organization`

#### 2. Dialogue Entry Builder

Dynamic list of dialogue entries with full CRUD operations:

**Per Dialogue Entry Fields:**
- **Dialogue ID** (auto-generated, editable)
  - Pattern: `{category}-{descriptor}-{number}`
  - Validation: unique within character
  - Example: `welcome-general`, `praise-progress-2`
- **Text** (rich textarea, required)
  - Character counter with color coding:
    - Green: under recommended limit
    - Yellow: approaching limit (within 20 chars)
    - Red: exceeding recommended limit
  - Recommended limits shown for mobile/tablet/desktop
  - Line break support
  - Preview panel shows formatted text
  - Min: 10 chars
- **Emotions** (multi-select chips, required)
  - Select from 30+ emotion types
  - Min: 1, Recommended: 1-2, Max: 4
  - Visual chips with remove button
  - Grouped by common combinations
  - Search/filter capability
- **Category** (dropdown, required)
  - All 13 dialogue categories
  - Helper text explains category purpose
  - Smart emotion suggestions based on category
- **Available From** (dropdown, required)
  - All 8 story beats
  - Visual timeline indicator
  - Helper text shows when beat occurs
- **Available Until** (dropdown, optional)
  - All 8 story beats
  - Validation: must be after "Available From"
  - Leave empty for "forever"

**Entry Actions:**
- **Reorder** - Drag & drop or up/down arrow buttons
- **Duplicate** - Create copy of entry with `-copy` suffix on ID
- **Delete** - Remove entry (with confirmation if >1 entry)
- **Collapse/Expand** - Save screen space when editing multiple entries

**List Actions:**
- **Add Entry** - Add new blank dialogue entry
- **Bulk Operations** - Apply changes to multiple entries
- **Sort by Story Beat** - Reorder entries by availability

#### 3. Metadata Panel

Additional character context:

**Fields:**
- **Personality Traits** (tag input)
  - Free-form text tags
  - Example: `wise`, `encouraging`, `slightly-mystical`
- **Relationship to Player** (dropdown, required)
  - 5 relationship types
  - Helper text explains relationship dynamic
- **Available in Screens** (multi-select checkboxes)
  - Library, Tutorial, Testing, Puzzle
  - At least one must be selected
- **Last Updated** (auto-populated, read-only)
  - Current date in YYYY-MM-DD format
  - Auto-updates on save

#### 4. Validation & Quality Assurance

Real-time validation with visual indicators:

**Required Field Validation:**
- Red outline on empty required fields
- Error message below field
- Error count in validation panel
- Save button disabled until all errors resolved

**Character Count Warnings:**
- Yellow background: approaching limit (within 20 chars)
- Red background: exceeding recommended limit
- Shows current/recommended/max counts
- Warning in validation panel

**Dialogue Coverage Checker:**
- Warns if no dialogue for early story beats (hook/first_plot_point)
- Suggests balanced distribution across categories
- Flags if character has < 3 dialogue entries (minimum)
- Recommends 5+ entries for well-rounded character

**ID Uniqueness Validation:**
- Checks dialogue IDs within character
- Real-time validation on ID field blur
- Error message with suggested unique ID

**Story Beat Logic Validation:**
- Warns if `availableUntil` comes before `availableFrom`
- Suggests logical story beat progression
- Highlights impossible availability windows

**Emotion-Category Suggestions:**
- Recommends appropriate emotions for selected category
- Shows "commonly used" emotions for category
- Warning if unusual emotion/category combination

**Validation Status Panel:**
- Shows all errors (red), warnings (yellow), info (blue)
- Click validation message to jump to field
- Export validation report option

#### 5. Preview & Testing

Live preview of how character appears in-game:

**Character Card Preview:**
- Shows dialogue panel with character data
- Renders portrait (if uploaded/selected)
- Displays character name and title
- Shows current dialogue text
- Matches in-game styling

**Dialogue Sequence Preview:**
- Cycle through all dialogue entries
- Next/Previous buttons
- Shows entry X of Y
- Filter by story beat
- Filter by category
- Shows emotion tags
- Shows availability window

**Story Beat Simulator:**
- Dropdown to select current story beat
- Preview updates to show only available dialogue
- Shows count of available entries per beat
- Visualizes when character is active/retired

**Export Preview:**
- Shows formatted JSON before saving
- Syntax highlighting
- Validates JSON structure
- Copy to clipboard button

#### 6. Import/Export Functions

**New Character:**
- Loads blank template with sensible defaults
- Prompts for unsaved changes
- Optional: start from character archetype template

**Load Existing:**
- Dropdown of all characters from manifest
- Search/filter characters
- Shows character name and ID
- Prompts for unsaved changes before loading

**Import JSON:**
- File upload input
- Validates JSON structure
- Shows validation errors before loading
- Maps to form fields
- Highlights any missing/invalid fields

**Export JSON:**
- Downloads character file
- Filename: `{character-id}.json`
- Properly formatted (2-space indentation)
- Validates before export
- Option: include comments for human editing

**Save to Project:**
- Saves directly to `public/data/characters/`
- Updates `character-manifest.json`
- Creates backup of existing file (if updating)
- Success notification with file path
- Option: commit to git with message

---

## Technical Implementation Plan

### File Structure

```
app/
  admin/
    dialogue-creator/
      page.tsx                          # Main dialogue creator page
      layout.tsx                        # Admin layout wrapper
      components/
        CharacterInfoPanel.tsx          # Character metadata form
        DialogueEntryForm.tsx           # Single dialogue entry editor
        DialogueEntryList.tsx           # List of all dialogue entries
        DialoguePreview.tsx             # Live preview panel
        MetadataPanel.tsx               # Metadata form section
        ValidationPanel.tsx             # Validation results display
        EmotionSelector.tsx             # Multi-select emotion picker
        StoryBeatSelector.tsx           # Story beat dropdown with timeline
        TagInput.tsx                    # Reusable tag input component
        LoadExistingModal.tsx           # Modal for loading existing character
        ExportOptionsModal.tsx          # Modal for export options
      hooks/
        useDialogueCreator.ts           # Main state management hook
        useValidation.ts                # Validation logic hook
        useAutoSave.ts                  # Auto-save functionality
      utils/
        characterTemplate.ts            # Default character template
        validators.ts                   # Validation functions
        exportUtils.ts                  # JSON export/formatting
        emotionSuggestions.ts           # Emotion-category mappings
        idGenerator.ts                  # Auto-ID generation logic
      types/
        creator.types.ts                # Tool-specific type definitions
      styles/
        dialogue-creator.module.css     # Component styles

lib/
  dialogue/
    fileOperations.ts                   # Server-side file read/write
    manifestUpdater.ts                  # Update character manifest
```

### Component Architecture

#### 1. Main Page Component

**File:** `app/admin/dialogue-creator/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useDialogueCreator } from './hooks/useDialogueCreator';
import CharacterInfoPanel from './components/CharacterInfoPanel';
import DialogueEntryList from './components/DialogueEntryList';
import DialoguePreview from './components/DialoguePreview';
import MetadataPanel from './components/MetadataPanel';
import ValidationPanel from './components/ValidationPanel';

export default function DialogueCreatorPage() {
  const {
    character,
    dialogueEntries,
    metadata,
    validationResults,
    isDirty,
    updateCharacter,
    addDialogueEntry,
    updateDialogueEntry,
    deleteDialogueEntry,
    duplicateDialogueEntry,
    reorderDialogueEntry,
    updateMetadata,
    loadCharacter,
    importFromJSON,
    exportToJSON,
    saveCharacter,
    resetForm,
    validate
  } = useDialogueCreator();

  const [showPreview, setShowPreview] = useState(true);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const hasErrors = validationResults.some(r => r.severity === 'error');

  return (
    <div className={styles.creatorContainer}>
      <header className={styles.header}>
        <h1>Dialogue Creator</h1>
        <div className={styles.headerActions}>
          <button onClick={() => loadCharacter()}>Load Existing</button>
          <button onClick={() => importFromJSON()}>Import JSON</button>
          <button onClick={exportToJSON}>Export JSON</button>
          <button
            onClick={saveCharacter}
            disabled={hasErrors || !isDirty}
          >
            Save Character
          </button>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <CharacterInfoPanel
            character={character}
            onChange={updateCharacter}
            errors={validationResults.filter(r => r.field.startsWith('character'))}
          />

          <DialogueEntryList
            entries={dialogueEntries}
            onAdd={addDialogueEntry}
            onUpdate={updateDialogueEntry}
            onDelete={deleteDialogueEntry}
            onDuplicate={duplicateDialogueEntry}
            onReorder={reorderDialogueEntry}
            errors={validationResults.filter(r => r.field.startsWith('dialogue'))}
          />

          <MetadataPanel
            metadata={metadata}
            onChange={updateMetadata}
            errors={validationResults.filter(r => r.field.startsWith('metadata'))}
          />
        </div>

        {showPreview && (
          <div className={styles.rightPanel}>
            <DialoguePreview
              character={character}
              dialogueEntries={dialogueEntries}
              currentIndex={currentPreviewIndex}
              onIndexChange={setCurrentPreviewIndex}
            />
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <ValidationPanel
          results={validationResults}
          onFieldClick={(field) => {
            // Scroll to field and focus
          }}
        />
      </footer>
    </div>
  );
}
```

#### 2. CharacterInfoPanel Component

**File:** `app/admin/dialogue-creator/components/CharacterInfoPanel.tsx`

```typescript
import { Character } from '@/lib/dialogue/types';
import { ValidationResult } from '../types/creator.types';
import TagInput from './TagInput';
import styles from '../styles/dialogue-creator.module.css';

interface CharacterInfoPanelProps {
  character: Character;
  onChange: (field: keyof Character, value: any) => void;
  errors: ValidationResult[];
}

export default function CharacterInfoPanel({
  character,
  onChange,
  errors
}: CharacterInfoPanelProps) {
  const getError = (field: string) =>
    errors.find(e => e.field === `character.${field}`)?.message;

  const handleNameChange = (name: string) => {
    onChange('name', name);
    // Auto-generate ID if it hasn't been manually edited
    if (!character.id || isAutoGeneratedId(character.id, character.name)) {
      const autoId = generateIdFromName(name);
      onChange('id', autoId);
    }
  };

  return (
    <section className={styles.panel}>
      <h2>Character Information</h2>

      <div className={styles.formGroup}>
        <label htmlFor="char-id">Character ID *</label>
        <input
          id="char-id"
          type="text"
          value={character.id}
          onChange={(e) => onChange('id', e.target.value)}
          className={getError('id') ? styles.inputError : ''}
          placeholder="archivist-lumina"
        />
        {getError('id') && (
          <span className={styles.errorMessage}>{getError('id')}</span>
        )}
        <span className={styles.helperText}>
          Lowercase letters, numbers, and hyphens only
        </span>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="char-name">Character Name *</label>
        <input
          id="char-name"
          type="text"
          value={character.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={getError('name') ? styles.inputError : ''}
          placeholder="Archivist Lumina"
        />
        {getError('name') && (
          <span className={styles.errorMessage}>{getError('name')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="char-title">Title *</label>
        <input
          id="char-title"
          type="text"
          value={character.title}
          onChange={(e) => onChange('title', e.target.value)}
          className={getError('title') ? styles.inputError : ''}
          placeholder="Senior Archivist of Interdimensional Collections"
          maxLength={100}
        />
        <span className={styles.charCount}>
          {character.title.length}/100
        </span>
        {getError('title') && (
          <span className={styles.errorMessage}>{getError('title')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="char-description">Description *</label>
        <textarea
          id="char-description"
          value={character.description}
          onChange={(e) => onChange('description', e.target.value)}
          className={getError('description') ? styles.inputError : ''}
          placeholder="A wise and experienced archivist who..."
          rows={4}
          maxLength={500}
        />
        <span className={styles.charCount}>
          {character.description.length}/500
        </span>
        {getError('description') && (
          <span className={styles.errorMessage}>{getError('description')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="char-portrait">Portrait File *</label>
        <select
          id="char-portrait"
          value={character.portraitFile}
          onChange={(e) => onChange('portraitFile', e.target.value)}
          className={getError('portraitFile') ? styles.inputError : ''}
        >
          <option value="">Select portrait...</option>
          <option value="lumina-portrait.svg">lumina-portrait.svg</option>
          {/* Add more portrait options */}
        </select>
        {getError('portraitFile') && (
          <span className={styles.errorMessage}>{getError('portraitFile')}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="char-loading-group">Loading Group *</label>
        <select
          id="char-loading-group"
          value={character.loadingGroup}
          onChange={(e) => onChange('loadingGroup', e.target.value)}
          className={getError('loadingGroup') ? styles.inputError : ''}
        >
          <option value="">Select loading group...</option>
          <option value="introduction_characters">Introduction Characters</option>
          <option value="regular_contacts">Regular Contacts</option>
          <option value="essential_library_staff">Essential Library Staff</option>
          <option value="extended_library_staff">Extended Library Staff</option>
          <option value="long_term_scholars">Long-term Scholars</option>
          <option value="visiting_scholars">Visiting Scholars</option>
          <option value="visiting_dignitaries">Visiting Dignitaries</option>
          <option value="knowledge_contributors">Knowledge Contributors</option>
          <option value="special_event_characters">Special Event Characters</option>
        </select>
        {getError('loadingGroup') && (
          <span className={styles.errorMessage}>{getError('loadingGroup')}</span>
        )}
        <span className={styles.helperText}>
          Determines when character is loaded during gameplay
        </span>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="char-retire">Retire After *</label>
        <select
          id="char-retire"
          value={character.retireAfter}
          onChange={(e) => onChange('retireAfter', e.target.value)}
          className={getError('retireAfter') ? styles.inputError : ''}
        >
          <option value="never">Never</option>
          <option value="hook">Hook</option>
          <option value="first_plot_point">First Plot Point</option>
          <option value="first_pinch_point">First Pinch Point</option>
          <option value="midpoint">Midpoint</option>
          <option value="second_pinch_point">Second Pinch Point</option>
          <option value="second_plot_point">Second Plot Point</option>
          <option value="climax">Climax</option>
          <option value="resolution">Resolution</option>
        </select>
        {getError('retireAfter') && (
          <span className={styles.errorMessage}>{getError('retireAfter')}</span>
        )}
        <span className={styles.helperText}>
          Character stops appearing after this story beat
        </span>
      </div>

      <div className={styles.formGroup}>
        <label>Specialties</label>
        <TagInput
          tags={character.specialties}
          onChange={(tags) => onChange('specialties', tags)}
          placeholder="Add specialty..."
        />
        <span className={styles.helperText}>
          Character expertise areas (e.g., interdimensional_cataloging)
        </span>
      </div>
    </section>
  );
}

// Helper functions
function generateIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function isAutoGeneratedId(id: string, name: string): boolean {
  return id === generateIdFromName(name);
}
```

#### 3. DialogueEntryForm Component

**File:** `app/admin/dialogue-creator/components/DialogueEntryForm.tsx`

```typescript
import { BanterDialogue, Emotion, DialogueCategory } from '@/lib/dialogue/types';
import { ValidationResult } from '../types/creator.types';
import EmotionSelector from './EmotionSelector';
import StoryBeatSelector from './StoryBeatSelector';
import styles from '../styles/dialogue-creator.module.css';

interface DialogueEntryFormProps {
  entry: BanterDialogue;
  index: number;
  totalEntries: number;
  isExpanded: boolean;
  onChange: (index: number, entry: BanterDialogue) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onReorder: (index: number, direction: 'up' | 'down') => void;
  onToggleExpand: () => void;
  errors: ValidationResult[];
}

export default function DialogueEntryForm({
  entry,
  index,
  totalEntries,
  isExpanded,
  onChange,
  onDelete,
  onDuplicate,
  onReorder,
  onToggleExpand,
  errors
}: DialogueEntryFormProps) {
  const getError = (field: string) =>
    errors.find(e => e.field === `dialogue.${index}.${field}`)?.message;

  const getCharCountColor = (count: number) => {
    if (count <= 180) return styles.countGood;
    if (count <= 200) return styles.countWarning;
    return styles.countExceeded;
  };

  const handleUpdate = (field: keyof BanterDialogue, value: any) => {
    onChange(index, { ...entry, [field]: value });
  };

  return (
    <div className={styles.dialogueEntry}>
      <div className={styles.entryHeader} onClick={onToggleExpand}>
        <span className={styles.entryNumber}>Entry {index + 1}</span>
        <span className={styles.entryPreview}>
          {entry.text.slice(0, 50)}...
        </span>
        <div className={styles.entryActions} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onReorder(index, 'up')}
            disabled={index === 0}
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onReorder(index, 'down')}
            disabled={index === totalEntries - 1}
            title="Move down"
          >
            ↓
          </button>
          <button onClick={() => onDuplicate(index)} title="Duplicate">
            ⎘
          </button>
          <button
            onClick={() => onDelete(index)}
            disabled={totalEntries === 1}
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.entryContent}>
          <div className={styles.formGroup}>
            <label>Dialogue ID *</label>
            <input
              type="text"
              value={entry.id}
              onChange={(e) => handleUpdate('id', e.target.value)}
              className={getError('id') ? styles.inputError : ''}
              placeholder="welcome-general"
            />
            {getError('id') && (
              <span className={styles.errorMessage}>{getError('id')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Category *</label>
            <select
              value={entry.category}
              onChange={(e) => handleUpdate('category', e.target.value as DialogueCategory)}
              className={getError('category') ? styles.inputError : ''}
            >
              <option value="">Select category...</option>
              <option value="general-welcome">General Welcome</option>
              <option value="progress-praise">Progress Praise</option>
              <option value="lore-sharing">Lore Sharing</option>
              <option value="casual-advice">Casual Advice</option>
              <option value="appreciation">Appreciation</option>
              <option value="academic-introduction">Academic Introduction</option>
              <option value="lore-exposition">Lore Exposition</option>
              <option value="academic-guidance">Academic Guidance</option>
              <option value="colleague-reference">Colleague Reference</option>
              <option value="research-exposition">Research Exposition</option>
              <option value="meta-humor">Meta Humor</option>
              <option value="general-testing">General Testing</option>
              <option value="technical-testing">Technical Testing</option>
            </select>
            {getError('category') && (
              <span className={styles.errorMessage}>{getError('category')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Emotions *</label>
            <EmotionSelector
              selectedEmotions={entry.emotion}
              onChange={(emotions) => handleUpdate('emotion', emotions)}
              suggestedForCategory={entry.category}
            />
            {getError('emotion') && (
              <span className={styles.errorMessage}>{getError('emotion')}</span>
            )}
            <span className={styles.helperText}>
              Select 1-2 emotions (max 4)
            </span>
          </div>

          <div className={styles.formGroup}>
            <label>Dialogue Text *</label>
            <textarea
              value={entry.text}
              onChange={(e) => handleUpdate('text', e.target.value)}
              className={getError('text') ? styles.inputError : ''}
              placeholder="Enter dialogue text..."
              rows={4}
            />
            <div className={styles.charCountDisplay}>
              <span className={getCharCountColor(entry.text.length)}>
                {entry.text.length} characters
              </span>
              <span className={styles.helperText}>
                Recommended: Mobile 180 | Tablet 300 | Desktop 400
              </span>
            </div>
            {getError('text') && (
              <span className={styles.errorMessage}>{getError('text')}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Available From *</label>
              <StoryBeatSelector
                value={entry.availableFrom}
                onChange={(beat) => handleUpdate('availableFrom', beat)}
                error={getError('availableFrom')}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Available Until (optional)</label>
              <StoryBeatSelector
                value={entry.availableUntil || ''}
                onChange={(beat) => handleUpdate('availableUntil', beat || undefined)}
                error={getError('availableUntil')}
                allowEmpty
              />
              <span className={styles.helperText}>
                Leave empty for permanent availability
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 4. DialoguePreview Component

**File:** `app/admin/dialogue-creator/components/DialoguePreview.tsx`

```typescript
import { Character, BanterDialogue, StoryBeat } from '@/lib/dialogue/types';
import { useState } from 'react';
import styles from '../styles/dialogue-creator.module.css';

interface DialoguePreviewProps {
  character: Character;
  dialogueEntries: BanterDialogue[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function DialoguePreview({
  character,
  dialogueEntries,
  currentIndex,
  onIndexChange
}: DialoguePreviewProps) {
  const [filterBeat, setFilterBeat] = useState<StoryBeat | 'all'>('all');

  const filteredEntries = dialogueEntries.filter(entry => {
    if (filterBeat === 'all') return true;

    const availableFrom = entry.availableFrom;
    const availableUntil = entry.availableUntil;

    // Check if dialogue is available at filterBeat
    const beatOrder: StoryBeat[] = [
      'hook', 'first_plot_point', 'first_pinch_point', 'midpoint',
      'second_pinch_point', 'second_plot_point', 'climax', 'resolution'
    ];

    const currentBeatIndex = beatOrder.indexOf(filterBeat);
    const fromBeatIndex = beatOrder.indexOf(availableFrom);
    const untilBeatIndex = availableUntil ? beatOrder.indexOf(availableUntil) : Infinity;

    return currentBeatIndex >= fromBeatIndex && currentBeatIndex <= untilBeatIndex;
  });

  const currentEntry = filteredEntries[currentIndex] || dialogueEntries[0];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredEntries.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  return (
    <div className={styles.previewPanel}>
      <h2>Live Preview</h2>

      <div className={styles.previewControls}>
        <label>Filter by Story Beat:</label>
        <select
          value={filterBeat}
          onChange={(e) => {
            setFilterBeat(e.target.value as StoryBeat | 'all');
            onIndexChange(0);
          }}
        >
          <option value="all">All Dialogue</option>
          <option value="hook">Hook</option>
          <option value="first_plot_point">First Plot Point</option>
          <option value="first_pinch_point">First Pinch Point</option>
          <option value="midpoint">Midpoint</option>
          <option value="second_pinch_point">Second Pinch Point</option>
          <option value="second_plot_point">Second Plot Point</option>
          <option value="climax">Climax</option>
          <option value="resolution">Resolution</option>
        </select>
      </div>

      {/* Simulated in-game dialogue panel */}
      <div className={styles.dialoguePreviewPanel}>
        <div className={styles.previewPortrait}>
          {character.portraitFile ? (
            <img
              src={`/images/portraits/${character.portraitFile}`}
              alt={character.name}
              onError={(e) => {
                e.currentTarget.src = '/images/portraits/placeholder.svg';
              }}
            />
          ) : (
            <div className={styles.portraitPlaceholder}>Portrait</div>
          )}
        </div>

        <div className={styles.previewContent}>
          <div className={styles.previewCharacterName}>{character.name}</div>
          <div className={styles.previewCharacterTitle}>{character.title}</div>

          {currentEntry ? (
            <>
              <div className={styles.previewDialogueText}>{currentEntry.text}</div>

              <div className={styles.previewEmotions}>
                {currentEntry.emotion.map((emotion) => (
                  <span key={emotion} className={styles.emotionChip}>
                    {emotion}
                  </span>
                ))}
              </div>

              <div className={styles.previewMeta}>
                <span>Category: {currentEntry.category}</span>
                <span>
                  Available: {currentEntry.availableFrom}
                  {currentEntry.availableUntil && ` - ${currentEntry.availableUntil}`}
                </span>
              </div>
            </>
          ) : (
            <div className={styles.previewEmpty}>
              No dialogue available for this story beat
            </div>
          )}

          <div className={styles.previewControls}>
            <button onClick={handlePrevious} disabled={currentIndex === 0}>
              Previous
            </button>
            <span>
              {filteredEntries.length > 0
                ? `${currentIndex + 1} / ${filteredEntries.length}`
                : '0 / 0'}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex >= filteredEntries.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className={styles.previewInfo}>
        <p>
          <strong>Total Dialogue Entries:</strong> {dialogueEntries.length}
        </p>
        <p>
          <strong>Available at Current Beat:</strong> {filteredEntries.length}
        </p>
      </div>
    </div>
  );
}
```

#### 5. State Management Hook

**File:** `app/admin/dialogue-creator/hooks/useDialogueCreator.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { Character, BanterDialogue, CharacterMetadata, StoryBeat } from '@/lib/dialogue/types';
import { ValidationResult } from '../types/creator.types';
import { validateCharacter } from '../utils/validators';
import { getCharacterTemplate } from '../utils/characterTemplate';
import { exportCharacterToJSON } from '../utils/exportUtils';

interface DialogueCreatorState {
  character: Character;
  dialogueEntries: BanterDialogue[];
  metadata: CharacterMetadata;
  validationResults: ValidationResult[];
  isDirty: boolean;
  currentPreviewIndex: number;
}

export function useDialogueCreator() {
  const [state, setState] = useState<DialogueCreatorState>(() => ({
    character: getCharacterTemplate(),
    dialogueEntries: [],
    metadata: {
      personalityTraits: [],
      relationshipToPlayer: 'colleague',
      availableInScreens: ['library'],
      lastUpdated: new Date().toISOString().split('T')[0]
    },
    validationResults: [],
    isDirty: false,
    currentPreviewIndex: 0
  }));

  // Auto-validate on changes
  useEffect(() => {
    const results = validateCharacter(
      state.character,
      state.dialogueEntries,
      state.metadata
    );
    setState(prev => ({ ...prev, validationResults: results }));
  }, [state.character, state.dialogueEntries, state.metadata]);

  // Character operations
  const updateCharacter = useCallback((field: keyof Character, value: any) => {
    setState(prev => ({
      ...prev,
      character: { ...prev.character, [field]: value },
      isDirty: true
    }));
  }, []);

  // Dialogue operations
  const addDialogueEntry = useCallback(() => {
    const newEntry: BanterDialogue = {
      id: `dialogue-${state.dialogueEntries.length + 1}`,
      text: '',
      emotion: [],
      category: 'general-welcome',
      availableFrom: 'hook'
    };

    setState(prev => ({
      ...prev,
      dialogueEntries: [...prev.dialogueEntries, newEntry],
      isDirty: true
    }));
  }, [state.dialogueEntries.length]);

  const updateDialogueEntry = useCallback((index: number, entry: BanterDialogue) => {
    setState(prev => ({
      ...prev,
      dialogueEntries: prev.dialogueEntries.map((e, i) =>
        i === index ? entry : e
      ),
      isDirty: true
    }));
  }, []);

  const deleteDialogueEntry = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      dialogueEntries: prev.dialogueEntries.filter((_, i) => i !== index),
      isDirty: true
    }));
  }, []);

  const duplicateDialogueEntry = useCallback((index: number) => {
    const entryToDuplicate = state.dialogueEntries[index];
    const newEntry: BanterDialogue = {
      ...entryToDuplicate,
      id: `${entryToDuplicate.id}-copy`
    };

    setState(prev => ({
      ...prev,
      dialogueEntries: [
        ...prev.dialogueEntries.slice(0, index + 1),
        newEntry,
        ...prev.dialogueEntries.slice(index + 1)
      ],
      isDirty: true
    }));
  }, [state.dialogueEntries]);

  const reorderDialogueEntry = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= state.dialogueEntries.length) return;

      const entries = [...state.dialogueEntries];
      [entries[index], entries[newIndex]] = [entries[newIndex], entries[index]];

      setState(prev => ({
        ...prev,
        dialogueEntries: entries,
        isDirty: true
      }));
    },
    [state.dialogueEntries]
  );

  // Metadata operations
  const updateMetadata = useCallback((field: keyof CharacterMetadata, value: any) => {
    setState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
      isDirty: true
    }));
  }, []);

  // File operations
  const loadCharacter = useCallback(async (filename: string) => {
    try {
      const response = await fetch(`/api/dialogue/load?filename=${filename}`);
      const data = await response.json();

      setState({
        character: data.character,
        dialogueEntries: data.banterDialogue,
        metadata: data.metadata,
        validationResults: [],
        isDirty: false,
        currentPreviewIndex: 0
      });
    } catch (error) {
      console.error('Failed to load character:', error);
      alert('Failed to load character. Please try again.');
    }
  }, []);

  const importFromJSON = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);

      setState({
        character: data.character,
        dialogueEntries: data.banterDialogue,
        metadata: data.metadata,
        validationResults: [],
        isDirty: true,
        currentPreviewIndex: 0
      });
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      alert('Invalid JSON format. Please check the file and try again.');
    }
  }, []);

  const exportToJSON = useCallback(() => {
    const characterData = {
      character: state.character,
      banterDialogue: state.dialogueEntries,
      metadata: {
        ...state.metadata,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    const json = exportCharacterToJSON(characterData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.character.id || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const saveCharacter = useCallback(async () => {
    // Validate before saving
    const results = validateCharacter(
      state.character,
      state.dialogueEntries,
      state.metadata
    );

    const hasErrors = results.some(r => r.severity === 'error');
    if (hasErrors) {
      alert('Please fix all errors before saving.');
      return;
    }

    const characterData = {
      character: state.character,
      banterDialogue: state.dialogueEntries,
      metadata: {
        ...state.metadata,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    try {
      const response = await fetch('/api/dialogue/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterData)
      });

      if (response.ok) {
        setState(prev => ({ ...prev, isDirty: false }));
        alert('Character saved successfully!');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save character:', error);
      alert('Failed to save character. Please try again.');
    }
  }, [state]);

  const resetForm = useCallback(() => {
    if (state.isDirty && !confirm('Discard unsaved changes?')) {
      return;
    }

    setState({
      character: getCharacterTemplate(),
      dialogueEntries: [],
      metadata: {
        personalityTraits: [],
        relationshipToPlayer: 'colleague',
        availableInScreens: ['library'],
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      validationResults: [],
      isDirty: false,
      currentPreviewIndex: 0
    });
  }, [state.isDirty]);

  const validate = useCallback(() => {
    const results = validateCharacter(
      state.character,
      state.dialogueEntries,
      state.metadata
    );
    setState(prev => ({ ...prev, validationResults: results }));
    return results;
  }, [state.character, state.dialogueEntries, state.metadata]);

  return {
    ...state,
    updateCharacter,
    addDialogueEntry,
    updateDialogueEntry,
    deleteDialogueEntry,
    duplicateDialogueEntry,
    reorderDialogueEntry,
    updateMetadata,
    loadCharacter,
    importFromJSON,
    exportToJSON,
    saveCharacter,
    resetForm,
    validate
  };
}
```

### API Routes

#### Load Character API

**File:** `app/api/dialogue/load/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json(
      { error: 'Filename is required' },
      { status: 400 }
    );
  }

  try {
    const filePath = join(
      process.cwd(),
      'public',
      'data',
      'characters',
      filename
    );

    const fileContent = await readFile(filePath, 'utf-8');
    const characterData = JSON.parse(fileContent);

    return NextResponse.json(characterData);
  } catch (error) {
    console.error('Error loading character:', error);
    return NextResponse.json(
      { error: 'Failed to load character file' },
      { status: 500 }
    );
  }
}
```

#### Save Character API

**File:** `app/api/dialogue/save/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const characterData = await request.json();

    if (!characterData.character?.id) {
      return NextResponse.json(
        { error: 'Character ID is required' },
        { status: 400 }
      );
    }

    const filename = `${characterData.character.id}.json`;
    const filePath = join(
      process.cwd(),
      'public',
      'data',
      'characters',
      filename
    );

    // Format JSON with 2-space indentation
    const jsonContent = JSON.stringify(characterData, null, 2);

    // Save character file
    await writeFile(filePath, jsonContent, 'utf-8');

    // Update character manifest
    const manifestPath = join(
      process.cwd(),
      'public',
      'data',
      'characters',
      'character-manifest.json'
    );

    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    if (!manifest.includes(filename)) {
      manifest.push(filename);
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    }

    return NextResponse.json({
      success: true,
      filename,
      path: filePath
    });
  } catch (error) {
    console.error('Error saving character:', error);
    return NextResponse.json(
      { error: 'Failed to save character file' },
      { status: 500 }
    );
  }
}
```

---

## Validation Rules

### Character Validation

```typescript
// File: app/admin/dialogue-creator/utils/validators.ts

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidation?: (value: any, context?: any) => string | null;
}

export const characterValidationRules: Record<keyof Character, ValidationRule> = {
  id: {
    required: true,
    pattern: /^[a-z0-9-]+$/,
    minLength: 2,
    maxLength: 50,
    customValidation: (id: string, context) => {
      if (context.existingIds?.includes(id)) {
        return 'This ID is already in use';
      }
      return null;
    }
  },

  name: {
    required: true,
    minLength: 2,
    maxLength: 50
  },

  title: {
    required: true,
    minLength: 5,
    maxLength: 100
  },

  description: {
    required: true,
    minLength: 20,
    maxLength: 500
  },

  portraitFile: {
    required: true,
    pattern: /\.(svg|png|jpg|jpeg)$/i,
    customValidation: (file: string, context) => {
      if (!context.availablePortraits?.includes(file)) {
        return 'Portrait file not found in assets';
      }
      return null;
    }
  },

  loadingGroup: {
    required: true,
    customValidation: (group: string) => {
      const validGroups = [
        'introduction_characters',
        'regular_contacts',
        'essential_library_staff',
        'extended_library_staff',
        'long_term_scholars',
        'visiting_scholars',
        'visiting_dignitaries',
        'knowledge_contributors',
        'special_event_characters'
      ];

      if (!validGroups.includes(group)) {
        return 'Invalid loading group';
      }
      return null;
    }
  },

  retireAfter: {
    required: true,
    customValidation: (value: string) => {
      const validValues = [
        'never',
        'hook',
        'first_plot_point',
        'first_pinch_point',
        'midpoint',
        'second_pinch_point',
        'second_plot_point',
        'climax',
        'resolution'
      ];

      if (!validValues.includes(value)) {
        return 'Invalid story beat';
      }
      return null;
    }
  },

  specialties: {
    customValidation: (specialties: string[]) => {
      if (specialties.length === 0) {
        return 'At least one specialty is recommended';
      }
      return null;
    }
  }
};
```

### Dialogue Validation

```typescript
export const dialogueValidationRules = {
  id: {
    required: true,
    pattern: /^[a-z0-9-]+$/,
    minLength: 3,
    maxLength: 50,
    customValidation: (id: string, context) => {
      const ids = context.allDialogueIds || [];
      const count = ids.filter((existingId: string) => existingId === id).length;

      if (count > 1) {
        return 'Dialogue ID must be unique within character';
      }
      return null;
    }
  },

  text: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    customValidation: (text: string) => {
      // Warn if exceeding recommended mobile limit
      if (text.length > 180 && text.length <= 300) {
        return 'Text exceeds mobile recommended length (180 chars)';
      }

      if (text.length > 300 && text.length <= 400) {
        return 'Text exceeds tablet recommended length (300 chars)';
      }

      if (text.length > 400) {
        return 'Text exceeds desktop recommended length (400 chars)';
      }

      return null;
    }
  },

  emotion: {
    required: true,
    customValidation: (emotions: string[]) => {
      if (emotions.length === 0) {
        return 'At least one emotion is required';
      }

      if (emotions.length > 4) {
        return 'Maximum 4 emotions allowed';
      }

      if (emotions.length > 2) {
        return 'Most dialogue uses 1-2 emotions (currently using ' + emotions.length + ')';
      }

      return null;
    }
  },

  category: {
    required: true,
    customValidation: (category: string) => {
      const validCategories = [
        'general-welcome',
        'progress-praise',
        'lore-sharing',
        'casual-advice',
        'appreciation',
        'academic-introduction',
        'lore-exposition',
        'academic-guidance',
        'colleague-reference',
        'research-exposition',
        'meta-humor',
        'general-testing',
        'technical-testing'
      ];

      if (!validCategories.includes(category)) {
        return 'Invalid dialogue category';
      }
      return null;
    }
  },

  availableFrom: {
    required: true,
    customValidation: (from: string, context) => {
      const validBeats = [
        'hook',
        'first_plot_point',
        'first_pinch_point',
        'midpoint',
        'second_pinch_point',
        'second_plot_point',
        'climax',
        'resolution'
      ];

      if (!validBeats.includes(from)) {
        return 'Invalid story beat';
      }

      return null;
    }
  },

  availableUntil: {
    customValidation: (until: string | undefined, context) => {
      if (!until) return null;

      const validBeats = [
        'hook',
        'first_plot_point',
        'first_pinch_point',
        'midpoint',
        'second_pinch_point',
        'second_plot_point',
        'climax',
        'resolution'
      ];

      if (!validBeats.includes(until)) {
        return 'Invalid story beat';
      }

      const from = context.availableFrom;
      const beatOrder = validBeats;
      const fromIndex = beatOrder.indexOf(from);
      const untilIndex = beatOrder.indexOf(until);

      if (untilIndex <= fromIndex) {
        return 'Available Until must be after Available From';
      }

      return null;
    }
  }
};
```

### Quality Validation

```typescript
export function validateDialogueQuality(
  dialogueEntries: BanterDialogue[]
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check minimum dialogue count
  if (dialogueEntries.length < 3) {
    results.push({
      severity: 'warning',
      field: 'dialogue',
      message: `Only ${dialogueEntries.length} dialogue entries. Recommended minimum: 3`
    });
  }

  // Check early story beat coverage
  const hasHook = dialogueEntries.some(d => d.availableFrom === 'hook');
  const hasFirstPlot = dialogueEntries.some(
    d => d.availableFrom === 'first_plot_point'
  );

  if (!hasHook && !hasFirstPlot) {
    results.push({
      severity: 'warning',
      field: 'dialogue',
      message: 'No dialogue available in early game (hook or first_plot_point)'
    });
  }

  // Check category distribution
  const categories = dialogueEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEntries = dialogueEntries.length;
  const dominantCategory = Object.entries(categories).find(
    ([_, count]) => count / totalEntries > 0.5
  );

  if (dominantCategory) {
    results.push({
      severity: 'info',
      field: 'dialogue',
      message: `Over 50% of dialogue is in category "${dominantCategory[0]}". Consider varying categories.`
    });
  }

  // Check story beat coverage
  const beats: StoryBeat[] = [
    'hook',
    'first_plot_point',
    'first_pinch_point',
    'midpoint',
    'second_pinch_point',
    'second_plot_point',
    'climax',
    'resolution'
  ];

  const beatsWithDialogue = new Set(dialogueEntries.map(d => d.availableFrom));
  const missingBeats = beats.filter(beat => !beatsWithDialogue.has(beat));

  if (missingBeats.length > 3) {
    results.push({
      severity: 'info',
      field: 'dialogue',
      message: `No dialogue for story beats: ${missingBeats.join(', ')}`
    });
  }

  return results;
}
```

---

## Smart Features

### 1. Auto-ID Generation

```typescript
// File: app/admin/dialogue-creator/utils/idGenerator.ts

/**
 * Generate character ID from character name
 */
export function generateCharacterIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Generate dialogue ID from category and index
 */
export function generateDialogueId(
  category: string,
  existingIds: string[]
): string {
  // Extract first word of category
  const categoryWord = category.split('-')[0];

  // Common second words for natural IDs
  const secondWords = [
    'general', 'specific', 'first', 'second', 'warm',
    'casual', 'formal', 'intro', 'outro', 'progress',
    'start', 'mid', 'end', 'early', 'late'
  ];

  // Try to generate unique ID
  let baseId = categoryWord;
  let counter = 1;

  // First try with second word
  for (const word of secondWords) {
    const candidateId = `${word}-${baseId}`;
    if (!existingIds.includes(candidateId)) {
      return candidateId;
    }
  }

  // Fall back to numbered IDs
  while (existingIds.includes(`${baseId}-${counter}`)) {
    counter++;
  }

  return `${baseId}-${counter}`;
}

/**
 * Check if ID was auto-generated (to know if we should update it)
 */
export function isAutoGeneratedId(
  currentId: string,
  name: string
): boolean {
  const expectedId = generateCharacterIdFromName(name);
  return currentId === expectedId;
}
```

### 2. Emotion-Category Suggestions

```typescript
// File: app/admin/dialogue-creator/utils/emotionSuggestions.ts

import { DialogueCategory, Emotion } from '@/lib/dialogue/types';

export const emotionSuggestions: Record<DialogueCategory, Emotion[]> = {
  'general-welcome': [
    'warm',
    'welcoming',
    'professional',
    'formal',
    'friendly'
  ],

  'progress-praise': [
    'encouraging',
    'proud',
    'impressed',
    'warm',
    'enthusiastic'
  ],

  'lore-sharing': [
    'explanatory',
    'mystical',
    'scholarly',
    'wise',
    'contemplative',
    'intellectual'
  ],

  'casual-advice': [
    'conspiratorial',
    'reassuring',
    'warm',
    'amused',
    'friendly',
    'casual'
  ],

  'appreciation': [
    'grateful',
    'warm',
    'sincere',
    'touched',
    'appreciative'
  ],

  'academic-introduction': [
    'scholarly',
    'professional',
    'formal',
    'intellectual',
    'welcoming'
  ],

  'lore-exposition': [
    'scholarly',
    'explanatory',
    'mystical',
    'serious',
    'contemplative',
    'wise'
  ],

  'academic-guidance': [
    'instructional',
    'professorial',
    'methodical',
    'patient',
    'encouraging'
  ],

  'colleague-reference': [
    'collaborative',
    'professional',
    'respectful',
    'collegial',
    'warm'
  ],

  'research-exposition': [
    'analytical',
    'excited',
    'scientific',
    'enthusiastic',
    'intellectual'
  ],

  'meta-humor': [
    'amused',
    'self-aware',
    'playful',
    'witty',
    'lighthearted'
  ],

  'general-testing': [
    'professional',
    'methodical',
    'analytical',
    'focused'
  ],

  'technical-testing': [
    'analytical',
    'methodical',
    'technical',
    'precise',
    'focused'
  ]
};

/**
 * Get suggested emotions for a dialogue category
 */
export function getSuggestedEmotions(
  category: DialogueCategory
): Emotion[] {
  return emotionSuggestions[category] || [];
}

/**
 * Check if emotion is commonly used with category
 */
export function isCommonEmotionForCategory(
  emotion: Emotion,
  category: DialogueCategory
): boolean {
  const suggestions = emotionSuggestions[category] || [];
  return suggestions.includes(emotion);
}

/**
 * Validate emotion-category pairing
 */
export function validateEmotionCategoryPairing(
  emotions: Emotion[],
  category: DialogueCategory
): ValidationResult | null {
  const suggestions = emotionSuggestions[category] || [];
  const hasCommonEmotion = emotions.some(e => suggestions.includes(e));

  if (!hasCommonEmotion) {
    return {
      severity: 'info',
      field: 'emotion',
      message: `Unusual emotion for "${category}". Commonly used: ${suggestions.slice(0, 3).join(', ')}`
    };
  }

  return null;
}
```

### 3. Character Templates

```typescript
// File: app/admin/dialogue-creator/utils/characterTemplate.ts

import { Character, CharacterMetadata } from '@/lib/dialogue/types';

export interface CharacterTemplate {
  name: string;
  description: string;
  character: Partial<Character>;
  metadata: Partial<CharacterMetadata>;
  sampleDialogue: Array<{
    category: string;
    text: string;
    emotion: string[];
  }>;
}

export const characterTemplates: Record<string, CharacterTemplate> = {
  mentor: {
    name: 'Wise Mentor',
    description: 'A knowledgeable guide who encourages and teaches the player',
    character: {
      loadingGroup: 'introduction_characters',
      retireAfter: 'never',
      specialties: ['teaching', 'knowledge_sharing', 'guidance']
    },
    metadata: {
      personalityTraits: ['wise', 'encouraging', 'patient'],
      relationshipToPlayer: 'mentor-colleague',
      availableInScreens: ['library', 'tutorial']
    },
    sampleDialogue: [
      {
        category: 'general-welcome',
        text: 'Welcome, student. Your journey into knowledge begins here.',
        emotion: ['warm', 'welcoming']
      },
      {
        category: 'progress-praise',
        text: 'Excellent work! You\'re grasping these concepts faster than I expected.',
        emotion: ['encouraging', 'proud']
      },
      {
        category: 'lore-sharing',
        text: 'In the old days, we organized knowledge differently. Let me show you why our current system works better.',
        emotion: ['scholarly', 'wise']
      }
    ]
  },

  scholar: {
    name: 'Academic Scholar',
    description: 'An intellectual researcher focused on their field of study',
    character: {
      loadingGroup: 'visiting_scholars',
      retireAfter: 'second_plot_point',
      specialties: ['research', 'analysis', 'academic_writing']
    },
    metadata: {
      personalityTraits: ['intellectual', 'focused', 'passionate'],
      relationshipToPlayer: 'academic-mentor',
      availableInScreens: ['library']
    },
    sampleDialogue: [
      {
        category: 'academic-introduction',
        text: 'I\'m researching the intersection of interdimensional theory and practical cataloging. Fascinating stuff.',
        emotion: ['scholarly', 'enthusiastic']
      },
      {
        category: 'research-exposition',
        text: 'My latest findings suggest that organized knowledge creates stronger dimensional anchors. The data is compelling!',
        emotion: ['excited', 'analytical']
      },
      {
        category: 'colleague-reference',
        text: 'Have you worked with Professor Eldridge? Their approach to classification is revolutionary.',
        emotion: ['intellectual', 'collaborative']
      }
    ]
  },

  assistant: {
    name: 'Testing Assistant',
    description: 'A helpful character focused on testing and quality assurance',
    character: {
      loadingGroup: 'essential_library_staff',
      retireAfter: 'never',
      specialties: ['testing', 'quality_assurance', 'debugging']
    },
    metadata: {
      personalityTraits: ['methodical', 'helpful', 'detail-oriented'],
      relationshipToPlayer: 'colleague',
      availableInScreens: ['testing', 'library']
    },
    sampleDialogue: [
      {
        category: 'general-testing',
        text: 'Let\'s run through the test cases systematically. We need to ensure everything works perfectly.',
        emotion: ['professional', 'methodical']
      },
      {
        category: 'technical-testing',
        text: 'Interesting edge case! The system handled that gracefully.',
        emotion: ['analytical', 'impressed']
      },
      {
        category: 'casual-advice',
        text: 'Don\'t worry about breaking things in testing - that\'s what we\'re here for!',
        emotion: ['reassuring', 'amused']
      }
    ]
  },

  mysterious: {
    name: 'Mysterious Guide',
    description: 'An enigmatic character with hidden knowledge and cryptic advice',
    character: {
      loadingGroup: 'special_event_characters',
      retireAfter: 'resolution',
      specialties: ['ancient_knowledge', 'mysteries', 'secrets']
    },
    metadata: {
      personalityTraits: ['mysterious', 'cryptic', 'wise'],
      relationshipToPlayer: 'academic-mentor',
      availableInScreens: ['library']
    },
    sampleDialogue: [
      {
        category: 'lore-exposition',
        text: 'The archives remember more than they reveal. Some knowledge chooses its moment to surface.',
        emotion: ['mystical', 'contemplative']
      },
      {
        category: 'casual-advice',
        text: 'Trust your instincts. The patterns you see are not coincidence.',
        emotion: ['mysterious', 'wise']
      },
      {
        category: 'lore-sharing',
        text: 'In older times, archivists learned to listen to what the books didn\'t say.',
        emotion: ['mystical', 'scholarly']
      }
    ]
  },

  enthusiastic: {
    name: 'Enthusiastic Colleague',
    description: 'An energetic and friendly team member who loves their work',
    character: {
      loadingGroup: 'regular_contacts',
      retireAfter: 'never',
      specialties: ['teamwork', 'motivation', 'community_building']
    },
    metadata: {
      personalityTraits: ['enthusiastic', 'friendly', 'optimistic'],
      relationshipToPlayer: 'colleague',
      availableInScreens: ['library']
    },
    sampleDialogue: [
      {
        category: 'general-welcome',
        text: 'Hey! Great to see you! Ready to do some awesome archiving today?',
        emotion: ['enthusiastic', 'warm']
      },
      {
        category: 'progress-praise',
        text: 'Wow, you\'re really crushing it! Your organization skills are amazing!',
        emotion: ['enthusiastic', 'impressed']
      },
      {
        category: 'appreciation',
        text: 'I love working with you! You make this library feel like a real community.',
        emotion: ['grateful', 'warm']
      }
    ]
  }
};

/**
 * Get blank character template
 */
export function getCharacterTemplate(): Character {
  return {
    id: '',
    name: '',
    title: '',
    description: '',
    portraitFile: '',
    loadingGroup: 'introduction_characters',
    retireAfter: 'never',
    specialties: []
  };
}

/**
 * Load a character template by type
 */
export function loadCharacterTemplate(
  templateType: keyof typeof characterTemplates
): {
  character: Character;
  metadata: CharacterMetadata;
  dialogueEntries: BanterDialogue[];
} {
  const template = characterTemplates[templateType];

  return {
    character: {
      ...getCharacterTemplate(),
      ...template.character
    } as Character,

    metadata: {
      personalityTraits: [],
      relationshipToPlayer: 'colleague',
      availableInScreens: ['library'],
      lastUpdated: new Date().toISOString().split('T')[0],
      ...template.metadata
    } as CharacterMetadata,

    dialogueEntries: template.sampleDialogue.map((sample, index) => ({
      id: generateDialogueId(sample.category, []),
      text: sample.text,
      emotion: sample.emotion as Emotion[],
      category: sample.category as DialogueCategory,
      availableFrom: 'hook' as StoryBeat
    }))
  };
}
```

### 4. Export Utilities

```typescript
// File: app/admin/dialogue-creator/utils/exportUtils.ts

import { CharacterData } from '@/lib/dialogue/types';

/**
 * Export character data to formatted JSON string
 */
export function exportCharacterToJSON(characterData: CharacterData): string {
  return JSON.stringify(characterData, null, 2);
}

/**
 * Export character data to Markdown format for review
 */
export function exportCharacterToMarkdown(characterData: CharacterData): string {
  const { character, banterDialogue, metadata } = characterData;

  let markdown = `# ${character.name}\n\n`;
  markdown += `**Title:** ${character.title}\n\n`;
  markdown += `**ID:** \`${character.id}\`\n\n`;
  markdown += `**Description:** ${character.description}\n\n`;
  markdown += `---\n\n`;

  markdown += `## Character Details\n\n`;
  markdown += `- **Loading Group:** ${character.loadingGroup}\n`;
  markdown += `- **Retire After:** ${character.retireAfter}\n`;
  markdown += `- **Portrait:** ${character.portraitFile}\n`;
  markdown += `- **Specialties:** ${character.specialties.join(', ')}\n\n`;

  markdown += `## Metadata\n\n`;
  markdown += `- **Personality Traits:** ${metadata.personalityTraits.join(', ')}\n`;
  markdown += `- **Relationship:** ${metadata.relationshipToPlayer}\n`;
  markdown += `- **Available In:** ${metadata.availableInScreens.join(', ')}\n`;
  markdown += `- **Last Updated:** ${metadata.lastUpdated}\n\n`;

  markdown += `---\n\n`;
  markdown += `## Dialogue (${banterDialogue.length} entries)\n\n`;

  banterDialogue.forEach((dialogue, index) => {
    markdown += `### ${index + 1}. ${dialogue.id}\n\n`;
    markdown += `**Category:** ${dialogue.category}\n\n`;
    markdown += `**Emotions:** ${dialogue.emotion.join(', ')}\n\n`;
    markdown += `**Availability:** ${dialogue.availableFrom}`;
    if (dialogue.availableUntil) {
      markdown += ` → ${dialogue.availableUntil}`;
    }
    markdown += `\n\n`;
    markdown += `> ${dialogue.text}\n\n`;
  });

  return markdown;
}

/**
 * Export dialogue entries to CSV format
 */
export function exportDialogueToCSV(banterDialogue: BanterDialogue[]): string {
  const headers = [
    'ID',
    'Category',
    'Text',
    'Emotions',
    'Available From',
    'Available Until',
    'Character Count'
  ];

  const rows = banterDialogue.map(dialogue => [
    dialogue.id,
    dialogue.category,
    `"${dialogue.text.replace(/"/g, '""')}"`, // Escape quotes
    dialogue.emotion.join('; '),
    dialogue.availableFrom,
    dialogue.availableUntil || '',
    dialogue.text.length.toString()
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

/**
 * Generate validation report
 */
export function generateValidationReport(
  characterData: CharacterData,
  validationResults: ValidationResult[]
): string {
  let report = `# Validation Report: ${characterData.character.name}\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  const errors = validationResults.filter(r => r.severity === 'error');
  const warnings = validationResults.filter(r => r.severity === 'warning');
  const info = validationResults.filter(r => r.severity === 'info');

  report += `## Summary\n\n`;
  report += `- **Errors:** ${errors.length}\n`;
  report += `- **Warnings:** ${warnings.length}\n`;
  report += `- **Info:** ${info.length}\n\n`;

  if (errors.length > 0) {
    report += `## Errors\n\n`;
    errors.forEach(error => {
      report += `- **${error.field}:** ${error.message}\n`;
    });
    report += `\n`;
  }

  if (warnings.length > 0) {
    report += `## Warnings\n\n`;
    warnings.forEach(warning => {
      report += `- **${warning.field}:** ${warning.message}\n`;
    });
    report += `\n`;
  }

  if (info.length > 0) {
    report += `## Information\n\n`;
    info.forEach(item => {
      report += `- **${item.field}:** ${item.message}\n`;
    });
    report += `\n`;
  }

  return report;
}
```

---

## Implementation Checklist

### Phase 1: Core MVP (Estimated: 20-30 hours)

#### Setup & Structure
- [ ] Create directory structure in `app/admin/dialogue-creator/`
- [ ] Set up TypeScript type definitions in `types/creator.types.ts`
- [ ] Create basic page layout and routing
- [ ] Set up CSS modules for styling

#### Character Info Panel (4-6 hours)
- [ ] Create `CharacterInfoPanel` component
- [ ] Implement all character form fields
- [ ] Add character count displays
- [ ] Implement basic field validation
- [ ] Add auto-ID generation from name
- [ ] Style component to match design

#### Dialogue Entry Forms (6-8 hours)
- [ ] Create `DialogueEntryForm` component
- [ ] Create `DialogueEntryList` component
- [ ] Implement add/delete/duplicate entry
- [ ] Implement reorder (up/down arrows)
- [ ] Add collapse/expand functionality
- [ ] Create `EmotionSelector` component
- [ ] Create `StoryBeatSelector` component
- [ ] Implement character count with color coding
- [ ] Add validation displays per field
- [ ] Style components

#### Preview Panel (4-6 hours)
- [ ] Create `DialoguePreview` component
- [ ] Implement character card preview
- [ ] Add portrait display with fallback
- [ ] Implement dialogue navigation (next/previous)
- [ ] Add story beat filter
- [ ] Show dialogue count and current index
- [ ] Match in-game dialogue panel styling

#### Validation System (4-6 hours)
- [ ] Create `validators.ts` utility file
- [ ] Implement character validation rules
- [ ] Implement dialogue validation rules
- [ ] Implement quality validation
- [ ] Create `ValidationPanel` component
- [ ] Add real-time validation on field changes
- [ ] Implement click-to-focus from validation panel
- [ ] Add validation status summary

#### Metadata Panel (2-3 hours)
- [ ] Create `MetadataPanel` component
- [ ] Implement personality traits tag input
- [ ] Add relationship dropdown
- [ ] Add screen availability checkboxes
- [ ] Auto-populate last updated date
- [ ] Style component

#### State Management (3-4 hours)
- [ ] Create `useDialogueCreator` hook
- [ ] Implement state initialization
- [ ] Add character update methods
- [ ] Add dialogue CRUD methods
- [ ] Add metadata update methods
- [ ] Implement validation integration
- [ ] Add isDirty tracking

#### Import/Export (2-4 hours)
- [ ] Create `exportUtils.ts` utility file
- [ ] Implement export to JSON
- [ ] Implement JSON formatting
- [ ] Add download functionality
- [ ] Create file input for import
- [ ] Add JSON parsing and validation
- [ ] Implement reset/new character

#### API Routes (2-3 hours)
- [ ] Create `/api/dialogue/load` route
- [ ] Create `/api/dialogue/save` route
- [ ] Implement file reading from `public/data/characters/`
- [ ] Implement file writing
- [ ] Add manifest update logic
- [ ] Add error handling

#### Testing & Polish (2-4 hours)
- [ ] Test all CRUD operations
- [ ] Test validation rules
- [ ] Test import/export
- [ ] Test API routes
- [ ] Fix bugs
- [ ] Polish UI/UX
- [ ] Add loading states
- [ ] Add success/error notifications

---

### Phase 2: Enhanced Features (Estimated: 12-17 hours)

#### Smart Features (4-6 hours)
- [ ] Create `idGenerator.ts` utility
- [ ] Implement auto-dialogue-ID generation
- [ ] Create `emotionSuggestions.ts` utility
- [ ] Implement emotion-category suggestions
- [ ] Add suggestion highlights in UI
- [ ] Create `characterTemplate.ts` utility
- [ ] Implement 5 character templates
- [ ] Add template selector to UI

#### Bulk Operations (3-4 hours)
- [ ] Add bulk selection checkboxes
- [ ] Implement bulk emotion application
- [ ] Implement bulk story beat changes
- [ ] Add bulk delete with confirmation
- [ ] Add select all/none functionality

#### Advanced Validation (2-3 hours)
- [ ] Add emotion-category pairing validation
- [ ] Implement category distribution analysis
- [ ] Add story beat coverage analysis
- [ ] Create visual coverage charts
- [ ] Add "Fix All" suggestions

#### Export Formats (2-3 hours)
- [ ] Implement export to Markdown
- [ ] Implement export to CSV
- [ ] Implement validation report export
- [ ] Add export format selector
- [ ] Add "Export All" option

#### UI Enhancements (1-2 hours)
- [ ] Add keyboard shortcuts
- [ ] Implement auto-save draft
- [ ] Add undo/redo functionality
- [ ] Improve mobile responsiveness
- [ ] Add tooltips and help text
- [ ] Implement dark mode support

---

### Phase 3: Advanced Features (Future)

#### Text Import Parser
- [ ] Design text format specification
- [ ] Implement parser for formatted text
- [ ] Add preview before import
- [ ] Handle parsing errors gracefully

#### Story Event Creator
- [ ] Design story event UI
- [ ] Implement multi-character dialogue
- [ ] Add sequence management
- [ ] Create story event preview

#### Collaboration Features
- [ ] Add version history
- [ ] Implement character comparison
- [ ] Add comment system
- [ ] Create review workflow

#### Analytics
- [ ] Track dialogue usage in-game
- [ ] Show which dialogue gets seen most
- [ ] Add character popularity metrics
- [ ] Create usage reports

---

## Future Enhancements

### 1. Story Event Creator
Similar tool for creating multi-character dialogue sequences:
- Timeline editor for dialogue sequences
- Multi-character management
- Trigger condition builder
- Branching dialogue paths
- Preview with multiple characters

### 2. Dialogue Testing Mode
In-app dialogue simulator:
- Test dialogue in mock game environment
- Simulate different story beats
- Test character retirement
- Preview dialogue selection randomization
- Debug dialogue availability

### 3. Character Relationship Editor
Visual relationship graph:
- Node-based character network
- Define relationships between characters
- Set relationship evolution over story
- Visualize character groups
- Track character interactions

### 4. AI Writing Assistant
AI-powered dialogue suggestions:
- Generate dialogue based on character traits
- Suggest emotion tags for written text
- Check for tone consistency
- Expand or condense dialogue text
- Generate variations of existing dialogue

### 5. Translation Management
Multi-language support:
- Side-by-side translation editor
- Translation status tracking
- Character count validation per language
- Export/import translation files
- Integration with translation services

### 6. Voice Preview
Text-to-speech integration:
- Preview dialogue with voice
- Assign voice profiles to characters
- Test dialogue pacing
- Export audio for game integration

### 7. Dialogue Analytics Dashboard
In-game usage tracking:
- Which dialogue gets shown most
- Character appearance frequency
- Story beat progression tracking
- Player engagement metrics
- A/B testing different dialogue

### 8. Version Control Integration
Git-based workflow:
- Commit characters directly from UI
- View character history
- Compare versions visually
- Merge conflict resolution
- Branch management

### 9. Batch Character Management
Manage multiple characters:
- Grid view of all characters
- Bulk operations across characters
- Search and filter characters
- Export character collection
- Import character pack

### 10. Dialogue Quality Analyzer
Advanced quality checks:
- Readability scoring
- Vocabulary analysis
- Tone consistency checking
- Reading level calculation
- Character voice consistency

---

## Design Mockups Reference

### Color Scheme

```css
:root {
  /* Primary Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;

  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Neutral Colors */
  --color-bg: #ffffff;
  --color-bg-secondary: #f3f4f6;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-secondary: #6b7280;

  /* Character Count Colors */
  --color-count-good: #10b981;
  --color-count-warning: #f59e0b;
  --color-count-exceeded: #ef4444;
}
```

### Typography

```css
/* Headings */
h1 { font-size: 2rem; font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; }
h3 { font-size: 1.25rem; font-weight: 600; }

/* Body */
body { font-size: 1rem; line-height: 1.5; }
.helper-text { font-size: 0.875rem; color: var(--color-text-secondary); }
.error-message { font-size: 0.875rem; color: var(--color-error); }

/* Code/IDs */
.character-id { font-family: monospace; background: #f3f4f6; padding: 2px 6px; }
```

### Spacing

```css
/* Consistent spacing scale */
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
```

---

## Notes for Future Implementation

### Performance Considerations
- Use React.memo for expensive components
- Debounce validation checks (300ms delay)
- Lazy load character portraits
- Virtualize long dialogue entry lists
- Cache validation results

### Accessibility
- All form fields must have labels
- Use semantic HTML elements
- ARIA labels for complex interactions
- Keyboard navigation for all features
- Focus management for modals
- Color contrast ratios meet WCAG AA

### Browser Compatibility
- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum: ES2020 JavaScript features
- CSS Grid and Flexbox for layouts
- Progressive enhancement for older browsers

### Security Considerations
- Sanitize all file uploads
- Validate JSON structure server-side
- Prevent directory traversal in file paths
- Rate limit API endpoints
- Add CSRF protection for save operations

### Testing Strategy
- Unit tests for validation functions
- Integration tests for state management
- E2E tests for critical workflows
- Visual regression tests for UI
- Performance tests for large characters

---

## Resources

### Related Files
- **Dialogue Types:** `lib/dialogue/types.ts`
- **Dialogue Manager:** `lib/dialogue/DialogueManager.ts`
- **Dialogue Hook:** `hooks/dialogue/useDialogue.ts`
- **Config:** `public/data/dialogue-config.json`
- **Character Files:** `public/data/characters/*.json`

### Documentation
- Next.js App Router: https://nextjs.org/docs/app
- React Hooks: https://react.dev/reference/react
- TypeScript: https://www.typescriptlang.org/docs

### Design Inspiration
- GitHub Issues UI
- WordPress Block Editor
- Notion Database Editor
- Airtable Interface

---

## Contact & Questions

For questions about this design document or implementation guidance:

1. Review the existing dialogue system files first
2. Check the validation rules for requirements
3. Refer to character templates for examples
4. Test changes with existing character files

---

**End of Design Document**

Last Updated: 2025-11-18
Version: 1.0.0
Status: Ready for Implementation
