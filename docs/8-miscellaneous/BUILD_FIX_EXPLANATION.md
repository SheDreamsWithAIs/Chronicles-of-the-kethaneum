# Fix: Excluding Development Tools from Next.js Production Build

## Problem

When building a Next.js project with `output: 'export'` (static export), the build was failing with a TypeScript error:

```
Type error: Cannot find module '../../../app/tools/genre-builder/page.js' or its corresponding type declarations.
```

The error occurred in `.next/dev/types/validator.ts` during the build process, even though the development tools in `app/tools/` and `app/api/manifest-manager/` were not meant to be included in the production build.

## Root Cause

Next.js automatically scans the `app/` directory structure and generates TypeScript type definitions for all routes, including development-only tools. During the build process:

1. Next.js generates type definitions in `.next/dev/types/validator.ts` that reference ALL routes found in `app/`
2. These cached type definitions persist between builds
3. Even if routes are excluded from the final output, TypeScript still validates them during the build
4. The development tools use API routes that don't work with static export anyway

## Solution Approach

The solution uses a multi-layered approach:

1. **TypeScript Exclusion**: Exclude dev directories from TypeScript checking
2. **Build-Time Directory Movement**: Temporarily move dev directories out of `app/` before building
3. **Cache Cleaning**: Clean the `.next` directory to remove cached type definitions
4. **Automatic Restoration**: Restore directories after build completes

## Changes Made

### 1. Updated `tsconfig.json`

Added development directories to the `exclude` array:

```json
{
  "exclude": [
    "node_modules", 
    "cypress", 
    "app/tools", 
    "app/api/manifest-manager"
  ]
}
```

This prevents TypeScript from checking these directories during type validation.

### 2. Created `scripts/build-production.js`

A Node.js script that orchestrates the build process:

```javascript
// Key steps:
1. Clean .next directory (removes cached type definitions)
2. Move app/tools → _dev_tools
3. Move app/api/manifest-manager → _dev_api_manifest-manager
4. Run next build
5. Restore directories (even if build fails)
```

**Important features:**
- Cleans `.next` directory first to remove stale type definitions
- Moves directories before Next.js scans the file structure
- Automatically restores directories on both success and failure
- Provides clear console output for each step

### 3. Updated `package.json`

Changed the build script to use the new script:

```json
{
  "scripts": {
    "build": "node scripts/build-production.js",
    "build:next": "next build"  // Fallback for direct Next.js builds
  }
}
```

### 4. Updated `.gitignore`

Added temporary directories created during build:

```
# Temporary directories created during production build
/_dev_tools
/_dev_api_manifest-manager
```

## How It Works

### Build Process Flow

1. **Clean Phase**: Removes `.next/` directory containing cached type definitions that reference dev tools
2. **Move Phase**: Temporarily renames dev directories so Next.js doesn't see them
3. **Build Phase**: Next.js scans `app/` directory and generates fresh type definitions without dev tools
4. **Restore Phase**: Moves directories back to their original locations

### Why This Works

- **Directory Movement**: By moving directories out of `app/`, Next.js never sees them during route scanning
- **Cache Cleaning**: Removing `.next/` ensures no stale references exist
- **TypeScript Exclusion**: Even if something slips through, TypeScript won't check those directories
- **Safe Restoration**: Directories are always restored, so development workflow is unaffected

## Usage

Simply run:

```bash
npm run build
```

The script handles everything automatically. Development tools remain fully functional during `npm run dev`.

## Alternative Approaches Considered

1. **Route Groups**: Using Next.js route groups like `(dev)/tools` - but these still get type-checked
2. **Webpack Aliases**: Excluding via webpack config - doesn't prevent TypeScript validation
3. **Environment Variables**: Conditional rendering - doesn't prevent route generation
4. **Separate Directory**: Moving tools outside `app/` - breaks development workflow

The chosen solution is the most reliable because it physically removes the directories from Next.js's scanning path during build time.

## Notes

- Development tools are only moved during production builds (`npm run build`)
- Development server (`npm run dev`) works normally with all tools available
- The temporary directories (`_dev_tools`, `_dev_api_manifest-manager`) are gitignored
- If the build fails, directories are automatically restored before the script exits

