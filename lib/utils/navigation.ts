/**
 * Navigation utilities for handling basePath in GitHub Pages
 * 
 * When deploying to GitHub Pages with basePath configured,
 * all navigation needs to include the basePath prefix.
 */

// Get basePath from environment variable (set during build)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Prepends the configured basePath to a route path
 * @param path - The route path (e.g., '/backstory')
 * @returns The full path with basePath (e.g., '/Chronicles-of-the-kethaneum/backstory')
 */
export function getRoutePath(path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If BASE_PATH is set, prepend it
  if (BASE_PATH) {
    return `${BASE_PATH}${cleanPath}`;
  }
  
  // Otherwise return path as-is
  return cleanPath;
}

/**
 * Navigate to a route with basePath support
 * Use this instead of window.location.href for routes
 * @param path - The route path
 */
export function navigateTo(path: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = getRoutePath(path);
  }
}

