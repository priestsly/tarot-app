import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.IS_STATIC === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Make debugging easier on mobile
  productionBrowserSourceMaps: process.env.DEBUG_BUILD === 'true',
};

export default nextConfig;
