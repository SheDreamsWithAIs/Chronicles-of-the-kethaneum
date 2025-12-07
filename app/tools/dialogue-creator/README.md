# Character and Banter Dialogue Creator Tool

A comprehensive web-based UI tool for creating and editing character files with banter dialogue for the Chronicles of the Kethaneum game.

## Overview

The Character and Banter Dialogue Creator Tool provides an intuitive interface for managing character files and banter dialogue data, including character information, dialogue entries, and metadata. It integrates seamlessly with the existing dialogue system and provides real-time validation, preview capabilities, and story beat management.

## Features

### Character Management
- **Character Information**: Edit character ID, name, title, description, portrait file, loading group, retirement settings, and specialties
- **Auto-ID Generation**: Automatically generates character IDs from names (updates when name changes if ID was auto-generated)
- **Loading Groups**: Select from predefined loading groups that determine when characters appear in-game
- **Retirement Settings**: Configure when characters stop appearing (by story beat or never)

### Dialogue Entry Management
- **CRUD Operations**: Create, read, update, delete, duplicate, and reorder dialogue entries
- **Category Selection**: Choose from 13 dialogue categories (general-welcome, progress-praise, lore-sharing, etc.)
- **Emotion Selection**: Multi-select from 32 emotion types with category-based suggestions
- **Story Beat Management**: Set availability windows using story beats (hook through resolution)
- **Text Validation**: Real-time validation with text length limits for mobile, tablet, and desktop

### Validation & Quality Checks
- **Real-time Validation**: Automatic validation of all fields with error, warning, and info messages
- **Text Limits**: Enforces recommended character limits from dialogue-config.json (Mobile: 120, Tablet: 200, Desktop: 300)
- **ID Uniqueness**: Ensures character and dialogue IDs are unique
- **Story Beat Logic**: Validates that "available until" comes after "available from"
- **Quality Warnings**: Alerts for minimum dialogue count, early-game availability, and emotion count recommendations

### Preview & Testing
- **Live Preview**: See how dialogue will appear in-game with character card preview
- **Story Beat Filtering**: Filter dialogue entries by story beat to test availability
- **Navigation**: Navigate through filtered dialogue entries with previous/next controls
- **Character Display**: Shows character name, title, portrait placeholder, dialogue text, emotions, and metadata

### File Operations
- **Load Existing**: Load and edit existing character files from the character manifest
- **Save**: Save character files to `public/data/characters/` and update manifest automatically
- **Import JSON**: Import character data from JSON files
- **Export JSON**: Export character data to JSON for backup or sharing
- **New Character**: Start fresh with a new character template

## File Structure

```
app/tools/dialogue-creator/
├── page.tsx                          # Main tool page
├── README.md                         # This file
├── components/
│   ├── CharacterInfoPanel.tsx       # Character metadata form
│   ├── DialogueEntryForm.tsx        # Single dialogue entry editor
│   ├── DialogueEntryList.tsx        # List of all dialogue entries
│   ├── DialoguePreview.tsx          # Live preview panel
│   ├── MetadataPanel.tsx            # Metadata form section
│   ├── ValidationPanel.tsx          # Validation results display
│   ├── EmotionSelector.tsx          # Multi-select emotion picker
│   ├── StoryBeatSelector.tsx        # Story beat dropdown
│   └── TagInput.tsx                 # Reusable tag input component
├── hooks/
│   └── useDialogueCreator.ts        # Main state management hook
├── utils/
│   ├── characterTemplate.ts         # Default character template
│   ├── validators.ts                # Validation functions
│   ├── exportUtils.ts               # JSON export/formatting
│   ├── emotionSuggestions.ts        # Emotion-category mappings
│   └── idGenerator.ts               # Auto-ID generation logic
├── types/
│   └── creator.types.ts             # Tool-specific type definitions
└── styles/
    └── dialogue-creator.module.css   # Component styles
```

## Usage

### Creating a New Character

1. Navigate to `/tools/dialogue-creator`
2. Fill in character information:
   - Character ID (auto-generated from name, or customize)
   - Name, title, description
   - Portrait file name
   - Loading group
   - Retirement settings
   - Specialties (optional tags)
3. Add dialogue entries using the "Add Entry" button
4. Configure metadata (personality traits, relationship, available screens)
5. Review validation panel for any errors or warnings
6. Click "Save Character" to save

### Editing an Existing Character

1. Click "Load Existing" button
2. Select a character from the list
3. Make your changes
4. Review validation
5. Click "Save Character"

### Dialogue Entry Management

- **Add**: Click "Add Entry" to create a new dialogue entry
- **Edit**: Click on an entry header to expand and edit
- **Duplicate**: Click the duplicate button (⎘) to copy an entry
- **Reorder**: Use up/down arrows to reorder entries
- **Delete**: Click the delete button (🗑) to remove an entry

### Validation

The tool automatically validates all fields in real-time. Check the validation panel at the bottom for:
- **Errors** (red): Must be fixed before saving
- **Warnings** (yellow): Recommendations for best practices
- **Info** (blue): Informational messages

### Preview

Use the preview panel on the right to:
- See how dialogue will appear in-game
- Filter by story beat to test availability
- Navigate through dialogue entries
- View character information and emotions

## Integration with Dialogue System

The tool integrates with the existing dialogue system:

- **Types**: Uses types from `lib/dialogue/types.ts`
- **Config**: Reads text limits from `public/data/dialogue-config.json`
- **Files**: Saves to `public/data/characters/{character-id}.json`
- **Manifest**: Updates `public/data/characters/character-manifest.json` automatically
- **API**: Uses existing `/api/manifest-manager/file` endpoint

## Character File Format

Character files follow this structure:

```json
{
  "character": {
    "id": "archivist-lumina",
    "name": "Archivist Lumina",
    "title": "Senior Archivist",
    "description": "A wise archivist...",
    "portraitFile": "lumina-portrait.svg",
    "loadingGroup": "introduction_characters",
    "retireAfter": "never",
    "specialties": ["interdimensional_cataloging"]
  },
  "banterDialogue": [
    {
      "id": "welcome-general",
      "text": "Welcome to the library...",
      "emotion": ["warm", "welcoming"],
      "category": "general-welcome",
      "availableFrom": "hook",
      "availableUntil": undefined
    }
  ],
  "metadata": {
    "personalityTraits": ["wise", "encouraging"],
    "relationshipToPlayer": "mentor-colleague",
    "availableInScreens": ["library"],
    "lastUpdated": "2025-12-06"
  }
}
```

## Technical Details

### Validation Rules

- **Character ID**: 2-50 chars, lowercase letters/numbers/hyphens only, must be unique
- **Character Name**: 2-50 chars, required
- **Title**: Max 100 chars, required
- **Description**: 20-500 chars, required
- **Dialogue Text**: 10-1000 chars, recommended limits: Mobile 120, Tablet 200, Desktop 300
- **Emotions**: 1-4 emotions required, 1-2 recommended
- **Story Beats**: Must be valid story beat, "available until" must come after "available from"

### Emotion Types

The tool supports all 32 emotion types from the dialogue system:
warm, professional, encouraging, proud, explanatory, mystical, conspiratorial, reassuring, grateful, scholarly, verbose, enthusiastic, analytical, professorial, impressed, instructional, methodical, passionate, contemplative, collaborative, intellectual, scientific, excited, theoretical, apologetic, self-aware, amused, curious, satisfied, welcoming, formal, wise

### Story Beats

The tool supports all 8 story beats:
hook, first_plot_point, first_pinch_point, midpoint, second_pinch_point, second_plot_point, climax, resolution

## Development Notes

- The tool is client-side only (`'use client'`)
- Uses React hooks for state management
- Integrates with existing API endpoints
- Follows existing tool patterns (CosmicBackground, styling)
- All validation happens client-side before saving

## Future Enhancements

Potential future improvements:
- Bulk import/export of multiple characters
- Character templates/presets
- Advanced search and filtering
- Dialogue entry templates
- Character relationship visualization
- Story beat timeline visualization
- Integration with story event system

