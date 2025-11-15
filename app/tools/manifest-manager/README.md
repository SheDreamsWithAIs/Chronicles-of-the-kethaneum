# Manifest Manager

**Access:** `http://localhost:3000/tools/manifest-manager`

A Next.js-based content management system for organizing and managing game data files across multiple systems (puzzles, characters, items, etc.).

## Overview

The Manifest Manager is designed to support a **modular game content architecture** that allows you to:
- Organize content by system (puzzles, characters, items, etc.)
- Create and manage manifest files for different game systems
- Easily swap content between games
- Navigate folder hierarchies
- Maintain clean separation of concerns

## Key Features

### 📁 Folder Navigation
- **Breadcrumb Navigation**: Click through folder paths with ease
- **Visual Folder Cards**: Folders displayed as clickable cards
- **Create New Folders**: Organize content by creating subdirectories
- **Navigate Anywhere**: Browse through `/public/data/` and all subdirectories

### 📋 Multiple Manifest Support
- **Any Manifest Type**: Create `genreManifest.json`, `characterManifest.json`, `itemManifest.json`, etc.
- **Folder-Specific**: Each folder can have its own set of manifests
- **Sidebar Display**: Active manifests shown in the sidebar for quick access
- **Automatic Detection**: Manifest files (ending in `Manifest.json`) are automatically recognized
- **Visual Editor**: Add/remove files from manifests with a visual interface

### 📄 File Management
- **Content Type Detection**: Automatically identifies file types (puzzles, characters, generic)
- **Color-Coded Display**: Different file types have distinct visual indicators
  - 🟢 Green = Puzzle data
  - 🔴 Red = Character data
  - 🟡 Yellow = Generic/unknown data
- **Quick Preview**: View file contents in a modal window
- **Delete Files**: Remove files with confirmation
- **Create Files**: New files with template structures based on content type

### ⚙️ Content Types

The tool supports multiple content types with appropriate templates:

**Puzzle Data:**
```json
[
  {
    "title": "Sample Puzzle - Part 1",
    "book": "Sample Book",
    "storyPart": 0,
    "genre": "New Genre",
    "words": ["sample", "words", "here"],
    "storyExcerpt": "Story text..."
  }
]
```

**Character Data:**
```json
[
  {
    "name": "Sample Character",
    "role": "NPC",
    "description": "Character description"
  }
]
```

**Manifest Files:**
```json
{
  "files": []
}
```

## How to Use

### Accessing the Tool

1. **Start the development server**: Run `npm run dev` from the project root
2. **Open your browser**: Navigate to `http://localhost:3000/tools`
3. **Select Manifest Manager**: Click the Manifest Manager card
4. **You'll see**: The root `/data/` folder with all existing files

### Creating a Content System

Let's say you want to add a character system to your game:

1. **Create a folder**:
   - Click "📁 New Folder"
   - Enter name: `characters`
   - Click "Create Folder"

2. **Navigate into folder**:
   - Click the `characters` folder card
   - You're now in `/data/characters/`

3. **Create a manifest**:
   - Click "📋 New Manifest"
   - Enter name: `character` (will create `characterManifest.json`)
   - Click "Create Manifest"

4. **Create character files**:
   - Click "📄 New File"
   - Enter filename: `npcs.json`
   - Select content type: "Character Data"
   - Click "Create File"

5. **Add files to manifest**:
   - Click the manifest name in the sidebar to open it
   - Click "Add" button next to files you want to include
   - Click "💾 Save Manifest" when done

6. **Edit file contents**:
   - Click "👁️ View" to preview contents
   - Edit files manually in your code editor
   - Refresh the tool to see updates

### Navigating the Project

- **Breadcrumbs**: Click any part of the path to jump to that folder
- **Folders**: Displayed as visual cards at the top
- **Files**: Listed below with metadata and action buttons
- **Sidebar**: Shows manifests in the current folder
- **Manifest Editor**: When a manifest is selected, files in the manifest are highlighted

## File Organization

The tool supports this structure:

```
/public/data/
├── genreManifest.json          # Main puzzle manifest
├── kethaneumPuzzles.json       # Puzzle files
├── naturePuzzles.json
├── /characters/                 # Character system folder
│   ├── characterManifest.json  # Character manifest
│   ├── npcs.json               # NPC data
│   └── protagonists.json       # Main character data
├── /items/                      # Item system folder
│   ├── itemManifest.json       # Item manifest
│   ├── weapons.json            # Weapon data
│   └── consumables.json        # Consumable items
└── /environments/               # Environment system folder
    ├── environmentManifest.json
    └── locations.json
```

## Modular Content Architecture

This tool is designed to support **swappable game content**:

### Benefits

1. **System Separation**: Each game system (puzzles, characters, items) has its own folder and manifest
2. **Content Reusability**: Copy entire folders between games
3. **Clean Organization**: No mixing of different content types
4. **Easy Maintenance**: Update one system without affecting others
5. **Scalability**: Add new systems without modifying existing code

### Example: Swapping Puzzle Sets

To use different puzzles in a game:

1. Create puzzle sets in separate folders
2. Each set has its own manifest
3. Point your game loader to different manifests
4. Swap content by changing manifest references

```
/public/data/
├── /puzzles-fantasy/
│   ├── genreManifest.json
│   └── (fantasy puzzle files)
├── /puzzles-scifi/
│   ├── genreManifest.json
│   └── (sci-fi puzzle files)
└── /puzzles-historical/
    ├── genreManifest.json
    └── (historical puzzle files)
```

## Technical Details

### Stack
- **Framework**: Next.js 14 with App Router
- **Frontend**: React with TypeScript
- **Backend**: Next.js API Routes
- **Storage**: Direct file system operations (server-side)
- **Styling**: Tailwind CSS with custom cosmic theme

### API Routes

The tool provides these REST endpoints:

- `GET /api/manifest-manager/browse?path=<path>` - Browse folder structure
- `GET /api/manifest-manager/manifest/:manifestName?path=<path>` - Get specific manifest
- `POST /api/manifest-manager/manifest/:manifestName` - Save manifest
- `GET /api/manifest-manager/file?path=<path>` - Get file contents
- `POST /api/manifest-manager/file` - Create new file
- `DELETE /api/manifest-manager/file?path=<path>` - Delete file
- `POST /api/manifest-manager/folder` - Create new folder

### Project Structure
```
app/
├── tools/
│   ├── manifest-manager/
│   │   ├── page.tsx        # Main UI component
│   │   └── README.md       # This file
│   └── page.tsx            # Tools index page
└── api/
    └── manifest-manager/
        ├── browse/route.ts              # Folder browsing
        ├── file/route.ts                # File operations
        ├── folder/route.ts              # Folder creation
        └── manifest/[manifestType]/route.ts  # Manifest operations
```

## Security Notes

**IMPORTANT**: This tool:
- Should **ONLY** be run locally during development
- Has full file system access to `/public/data/`
- Can create, modify, and delete files and folders
- Should **NEVER** be deployed to production
- Should **NEVER** be accessible to players
- Is protected by Next.js development-only routes

## Troubleshooting

**Tool won't load:**
- Ensure the Next.js development server is running (`npm run dev`)
- Check that port 3000 is not in use
- Verify you're accessing `http://localhost:3000/tools/manifest-manager`

**Can't see files:**
- Ensure `/public/data/` directory exists
- Check file permissions
- Verify files are valid JSON
- Check browser console for errors

**Can't create folders:**
- Check disk space
- Verify write permissions
- Ensure parent folder exists

**Changes not appearing:**
- Click the "🔄 Refresh" button
- Check browser console for errors
- Verify the development server is still running

**API errors:**
- Check the terminal running the dev server for error messages
- Ensure file paths are correct
- Verify JSON syntax in files

## Future Enhancements

Possible additions to this tool:

- **Direct JSON Editing**: Edit file contents within the tool
- **Drag & Drop**: Drag files into manifests or reorder them
- **File Upload**: Upload JSON files through the browser
- **Validation**: Verify file structure and content before saving
- **Templates**: More content type templates
- **Export/Import**: Package entire content systems
- **Search**: Find files by name or content
- **Bulk Operations**: Select and modify multiple files at once

---

For more information about the game architecture, see the [Genre Builder documentation](../genre-builder/README.md).
