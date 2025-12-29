# Story Blurb Editor

A visual editor for managing story progression blurbs and trigger configurations in Chronicles of the Kethaneum.

## Access

```
http://localhost:3000/tools/story-blurb-editor
```

## Overview

The Story Blurb Editor provides a user-friendly interface for:
- Creating and editing story blurbs
- Configuring trigger conditions
- Organizing blurbs by story beat
- Previewing how blurbs will appear in-game

## Features

### Blurb Management
- **Add Blurbs**: Create new story blurbs with one click
- **Edit Blurbs**: Modify title, text, trigger, story beat, and order
- **Delete Blurbs**: Remove unwanted blurbs with confirmation
- **Duplicate Blurbs**: Copy existing blurbs as a starting point
- **Search & Filter**: Find blurbs by text, title, or filter by story beat

### Trigger Configuration
- **Preset Triggers**: Choose from 25+ built-in trigger types
- **Milestone Triggers**: Books discovered, puzzles completed, etc.
- **Event Triggers**: First completions, Kethaneum reveals, etc.
- **Story Beat Triggers**: Narrative progression events
- **Custom Triggers**: Support for custom trigger IDs

### Story Beat Organization
The editor organizes blurbs by the 8-beat narrative structure:

1. **Hook** - Introduction and early discoveries
2. **First Plot Point** - Major revelation, Kethaneum revealed
3. **First Pinch Point** - Mystery deepens, tension rises
4. **Midpoint** - Major milestone, turning point
5. **Second Pinch Point** - Stakes raised, danger revealed
6. **Second Plot Point** - Final preparation
7. **Climax** - Confrontation with main challenge
8. **Resolution** - Victory, new beginning

### Visual Preview
- See how blurbs will appear in the Book of Passage
- Preview updates in real-time as you type

### Data Management
- **Auto-save**: Changes saved automatically after 2 seconds
- **Manual Save**: Save button for immediate persistence
- **Copy JSON**: Export the full JSON for backup or review

## Data File

The editor reads and writes to:
```
/public/data/story-progress.json
```

### File Structure

```json
{
  "version": 1,
  "triggerConfig": {
    "allowMultiplePerTrigger": false,
    "defaultStoryBeat": "hook",
    "milestones": {
      "booksDiscovered": [5, 10, 25, 50, 100],
      "puzzlesComplete": [10, 25, 50, 100],
      "booksComplete": [5, 10, 25]
    }
  },
  "blurbs": [
    {
      "id": "intro_001",
      "storyBeat": "hook",
      "trigger": "game_start",
      "title": "A New Beginning",
      "text": "The pages of your Book of Passage shimmer...",
      "order": 1,
      "metadata": {
        "lastUpdated": "2025-11-23T00:00:00.000Z",
        "tags": ["introduction", "opening"]
      }
    }
  ]
}
```

## Available Triggers

### Start Triggers
- `game_start` - When the game first starts

### Discovery Triggers
- `first_book_discovered` - First book added to collection
- `books_discovered_5/10/25/50/100` - Milestone book discoveries

### Completion Triggers
- `first_puzzle_complete` - First puzzle solved
- `first_book_complete` - First book fully completed
- `puzzles_complete_10/25/50/100` - Milestone puzzle completions
- `books_complete_5/10/25` - Milestone book completions

### Kethaneum Triggers
- `kethaneum_genre_revealed` - Kethaneum genre unlocked
- `kethaneum_first_puzzle` - First Kethaneum puzzle started
- `kethaneum_book_complete` - Kethaneum book completed

### Story Beat Triggers
- `story_beat_first_plot_point`
- `story_beat_first_pinch_point`
- `story_beat_midpoint`
- `story_beat_second_pinch_point`
- `story_beat_second_plot_point`
- `story_beat_climax`
- `story_beat_resolution`

### Genre Triggers
- `genre_first_complete` - First genre fully completed
- `genre_mastered` - Genre mastered (all books complete)

## Workflow

### Adding a New Story Blurb

1. Open the Story Blurb Editor
2. Click "Add Blurb"
3. Fill in the fields:
   - **ID**: Unique identifier (auto-generated, can customize)
   - **Title**: Display title shown in Book of Passage
   - **Story Beat**: Which narrative section this belongs to
   - **Trigger**: What unlocks this blurb
   - **Order**: Sort order within the story beat
   - **Text**: The narrative content
   - **Tags**: Optional categorization tags
4. Review the preview
5. Click "Save" or wait for auto-save

### Editing Existing Blurbs

1. Use the search or filter to find the blurb
2. Click on the blurb in the list
3. Edit fields in the right panel
4. Changes auto-save after 2 seconds

### Organizing Blurbs

- Use the Story Beat dropdown to filter by narrative section
- Adjust "Order" values to control sequence within a beat
- Use tags for additional organization and searchability

## Best Practices

1. **Use Descriptive IDs**: `hook_first_discovery` is better than `blurb_001`
2. **Match Story Beat to Trigger**: Keep triggers and beats aligned
3. **Order by Narrative Flow**: Lower order values appear first
4. **Write Evocative Text**: Use italics and descriptive language
5. **Tag Consistently**: Use tags like `milestone`, `achievement`, `mystery`
6. **Test Triggers**: Verify blurbs unlock at the right moments

## Integration

The Story Blurb Editor works with:

- **Book of Passage** (`/book-of-passage`): Displays unlocked blurbs
- **Story Progress Manager** (`lib/story/storyProgressManager.ts`): Checks triggers
- **Game State** (`lib/game/state.ts`): Stores player's story progress
- **Game Mode Handlers** (`hooks/useGameModeHandlers.ts`): Triggers on puzzle wins

## Troubleshooting

### Changes Not Saving
- Ensure the dev server is running with API routes
- Check browser console for errors
- Verify `/public/data/` has write permissions

### Blurbs Not Appearing In-Game
- Check the trigger conditions match game state
- Verify the story beat allows the trigger
- Clear localStorage and test from fresh state

### Preview Not Matching Game
- The preview is an approximation
- Check actual Book of Passage page for final appearance

## Security Note

This tool is for **development only** and should never be deployed to production or made accessible to players.
