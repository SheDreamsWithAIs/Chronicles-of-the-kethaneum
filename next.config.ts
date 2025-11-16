import type { NextConfig } from "next";

const basePath = '/Chronicles-of-the-kethaneum';

const nextConfig: NextConfig = {
  output: 'export', // Static export for GitHub Pages
  basePath: basePath, // Your GitHub repo name
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
