# Game Screen Content Editor Tool

A visual editor for formatted text content files used in game screens (Backstory, Story End, etc.).

## Access

`http://localhost:3000/tools/content-editor`

## Features

### Visual Editing
- **Title Editor**: Edit the main title displayed on the screen
- **Paragraph Management**: Add, edit, and delete paragraphs
- **Segment Editor**: Fine-grained control over text segments within paragraphs

### Formatting Options
- **Bold**: Toggle bold formatting on any text segment
- **Italic**: Toggle italic formatting on any text segment
- **Color**: Choose from preset colors or use a custom color picker
- **Combinations**: Apply multiple formatting options to the same segment

### Live Preview
- **Segment Preview**: See how each segment will render in real-time
- **Paragraph Preview**: Preview the complete paragraph with all formatting
- **Full Preview**: See the entire content as it will appear in the game

### Export & Save
- **Save to File**: Save changes directly to the content JSON file
- **Copy JSON**: Copy the formatted JSON to clipboard
- **JSON Preview**: View and inspect the raw JSON structure

## Supported Content Files

| File | Path | Description |
|------|------|-------------|
| Backstory | `/data/backstory-content.json` | Opening story shown when starting the game |
| Story End | `/data/story-end-content.json` | Congratulations message at game completion |

## JSON Format

The content editor works with files in this format:

```json
{
  "title": "The Title",
  "paragraphs": [
    {
      "segments": [
        {
          "text": "Plain text"
        },
        {
          "text": "Colored text",
          "color": "#8b5cf6"
        },
        {
          "text": "Formatted text",
          "italic": true,
          "bold": true,
          "color": "#fbbf24"
        }
      ]
    }
  ]
}
```

## Preset Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#8b5cf6` | Mystical terms, "Kethaneum" |
| Gold | `#fbbf24` | Important items, "Book of Passage" |
| Blue | `#60a5fa` | Ending messages, ethereal text |
| Coral | `#ff6b6b` | Warnings, emphasis |
| Teal | `#4ecdc4` | Nature, discovery |
| Rose | `#f472b6` | Emotional moments |
| Emerald | `#34d399` | Success, achievements |
| Amber | `#f59e0b` | Warm highlights |

## Usage Tips

### Creating New Lines
Each paragraph becomes a separate `<p>` element in the rendered content. Add new paragraphs to create visual breaks and spacing.

### Inline Formatting
Use multiple segments within a single paragraph to apply different formatting to different parts of the same sentence.

**Example**: "Your *Book of Passage* awaits" would be:
```json
{
  "segments": [
    {"text": "Your "},
    {"text": "Book of Passage", "italic": true, "color": "#fbbf24"},
    {"text": " awaits"}
  ]
}
```

### Save Requirements
The Save to File feature requires the development server to be running with API routes enabled. If saving fails, you can use Copy JSON to manually update the file.

## Workflow

1. **Select Content File**: Choose which content file to edit
2. **Edit Title**: Update the main title if needed
3. **Edit Paragraphs**: Modify text content and formatting
4. **Preview**: Check the full preview to see how it looks
5. **Save**: Save changes to the file or copy JSON

## Troubleshooting

### Save Not Working
- Ensure the Next.js dev server is running (`npm run dev`)
- Check that API routes are available at `/api/manifest-manager/file`
- Use "Copy JSON" as a fallback and manually update the file

### Formatting Not Showing
- Verify the text content is not empty
- Check that color values are valid CSS colors
- Ensure boolean flags are correctly set

### Preview Looks Different
- The preview uses simplified styles; actual game rendering may vary slightly
- Colors and fonts may appear differently based on the game's CSS variables

## Related Files

- **Loader**: `/lib/utils/formattedContentLoader.ts`
- **Component**: `/components/shared/FormattedBackstory.tsx`
- **Backstory Page**: `/app/backstory/page.tsx`
- **Story End Page**: `/app/story-end/page.tsx`
- **Data README**: `/public/data/README.md`
