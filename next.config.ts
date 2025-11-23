import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Only use static export in production - allows API routes in development
  ...(isProd ? { output: 'export' } : {}),
  images: {
    unoptimized: true, // Required for static export
  },
  // Note: The Next.js dev overlay only appears in development mode.
  // Production builds (npm run build) won't include it, so it won't
  // interfere with the deployed game on GitHub Pages.
  // Development tools (app/tools and app/api) are excluded
  // from TypeScript checking and moved out of the way during build via
  // the build-production.js script.
};

export default nextConfig;
