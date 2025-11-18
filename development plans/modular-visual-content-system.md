# Modular Visual Content System - Implementation Plan

**Project:** Chronicles of the Kethaneum
**Created:** 2025-11-18
**Status:** Ready for Implementation
**Estimated Effort:** 8-12 hours

---

## Executive Summary

This plan transforms the game's visual content into a plug-and-play system where all images (logos, backgrounds, borders, location art, character portraits) can be swapped by simply updating configuration files and dropping new files into organized directories.

### Key Benefits
- ✅ **Easy Content Swaps:** Change one JSON file to update all visuals
- ✅ **Multiple Themes:** Support seasonal themes, special events, or A/B testing
- ✅ **Type Safety:** TypeScript ensures no broken asset references
- ✅ **Performance:** Preloading and caching built-in
- ✅ **Graceful Degradation:** Fallbacks for missing images
- ✅ **Maintainability:** Centralized asset management
- ✅ **Scalability:** Easy to add new asset types

---

## Current State Analysis

### How Visual Content is Currently Handled

#### 1. Image Loading Pattern
**Location:** `/app/page.tsx:83`

Currently using direct `<img>` tags with hardcoded paths:
```tsx
<img
  src="/images/logo-glow.png"
  alt="Chronicles of the Kethaneum Logo"
  className={styles.logoGlow}
/>
```

**Problems:**
- Hardcoded paths throughout codebase
- No centralized asset management
- Difficult to swap themes or update assets
- No type safety for asset paths

#### 2. Asset Path Utility (Partially Implemented)
**Location:** `/lib/utils/assetPath.ts`

Already has utilities for handling GitHub Pages basePath:
- `getAssetPath()` - for general paths
- `fetchAsset()` - for fetching JSON/data files

**Currently used for:** Loading puzzle data, character data, dialogue configs
**NOT used for:** Images (opportunity for extension)

#### 3. Current Asset Directory Structure
```
/public/
├── images/
│   ├── logo-glow.png (animated logo)
│   └── logo-static.png
├── data/
│   ├── characters/ (character metadata)
│   ├── story-events/
│   └── dialogue-config.json (references /images/portraits/)
└── audio/
```

**Problems:**
- Flat structure in `/images/`
- No organization by asset type
- Hard to manage as project grows

#### 4. Background Implementation
**Component:** `/components/shared/CosmicBackground.tsx`

Currently using **procedural generation** (CSS + canvas):
- No image files used
- Generates stars and particles dynamically
- Variants: `title`, `backstory`, `book`, `library`, `puzzle`

**This is good!** The new system should support BOTH image and procedural backgrounds.

#### 5. Placeholder Systems (Ready for Implementation)

**Character Portraits:**
- Referenced in `/public/data/dialogue-config.json:91`
- Path configured: `/images/portraits/`
- UI styled in `/app/library/library.module.css:178-192`
- **NOT IMPLEMENTED** - just shows "Portrait" text

**Location Artwork:**
- Placeholder in `/app/library/page.tsx:131-135`
- CSS class: `libraryArtPlaceholder`
- Text: "[ Library Artwork Will Display Here ]"
- Container styled and ready

#### 6. Design Tokens
**Location:** `/app/globals.css:4-27`

CSS variables already defined:
```css
--primary-dark: #441648;
--primary-medium: #793385;
--primary-light: #ad51be;
--accent-main: #fef3c7;
--accent-dark: #fde68a;
--text-light: #f0ebe3;
```

These can be part of theme configuration too!

#### 7. Build Configuration
**Location:** `/next.config.ts`

```typescript
images: {
  unoptimized: true, // Static export for GitHub Pages
}
output: 'export' // Static export mode
```

**Note:** Using `unoptimized: true` because of static export. The new system must work with this constraint.

---

## Implementation Plan

### Phase 1: Create Visual Asset Configuration System

#### 1.1 Create Visual Theme Configuration File

**Create:** `/public/data/visual-config.json`

This is the central registry for ALL visual assets in the game.

```json
{
  "theme": "default",
  "version": "1.0.0",
  "metadata": {
    "name": "Chronicles of the Kethaneum - Default Theme",
    "author": "SheDreamsWithAIs",
    "description": "The original visual theme for Chronicles of the Kethaneum"
  },
  "logos": {
    "main": {
      "src": "/images/logos/logo-glow.png",
      "alt": "Chronicles of the Kethaneum Logo",
      "width": 400,
      "height": 400
    },
    "static": {
      "src": "/images/logos/logo-static.png",
      "alt": "Chronicles of the Kethaneum Logo",
      "width": 400,
      "height": 400
    }
  },
  "backgrounds": {
    "title": {
      "type": "procedural",
      "variant": "title",
      "fallbackImage": "/images/backgrounds/title-bg.png"
    },
    "library": {
      "type": "procedural",
      "variant": "library",
      "fallbackImage": "/images/backgrounds/library-bg.png"
    },
    "puzzle": {
      "type": "procedural",
      "variant": "puzzle",
      "fallbackImage": "/images/backgrounds/puzzle-bg.png"
    },
    "backstory": {
      "type": "procedural",
      "variant": "backstory",
      "fallbackImage": "/images/backgrounds/backstory-bg.png"
    }
  },
  "borders": {
    "modal": {
      "src": "/images/borders/modal-border.png",
      "sliceSize": 32,
      "enabled": false
    },
    "panel": {
      "src": "/images/borders/panel-border.png",
      "sliceSize": 32,
      "enabled": false
    },
    "characterPortrait": {
      "src": "/images/borders/portrait-frame.png",
      "sliceSize": 16,
      "enabled": false
    }
  },
  "locations": {
    "library": {
      "main": {
        "src": "/images/locations/library-main.png",
        "alt": "The Grand Library of Kethaneum",
        "width": 800,
        "height": 600
      },
      "thumbnail": {
        "src": "/images/locations/library-thumb.png",
        "alt": "The Grand Library",
        "width": 200,
        "height": 150
      }
    }
  },
  "portraits": {
    "basePath": "/images/portraits/",
    "defaultPortrait": "/images/portraits/default.png",
    "format": "png",
    "dimensions": {
      "width": 150,
      "height": 150
    }
  },
  "ui": {
    "buttonBackground": {
      "src": "/images/ui/button-bg.png",
      "enabled": false
    },
    "divider": {
      "src": "/images/ui/divider.png",
      "enabled": false
    },
    "icons": {
      "basePath": "/images/ui/icons/"
    }
  },
  "overlays": {
    "vignette": {
      "src": "/images/overlays/vignette.png",
      "opacity": 0.3,
      "enabled": false
    },
    "texture": {
      "src": "/images/overlays/texture.png",
      "opacity": 0.1,
      "blend": "overlay",
      "enabled": false
    }
  },
  "colorScheme": {
    "primary-dark": "#441648",
    "primary-medium": "#793385",
    "primary-light": "#ad51be",
    "accent-main": "#fef3c7",
    "accent-dark": "#fde68a",
    "text-light": "#f0ebe3",
    "background": "#1a0b1e"
  }
}
```

**Key Design Decisions:**
- Each asset includes metadata (dimensions, alt text)
- `enabled` flags allow gradual adoption (can keep CSS styling while assets are prepared)
- `type` field for backgrounds supports both "image" and "procedural"
- Color scheme included for complete theme switching
- Version tracking for config file itself

#### 1.2 Support Multiple Themes

**Create:** `/public/data/visual-config-cyberpunk.json` (example alternate theme)

```json
{
  "theme": "cyberpunk",
  "version": "1.0.0",
  "metadata": {
    "name": "Chronicles of the Kethaneum - Cyberpunk Edition",
    "author": "Community",
    "description": "A neon-soaked cyberpunk reimagining"
  },
  "logos": {
    "main": {
      "src": "/images/themes/cyberpunk/logos/logo-glow.png",
      "alt": "Chronicles of the Kethaneum - Cyber Edition",
      "width": 400,
      "height": 400
    }
  },
  "backgrounds": {
    "title": {
      "type": "image",
      "src": "/images/themes/cyberpunk/backgrounds/title-bg.png"
    }
  },
  "colorScheme": {
    "primary-dark": "#0a0e27",
    "primary-medium": "#1a237e",
    "primary-light": "#3f51b5",
    "accent-main": "#00ffff",
    "accent-dark": "#00bcd4",
    "text-light": "#e0f7fa",
    "background": "#000000"
  }
}
```

**Theme Selection:**
- Default: Load `/public/data/visual-config.json`
- Environment variable: `NEXT_PUBLIC_THEME=cyberpunk` loads `visual-config-cyberpunk.json`
- Fallback chain: custom theme → default theme → hardcoded fallbacks

---

### Phase 2: Reorganize Asset Directory Structure

#### 2.1 New Directory Organization

Move existing assets and create new structure:

```
/public/images/
├── logos/
│   ├── logo-glow.png          [MOVE FROM /images/logo-glow.png]
│   └── logo-static.png        [MOVE FROM /images/logo-static.png]
├── backgrounds/
│   ├── title-bg.png           [CREATE - optional fallback]
│   ├── library-bg.png         [CREATE - optional fallback]
│   ├── puzzle-bg.png          [CREATE - optional fallback]
│   └── backstory-bg.png       [CREATE - optional fallback]
├── borders/
│   ├── modal-border.png       [CREATE - optional]
│   ├── panel-border.png       [CREATE - optional]
│   └── portrait-frame.png     [CREATE - optional]
├── locations/
│   ├── library-main.png       [CREATE - replaces placeholder]
│   └── library-thumb.png      [CREATE - thumbnail version]
├── portraits/
│   ├── default.png            [CREATE - default character portrait]
│   └── [character-id].png     [CREATE - per character]
├── ui/
│   ├── button-bg.png          [CREATE - optional]
│   ├── divider.png            [CREATE - optional]
│   └── icons/                 [FOLDER - for future UI icons]
├── overlays/
│   ├── vignette.png           [CREATE - optional screen overlay]
│   └── texture.png            [CREATE - optional paper/grain texture]
└── themes/                    [FOLDER - for alternate themes]
    ├── cyberpunk/
    │   ├── logos/
    │   ├── backgrounds/
    │   └── ...
    └── winter/
        └── ...
```

#### 2.2 Asset Specifications

**Recommended Image Formats:**
- Logos: PNG with transparency
- Backgrounds: JPG (file size) or PNG (quality)
- Borders: PNG with transparency (9-slice compatible)
- Portraits: PNG, 150x150px or 300x300px (retina)
- Location Art: PNG or JPG, 800x600px base size
- Overlays: PNG with transparency

**File Naming Convention:**
- Lowercase with hyphens: `library-main.png`, `portrait-frame.png`
- Character portraits by ID: `character-001.png`, `character-sage.png`
- Variants with suffixes: `logo-static.png`, `logo-animated.png`

#### 2.3 Migration Script (Optional)

**Create:** `/scripts/migrate-assets.js`

```javascript
// Script to move existing assets to new structure
const fs = require('fs');
const path = require('path');

const migrations = [
  {
    from: '/public/images/logo-glow.png',
    to: '/public/images/logos/logo-glow.png'
  },
  {
    from: '/public/images/logo-static.png',
    to: '/public/images/logos/logo-static.png'
  }
];

migrations.forEach(({ from, to }) => {
  const fromPath = path.join(__dirname, '..', from);
  const toPath = path.join(__dirname, '..', to);

  // Create directory if it doesn't exist
  const dir = path.dirname(toPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Copy file
  if (fs.existsSync(fromPath)) {
    fs.copyFileSync(fromPath, toPath);
    console.log(`✓ Migrated: ${from} → ${to}`);
  } else {
    console.log(`✗ Not found: ${from}`);
  }
});
```

---

### Phase 3: Build Visual Asset Management System

#### 3.1 Create TypeScript Types

**Create:** `/lib/types/visual-assets.ts`

```typescript
export interface AssetMetadata {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface BackgroundConfig {
  type: 'image' | 'procedural';
  src?: string;
  variant?: string;
  fallbackImage?: string;
}

export interface BorderConfig {
  src: string;
  sliceSize?: number;
  enabled: boolean;
}

export interface LocationAssets {
  main: AssetMetadata;
  thumbnail?: AssetMetadata;
}

export interface PortraitConfig {
  basePath: string;
  defaultPortrait: string;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface UIAsset {
  src: string;
  enabled: boolean;
  opacity?: number;
  blend?: string;
}

export interface ColorScheme {
  'primary-dark': string;
  'primary-medium': string;
  'primary-light': string;
  'accent-main': string;
  'accent-dark': string;
  'text-light': string;
  background: string;
}

export interface VisualConfig {
  theme: string;
  version: string;
  metadata: {
    name: string;
    author: string;
    description: string;
  };
  logos: {
    main: AssetMetadata;
    static: AssetMetadata;
  };
  backgrounds: {
    [key: string]: BackgroundConfig;
  };
  borders: {
    [key: string]: BorderConfig;
  };
  locations: {
    [key: string]: LocationAssets;
  };
  portraits: PortraitConfig;
  ui: {
    [key: string]: UIAsset;
  };
  overlays?: {
    [key: string]: UIAsset;
  };
  colorScheme: ColorScheme;
}
```

#### 3.2 Extend Asset Path Utility

**Modify:** `/lib/utils/assetPath.ts`

Add new functions to the existing file:

```typescript
/**
 * Get image path with basePath handling
 */
export function getImagePath(imagePath: string): string {
  if (!imagePath) return '';

  // Handle absolute URLs
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Add basePath for GitHub Pages
  return `${basePath}${imagePath}`;
}

/**
 * Preload an image for better performance
 */
export function preloadImage(imagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = getImagePath(imagePath);
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(imagePaths: string[]): Promise<void[]> {
  return Promise.all(imagePaths.map(path => preloadImage(path)));
}

/**
 * Check if an image exists (client-side)
 */
export async function imageExists(imagePath: string): Promise<boolean> {
  try {
    await preloadImage(imagePath);
    return true;
  } catch {
    return false;
  }
}
```

#### 3.3 Create Visual Asset Context/Hook

**Create:** `/lib/hooks/useVisualAssets.ts`

```typescript
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { VisualConfig, AssetMetadata, BackgroundConfig, LocationAssets } from '@/lib/types/visual-assets';
import { fetchAsset, getImagePath } from '@/lib/utils/assetPath';

interface VisualAssetsContextType {
  config: VisualConfig | null;
  loading: boolean;
  error: Error | null;
  getLogo: (variant?: 'main' | 'static') => AssetMetadata | null;
  getBackground: (key: string) => BackgroundConfig | null;
  getBorder: (key: string) => string | null;
  getLocation: (key: string) => LocationAssets | null;
  getPortrait: (characterId: string) => string;
  getUIAsset: (key: string) => string | null;
  applyColorScheme: () => void;
}

const VisualAssetsContext = createContext<VisualAssetsContextType | undefined>(undefined);

export function VisualAssetsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<VisualConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadVisualConfig();
  }, []);

  async function loadVisualConfig() {
    try {
      setLoading(true);

      // Check for theme override via environment variable
      const theme = process.env.NEXT_PUBLIC_THEME || 'default';
      const configFile = theme === 'default'
        ? '/data/visual-config.json'
        : `/data/visual-config-${theme}.json`;

      const data = await fetchAsset<VisualConfig>(configFile);
      setConfig(data);

      // Apply color scheme to CSS variables
      applyColorSchemeToDOM(data.colorScheme);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load visual config:', err);
      setError(err as Error);
      setLoading(false);

      // Load default fallback config
      loadFallbackConfig();
    }
  }

  function loadFallbackConfig() {
    // Hardcoded fallback based on current implementation
    const fallback: VisualConfig = {
      theme: 'fallback',
      version: '1.0.0',
      metadata: {
        name: 'Fallback Theme',
        author: 'System',
        description: 'Emergency fallback configuration'
      },
      logos: {
        main: { src: '/images/logo-glow.png', alt: 'Logo', width: 400, height: 400 },
        static: { src: '/images/logo-static.png', alt: 'Logo', width: 400, height: 400 }
      },
      backgrounds: {
        title: { type: 'procedural', variant: 'title' },
        library: { type: 'procedural', variant: 'library' },
        puzzle: { type: 'procedural', variant: 'puzzle' }
      },
      borders: {},
      locations: {},
      portraits: {
        basePath: '/images/portraits/',
        defaultPortrait: '/images/portraits/default.png',
        format: 'png',
        dimensions: { width: 150, height: 150 }
      },
      ui: {},
      colorScheme: {
        'primary-dark': '#441648',
        'primary-medium': '#793385',
        'primary-light': '#ad51be',
        'accent-main': '#fef3c7',
        'accent-dark': '#fde68a',
        'text-light': '#f0ebe3',
        'background': '#1a0b1e'
      }
    };
    setConfig(fallback);
  }

  function applyColorSchemeToDOM(colorScheme: VisualConfig['colorScheme']) {
    const root = document.documentElement;
    Object.entries(colorScheme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  const getLogo = (variant: 'main' | 'static' = 'main') => {
    return config?.logos[variant] || null;
  };

  const getBackground = (key: string) => {
    return config?.backgrounds[key] || null;
  };

  const getBorder = (key: string) => {
    const border = config?.borders[key];
    return border?.enabled ? border.src : null;
  };

  const getLocation = (key: string) => {
    return config?.locations[key] || null;
  };

  const getPortrait = (characterId: string) => {
    if (!config?.portraits) return '';

    const portraitPath = `${config.portraits.basePath}${characterId}.${config.portraits.format}`;
    return getImagePath(portraitPath);
  };

  const getUIAsset = (key: string) => {
    const asset = config?.ui[key];
    return asset?.enabled ? asset.src : null;
  };

  const applyColorScheme = () => {
    if (config?.colorScheme) {
      applyColorSchemeToDOM(config.colorScheme);
    }
  };

  return (
    <VisualAssetsContext.Provider
      value={{
        config,
        loading,
        error,
        getLogo,
        getBackground,
        getBorder,
        getLocation,
        getPortrait,
        getUIAsset,
        applyColorScheme
      }}
    >
      {children}
    </VisualAssetsContext.Provider>
  );
}

export function useVisualAssets() {
  const context = useContext(VisualAssetsContext);
  if (!context) {
    throw new Error('useVisualAssets must be used within VisualAssetsProvider');
  }
  return context;
}
```

**Integration:** Wrap app in provider

**Modify:** `/app/layout.tsx`

```tsx
import { VisualAssetsProvider } from '@/lib/hooks/useVisualAssets';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VisualAssetsProvider>
          {children}
        </VisualAssetsProvider>
      </body>
    </html>
  );
}
```

---

### Phase 4: Create Reusable Visual Components

#### 4.1 Smart Image Component

**Create:** `/components/shared/SmartImage.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useVisualAssets } from '@/lib/hooks/useVisualAssets';
import { getImagePath } from '@/lib/utils/assetPath';

interface SmartImageProps {
  src?: string;
  assetKey?: string; // e.g., "logos.main"
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function SmartImage({
  src,
  assetKey,
  alt,
  className = '',
  width,
  height,
  fallback,
  onLoad,
  onError
}: SmartImageProps) {
  const { config } = useVisualAssets();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) {
      setImageSrc(getImagePath(src));
    } else if (assetKey && config) {
      // Navigate nested object path like "logos.main"
      const asset = getNestedProperty(config, assetKey);
      if (asset?.src) {
        setImageSrc(getImagePath(asset.src));
      }
    }
  }, [src, assetKey, config]);

  function getNestedProperty(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  function handleError() {
    setError(true);
    if (fallback) {
      setImageSrc(getImagePath(fallback));
    }
    onError?.();
  }

  if (!imageSrc) {
    return <div className={className} style={{ width, height, background: '#333' }} />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}
```

#### 4.2 Configurable Background Component

**Create:** `/components/shared/ConfigurableBackground.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useVisualAssets } from '@/lib/hooks/useVisualAssets';
import { getImagePath } from '@/lib/utils/assetPath';
import CosmicBackground from './CosmicBackground';

interface ConfigurableBackgroundProps {
  variant: string; // 'title', 'library', 'puzzle', etc.
  className?: string;
  overlay?: boolean;
}

export default function ConfigurableBackground({
  variant,
  className = '',
  overlay = false
}: ConfigurableBackgroundProps) {
  const { getBackground, config } = useVisualAssets();
  const [bgConfig, setBgConfig] = useState<any>(null);

  useEffect(() => {
    const background = getBackground(variant);
    setBgConfig(background);
  }, [variant, config]);

  if (!bgConfig) {
    // Fallback to procedural while loading
    return <CosmicBackground variant={variant} />;
  }

  if (bgConfig.type === 'procedural') {
    return <CosmicBackground variant={bgConfig.variant || variant} />;
  }

  if (bgConfig.type === 'image' && bgConfig.src) {
    return (
      <div
        className={`configurable-background ${className}`}
        style={{
          backgroundImage: `url(${getImagePath(bgConfig.src)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      >
        {overlay && config?.overlays && (
          <>
            {config.overlays.vignette?.enabled && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${getImagePath(config.overlays.vignette.src)})`,
                opacity: config.overlays.vignette.opacity || 0.3,
                pointerEvents: 'none'
              }} />
            )}
            {config.overlays.texture?.enabled && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${getImagePath(config.overlays.texture.src)})`,
                opacity: config.overlays.texture.opacity || 0.1,
                mixBlendMode: (config.overlays.texture.blend as any) || 'overlay',
                pointerEvents: 'none'
              }} />
            )}
          </>
        )}
      </div>
    );
  }

  // Fallback
  return <CosmicBackground variant={variant} />;
}
```

#### 4.3 Decorative Border Component

**Create:** `/components/shared/DecorativeBorder.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useVisualAssets } from '@/lib/hooks/useVisualAssets';
import { getImagePath } from '@/lib/utils/assetPath';

interface DecorativeBorderProps {
  borderKey: string; // 'modal', 'panel', 'characterPortrait'
  children: React.ReactNode;
  className?: string;
  sliceSize?: number;
}

export default function DecorativeBorder({
  borderKey,
  children,
  className = '',
  sliceSize
}: DecorativeBorderProps) {
  const { getBorder, config } = useVisualAssets();
  const [borderSrc, setBorderSrc] = useState<string | null>(null);
  const [slice, setSlice] = useState<number>(32);

  useEffect(() => {
    const border = getBorder(borderKey);
    setBorderSrc(border);

    const borderConfig = config?.borders[borderKey];
    if (borderConfig?.sliceSize) {
      setSlice(borderConfig.sliceSize);
    }
  }, [borderKey, config]);

  if (!borderSrc) {
    // No border - just render children
    return <div className={className}>{children}</div>;
  }

  const borderImageSlice = sliceSize || slice;

  return (
    <div
      className={`decorative-border ${className}`}
      style={{
        borderImageSource: `url(${getImagePath(borderSrc)})`,
        borderImageSlice: borderImageSlice,
        borderImageWidth: `${borderImageSlice}px`,
        borderImageRepeat: 'round',
        borderStyle: 'solid',
        borderWidth: `${borderImageSlice}px`,
        padding: `${borderImageSlice}px`
      }}
    >
      {children}
    </div>
  );
}
```

**Note:** Nine-slice scaling (border-image-slice) allows borders to stretch without distortion.

#### 4.4 Location Art Component

**Create:** `/components/shared/LocationArt.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useVisualAssets } from '@/lib/hooks/useVisualAssets';
import SmartImage from './SmartImage';

interface LocationArtProps {
  locationKey: string; // 'library', etc.
  variant?: 'main' | 'thumbnail';
  className?: string;
  placeholder?: React.ReactNode;
}

export default function LocationArt({
  locationKey,
  variant = 'main',
  className = '',
  placeholder
}: LocationArtProps) {
  const { getLocation } = useVisualAssets();
  const [locationAsset, setLocationAsset] = useState<any>(null);

  useEffect(() => {
    const location = getLocation(locationKey);
    if (location) {
      setLocationAsset(location[variant]);
    }
  }, [locationKey, variant]);

  if (!locationAsset) {
    return (
      <div className={`location-art-placeholder ${className}`}>
        {placeholder || `[ ${locationKey} Artwork ]`}
      </div>
    );
  }

  return (
    <SmartImage
      src={locationAsset.src}
      alt={locationAsset.alt || locationKey}
      width={locationAsset.width}
      height={locationAsset.height}
      className={className}
    />
  );
}
```

#### 4.5 Character Portrait Component

**Create:** `/components/shared/CharacterPortrait.tsx`

```tsx
'use client';

import { useVisualAssets } from '@/lib/hooks/useVisualAssets';
import SmartImage from './SmartImage';
import DecorativeBorder from './DecorativeBorder';

interface CharacterPortraitProps {
  characterId: string;
  className?: string;
  showBorder?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CharacterPortrait({
  characterId,
  className = '',
  showBorder = true,
  size = 'medium'
}: CharacterPortraitProps) {
  const { getPortrait, config } = useVisualAssets();

  const portraitSrc = getPortrait(characterId);

  const dimensions = {
    small: { width: 80, height: 80 },
    medium: { width: 150, height: 150 },
    large: { width: 300, height: 300 }
  };

  const portrait = (
    <SmartImage
      src={portraitSrc}
      alt={`${characterId} portrait`}
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={className}
      fallback={config?.portraits.defaultPortrait}
    />
  );

  if (showBorder) {
    return (
      <DecorativeBorder borderKey="characterPortrait">
        {portrait}
      </DecorativeBorder>
    );
  }

  return portrait;
}
```

---

### Phase 5: Implement in Existing Components

#### 5.1 Update Title Screen

**Modify:** `/app/page.tsx`

Replace this:
```tsx
<img
  src="/images/logo-glow.png"
  alt="Chronicles of the Kethaneum Logo"
  className={styles.logoGlow}
/>
```

With this:
```tsx
import SmartImage from '@/components/shared/SmartImage';
import ConfigurableBackground from '@/components/shared/ConfigurableBackground';

// In component:
<ConfigurableBackground variant="title" />

<SmartImage
  assetKey="logos.main"
  alt="Chronicles of the Kethaneum Logo"
  className={styles.logoGlow}
/>
```

#### 5.2 Update Library Page

**Modify:** `/app/library/page.tsx`

Replace the artwork placeholder around line 131-135:
```tsx
<div className={styles.libraryArtPlaceholder}>
  [ Library Artwork Will Display Here ]
</div>
```

With:
```tsx
import LocationArt from '@/components/shared/LocationArt';

<LocationArt
  locationKey="library"
  variant="main"
  className={styles.libraryArt}
/>
```

Add character portraits in dialogue sections:
```tsx
import CharacterPortrait from '@/components/shared/CharacterPortrait';

<CharacterPortrait
  characterId={currentCharacter.id}
  size="medium"
  showBorder={true}
/>
```

#### 5.3 Update Modal Components

**Modify:** `/components/GameModeModal.tsx` (and other modals)

Wrap modal content with borders:
```tsx
import DecorativeBorder from '@/components/shared/DecorativeBorder';

<DecorativeBorder borderKey="modal">
  {/* existing modal content */}
</DecorativeBorder>
```

#### 5.4 Update Background Usage Across App

Search for `<CosmicBackground variant="..." />` and replace with:
```tsx
<ConfigurableBackground variant="..." />
```

This maintains backward compatibility (procedural backgrounds still work) while enabling image backgrounds.

---

### Phase 6: Developer Experience Features

#### 6.1 Asset Validation Script

**Create:** `/scripts/validate-assets.js`

```javascript
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../public/data/visual-config.json');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function validateAssets() {
  console.log('🔍 Validating visual assets...\n');

  // Load config
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

  let errors = 0;
  let warnings = 0;

  function checkAsset(assetPath, description) {
    if (!assetPath) return;

    const fullPath = path.join(PUBLIC_DIR, assetPath);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing: ${description}`);
      console.error(`   Expected: ${assetPath}\n`);
      errors++;
    } else {
      console.log(`✅ Found: ${description}`);
    }
  }

  function checkOptionalAsset(assetPath, description, enabled) {
    if (!assetPath) return;

    if (enabled === false) {
      console.log(`⏭️  Skipped (disabled): ${description}`);
      return;
    }

    const fullPath = path.join(PUBLIC_DIR, assetPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Optional missing: ${description}`);
      console.warn(`   Expected: ${assetPath}\n`);
      warnings++;
    } else {
      console.log(`✅ Found: ${description}`);
    }
  }

  // Check logos
  console.log('\n📋 LOGOS:');
  checkAsset(config.logos.main.src, 'Main logo');
  checkAsset(config.logos.static.src, 'Static logo');

  // Check backgrounds
  console.log('\n📋 BACKGROUNDS:');
  Object.entries(config.backgrounds).forEach(([key, bg]) => {
    if (bg.type === 'image' && bg.src) {
      checkAsset(bg.src, `Background: ${key}`);
    } else if (bg.fallbackImage) {
      checkOptionalAsset(bg.fallbackImage, `Background fallback: ${key}`, false);
    }
  });

  // Check borders
  console.log('\n📋 BORDERS:');
  Object.entries(config.borders).forEach(([key, border]) => {
    checkOptionalAsset(border.src, `Border: ${key}`, border.enabled);
  });

  // Check locations
  console.log('\n📋 LOCATIONS:');
  Object.entries(config.locations).forEach(([key, location]) => {
    if (location.main) {
      checkAsset(location.main.src, `Location main: ${key}`);
    }
    if (location.thumbnail) {
      checkOptionalAsset(location.thumbnail.src, `Location thumbnail: ${key}`, true);
    }
  });

  // Check portraits
  console.log('\n📋 PORTRAITS:');
  checkAsset(config.portraits.defaultPortrait, 'Default portrait');

  // Check UI assets
  console.log('\n📋 UI ASSETS:');
  Object.entries(config.ui).forEach(([key, asset]) => {
    checkOptionalAsset(asset.src, `UI: ${key}`, asset.enabled);
  });

  // Check overlays
  if (config.overlays) {
    console.log('\n📋 OVERLAYS:');
    Object.entries(config.overlays).forEach(([key, overlay]) => {
      checkOptionalAsset(overlay.src, `Overlay: ${key}`, overlay.enabled);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VALIDATION SUMMARY:');
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);

  if (errors === 0 && warnings === 0) {
    console.log('\n✨ All assets validated successfully!');
  } else if (errors === 0) {
    console.log('\n✅ No critical errors. Warnings are for optional assets.');
  } else {
    console.log('\n❗ Please add missing required assets before building.');
    process.exit(1);
  }
}

validateAssets().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
```

**Add to package.json:**
```json
{
  "scripts": {
    "validate-assets": "node scripts/validate-assets.js",
    "prebuild": "npm run validate-assets"
  }
}
```

#### 6.2 Asset Preview Tool

**Create:** `/app/asset-preview/page.tsx`

```tsx
'use client';

import { useVisualAssets } from '@/lib/hooks/useVisualAssets';
import SmartImage from '@/components/shared/SmartImage';
import CharacterPortrait from '@/components/shared/CharacterPortrait';
import LocationArt from '@/components/shared/LocationArt';
import ConfigurableBackground from '@/components/shared/ConfigurableBackground';
import styles from './preview.module.css';

export default function AssetPreview() {
  const { config, loading } = useVisualAssets();

  if (loading) {
    return <div className={styles.loading}>Loading asset configuration...</div>;
  }

  if (!config) {
    return <div className={styles.error}>Failed to load asset configuration.</div>;
  }

  return (
    <div className={styles.previewContainer}>
      <h1>🎨 Visual Asset Preview</h1>
      <p className={styles.subtitle}>Theme: {config.theme} (v{config.version})</p>

      <section className={styles.section}>
        <h2>Logos</h2>
        <div className={styles.grid}>
          <div className={styles.assetCard}>
            <h3>Main Logo</h3>
            <SmartImage assetKey="logos.main" alt="Main Logo" className={styles.logo} />
            <code>{config.logos.main.src}</code>
          </div>
          <div className={styles.assetCard}>
            <h3>Static Logo</h3>
            <SmartImage assetKey="logos.static" alt="Static Logo" className={styles.logo} />
            <code>{config.logos.static.src}</code>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Backgrounds</h2>
        <div className={styles.grid}>
          {Object.entries(config.backgrounds).map(([key, bg]) => (
            <div key={key} className={styles.assetCard}>
              <h3>{key}</h3>
              <div className={styles.bgPreview}>
                <ConfigurableBackground variant={key} />
              </div>
              <code>Type: {bg.type}</code>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Locations</h2>
        <div className={styles.grid}>
          {Object.entries(config.locations).map(([key, location]) => (
            <div key={key} className={styles.assetCard}>
              <h3>{key}</h3>
              <LocationArt locationKey={key} variant="main" />
              <code>{location.main.src}</code>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Color Scheme</h2>
        <div className={styles.colorGrid}>
          {Object.entries(config.colorScheme).map(([name, color]) => (
            <div key={name} className={styles.colorSwatch}>
              <div
                className={styles.colorBox}
                style={{ backgroundColor: color }}
              />
              <div className={styles.colorLabel}>
                <strong>{name}</strong>
                <code>{color}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Configuration JSON</h2>
        <pre className={styles.jsonPreview}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </section>
    </div>
  );
}
```

**Create:** `/app/asset-preview/preview.module.css`

```css
.previewContainer {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: var(--background);
  color: var(--text-light);
}

.loading, .error {
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
}

.subtitle {
  color: var(--accent-dark);
  margin-bottom: 2rem;
}

.section {
  margin: 3rem 0;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.section h2 {
  color: var(--accent-main);
  margin-bottom: 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.assetCard {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--primary-light);
}

.assetCard h3 {
  color: var(--accent-main);
  margin-bottom: 1rem;
  text-transform: capitalize;
}

.assetCard code {
  display: block;
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--accent-dark);
  word-break: break-all;
}

.logo {
  max-width: 200px;
  max-height: 200px;
}

.bgPreview {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--primary-medium);
}

.colorGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.colorSwatch {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.colorBox {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid white;
  flex-shrink: 0;
}

.colorLabel {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.colorLabel code {
  font-size: 0.85rem;
  color: var(--accent-dark);
}

.jsonPreview {
  background: rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  color: var(--accent-dark);
  max-height: 500px;
  overflow-y: auto;
}
```

**Access:** Navigate to `http://localhost:3000/asset-preview` during development

#### 6.3 Documentation

**Create:** `/docs/VISUAL_ASSETS.md`

```markdown
# Visual Assets Guide

## Overview

Chronicles of the Kethaneum uses a modular visual asset system that allows you to easily swap logos, backgrounds, borders, location art, and other visual content by updating configuration files and organizing assets in designated directories.

## Quick Start: Swapping Visual Content

### Method 1: Replace Individual Assets

1. Navigate to `/public/images/[category]/`
2. Replace the file with your new asset (keep the same filename)
3. Rebuild the project: `npm run build`

**Example:** To replace the logo:
- Place your new logo at `/public/images/logos/logo-glow.png`
- No code changes needed!

### Method 2: Create a New Theme

1. Organize your assets in `/public/images/themes/[theme-name]/`
2. Create `/public/data/visual-config-[theme-name].json`
3. Copy the structure from `visual-config.json` and update paths
4. Set environment variable: `NEXT_PUBLIC_THEME=theme-name`
5. Rebuild

## Configuration File Reference

### visual-config.json Structure

```json
{
  "theme": "default",
  "version": "1.0.0",
  "logos": { ... },
  "backgrounds": { ... },
  "borders": { ... },
  "locations": { ... },
  "portraits": { ... },
  "ui": { ... },
  "overlays": { ... },
  "colorScheme": { ... }
}
```

### Asset Types

#### Logos
```json
"logos": {
  "main": {
    "src": "/images/logos/logo-glow.png",
    "alt": "Game Logo",
    "width": 400,
    "height": 400
  }
}
```

#### Backgrounds
```json
"backgrounds": {
  "title": {
    "type": "image",                    // or "procedural"
    "src": "/images/backgrounds/title-bg.png",
    "fallbackImage": "/images/fallback.png"
  }
}
```

**Background Types:**
- `"procedural"`: Uses code-generated cosmic background (current default)
- `"image"`: Loads an image file

#### Borders
```json
"borders": {
  "modal": {
    "src": "/images/borders/modal-border.png",
    "sliceSize": 32,          // For 9-slice scaling
    "enabled": true           // Set false to use CSS styling instead
  }
}
```

#### Locations
```json
"locations": {
  "library": {
    "main": {
      "src": "/images/locations/library-main.png",
      "alt": "The Grand Library",
      "width": 800,
      "height": 600
    },
    "thumbnail": {
      "src": "/images/locations/library-thumb.png",
      "width": 200,
      "height": 150
    }
  }
}
```

#### Character Portraits
```json
"portraits": {
  "basePath": "/images/portraits/",
  "defaultPortrait": "/images/portraits/default.png",
  "format": "png",
  "dimensions": { "width": 150, "height": 150 }
}
```

**File naming:** `[character-id].png` (e.g., `character-001.png`, `sage.png`)

#### UI Assets
```json
"ui": {
  "buttonBackground": {
    "src": "/images/ui/button-bg.png",
    "enabled": false
  }
}
```

#### Overlays
```json
"overlays": {
  "vignette": {
    "src": "/images/overlays/vignette.png",
    "opacity": 0.3,
    "enabled": true
  },
  "texture": {
    "src": "/images/overlays/texture.png",
    "opacity": 0.1,
    "blend": "overlay",
    "enabled": true
  }
}
```

#### Color Scheme
```json
"colorScheme": {
  "primary-dark": "#441648",
  "primary-medium": "#793385",
  "primary-light": "#ad51be",
  "accent-main": "#fef3c7",
  "accent-dark": "#fde68a",
  "text-light": "#f0ebe3",
  "background": "#1a0b1e"
}
```

Colors are applied as CSS variables: `--primary-dark`, `--accent-main`, etc.

## Asset Specifications

### Recommended Formats

| Asset Type | Format | Recommended Size | Notes |
|------------|--------|-----------------|-------|
| Logos | PNG | 400x400px | With transparency |
| Backgrounds | JPG/PNG | 1920x1080px | JPG for smaller files |
| Borders | PNG | Variable | 9-slice compatible, power of 2 |
| Portraits | PNG | 150x150px or 300x300px | Square, retina option |
| Location Art | PNG/JPG | 800x600px | 4:3 ratio recommended |
| Overlays | PNG | 1920x1080px | With transparency |

### File Naming Convention

- Use lowercase with hyphens: `library-main.png`, `modal-border.png`
- Character portraits by ID: `character-001.png`, `sage.png`
- Variants with suffixes: `logo-static.png`, `logo-animated.png`

### 9-Slice Borders

For borders that need to stretch without distortion:

1. Create a square image (e.g., 96x96px)
2. Design corners in the outer 32x32px regions
3. Design repeatable edges in the middle sections
4. Set `"sliceSize": 32` in config
5. The component will automatically handle stretching

**Example structure:**
```
┌─────────┬─────────┬─────────┐
│ Corner  │  Edge   │ Corner  │ 32px
├─────────┼─────────┼─────────┤
│  Edge   │ Center  │  Edge   │ 32px
├─────────┼─────────┼─────────┤
│ Corner  │  Edge   │ Corner  │ 32px
└─────────┴─────────┴─────────┘
   32px       32px      32px
```

## Directory Structure

```
/public/images/
├── logos/
│   ├── logo-glow.png
│   └── logo-static.png
├── backgrounds/
│   ├── title-bg.png
│   ├── library-bg.png
│   └── puzzle-bg.png
├── borders/
│   ├── modal-border.png
│   ├── panel-border.png
│   └── portrait-frame.png
├── locations/
│   ├── library-main.png
│   └── library-thumb.png
├── portraits/
│   ├── default.png
│   └── [character-id].png
├── ui/
│   ├── button-bg.png
│   ├── divider.png
│   └── icons/
├── overlays/
│   ├── vignette.png
│   └── texture.png
└── themes/
    ├── cyberpunk/
    │   ├── logos/
    │   ├── backgrounds/
    │   └── ...
    └── winter/
        └── ...
```

## Using Components

### SmartImage

Load any image from config:

```tsx
import SmartImage from '@/components/shared/SmartImage';

<SmartImage
  assetKey="logos.main"
  alt="Game Logo"
  className={styles.logo}
/>
```

### ConfigurableBackground

Render backgrounds (image or procedural):

```tsx
import ConfigurableBackground from '@/components/shared/ConfigurableBackground';

<ConfigurableBackground variant="title" overlay={true} />
```

### LocationArt

Display location artwork:

```tsx
import LocationArt from '@/components/shared/LocationArt';

<LocationArt
  locationKey="library"
  variant="main"
  className={styles.locationImage}
/>
```

### CharacterPortrait

Show character portraits:

```tsx
import CharacterPortrait from '@/components/shared/CharacterPortrait';

<CharacterPortrait
  characterId="sage"
  size="medium"
  showBorder={true}
/>
```

### DecorativeBorder

Wrap content with decorative borders:

```tsx
import DecorativeBorder from '@/components/shared/DecorativeBorder';

<DecorativeBorder borderKey="modal">
  <div>Modal content</div>
</DecorativeBorder>
```

## Development Tools

### Asset Validation

Validate that all configured assets exist:

```bash
npm run validate-assets
```

This runs automatically before builds.

### Asset Preview

View all configured assets at once:

```bash
npm run dev
# Navigate to http://localhost:3000/asset-preview
```

Shows:
- All logos
- All backgrounds (with live preview)
- All location art
- Color scheme swatches
- Full configuration JSON

### Theme Switching

#### Development
Set in `.env.local`:
```
NEXT_PUBLIC_THEME=cyberpunk
```

#### Production Build
```bash
NEXT_PUBLIC_THEME=winter npm run build
```

## Creating a New Theme

### Step-by-Step

1. **Create asset directory**
   ```bash
   mkdir -p public/images/themes/my-theme/{logos,backgrounds,borders,locations,portraits,ui,overlays}
   ```

2. **Add your assets**
   Place all your custom images in the appropriate subdirectories.

3. **Create theme config**
   ```bash
   cp public/data/visual-config.json public/data/visual-config-my-theme.json
   ```

4. **Update config**
   Edit `visual-config-my-theme.json`:
   - Change `"theme": "my-theme"`
   - Update all `src` paths to point to your theme directory
   - Customize color scheme
   - Update metadata

5. **Test theme**
   ```bash
   NEXT_PUBLIC_THEME=my-theme npm run dev
   ```

6. **Validate**
   ```bash
   npm run validate-assets
   ```

7. **Preview**
   Navigate to `/asset-preview` to see all your assets.

### Theme Config Template

```json
{
  "theme": "my-theme",
  "version": "1.0.0",
  "metadata": {
    "name": "My Custom Theme",
    "author": "Your Name",
    "description": "A beautiful custom theme"
  },
  "logos": {
    "main": {
      "src": "/images/themes/my-theme/logos/logo-glow.png",
      "alt": "My Theme Logo",
      "width": 400,
      "height": 400
    },
    "static": {
      "src": "/images/themes/my-theme/logos/logo-static.png",
      "alt": "My Theme Logo",
      "width": 400,
      "height": 400
    }
  },
  "backgrounds": {
    "title": {
      "type": "image",
      "src": "/images/themes/my-theme/backgrounds/title-bg.png"
    }
  },
  "colorScheme": {
    "primary-dark": "#your-color",
    "primary-medium": "#your-color",
    "primary-light": "#your-color",
    "accent-main": "#your-color",
    "accent-dark": "#your-color",
    "text-light": "#your-color",
    "background": "#your-color"
  }
}
```

## Troubleshooting

### Assets Not Loading

1. Check file paths in `visual-config.json` are correct
2. Run `npm run validate-assets` to find missing files
3. Ensure assets are in `/public/images/` (not `/images/`)
4. Check browser console for 404 errors
5. Clear Next.js cache: `rm -rf .next` and rebuild

### Borders Not Showing

1. Check `"enabled": true` in config
2. Verify `sliceSize` matches your border design
3. Ensure border image is square and dimensions are correct
4. Check that parent container has content (borders need something to wrap)

### Portraits Not Loading

1. Verify character ID matches filename (case-sensitive)
2. Check `portraits.basePath` in config
3. Ensure default portrait exists as fallback
4. Character IDs should match those in character data files

### Colors Not Updating

1. Check `colorScheme` in config
2. Clear browser cache
3. Verify CSS variables are being applied (inspect element in DevTools)
4. Rebuild project after config changes

### Theme Not Switching

1. Verify theme config file exists: `visual-config-[theme-name].json`
2. Check `NEXT_PUBLIC_THEME` environment variable is set correctly
3. Restart dev server after changing environment variables
4. For production: rebuild with theme env var set

## Performance Optimization

### Image Optimization

Even though Next.js images are unoptimized (for static export), you should still:

1. **Compress images** before adding them:
   - Use tools like TinyPNG, ImageOptim, or Squoosh
   - Target: < 200KB for backgrounds, < 50KB for UI assets

2. **Use appropriate formats**:
   - PNG for images with transparency
   - JPG for photographs and complex backgrounds
   - Consider WebP with PNG/JPG fallbacks

3. **Provide correct dimensions**:
   - Don't use 4K images if displaying at 800px
   - Match dimensions to actual display size

### Preloading

Critical images are preloaded automatically by the `useVisualAssets` hook. For additional preloading:

```typescript
import { preloadImages } from '@/lib/utils/assetPath';

// Preload an array of image paths
await preloadImages([
  '/images/logos/logo-glow.png',
  '/images/locations/library-main.png'
]);
```

### Lazy Loading

Non-critical assets load on-demand. Components like `SmartImage` handle this automatically.

## Best Practices

1. **Always validate** before committing: `npm run validate-assets`
2. **Use the preview tool** to visually verify themes
3. **Keep file sizes reasonable** (< 200KB for most assets)
4. **Maintain consistent dimensions** within each asset category
5. **Provide fallbacks** for optional assets (set `enabled: false`)
6. **Document custom themes** with metadata in config
7. **Version your configs** when making breaking changes
8. **Test on multiple screen sizes** especially for backgrounds
9. **Use descriptive filenames** that match their purpose
10. **Keep themes organized** in separate subdirectories

## API Reference

### useVisualAssets Hook

```typescript
const {
  config,           // Full visual config object
  loading,          // Loading state
  error,            // Error state
  getLogo,          // Get logo asset (variant: 'main' | 'static')
  getBackground,    // Get background config (key: string)
  getBorder,        // Get border src if enabled (key: string)
  getLocation,      // Get location assets (key: string)
  getPortrait,      // Get portrait path (characterId: string)
  getUIAsset,       // Get UI asset if enabled (key: string)
  applyColorScheme  // Manually reapply color scheme
} = useVisualAssets();
```

### Asset Path Utilities

```typescript
import {
  getAssetPath,      // Get path with basePath
  getImagePath,      // Get image path with basePath
  preloadImage,      // Preload single image
  preloadImages,     // Preload multiple images
  imageExists        // Check if image exists
} from '@/lib/utils/assetPath';
```

## Examples

### Seasonal Theme Switching

Create configs for each season and switch based on date:

```typescript
// In a custom hook or component
function useSeasonalTheme() {
  const month = new Date().getMonth();

  if (month >= 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

// Set in environment or load dynamically
```

### User-Selectable Themes

Allow players to choose themes:

```typescript
'use client';

import { useState } from 'react';

const AVAILABLE_THEMES = ['default', 'cyberpunk', 'winter', 'vintage'];

export default function ThemeSelector() {
  const [theme, setTheme] = useState('default');

  function changeTheme(newTheme: string) {
    localStorage.setItem('selectedTheme', newTheme);
    // Trigger reload to apply new theme
    window.location.reload();
  }

  return (
    <select value={theme} onChange={(e) => changeTheme(e.target.value)}>
      {AVAILABLE_THEMES.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}
```

### A/B Testing Themes

Use different themes for different users:

```typescript
// Randomly assign theme on first visit
function getAssignedTheme() {
  let theme = localStorage.getItem('abTestTheme');

  if (!theme) {
    theme = Math.random() < 0.5 ? 'default' : 'variant-a';
    localStorage.setItem('abTestTheme', theme);
  }

  return theme;
}
```

## Support

For issues or questions:
1. Check this documentation
2. Run asset validation: `npm run validate-assets`
3. Use asset preview tool: `/asset-preview`
4. Check browser console for errors
5. Review config file syntax (valid JSON)

## Changelog

### v1.0.0
- Initial modular visual asset system
- Configuration-based asset management
- Theme switching support
- Reusable visual components
- Asset validation and preview tools
```

---

## Implementation Checklist

Use this checklist to track implementation progress:

### Phase 1: Configuration
- [ ] Create `/public/data/visual-config.json`
- [ ] Create example alternate theme config
- [ ] Add theme environment variable support

### Phase 2: Directory Organization
- [ ] Create new directory structure in `/public/images/`
- [ ] Move existing assets to new locations
- [ ] Create placeholder images for missing assets
- [ ] Update `.gitkeep` files if needed

### Phase 3: Asset Management
- [ ] Create `/lib/types/visual-assets.ts`
- [ ] Extend `/lib/utils/assetPath.ts`
- [ ] Create `/lib/hooks/useVisualAssets.ts`
- [ ] Add VisualAssetsProvider to layout

### Phase 4: Visual Components
- [ ] Create `SmartImage.tsx`
- [ ] Create `ConfigurableBackground.tsx`
- [ ] Create `DecorativeBorder.tsx`
- [ ] Create `LocationArt.tsx`
- [ ] Create `CharacterPortrait.tsx`

### Phase 5: Integration
- [ ] Update title screen (`/app/page.tsx`)
- [ ] Update library page (`/app/library/page.tsx`)
- [ ] Update modal components
- [ ] Replace all `CosmicBackground` with `ConfigurableBackground`
- [ ] Add character portraits to dialogue

### Phase 6: Developer Tools
- [ ] Create `/scripts/validate-assets.js`
- [ ] Create `/app/asset-preview/page.tsx`
- [ ] Create `/docs/VISUAL_ASSETS.md`
- [ ] Add npm scripts to `package.json`
- [ ] Test theme switching
- [ ] Test asset validation

### Testing
- [ ] Test with all assets present
- [ ] Test with missing assets (fallbacks)
- [ ] Test procedural backgrounds still work
- [ ] Test theme switching
- [ ] Test on multiple screen sizes
- [ ] Test build process
- [ ] Test GitHub Pages deployment
- [ ] Validate all assets
- [ ] Review asset preview page

### Documentation
- [ ] Document custom assets in game
- [ ] Update README with theme info
- [ ] Create theme creation guide
- [ ] Add troubleshooting section

---

## Estimated Implementation Time

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Configuration | 1-2 hours |
| Phase 2: Directory Organization | 30 minutes |
| Phase 3: Asset Management | 2-3 hours |
| Phase 4: Visual Components | 2-3 hours |
| Phase 5: Integration | 2-3 hours |
| Phase 6: Developer Tools | 1-2 hours |
| Testing & Polish | 1-2 hours |
| **Total** | **10-16 hours** |

---

## Future Enhancements

Ideas for extending this system:

1. **Animation Support**
   - Animated backgrounds (video, GIF, animated PNG)
   - Sprite sheet animations for characters
   - Particle effects configuration

2. **Audio Theme Integration**
   - Music and sound effects per theme
   - Background ambient sounds

3. **Dynamic Asset Loading**
   - CDN support for large asset libraries
   - Progressive image loading
   - Asset streaming

4. **Theme Builder UI**
   - In-game theme customization
   - Visual theme editor
   - Asset upload interface

5. **Accessibility Features**
   - High contrast themes
   - Dyslexia-friendly fonts
   - Motion-reduced variants

6. **Community Themes**
   - Theme marketplace
   - User-submitted themes
   - Rating system

7. **Advanced Borders**
   - Animated borders
   - Particle borders
   - SVG borders with custom shapes

8. **Responsive Assets**
   - Different images for mobile/desktop
   - Retina display support
   - Art direction with srcset

---

## Notes for Future Implementation

### Current State
- Basic visual system with hardcoded paths
- Procedural backgrounds working well
- Asset path utilities exist but only used for data
- CSS variables for colors already implemented
- Placeholders ready for location art and portraits

### Key Considerations
1. **Backward Compatibility**: System must support existing procedural backgrounds
2. **GitHub Pages**: Static export means no server-side image optimization
3. **Performance**: Keep bundle size reasonable, use lazy loading
4. **Gradual Adoption**: `enabled` flags allow implementing features incrementally
5. **Type Safety**: TypeScript types prevent runtime errors

### Related Files to Review
- `/lib/utils/assetPath.ts` - Already handles basePath for GitHub Pages
- `/components/shared/CosmicBackground.tsx` - Current background system
- `/public/data/dialogue-config.json` - References portrait directory
- `/app/globals.css` - CSS variables for colors

### Gotchas
- Remember to use `getImagePath()` for all image sources (GitHub Pages basePath)
- Border images need proper 9-slice design to stretch correctly
- Character portrait IDs must match between config and data files
- Theme switching requires rebuild (environment variable)
- Validate assets before deployment to catch missing files

---

**End of Implementation Plan**

Last Updated: 2025-11-18
