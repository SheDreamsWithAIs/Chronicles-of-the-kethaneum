# Puzzle Data System

This directory contains all puzzle data files for the Chronicles of the Kethaneum game.

## File Structure

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

