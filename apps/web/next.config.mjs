/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@unerp/ui', '@unerp/shared', '@unerp/auth'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@unerp/ui'],
  },
};

export default nextConfig;
