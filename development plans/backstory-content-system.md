# Formatted Content System - Development Plan

## Status: ✅ COMPLETED (Phase 2)

**Branch:** `claude/backstory-text-source-01V59wehphGn9mrJTXxuvKPt`
**Completion Date:** 2025-11-22
**Commits:** df8d590, d2101b6, 69a5398, a37136e

---

## Overview

This system provides a comprehensive formatted text content system for game screens, with a visual editing tool for easy content management. The system supports rich text formatting including colors, italics, bold text, and proper paragraph breaks.

**Phase 1 (Complete):** Backstory content from file
**Phase 2 (Complete):** Story End page, generic loader, visual Content Editor tool

---

## What Was Implemented

### 1. Core Files Created

#### `public/data/backstory-content.json`
- **Purpose:** Stores the backstory text content with formatting metadata
- **Location:** `/public/data/backstory-content.json`
- **Format:** JSON with title and paragraphs array
- **Features:** Supports colors, italics, bold, and combinations

**Example Structure:**
```json
{
  "title": "The Kethaneum",
  "paragraphs": [
    {
      "segments": [
        {"text": "Plain text "},
        {"text": "colored text", "color": "#8b5cf6"},
        {"text": " italic", "italic": true},
        {"text": " bold", "bold": true}
      ]
    }
  ]
}
```

#### `lib/utils/backstoryLoader.ts`
- **Purpose:** Utility to fetch and parse backstory content from JSON
- **Location:** `/lib/utils/backstoryLoader.ts`
- **Exports:**
  - `TextSegment` interface
  - `Paragraph` interface
  - `BackstoryContent` interface
  - `loadBackstoryContent()` async function
- **Features:**
  - Uses `fetchAsset()` for proper basePath handling
  - Validates content structure
  - Error handling with null return on failure

#### `components/shared/FormattedBackstory.tsx`
- **Purpose:** React component to render formatted backstory content
- **Location:** `/components/shared/FormattedBackstory.tsx`
- **Exports:**
  - `FormattedBackstory` component
  - `renderSegment()` helper function
- **Features:**
  - Renders paragraphs as `<p>` tags
  - Applies formatting via `<em>`, `<strong>`, and `<span>` with styles
  - Handles color styling via inline CSS
  - Properly keys all React elements

### 2. Modified Files

#### `app/backstory/page.tsx`
- **Changes:**
  - Added imports for `FormattedBackstory` and `loadBackstoryContent`
  - Added `backstoryContent` state variable
  - Added useEffect to load content on mount
  - Updated JSX to conditionally render `FormattedBackstory` or fallback
  - Title now sourced from content or defaults to "The Kethaneum"
- **Fallback:** Original hardcoded content displays if JSON loading fails

#### `public/data/README.md`
- **Changes:**
  - Updated title to "Game Data System" (from "Puzzle Data System")
  - Added comprehensive "Backstory Content" section
  - Documented JSON format with examples
  - Added usage instructions
  - Included tips for formatting and best practices

#### `.gitignore`
- **Changes:**
  - Added `*.tsbuildinfo` to ignore TypeScript build artifacts

---

## Phase 2: Story End Page & Content Editor

### New Files Created

#### `lib/utils/formattedContentLoader.ts`
- **Purpose:** Generic content loader for any formatted content file
- **Features:**
  - `loadFormattedContent(contentType)` - Load by predefined type ('backstory', 'story-end')
  - `loadFormattedContentFromPath(path)` - Load from custom file path
  - Enhanced validation of content structure
  - TypeScript interfaces for all content types
- **Note:** `backstoryLoader.ts` now re-exports from this file for backward compatibility

#### `public/data/story-end-content.json`
- **Purpose:** Congratulations message shown at game completion
- **Format:** Same as backstory-content.json
- **Content:** Congratulates the player for completing their journey

#### `app/story-end/page.tsx` & `story-end.module.css`
- **Purpose:** Game completion screen
- **Features:**
  - Loads content from story-end-content.json
  - Same book-style visual design as backstory
  - "Play Again" and "Return Home" buttons
  - Star symbol decorations instead of moon phases
  - Full fallback content if loading fails

#### `app/tools/content-editor/page.tsx` & `README.md`
- **Purpose:** Visual editor for formatted content files
- **Access:** `/tools/content-editor`
- **Features:**
  - File selector for backstory and story-end content
  - Title editing
  - Paragraph management (add, delete)
  - Segment editor with:
    - Text input
    - Bold toggle
    - Italic toggle
    - Color picker (presets + custom)
  - Live preview at segment, paragraph, and full document level
  - JSON preview and copy to clipboard
  - Save to file (requires dev server API)

### Modified Files

#### `app/tools/page.tsx`
- Added Content Editor tool to the tools grid
- Changed grid to 3-column layout on large screens

#### `public/data/README.md`
- Added Story End content documentation
- Added Content Editor usage section

---

## How It Works

### Content Loading Flow

1. **Page Mount** → `BackstoryScreen` component renders
2. **useEffect Trigger** → Calls `loadBackstoryContent()`
3. **Fetch** → `fetchAsset('/data/backstory-content.json')` retrieves file
4. **Parse & Validate** → JSON parsed and structure validated
5. **State Update** → `setBackstoryContent(content)` updates state
6. **Render** → `FormattedBackstory` component renders formatted content

### Formatting System

Each text segment can have:
- `text` (required): The actual text string
- `color` (optional): Any CSS color value (#hex, rgb(), named colors)
- `italic` (optional): Boolean to apply `<em>` tag
- `bold` (optional): Boolean to apply `<strong>` tag

**Rendering Priority:**
1. Text wrapped in `<strong>` if `bold: true`
2. Result wrapped in `<em>` if `italic: true`
3. Result wrapped in `<span style="color: ...">` if `color` specified

### Error Handling

- If fetch fails → console error, returns `null`
- If JSON invalid → console error, returns `null`
- If content is `null` → Fallback JSX with hardcoded content displays
- User always sees content even if system fails

---

## How to Update Backstory Content

### Simple Text Update

1. Open `public/data/backstory-content.json`
2. Find the paragraph you want to change
3. Edit the `text` field
4. Save the file
5. Refresh the page

### Adding Formatting

**To add color to existing text:**
```json
{
  "text": "Kethaneum",
  "color": "#8b5cf6"
}
```

**To make text italic:**
```json
{
  "text": "Book of Passage",
  "italic": true
}
```

**To make text bold:**
```json
{
  "text": "Important Notice",
  "bold": true
}
```

**To combine multiple formats:**
```json
{
  "text": "Emphasized and Colored",
  "italic": true,
  "bold": true,
  "color": "#fbbf24"
}
```

### Adding New Paragraphs

Add a new object to the `paragraphs` array:

```json
{
  "paragraphs": [
    {
      "segments": [{"text": "First paragraph"}]
    },
    {
      "segments": [{"text": "Second paragraph"}]
    }
  ]
}
```

### Splitting Formatting Within a Paragraph

Use multiple segments in the same paragraph:

```json
{
  "segments": [
    {"text": "Regular text followed by "},
    {"text": "colored text", "color": "#ff6b6b"},
    {"text": " and back to regular."}
  ]
}
```

---

## Technical Details

### File Locations

```
Chronicles-of-the-kethaneum/
├── app/
│   └── backstory/
│       └── page.tsx                          # Modified: Loads and renders content
├── components/
│   └── shared/
│       └── FormattedBackstory.tsx           # New: Rendering component
├── lib/
│   └── utils/
│       ├── backstoryLoader.ts               # New: Loading utility
│       └── assetPath.ts                     # Existing: Used for fetch
└── public/
    └── data/
        ├── backstory-content.json           # New: Content file
        └── README.md                        # Modified: Documentation
```

### TypeScript Interfaces

```typescript
interface TextSegment {
  text: string;
  color?: string;
  italic?: boolean;
  bold?: boolean;
}

interface Paragraph {
  segments: TextSegment[];
}

interface BackstoryContent {
  title: string;
  paragraphs: Paragraph[];
}
```

### CSS Classes Used

The component renders into the existing backstory page styles:
- `styles.storyContent` - Applied to the content container
- Default `<p>` styling from backstory.module.css
- Default `<em>` and `<strong>` styling from global CSS

---

## Future Enhancement Ideas

### Priority 1: Additional Formatting Options

**Underline Support:**
```json
{"text": "Underlined text", "underline": true}
```

**Font Size Variations:**
```json
{"text": "Large text", "size": "large"}
{"text": "Small text", "size": "small"}
```

**Implementation:**
- Add new optional properties to `TextSegment` interface
- Update `renderSegment()` function in `FormattedBackstory.tsx`
- Add corresponding CSS or inline styles

### Priority 2: Animation Support

**Fade-in Effect per Paragraph:**
```json
{
  "segments": [...],
  "animation": "fade-in",
  "delay": 500
}
```

**Implementation:**
- Add optional `animation` and `delay` to `Paragraph` interface
- Use CSS animations or Framer Motion
- Stagger paragraph appearances for dramatic effect

### Priority 3: Custom CSS Classes

**Allow custom styling:**
```json
{"text": "Styled text", "className": "mystical-glow"}
```

**Implementation:**
- Add `className` to `TextSegment` interface
- Apply className to rendered span/em/strong
- Define custom classes in backstory.module.css

### Priority 4: Link Support

**Add clickable links:**
```json
{
  "text": "Chronicles of the Kethaneum",
  "link": "/about",
  "color": "#60a5fa"
}
```

**Implementation:**
- Add `link` optional property to `TextSegment`
- Render as `<a href={segment.link}>` when present
- Use Next.js `<Link>` component for routing

### Priority 5: Gradient Text Support

**Gradient colors:**
```json
{
  "text": "Rainbow text",
  "gradient": {
    "from": "#ff6b6b",
    "to": "#4ecdc4",
    "direction": "to right"
  }
}
```

**Implementation:**
- Add `gradient` object to `TextSegment`
- Apply via `background: linear-gradient(...)` + `-webkit-background-clip: text`

### Priority 6: Multi-language Support

**Language variants:**
```json
{
  "en": {
    "title": "The Kethaneum",
    "paragraphs": [...]
  },
  "es": {
    "title": "El Kethaneum",
    "paragraphs": [...]
  }
}
```

**Implementation:**
- Update `BackstoryContent` interface to support language keys
- Add language detection/selection logic
- Modify `loadBackstoryContent()` to accept language parameter
- Update README with translation guidelines

### Priority 7: Visual Content Integration

**Embed images between paragraphs:**
```json
{
  "type": "image",
  "src": "/images/kethaneum-library.png",
  "alt": "The Kethaneum Library",
  "width": 400
}
```

**Implementation:**
- Change `paragraphs` to accept union type: `Paragraph | ImageBlock`
- Add image rendering logic to `FormattedBackstory`
- Ensure responsive sizing

### Priority 8: Content Versioning

**Track content changes:**
```json
{
  "version": "1.2.0",
  "lastUpdated": "2025-11-18",
  "title": "The Kethaneum",
  "paragraphs": [...]
}
```

**Implementation:**
- Add optional metadata fields to `BackstoryContent`
- Display version in dev mode or console
- Track when users last saw content

### Priority 9: Dynamic Content Loading

**Load different backstories based on game state:**
```typescript
loadBackstoryContent(gameMode: 'story' | 'puzzle-only' | 'beat-the-clock')
```

**File Structure:**
```
public/data/
├── backstory-content-story.json
├── backstory-content-puzzle.json
└── backstory-content-btc.json
```

**Implementation:**
- Accept parameter in `loadBackstoryContent()`
- Construct filename dynamically
- Fallback to default if specific version not found

### Priority 10: Interactive Elements

**Clickable text that reveals more:**
```json
{
  "text": "Book of Passage",
  "italic": true,
  "tooltip": "A living artifact that records your journey"
}
```

**Implementation:**
- Add `tooltip` or `expandable` properties
- Use hover/click handlers
- Display modal or popover with additional info

---

## Testing Recommendations

### Manual Testing Checklist

- [ ] Backstory page loads without errors
- [ ] Content displays correctly from JSON file
- [ ] Colors render as expected
- [ ] Italic text appears italicized
- [ ] Bold text appears bold
- [ ] Combined formatting (bold + italic + color) works
- [ ] Paragraph breaks create proper spacing
- [ ] Title updates when changed in JSON
- [ ] Fallback content displays if JSON fails to load
- [ ] Console shows appropriate errors on load failure

### Automated Testing Ideas

**Unit Tests (Jest + React Testing Library):**
```typescript
// Test FormattedBackstory component
describe('FormattedBackstory', () => {
  it('renders plain text segments', () => {
    const content = {
      title: 'Test',
      paragraphs: [{
        segments: [{text: 'Hello'}]
      }]
    };
    render(<FormattedBackstory content={content} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies color styling', () => {
    const content = {
      title: 'Test',
      paragraphs: [{
        segments: [{text: 'Colored', color: '#ff0000'}]
      }]
    };
    render(<FormattedBackstory content={content} />);
    const element = screen.getByText('Colored');
    expect(element).toHaveStyle({color: '#ff0000'});
  });

  it('applies italic formatting', () => {
    const content = {
      title: 'Test',
      paragraphs: [{
        segments: [{text: 'Italic', italic: true}]
      }]
    };
    render(<FormattedBackstory content={content} />);
    expect(screen.getByText('Italic').tagName).toBe('EM');
  });
});
```

**Integration Tests (Cypress):**
```typescript
describe('Backstory Screen', () => {
  it('loads and displays backstory content', () => {
    cy.visit('/backstory');
    cy.get('[data-testid="backstory-content"]').should('be.visible');
    cy.contains('The Kethaneum').should('exist');
  });

  it('displays formatted text correctly', () => {
    cy.visit('/backstory');
    cy.get('[data-testid="backstory-content"] em').should('exist');
    cy.get('[data-testid="backstory-content"] p').should('have.length.greaterThan', 1);
  });
});
```

---

## Common Issues & Solutions

### Issue: Content Not Loading

**Symptoms:** Fallback content always displays

**Possible Causes:**
1. JSON file path incorrect
2. JSON syntax error
3. File not included in build
4. Network/fetch error

**Solutions:**
1. Verify file exists at `public/data/backstory-content.json`
2. Validate JSON syntax (use JSONLint or VS Code)
3. Check browser console for errors
4. Ensure file is in `public/` folder (Next.js serves these statically)

### Issue: Formatting Not Applying

**Symptoms:** Text displays but formatting doesn't show

**Possible Causes:**
1. Property names misspelled in JSON
2. CSS conflicts
3. Component not receiving props correctly

**Solutions:**
1. Check JSON property names: `italic`, `bold`, `color` (lowercase)
2. Inspect element in browser DevTools to check applied styles
3. Add console.log in `FormattedBackstory` to debug props

### Issue: Colors Not Showing

**Possible Causes:**
1. Invalid color format
2. CSS specificity conflict
3. Dark mode override

**Solutions:**
1. Use valid CSS colors: `#8b5cf6`, `rgb(139, 92, 246)`, `purple`
2. Use `!important` if necessary (not recommended)
3. Check if global dark mode styles override inline styles

### Issue: Build Errors

**Symptoms:** TypeScript compilation errors

**Solutions:**
1. Ensure all imports are correct
2. Run `npm install` to ensure dependencies are installed
3. Check interface definitions match JSON structure
4. Clear `.next` folder and rebuild

---

## Migration Guide (For Other Screens)

This system can be adapted for other text-heavy screens:

### 1. Book of Passage Screen

**Create:** `public/data/book-of-passage-content.json`
```json
{
  "title": "Your Book of Passage",
  "introduction": "This book chronicles your journey...",
  "sections": [...]
}
```

**Create:** `lib/utils/bookOfPassageLoader.ts`
**Create:** `components/shared/FormattedBookContent.tsx`
**Modify:** `app/book-of-passage/page.tsx`

### 2. Dialogue System

**Extend existing:** `public/data/dialogue-config.json`
Add formatting support to character dialogue:
```json
{
  "characterId": "archivist-lumina",
  "dialogue": [
    {
      "segments": [
        {"text": "Welcome, "},
        {"text": "seeker", "color": "#fbbf24", "italic": true},
        {"text": "!"}
      ]
    }
  ]
}
```

### 3. Story Excerpts

Extend puzzle data to support formatted story excerpts:
```json
{
  "title": "Puzzle Title",
  "storyExcerpt": {
    "paragraphs": [...]
  }
}
```

---

## Performance Considerations

### Current Implementation

- **Load Time:** Content fetched once on component mount
- **Bundle Size:** Minimal impact (~2KB for component + loader)
- **Runtime Performance:** O(n) where n = number of segments
- **Memory:** Content held in component state

### Optimization Opportunities

1. **Caching:** Cache loaded content in localStorage
2. **Code Splitting:** Lazy load `FormattedBackstory` component
3. **Memoization:** Memoize `renderSegment` function
4. **Streaming:** For very large content, consider streaming/chunking
5. **Compression:** Enable gzip/brotli compression for JSON files

---

## Security Considerations

### Current Security

✅ **Safe:** Content rendered through React (automatic XSS protection)
✅ **Safe:** No `dangerouslySetInnerHTML` used
✅ **Safe:** No eval() or dynamic code execution
✅ **Safe:** Color values applied via inline styles (React sanitizes)

### Future Security Notes

⚠️ **If adding HTML support:** Use DOMPurify to sanitize
⚠️ **If adding links:** Validate URLs, prevent javascript: protocol
⚠️ **If adding external resources:** Implement CSP headers
⚠️ **If adding user-generated content:** Add strict validation

---

## Documentation Links

- **Main README:** `/public/data/README.md`
- **Component:** `/components/shared/FormattedBackstory.tsx`
- **Loader:** `/lib/utils/backstoryLoader.ts`
- **Content File:** `/public/data/backstory-content.json`
- **Usage Example:** `/app/backstory/page.tsx`

---

## Credits & Notes

**Developed By:** Claude (Anthropic)
**Requested By:** SheDreamsWithAIs
**Repository:** https://github.com/SheDreamsWithAIs/Chronicles-of-the-kethaneum

**Design Decisions:**
- JSON format chosen for ease of editing (non-developers can update)
- Segment-based approach allows fine-grained formatting control
- Fallback content ensures user experience never breaks
- TypeScript interfaces provide type safety
- React component approach keeps rendering logic separate from data

**Future-Proofing:**
- System designed to be extensible (new properties can be added)
- Backward compatible (optional properties won't break old content)
- Follows existing project patterns (uses fetchAsset, follows file structure)
- Well-documented for future maintenance

---

## Quick Start for Continuation

If you need to continue this work or extend it:

1. **Checkout the branch:**
   ```bash
   git checkout claude/backstory-text-source-01V59wehphGn9mrJTXxuvKPt
   ```

2. **Review the implementation:**
   - Read `/public/data/README.md` for usage
   - Check `/lib/utils/backstoryLoader.ts` for data loading
   - Examine `/components/shared/FormattedBackstory.tsx` for rendering

3. **Test the system:**
   - Edit `/public/data/backstory-content.json`
   - Run `npm run dev`
   - Navigate to `/backstory`
   - Verify changes appear

4. **Extend as needed:**
   - Refer to "Future Enhancement Ideas" section above
   - Follow existing patterns for new features
   - Update documentation as you add features

---

## Contact & Support

For questions or issues with this system:
1. Check this documentation
2. Review code comments in implementation files
3. Test with the example content provided
4. Refer to Next.js and React documentation for framework questions

**Happy coding! 🚀**
