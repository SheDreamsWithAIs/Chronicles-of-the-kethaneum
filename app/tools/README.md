# Chronicles of the Kethaneum - Development Tools

This directory contains Next.js-based development tools for managing game content. These are **development-only tools** that should never be deployed to production or exposed to players.

## Quick Start

### Starting the Development Server

```bash
# From the project root
npm run dev
```

Then navigate to: `http://localhost:3000/tools`

## Available Tools

### 📜 Story Blurb Editor

**Access:** `http://localhost:3000/tools/story-blurb-editor`

A visual editor for managing story progression blurbs that appear in the Book of Passage.

**Key Features:**
- Create, edit, and delete story blurbs
- Configure triggers (milestones, events, story beats)
- Organize blurbs by 8-beat narrative structure
- Live preview of blurb appearance
- Search and filter by story beat
- Auto-save and manual save options

**Use Cases:**
- Writing narrative blurbs for player progression
- Configuring when blurbs unlock (triggers)
- Organizing story content by narrative beats
- Testing story flow before deployment

[📚 Full Documentation](./story-blurb-editor/README.md)

---

### 📖 Genre Builder

**Access:** `http://localhost:3000/tools/genre-builder`

A comprehensive tool for creating and editing genre puzzle files with an intuitive three-level navigation system.

**Key Features:**
- File → Book → Puzzle hierarchical navigation
- Real-time validation with error reporting
- Auto-save to prevent data loss
- JSON preview and export
- Auto-indexing of story parts
- Template generation for new files

**Use Cases:**
- Creating new genre puzzle collections
- Editing existing puzzle files
- Organizing puzzles into books and story parts
- Validating puzzle data before deployment

[📚 Full Documentation](./genre-builder/README.md)

---

### 📋 Manifest Manager

**Access:** `http://localhost:3000/tools/manifest-manager`

A modular content management system for organizing game data files across multiple systems.

**Key Features:**
- Browse and navigate `/public/data/` folder structure
- Create and edit manifest files (genre, character, item, etc.)
- Visual file management with type detection
- Add/remove files from manifests
- Create new folders and files with templates
- Preview file contents

**Use Cases:**
- Organizing game content into systems
- Creating manifest files for different content types
- Managing file references in manifests
- Browsing and previewing game data
- Setting up modular content architecture

[📚 Full Documentation](./manifest-manager/README.md)

---

## Architecture Overview

### Tool Structure

```
app/
├── tools/
│   ├── page.tsx                # Tools index page
│   ├── README.md               # This file
│   ├── genre-builder/
│   │   ├── page.tsx           # Genre Builder UI
│   │   └── README.md          # Genre Builder docs
│   └── manifest-manager/
│       ├── page.tsx           # Manifest Manager UI
│       └── README.md          # Manifest Manager docs
└── api/
    └── manifest-manager/       # API routes for file operations
        ├── browse/route.ts
        ├── file/route.ts
        ├── folder/route.ts
        └── manifest/[manifestType]/route.ts
```

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Frontend**: React with TypeScript
- **Backend**: Next.js API Routes (server-side)
- **Styling**: Tailwind CSS with custom cosmic theme
- **Storage**: Direct file system operations on `/public/data/`

### Design Principles

1. **Development-Only**: Tools are only accessible during development
2. **Modular Architecture**: Support for swappable game content systems
3. **Visual Interface**: Intuitive UI for complex data management
4. **Data Validation**: Real-time validation to prevent errors
5. **File-Based Storage**: Direct manipulation of JSON files in `/public/data/`

## Workflow Examples

### Creating a New Genre

1. **Use Genre Builder**:
   - Navigate to `/tools/genre-builder`
   - Click "New File"
   - Set filename and genre
   - Fill out books and puzzles
   - Save to file

2. **Register in Manifest Manager**:
   - Navigate to `/tools/manifest-manager`
   - Open `genreManifest.json` (or create if needed)
   - Add your new genre file to the manifest
   - Save the manifest

### Organizing Content by System

1. **Create folder structure**:
   ```
   /public/data/
   ├── /characters/
   ├── /items/
   └── /environments/
   ```

2. **Create manifests for each system**:
   - `characterManifest.json`
   - `itemManifest.json`
   - `environmentManifest.json`

3. **Add content files and reference them in manifests**

4. **Update game loaders to use the new manifests**

## Data Directory Structure

```
/public/data/
├── genreManifest.json          # Main puzzle manifest
├── kethaneumPuzzles.json       # Puzzle files
├── naturePuzzles.json
├── /characters/                 # Character system (example)
│   ├── characterManifest.json
│   ├── npcs.json
│   └── protagonists.json
├── /items/                      # Item system (example)
│   ├── itemManifest.json
│   └── weapons.json
└── /environments/               # Environment system (example)
    ├── environmentManifest.json
    └── locations.json
```

## Security & Best Practices

### Security Notes

**CRITICAL**: These tools:
- Have **full file system access** to `/public/data/`
- Can **create, modify, and delete** files and folders
- Should **ONLY run during development**
- Should **NEVER be deployed** to production
- Should **NEVER be accessible** to players
- Are **not protected by authentication** (development only)

### Best Practices

1. **Always validate data** before saving to files
2. **Use the Genre Builder** for creating puzzle files (ensures correct format)
3. **Use the Manifest Manager** for organizing content (prevents broken references)
4. **Keep backups** of important data files
5. **Test in development** before deploying to production
6. **Review JSON output** before saving to ensure correctness

### Development Workflow

1. Create/edit content using the tools
2. Validate the data structure
3. Save files to `/public/data/`
4. Test in the game during development
5. Commit validated files to version control
6. Deploy only the data files (not the tools) to production

## Troubleshooting

### Tools won't load
- Ensure Next.js dev server is running: `npm run dev`
- Check that port 3000 is available
- Navigate to `http://localhost:3000/tools`

### Can't save files
- Check disk space and file permissions
- Ensure `/public/data/` directory exists
- Verify JSON syntax is correct
- Check browser console and terminal for errors

### Changes not appearing
- Click refresh buttons in the tools
- Check that files were saved correctly
- Verify file paths are correct
- Clear browser cache if needed

### API errors
- Check terminal running dev server for errors
- Ensure file paths don't have special characters
- Verify JSON is valid before saving
- Check file permissions on `/public/data/`

## Future Enhancements

Potential improvements to these tools:

- **Direct JSON Editor**: Edit file contents within the tools
- **Drag & Drop**: Reorder items visually
- **Import/Export**: Bulk operations for content
- **Version Control**: Track changes to data files
- **Collaboration**: Multi-user editing support
- **Templates**: More content type templates
- **Search**: Full-text search across all data files
- **Diff Viewer**: Compare file versions
- **Validation Rules**: Custom validation for different content types

## Additional Resources

- [Genre Builder Documentation](./genre-builder/README.md)
- [Manifest Manager Documentation](./manifest-manager/README.md)
- [Game Data Structure Documentation](/public/data/README.md) *(if exists)*

---

**Note**: These tools are part of the Chronicles of the Kethaneum development workflow. They provide a user-friendly interface for managing game content without directly editing JSON files, reducing errors and improving productivity.
