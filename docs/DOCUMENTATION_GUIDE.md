# Documentation Style Guide

This guide establishes the standard format for documentation in Chronicles of the Kethaneum. Use this as a template when creating new documentation files.

## File Naming

- Use SCREAMING_SNAKE_CASE for doc filenames: `FEATURE_NAME.md`
- Place all documentation in the `docs/` folder
- Keep names concise but descriptive

## Document Structure

Every documentation file should follow this structure:

```markdown
# Feature Name Documentation

## Overview

Brief 2-3 sentence description of what this feature/system does and its purpose in the game.

## Architecture (if applicable)

List the main components with file paths:

1. **ComponentName** (`path/to/file.ts`) - Brief description
2. **HookName** (`hooks/useHook.ts`) - Brief description

## File Structure

Show relevant file organization:

```
folder/
├── subfolder/
│   └── file.ts
└── another-file.ts
```

## Features / API / Usage

Document the main functionality. Use subsections:

### Feature One

Description and examples.

### Feature Two

Description and examples.

## Configuration (if applicable)

Document any config options, environment variables, or settings.

## Common Workflows

Step-by-step guides for typical tasks:

1. First step
2. Second step
3. Third step

## Development Notes

Any caveats, gotchas, or important notes for developers.
```

## Formatting Guidelines

### Headers

- `#` - Document title (one per doc)
- `##` - Major sections
- `###` - Subsections
- `####` - Use sparingly, for deep nesting

### Code Blocks

Always specify the language:

```typescript
const example = "use typescript for TS/JS";
```

```json
{ "use": "json for config examples" }
```

```bash
npm run dev  # use bash for commands
```

### Tables

Use for API references, options, or comparisons:

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Brief description |
| `count` | number | Brief description |

### Lists

- Use bullet points for unordered items
- Use numbered lists for sequential steps or ranked items
- Bold the first word/phrase when listing features:
  - **Feature**: Description of feature

### File Paths

- Use backticks for inline paths: `lib/audio/audioManager.ts`
- Use code blocks for directory structures

### Emphasis

- **Bold** for UI elements, important terms, feature names
- `code` for file names, function names, variables, commands
- *Italic* sparingly, for introducing new terms

## Example Sections

### API Endpoint Documentation

```markdown
### GET /api/example

Returns example data.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | The item ID |
| `limit` | number | No | Max results (default: 10) |

**Response:**

```json
{
  "success": true,
  "data": []
}
```
```

### Component/Hook Documentation

```markdown
### useExample Hook

```typescript
const { data, loading, error } = useExample(options);
```

**Parameters:**

- `options.enabled` - Whether to enable the feature
- `options.onComplete` - Callback when complete

**Returns:**

- `data` - The fetched data
- `loading` - Loading state boolean
- `error` - Error object if failed
```

### Workflow Documentation

```markdown
## Adding a New Item

1. Create the item file in `public/data/items/`
2. Register it in `itemManifest.json`
3. Run the sync tool: `npm run sync-items`
4. Verify in the admin panel at `/tools/items`
```

## What NOT to Include

- Implementation details that change frequently
- Commented-out code blocks
- TODO items (use GitHub issues instead)
- Personal notes or work-in-progress content
- Sensitive information (API keys, passwords)

## Maintenance

- Update docs when features change
- Remove docs for deprecated features
- Keep examples working and up-to-date
- Review docs during PR reviews
