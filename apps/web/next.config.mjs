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
  // Type and lint errors fail the build. Previously both were ignored, which
  // let type errors ship (see the hardening plan). tsc --noEmit and next lint
  // are green; keep them that way — the CI typecheck gate is the backstop.
};

export default nextConfig;
