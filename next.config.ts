import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
// GitHub Pages basePath - only set if NEXT_PUBLIC_BASE_PATH is provided
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  // Only use static export in production - allows API routes in development
  ...(isProd ? { output: 'export' } : {}),
  // Set basePath for GitHub Pages (project pages need this)
  // basePath handles both routes and assets (_next/static) automatically
  ...(basePath ? { basePath } : {}),
  // For static export with basePath, assetPrefix should match basePath
  ...(basePath && isProd ? { assetPrefix: basePath } : {}),
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
