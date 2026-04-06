/**
 * Keep dev and production caches separate: running `next build` then `next dev`
 * against the same `.next` folder often causes missing chunk errors (e.g.
 * Cannot find module './8948.js'), 500 pages, and styles/scripts not loading.
 * `next dev` writes to `.next-dev`; `next build` / `next start` use `.next`.
 * Override with env NEXT_DIST_DIR if needed.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Added for production deployment (Hostinger/VPS)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  /** Client-only: longer chunk load timeout in dev (does not touch server bundles). */
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && config.output) {
      config.output.chunkLoadTimeout = 300000;
    }
    return config;
  },
};

export default nextConfig;
