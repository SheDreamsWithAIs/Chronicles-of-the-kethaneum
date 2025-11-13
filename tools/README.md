# Chronicles of the Kethaneum - Development Tools

This directory contains development tools to help manage the game project. These are **development-only tools** that should never be deployed to production or exposed to players.

## Getting Started

### Installation

First, install the required dependencies:

```bash
cd tools
npm install
```

### Starting the Development Server

```bash
npm start
```

The server will start on `http://localhost:3030`

## Manifest Editor

**Access:** `http://localhost:3030` (when server is running)

A powerful web-based GUI tool for managing puzzle data files and the manifest system.

### Features

#### File Management
- **View All Files**: Automatically scans and displays all JSON files in `/public/data/`
- **File Status Indicators**:
  - 🟢 Green = File is in the manifest and will be loaded by the game
  - 🟡 Yellow = File exists but is not in the manifest
  - 🔵 Blue = The manifest file itself
- **Statistics Dashboard**: Shows total files, manifest status, and puzzle counts

#### Manifest Operations
- **Add to Manifest**: Click to add any file to the manifest with one click
- **Remove from Manifest**: Remove files from the manifest
- **Automatic Saving**: Changes are saved directly to `/public/data/genreManifest.json`
- **View JSON**: Preview the raw manifest JSON
- **Copy to Clipboard**: Copy manifest JSON for manual editing

#### Create New Files
- **Create Puzzle Files**: Create new puzzle JSON files with a template structure
- **Genre Setup**: Specify the genre name when creating files
- **Automatic Template**: New files include a sample puzzle structure

#### Delete Files
- **Safe Deletion**: Permanently delete puzzle files with confirmation
- **Automatic Cleanup**: Files are automatically removed from manifest when deleted
- **Protection**: Cannot delete the manifest file itself

#### Preview Files
- **Quick View**: See puzzle contents without opening files
- **Metadata Display**: Shows genre, puzzle count, books, etc.
- **Raw JSON View**: View the actual JSON structure

### How to Use

1. **Start the server** (see above)

2. **Open the tool** in your web browser:
   ```
   http://localhost:3030
   ```

3. **Managing the Manifest:**
   - All files in `/public/data/` are automatically detected
   - Files highlighted in green are already in the manifest
   - Click "Add to Manifest" on yellow files to include them
   - Click "Remove from Manifest" to exclude files
   - Changes save automatically to `genreManifest.json`

4. **Creating New Puzzle Files:**
   - Enter a filename (must end with `.json`)
   - Enter the genre name
   - Click "Create File"
   - The file is created in `/public/data/` with a template puzzle
   - Edit the file manually to add your puzzles

5. **Deleting Files:**
   - Click the "Delete File" button
   - Confirm the deletion
   - File is permanently removed from disk and manifest

6. **Viewing Files:**
   - Click "View" to see file contents in a modal
   - Shows puzzle metadata and raw JSON

### File Structure Requirements

All puzzle files must follow this structure:

```json
[
  {
    "title": "Puzzle Title - Part 1",
    "book": "Book Name",
    "storyPart": 0,
    "genre": "Genre Name",
    "words": ["word1", "word2", "word3"],
    "storyExcerpt": "Story text here..."
  }
]
```

**Important:**
- All puzzles in a file should have the same `genre` value
- The `genre` field determines how the file appears in the game
- `storyPart` is a 0-based index for story progression

### Manifest File Format

The `genreManifest.json` file structure:

```json
{
  "genreFiles": [
    "/data/file1.json",
    "/data/file2.json",
    "/data/file3.json"
  ]
}
```

- Only files listed in `genreFiles` are loaded by the game
- Paths must start with `/data/`
- Order in the array doesn't affect game behavior

### API Endpoints

The tool exposes these REST API endpoints (for advanced usage):

- `GET /api/scan-files` - List all JSON files in data directory
- `GET /api/manifest` - Get current manifest
- `POST /api/manifest` - Save manifest changes
- `GET /api/file/:filename` - Get file contents
- `POST /api/file` - Create new file
- `PUT /api/file/:filename` - Update file
- `DELETE /api/file/:filename` - Delete file

### Security Notes

**IMPORTANT**: This tool:
- Should **ONLY** be run locally during development
- Has full file system access to `/public/data/`
- Can create, modify, and delete puzzle files
- Should **NEVER** be deployed to production
- Should **NEVER** be accessible to players
- Runs on `localhost` only by default

### Troubleshooting

**Server won't start:**
- Make sure you ran `npm install` first
- Check that port 3030 is not in use
- Verify you're in the `tools/` directory

**Can't see files:**
- Make sure the `/public/data/` directory exists
- Check file permissions
- Verify files are valid JSON

**Changes not saving:**
- Check server console for errors
- Verify write permissions on `/public/data/`
- Make sure the server is still running

**File creation fails:**
- Ensure filename ends with `.json`
- Check for filename conflicts
- Verify disk space

## Future Tools

This directory can be expanded with additional development tools:

- **Character Asset Manager**: Upload and organize character images
- **Story Validator**: Check story continuity and progression
- **Puzzle Tester**: Test puzzle difficulty and word placement
- **Asset Inventory**: Track all game assets
- **Build Validator**: Verify build integrity

## Technical Details

### Stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework needed)
- **Storage**: Direct file system operations
- **Port**: 3030 (default)

### File Organization
```
tools/
├── package.json          # Dependencies
├── server.js            # Express server with API
├── manifest-editor.html # Web interface
└── README.md           # This file
```

### Dependencies
- `express` - Web server framework
- `cors` - Cross-origin resource sharing

---

For more information about puzzle data and manifests, see `/public/data/README.md`.
