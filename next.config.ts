import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default config;
