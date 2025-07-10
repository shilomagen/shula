import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    authInterrupts: true,
  },

  // Configure image optimization for Docker environment
  images: {
    domains: ['admin.moments.services', '0.0.0.0', 'localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization in production if needed
    // unoptimized: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
