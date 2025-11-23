# Game Data System

This directory contains all data files for the Chronicles of the Kethaneum game, including puzzle data and backstory content.

## File Structure

### Backstory Content (`backstory-content.json`)

The `backstory-content.json` file contains the text content displayed on the backstory screen when the game starts. This file supports rich text formatting including colors, italics, and bold text.

**Format:**
```json
{
  "title": "The Kethaneum",
  "paragraphs": [
    {
      "segments": [
        {
          "text": "Plain text content"
        },
        {
          "text": "Italicized text",
          "italic": true
        },
        {
          "text": "Bold text",
          "bold": true
        },
        {
          "text": "Colored text",
          "color": "#ff6b6b"
        },
        {
          "text": "Combination",
          "italic": true,
          "bold": true,
          "color": "#4ecdc4"
        }
      ]
    }
  ]
}
```

**Structure:**
- `title`: The title displayed at the top of the backstory screen
- `paragraphs`: An array of paragraph objects, each containing:
  - `segments`: An array of text segments with optional formatting

**Text Segment Properties:**
- `text` (required): The text content to display
- `italic` (optional): Set to `true` to italicize the text
- `bold` (optional): Set to `true` to make the text bold
- `color` (optional): A CSS color value (hex, rgb, or named color) to color the text

**How to update:**
1. Open `public/data/backstory-content.json`
2. Modify the `title` field to change the backstory title
3. Edit the `paragraphs` array to change the content
4. Add or modify `segments` within paragraphs to apply formatting
5. Save the file - changes will appear automatically on the backstory screen

**Tips:**
- Each paragraph creates a new `<p>` tag with appropriate spacing
- Segments within a paragraph flow together without line breaks
- Use multiple segments in a paragraph to apply different formatting to different parts
- Colors can be hex codes (`#ff6b6b`), RGB values (`rgb(255, 107, 107)`), or named colors (`red`)
- New lines are created by adding new paragraph objects to the array

### Story End Content (`story-end-content.json`)

The `story-end-content.json` file contains the congratulations message displayed when a player completes the game. It uses the same format as the backstory content.

**Format:** Same as `backstory-content.json` (see above)

**Usage:**
- Displayed on the `/story-end` page when the game is completed
- Shows a congratulatory message with the same rich formatting support
- Can include colored text for emphasis (e.g., "Archivist", "Kethaneum")

**Example:**
```json
{
  "title": "Journey Complete",
  "paragraphs": [
    {
      "segments": [
        {"text": "Congratulations, "},
        {"text": "Archivist", "color": "#fbbf24", "italic": true},
        {"text": "."}
      ]
    }
  ]
}
```

### Editing Content Files

Both `backstory-content.json` and `story-end-content.json` can be edited:

1. **Manually**: Edit the JSON files directly in any text editor
2. **Visual Editor**: Use the Content Editor tool at `/tools/content-editor` during development

The Content Editor provides:
- Visual paragraph and segment management
- Color picker with preset colors
- Bold and italic toggles
- Live preview of formatted text
- JSON export and save functionality

### Genre Manifest (`genreManifest.json`)

The `genreManifest.json` file is a configuration file that lists all puzzle genre files that should be loaded by the game. This manifest system allows you to add or remove genre files without modifying the TypeScript code.

**Format:**
```json
{
  "genreFiles": [
    "/data/kethaneumPuzzles.json",
    "/data/naturePuzzles.json",
    "/data/testPuzzles.json"
  ]
}
```

**How it works:**
- The game loader reads this manifest file on startup
- Each file path listed in `genreFiles` will be loaded
- The genre name is automatically extracted from the `genre` field in each puzzle's JSON data
- If the manifest file fails to load, the game falls back to a default set of files

**To add a new genre:**
1. Create your puzzle JSON file (e.g., `myNewGenre.json`)
2. Add the file path to `genreManifest.json`:
   ```json
   {
     "genreFiles": [
       "/data/kethaneumPuzzles.json",
       "/data/naturePuzzles.json",
       "/data/myNewGenre.json"
     ]
   }
   ```
3. The new genre will automatically appear in the genre selection modal

**To remove a genre:**
- Simply remove the file path from the `genreFiles` array in `genreManifest.json`

### Puzzle Files

Each puzzle file should be a JSON array containing puzzle objects. The genre name is extracted from the `genre` field in each puzzle.

**Puzzle File Format:**
```json
[
  {
    "title": "Puzzle Title - Part 1",
    "book": "Book Name",
    "storyPart": 0,
    "genre": "Genre Name",
    "words": ["word1", "word2", "word3"],
    "storyExcerpt": "A brief excerpt from the story..."
  }
]
```

**Required Fields:**
- `title`: The puzzle title
- `book`: The book this puzzle belongs to
- `storyPart`: The part number in the book (0-based index)
- `genre`: The genre name (must match across all puzzles in the same file)
- `words`: Array of words to find in the puzzle
- `storyExcerpt`: Text excerpt shown to the player

**Important Notes:**
- All puzzles in a single file should have the same `genre` value
- The genre name from the JSON file is what appears in the genre selection modal
- If multiple files have the same genre name, their puzzles will be merged together
- Files are loaded in parallel for better performance

## Troubleshooting

**Genres not appearing in the modal:**
1. Check that the file path in `genreManifest.json` is correct
2. Verify the JSON file is valid JSON
3. Ensure the file has at least one puzzle with a `genre` field
4. Check the browser console for loading errors

**Duplicate genres:**
- If multiple files have the same `genre` value, they will be merged
- To keep them separate, use different genre names in each file

**File not loading:**
- Verify the file path starts with `/data/`
- Check that the file exists in the `public/data/` directory
- Ensure the file is included in the build (Next.js static export)

