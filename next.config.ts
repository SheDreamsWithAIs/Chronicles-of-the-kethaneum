import type { NextConfig } from "next";

// Only use basePath in production (for GitHub Pages deployment)
// In development, we want to access the site at localhost:3000/ not localhost:3000/Chronicles-of-the-kethaneum/
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/Chronicles-of-the-kethaneum' : '';

const nextConfig: NextConfig = {
  output: 'export', // Static export for GitHub Pages
  basePath: basePath, // Your GitHub repo name (only in production)
  images: {
    unoptimized: true, // Required for static export
  },
  // Expose basePath as environment variable for asset loading
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Note: The Next.js dev overlay only appears in development mode.
  // Production builds (npm run build) won't include it, so it won't
  // interfere with the deployed game on GitHub Pages.
  // Development tools (app/tools and app/api/manifest-manager) are excluded
  // from TypeScript checking and moved out of the way during build via
  // the build-production.js script.
};

export default nextConfig;
