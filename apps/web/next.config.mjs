import path from 'path';

/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@unerp/ui', '@unerp/shared', '@unerp/auth'],
  experimental: {
    // NOTE: '@unerp/ui' was previously listed here alongside being in
    // transpilePackages. Applying both experimental.optimizePackageImports
    // (which rewrites the import graph to per-export deep imports) and
    // transpilePackages (which re-transpiles the whole package from source)
    // to the SAME local workspace package produced duplicate/inconsistent
    // module instances for its React-hook-using exports. That was the root
    // cause of "Cannot read properties of null (reading 'useState')" during
    // `next build` prerendering across dozens of unrelated dashboard pages
    // (and on the built-in /_error /500 page, which shares the root layout's
    // provider tree). optimizePackageImports is meant for large third-party
    // barrel packages like lucide-react — leave local workspace packages to
    // transpilePackages only.
    optimizePackageImports: ['lucide-react'],
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
