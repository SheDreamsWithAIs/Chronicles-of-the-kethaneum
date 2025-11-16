/**
 * Utility for handling asset paths with Next.js basePath
 *
 * When deploying to GitHub Pages with basePath configured,
 * all asset paths need to include the basePath prefix.
 */

// Get basePath from next.config.ts
// In production builds, this will be injected by Next.js
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';

/**
 * Prepends the configured basePath to an asset path
 * @param path - The asset path (e.g., '/data/puzzles.json')
 * @returns The full path with basePath (e.g., '/Chronicles-of-the-kethaneum/data/puzzles.json')
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // If BASE_PATH is set, prepend it
  if (BASE_PATH) {
    return `${BASE_PATH}/${cleanPath}`;
  }

  // Otherwise return path as-is with leading slash
  return `/${cleanPath}`;
}

/**
 * Fetches an asset with the correct basePath
 * @param path - The asset path
 * @param init - Optional fetch init options
 * @returns Fetch response
 */
export async function fetchAsset(path: string, init?: RequestInit): Promise<Response> {
  const fullPath = getAssetPath(path);
  return fetch(fullPath, init);
}
