import path from 'path';

/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@unerp/ui', '@unerp/shared', '@unerp/auth'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@unerp/ui'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
