# Deploying Next.js to Itch.io via GitHub Pages

This guide documents the process of deploying a Next.js application to itch.io using GitHub Pages as the hosting platform with an iframe wrapper.

## The Problem

Itch.io has specific limitations for HTML5 games:
- Cannot handle Next.js App Router's client-side navigation (tries to fetch non-existent RSC files)
- Serves games from unpredictable subdirectories
- Requires `index.html` as the entry point
- Blocks absolute path asset loading with 403 errors

Traditional Next.js static export approaches fail because itch.io's CDN structure doesn't support the routing/asset loading patterns Next.js generates.

## The Solution: GitHub Pages + Iframe Wrapper

**Strategy:** Host the actual Next.js app on GitHub Pages (which supports static exports properly), then embed it on itch.io using a simple iframe wrapper.

**Benefits:**
- ✅ Full Next.js functionality (routing, navigation, assets)
- ✅ Free hosting on GitHub Pages
- ✅ Itch.io storefront and audience reach
- ✅ Automatic deployment via GitHub Actions
- ✅ Single source of truth (updates automatically propagate)

## Prerequisites

Before deployment, ensure your Next.js app builds successfully with TypeScript strict mode enabled.

### Common TypeScript Fixes Needed

#### 1. Timer Type Issues (App Router Components)
If using union types for timers, TypeScript may complain about methods not existing:

```typescript
// ❌ Problem: timer is a union type
const timer = useMemo(() => {
  return state.gameMode === 'story' ? storyTimer : puzzleOnlyTimer;
}, [state.gameMode, storyTimer, puzzleOnlyTimer]);

timer.initialize(); // Error: Property 'initialize' does not exist

// ✅ Solution: Use specific timer directly
if (state.gameMode === 'story') {
  storyTimer.initialize();
} else {
  puzzleOnlyTimer.start();
}
```

#### 2. Next.js 16 Async Params
Next.js 16 made route params asynchronous:

```typescript
// ❌ Old way (Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
}

// ✅ New way (Next.js 16)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

#### 3. Development Tools Exclusion
Create a build script to exclude dev tools from production builds:

**`scripts/build-production.js`:**
```javascript
const { execSync } = require('child_process');
const { existsSync, renameSync, rmSync } = require('fs');
const { join } = require('path');

const DEV_DIRS = [
  { src: join(process.cwd(), 'app', 'tools'), dest: join(process.cwd(), '_dev_tools') },
  { src: join(process.cwd(), 'app', 'api', 'manifest-manager'), dest: join(process.cwd(), '_dev_api_manifest-manager') },
];

// Clean .next directory
const nextDir = join(process.cwd(), '.next');
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
}

// Move dev directories
let movedDirs = [];
DEV_DIRS.forEach(({ src, dest }) => {
  if (existsSync(src)) {
    renameSync(src, dest);
    movedDirs.push({ src, dest });
  }
});

try {
  execSync('next build', { stdio: 'inherit' });
} finally {
  // Always restore directories
  movedDirs.forEach(({ src, dest }) => {
    if (existsSync(dest)) renameSync(dest, src);
  });
}
```

**Update `package.json`:**
```json
{
  "scripts": {
    "build": "node scripts/build-production.js"
  }
}
```

**Update `tsconfig.json`:**
```json
{
  "exclude": ["node_modules", "cypress", "app/tools", "app/api/manifest-manager"]
}
```

## Configuration

### 1. Next.js Config

**`next.config.ts`:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static export for GitHub Pages
  basePath: '/your-repo-name', // Replace with your GitHub repo name
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
```

**Important:** Replace `/your-repo-name` with your actual repository name (e.g., `/Chronicles-of-the-kethaneum`).

### 2. GitHub Pages Setup

**Create `.github/workflows/deploy-gh-pages.yml`:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Create `public/.nojekyll`:**
```bash
touch public/.nojekyll
```

This empty file tells GitHub Pages not to use Jekyll processing.

### 3. Itch.io Iframe Wrapper

**Create `index.html` in project root:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Game Title</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #0a0a0a;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #dcd0c0;
            font-family: serif;
            font-size: 1.5rem;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">Loading...</div>
    <iframe
        src="https://your-username.github.io/your-repo-name/"
        allowfullscreen
        allow="autoplay; fullscreen"
        onload="document.getElementById('loading').style.display='none'">
    </iframe>
</body>
</html>
```

**Important:** Replace the iframe `src` with your actual GitHub Pages URL.

## Deployment Steps

### Step 1: Enable GitHub Pages

1. Push your code to the `main` branch
2. Go to your GitHub repository
3. Click **Settings** → **Pages**
4. Under "Source", select **GitHub Actions**
5. Save

The GitHub Actions workflow will automatically trigger and deploy your site to:
```
https://your-username.github.io/your-repo-name/
```

### Step 2: Verify GitHub Pages Deployment

1. Wait for the GitHub Action to complete (check the Actions tab)
2. Visit your GitHub Pages URL
3. Verify the game loads and works correctly
4. Test navigation between screens
5. Check browser console for errors

### Step 3: Deploy to Itch.io

1. Go to your itch.io dashboard
2. Create a new project (or edit existing)
3. Set **Kind of project** to "HTML"
4. **Upload the `index.html` file only** (from your project root)
5. Check "This file will be played in the browser"
6. Configure viewport dimensions:
   - Recommended: 1280x720 or 1920x1080
   - Enable "Automatically start on page load"
   - Enable "Fullscreen button" (optional but recommended)
7. Save and publish

## How It Works

```
User visits itch.io
       ↓
Loads index.html (iframe wrapper)
       ↓
Iframe loads from GitHub Pages
       ↓
Full Next.js app runs from GitHub Pages
       ↓
All navigation/routing works correctly
```

The iframe wrapper is tiny (~1KB) and loads instantly. The actual game loads from GitHub Pages where Next.js routing and assets work perfectly.

## Updating Your Game

Once set up, updates are automatic:

1. Make changes to your code
2. Commit and push to `main` branch
3. GitHub Actions automatically rebuilds and deploys
4. Changes appear on GitHub Pages within minutes
5. Itch.io automatically shows updated version (no re-upload needed!)

The iframe always points to the latest GitHub Pages deployment.

## Troubleshooting

### Build Fails with TypeScript Errors

- Check that all API route handlers use `await params` for Next.js 16
- Verify dev tools are excluded in `tsconfig.json`
- Ensure build script moves dev directories before building

### Assets Return 404 on GitHub Pages

- Verify `basePath` in `next.config.ts` matches your repo name exactly
- Check that `.nojekyll` file exists in `public/` folder
- Ensure `output: 'export'` is set in Next.js config

### Itch.io Shows Blank Screen

- Verify GitHub Pages is live and accessible
- Check iframe `src` URL is correct in `index.html`
- Look for CORS errors in browser console
- Ensure itch.io viewport dimensions are set

### Navigation Doesn't Work

- This is expected with direct itch.io upload - use GitHub Pages + iframe instead
- Verify the iframe wrapper is being used, not direct Next.js export

### GitHub Actions Workflow Fails

- Check that `npm ci` can install dependencies
- Verify `npm run build` works locally
- Ensure Node.js version in workflow matches your local version

## Alternative: Direct Itch.io Upload (Not Recommended)

If you absolutely cannot use GitHub Pages, you can try:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: '.',
  trailingSlash: true,
};
```

Then upload the entire `out` folder. However, this approach has significant limitations:
- ❌ Client-side navigation may break
- ❌ Asset paths may not resolve correctly
- ❌ No RSC data for route prefetching
- ⚠️ Use only for single-page applications

The GitHub Pages + iframe approach is **strongly recommended** for multi-route Next.js apps.

## Cost Analysis

- **GitHub Pages:** Free (100GB bandwidth/month)
- **Itch.io:** Free tier available
- **Total Monthly Cost:** $0

Perfect for indie game distribution!

## Summary

The iframe wrapper approach successfully deploys Next.js apps to itch.io by:
1. Hosting the app on GitHub Pages (free, proper Next.js support)
2. Embedding it on itch.io via a simple iframe wrapper
3. Providing automatic updates via GitHub Actions
4. Maintaining full Next.js functionality (routing, navigation, assets)

This architecture gives you the best of both worlds: itch.io's storefront and audience, with GitHub Pages' reliable Next.js hosting.
