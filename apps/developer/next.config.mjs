/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,

  // The developer platform had no Next config at all, so it inherited the
  // defaults — and the default treatment of a workspace package is to bundle it.
  // @unerp/ui ships CSS modules beside its compiled components, and Next refuses
  // to process CSS modules that come from node_modules, so every page failed
  // with `Module not found: Can't resolve './badge.module.css'` even though the
  // file was sitting right there. The web app already solved this: treat the
  // design system as a server-external package and let Next require its
  // prebuilt output instead of re-bundling it.
  serverExternalPackages: ['@unerp/ui', '@unerp/framework'],

  // Only packages that ship TypeScript source AND import no CSS belong here.
  transpilePackages: ['@unerp/shared'],

  experimental: {
    // Meant for large third-party barrel packages. Applying it to a local
    // workspace package alongside transpilePackages produced duplicate module
    // instances and null-hook crashes in web; do not add @unerp/* here.
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
};

export default nextConfig;
