# Chronicles of the Kethaneum - Development Tools

This directory contains development tools for managing game content. These are **development-only tools** that should never be deployed to production or exposed to players.

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

## Manifest Manager

**Access:** `http://localhost:3030` (when server is running)

A modular content management system for organizing and managing game data files across multiple systems (puzzles, characters, items, etc.).

### Overview

The Manifest Manager is designed to support a **modular game content architecture** that allows you to:
- Organize content by system (puzzles, characters, items, etc.)
- Create and manage manifest files for different game systems
- Easily swap content between games
- Navigate folder hierarchies
- Maintain clean separation of concerns

### Key Features

#### 📁 Folder Navigation
- **Breadcrumb Navigation**: Click through folder paths with ease
- **Visual Folder Cards**: Folders displayed as clickable cards
- **Create New Folders**: Organize content by creating subdirectories
- **Navigate Anywhere**: Browse through `/data/` and all subdirectories

#### 📋 Multiple Manifest Support
- **Any Manifest Type**: Create `genreManifest.json`, `characterManifest.json`, `itemManifest.json`, etc.
- **Folder-Specific**: Each folder can have its own set of manifests
- **Sidebar Display**: Active manifests shown in the sidebar for quick access
- **Automatic Detection**: Manifest files (ending in `Manifest.json`) are automatically recognized

#### 📄 File Management
- **Content Type Detection**: Automatically identifies file types (puzzles, characters, generic)
- **Color-Coded Display**: Different file types have distinct visual indicators
  - 🟢 Green = Puzzle data
  - 🔴 Red = Character data
  - 🟡 Yellow = Generic/unknown data
  - 🔵 Blue = Manifest files
- **Quick Preview**: View file contents in a modal window
- **Delete Files**: Remove files with confirmation
- **Create Files**: New files with template structures based on content type

#### ⚙️ Content Types

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

### How to Use

#### Initial Setup

1. **Start the server**: Run `npm start` from the `tools/` directory
2. **Open your browser**: Navigate to `http://localhost:3030`
3. **You'll see**: The root `/data/` folder with all existing files

#### Creating a Content System

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

5. **Edit the files**:
   - Click "👁️ View" to see contents
   - Edit files manually in your code editor
   - Refresh the tool to see updates

6. **Update the manifest**:
   - Manually edit `characterManifest.json` to include your files
   - Or implement manifest editing UI (future feature)

#### Navigating the Project

- **Breadcrumbs**: Click any part of the path to jump to that folder
- **Folders**: Displayed as visual cards at the top
- **Files**: Listed below with metadata
- **Sidebar**: Shows manifests in the current folder

### File Organization

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

### API Endpoints

The tool provides these REST endpoints:

- `GET /api/browse?path=<path>` - Browse folder structure
- `GET /api/manifest/:manifestName?path=<path>` - Get specific manifest
- `POST /api/manifest/:manifestName` - Save manifest
- `GET /api/file?path=<path>` - Get file contents
- `POST /api/file` - Create new file
- `DELETE /api/file?path=<path>` - Delete file
- `POST /api/folder` - Create new folder

### Modular Content Architecture

This tool is designed to support **swappable game content**:

#### Benefits

1. **System Separation**: Each game system (puzzles, characters, items) has its own folder and manifest
2. **Content Reusability**: Copy entire folders between games
3. **Clean Organization**: No mixing of different content types
4. **Easy Maintenance**: Update one system without affecting others
5. **Scalability**: Add new systems without modifying existing code

#### Example: Swapping Puzzle Sets

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

### Security Notes

**IMPORTANT**: This tool:
- Should **ONLY** be run locally during development
- Has full file system access to `/public/data/`
- Can create, modify, and delete files and folders
- Should **NEVER** be deployed to production
- Should **NEVER** be accessible to players
- Runs on `localhost` only by default

### Troubleshooting

**Server won't start:**
- Run `npm install` first
- Check that port 3030 is not in use
- Verify you're in the `tools/` directory

**Can't see files:**
- Ensure `/public/data/` directory exists
- Check file permissions
- Verify files are valid JSON

**Can't create folders:**
- Check disk space
- Verify write permissions
- Ensure parent folder exists

**Changes not appearing:**
- Click the "🔄 Refresh" button
- Check browser console for errors
- Verify server is still running

## Technical Details

### Stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework)
- **Storage**: Direct file system operations
- **Port**: 3030 (default)

### File Organization
```
tools/
├── package.json            # Dependencies
├── server.js              # Express server with file system API
├── manifest-editor.html   # Web interface
├── .gitignore            # Excludes node_modules
└── README.md             # This file
```

### Dependencies
- `express` - Web server framework
- `cors` - Cross-origin resource sharing

## Future Enhancements

Possible additions to this tool:

- **Manifest Editing UI**: Visual interface to add/remove files from manifests
- **Drag & Drop**: Drag files into manifests
- **File Upload**: Upload JSON files through the browser
- **JSON Editor**: Edit file contents in the tool
- **Validation**: Verify file structure and content
- **Templates**: More content type templates
- **Export/Import**: Package entire content systems

---

For more information about the game data structure, see `/public/data/README.md`.
