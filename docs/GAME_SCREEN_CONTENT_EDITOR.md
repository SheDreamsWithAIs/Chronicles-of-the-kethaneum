# Game Screen Content Editor Documentation

## Overview

The Game Screen Content Editor is a WYSIWYG (What You See Is What You Get) tool for editing formatted text content used in game screens like the Backstory and Story End pages. It allows content creators to edit text with formatting (bold, italic, colors) without needing to manually edit JSON files.

## Architecture

1. **ContentEditorPage** (`app/tools/content-editor/page.tsx`) - Main editor component with WYSIWYG editing, formatting toolbar, and autosave
2. **File API Route** (`app/api/manifest-manager/file/route.ts`) - API endpoint for reading and saving content files
3. **Content Loader** (`lib/utils/formattedContentLoader.ts`) - Utility for loading formatted content in game pages

## File Structure

```
app/
├── tools/
│   └── content-editor/
│       └── page.tsx          # Editor tool page
├── api/
│   └── manifest-manager/
│       └── file/
│           └── route.ts      # File CRUD API
public/
└── data/
    ├── backstory-content.json    # Backstory screen content
    └── story-end-content.json    # Story end screen content
```

## Features

### WYSIWYG Text Editing

The editor uses a `contentEditable` div that allows natural text editing. What you type and format is exactly what appears in the game.

- Type text naturally as you would in any text editor
- Two blank lines (press Enter twice) creates a new paragraph
- Formatting is applied to selected text using the toolbar

### Formatting Toolbar

| Button | Shortcut | Description |
|--------|----------|-------------|
| **Undo** | Ctrl+Z | Undo the last change |
| **B** | Ctrl+B | Toggle bold on selected text |
| **I** | Ctrl+I | Toggle italic on selected text |
| **Color Dropdown** | - | Apply preset colors (Purple, Gold, Blue, etc.) |
| **Color Picker** | - | Apply custom color to selected text |
| **Clear Format** | - | Remove all formatting from selected text |

### Autosave

Changes are automatically saved 2 seconds after you stop typing. Visual indicators show the save status:

- **"(unsaved changes)"** - Yellow text appears when you have pending changes
- **"Autosaved!"** - Blue message confirms automatic save completed
- **"Saved successfully!"** - Green message confirms manual save completed

### JSON Preview

The right panel shows a live preview of the JSON structure that will be saved. This updates in real-time as you edit, showing exactly how your formatted text translates to the underlying data format.

### Copy JSON

Click the **Copy JSON** button to copy the current JSON to your clipboard for backup or manual editing.

## Content File Format

Content files use a JSON structure with paragraphs and segments:

```json
{
  "title": "The Kethaneum",
  "paragraphs": [
    {
      "segments": [
        { "text": "The " },
        { "text": "Kethaneum", "color": "#8b5cf6" },
        { "text": " exists in the spaces between worlds..." }
      ]
    },
    {
      "segments": [
        { "text": "Another paragraph with ", "bold": true },
        { "text": "mixed formatting", "italic": true, "color": "#fbbf24" }
      ]
    }
  ]
}
```

### Segment Properties

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | The text content (required) |
| `color` | string | Hex color code (e.g., "#8b5cf6") |
| `bold` | boolean | Whether text is bold |
| `italic` | boolean | Whether text is italicized |

## API Endpoints

### GET /api/manifest-manager/file

Read a content file.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | File path relative to `public/data/` |

### PUT /api/manifest-manager/file

Update an existing content file.

**Request Body:**

```json
{
  "path": "backstory-content.json",
  "content": "{ ... JSON string ... }"
}
```

**Response:**

```json
{
  "success": true,
  "path": "backstory-content.json"
}
```

## Common Workflows

### Editing Backstory Content

1. Navigate to `/tools/content-editor`
2. Click the **Backstory** card to load the content
3. Edit the title in the Title field
4. Edit the body text in the content editor
5. Select text and use toolbar buttons to apply formatting
6. Wait for autosave or click **Save Now**

### Adding Colored Text

1. Type or select the text you want to color
2. Choose a preset from the color dropdown, OR
3. Click the color picker and choose a custom color
4. The color is applied immediately

### Creating Paragraphs

1. Position your cursor where you want a new paragraph
2. Press Enter twice to create a blank line
3. The editor automatically splits content into separate paragraphs in the JSON

### Removing Formatting

1. Select the formatted text
2. Click **Clear Format** to remove all formatting
3. The text returns to default styling

## Supported Content Files

| File | Path | Used By |
|------|------|---------|
| Backstory | `/data/backstory-content.json` | `/backstory` page |
| Story End | `/data/story-end-content.json` | `/story-end` page |

## Development Notes

- The editor uses `document.execCommand()` for formatting, which handles browser-native rich text editing
- HTML from the contentEditable div is parsed and converted to the JSON segment structure on save
- Adjacent segments with identical formatting are automatically merged to keep the JSON clean
- The editor requires the Next.js dev server running to save files (API routes must be available)
- Files are stored in `public/data/` so they're accessible via HTTP GET in production
