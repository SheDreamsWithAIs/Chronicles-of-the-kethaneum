# Genre Builder Tool

A Next.js-based tool for creating and editing genre files for the Chronicles of the Kethaneum puzzle game.

## Access

Navigate to: `http://localhost:3030/tools/genre-builder`

## Features

### Three Zoom Levels
1. **File Level** - Manage overall genre file settings and view all books
2. **Book Level** - View and manage all puzzles within a specific book
3. **Puzzle Level** - Edit individual puzzle details with a comprehensive form

### Navigation
- **Breadcrumbs** - Click any level to navigate up the hierarchy
- **Sidebar** - Always-visible navigation tree showing the complete structure
- Auto-save when switching between scopes

### File Operations
- **New File** - Creates a template with 1 book containing 5 empty puzzles
- **Load File** - Import existing JSON files from your file system
- **Save to File** - Downloads the JSON file (validation required)
- **Preview JSON** - View scope-aware JSON preview (puzzle/book/file level)

### CRUD Operations
- **Create** - Add new books and puzzles
- **Read** - Navigate and view all data at any scope level
- **Update** - Edit any field with real-time validation
- **Delete** - Remove books or puzzles with confirmation

### Data Management
- **Auto-save** - Automatically saves to browser localStorage to prevent data loss
- **Validation** - Real-time validation with a summary panel
- **Genre Setting** - Set once at file level, applied to all puzzles
- **Auto-indexing** - `storyPart` automatically calculated by puzzle position

### Word Input
- Enter words as comma-separated values in a textarea
- Placeholder text explains the format
- Automatically parses and validates the word list

### Validation
- Blocks saving to file until all errors are resolved
- Allows auto-save of incomplete work to temp storage
- Clickable error navigation to jump directly to problem fields
- Required fields:
  - Title
  - Book name
  - Genre
  - At least one word
  - Story excerpt

## Workflow Examples

### Creating a New Genre File
1. Click "New File"
2. Set filename (e.g., `fantasyPuzzles.json`)
3. Set genre (e.g., `fantasy`)
4. Navigate to Book 1 and give it a name
5. Navigate to each puzzle and fill out the form:
   - Title
   - Book name (auto-populated)
   - Words (comma-separated)
   - Story excerpt
6. Click "Preview JSON" to verify structure
7. Click "Save to File" when all validations pass

### Editing an Existing File
1. Click "Load File" and select a JSON file
2. Navigate through the sidebar or breadcrumbs
3. Make your changes at any level
4. Use "Validation" button to check for errors
5. Click "Save to File" when ready

### Building a Multi-Book Genre
1. Start with the template
2. Fill out the first book and its puzzles
3. Navigate back to File level
4. Click "+ Add Book" (creates template with 5 puzzles)
5. Fill out the new book's puzzles
6. Repeat as needed

## Technical Details

### Data Structure
Each puzzle contains:
- `title` - Full title with book name and part number
- `book` - Collection name (groups puzzles into stories)
- `storyPart` - Sequential order (auto-calculated from position)
- `genre` - Genre identifier (inherited from file level)
- `words` - Array of words to find in the puzzle
- `storyExcerpt` - The story text for this puzzle part

### Storage
- **Temp Storage**: Browser localStorage (auto-save)
- **Permanent Storage**: Manual download to `/public/data/`
- Auto-save timestamp displayed in header

## Future Features
- Auto-update `genreManifest.json` when saving new genre files
- Drag-and-drop reordering of puzzles
- Import from URL
- Batch operations
- Export templates

## Notes
- The genre manifest (`/public/data/genreManifest.json`) must be updated manually for now
- All puzzles in a file share the same genre
- Story parts are 0-indexed and auto-calculated
- Validation must pass before saving to file
- Incomplete work is preserved in localStorage
