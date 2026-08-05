/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

const nextConfig = {
  // Platform Admin Console — internal tool, IP-allowlisted ingress.
  // This application runs on its own origin (admin.unierp.internal) with a
  // separate IdP realm and mandatory MFA per § 3.1 and Phase 1.
  reactStrictMode: true,

  // @unerp/ui ships CSS modules beside its compiled components, and Next refuses
  // to process CSS modules originating in node_modules. Without this the console
  // fails with `Module not found: Can't resolve './badge.module.css'` the moment
  // it renders anything from the design system — which its current landing route
  // does not, so the defect was latent rather than absent.
  serverExternalPackages: ['@unerp/ui', '@unerp/framework'],
  transpilePackages: ['@unerp/shared'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // The console talks to the control-plane router, never to /api/v1. Keeping the
  // proxy explicit means a console page cannot reach a tenant endpoint by
  // accident — the boundary § 3.1 describes is only real if it is wired.
  async rewrites() {
    return [
      {
        source: '/api/platform/v1/:path*',
        destination: `${apiBaseUrl}/api/platform/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
