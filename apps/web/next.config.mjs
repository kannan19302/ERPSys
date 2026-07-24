import path from 'path';

/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

const nextConfig = {
  // Force webpack to poll for file changes instead of relying on inotify,
  // which doesn't fire reliably on Docker Desktop bind mounts (Windows).
  // Polling is already set via WATCHPACK_POLLING=1000 in the Docker env,
  // but this explicit config ensures it works even if that env var is absent.
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...(config.watchOptions || {}),
      poll: 1000,
      aggregateTimeout: 300,
    };
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@unerp/ui-tokens': path.resolve(process.cwd(), '../../packages/ui-tokens/src/index.ts'),
      '@unerp/ui-theme': path.resolve(process.cwd(), '../../packages/ui-theme/src/index.ts'),
      '@unerp/ui-components': path.resolve(process.cwd(), '../../packages/ui-components/src/index.ts'),
      '@unerp/ui-layout': path.resolve(process.cwd(), '../../packages/ui-layout/src/index.ts'),
      '@unerp/ui-charts': path.resolve(process.cwd(), '../../packages/ui-charts/src/index.ts'),
      '@unerp/ui-data-grid': path.resolve(process.cwd(), '../../packages/ui-data-grid/src/index.ts'),
      '@unerp/ui-dashboard': path.resolve(process.cwd(), '../../packages/ui-dashboard/src/index.ts'),
      '@unerp/ui-notifications': path.resolve(process.cwd(), '../../packages/ui-notifications/src/index.ts'),
      '@unerp/ui-hooks': path.resolve(process.cwd(), '../../packages/ui-hooks/src/index.ts'),
      '@unerp/ui-utils': path.resolve(process.cwd(), '../../packages/ui-utils/src/index.ts'),
      '@unerp/ui-icons': path.resolve(process.cwd(), '../../packages/ui-icons/src/index.ts'),
      '@unerp/ui-form-engine': path.resolve(process.cwd(), '../../packages/ui-form-engine/src/index.ts'),
      '@unerp/ui-workflow': path.resolve(process.cwd(), '../../packages/ui-workflow/src/index.ts'),
      '@unerp/ui/styles': path.resolve(process.cwd(), '../../packages/ui/src/styles/globals.css'),
      '@unerp/ui/tokens': path.resolve(process.cwd(), '../../packages/ui/src/tokens/design-tokens.css'),
      '@unerp/ui': path.resolve(process.cwd(), '../../packages/ui/src/index.ts'),
    };
    return config;
  },
  reactStrictMode: true,
  transpilePackages: [
    '@unerp/ui',
    '@unerp/ui-tokens',
    '@unerp/ui-theme',
    '@unerp/ui-components',
    '@unerp/ui-layout',
    '@unerp/ui-charts',
    '@unerp/ui-data-grid',
    '@unerp/ui-dashboard',
    '@unerp/ui-notifications',
    '@unerp/ui-hooks',
    '@unerp/ui-utils',
    '@unerp/ui-icons',
    '@unerp/ui-form-engine',
    '@unerp/ui-workflow',
    '@unerp/shared',
    '@unerp/auth',
  ],
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
  // Settings-to-SaaS-Portal migration (Phase 3): legacy `/settings/*` admin
  // pages are being consolidated onto `/saas/*`. These are temporary (307)
  // redirects, not permanent, since some legacy pages still exist for parity
  // checking during the migration. Kept as a hand-written array here (not an
  // import of `apps/web/src/navigation/settingsRedirects.ts`) because
  // `next.config.mjs` runs under plain Node before the app's TS/webpack
  // pipeline is available — see the comment at the top of that file for the
  // full explanation. If you change a mapping, update both places.
  //
  // ── Ordering rules ──
  //  1. Exact-match (no wildcard) before prefix-match (with `/:path*`),
  //     so `/settings/sso` hits the exact rule before `/settings/:path*`.
  //  2. More specific before less specific.
  async redirects() {
    return [
      // ── Identity & Access ──
      { source: '/settings/identity-access', destination: '/saas/security', permanent: false },
      { source: '/settings/access-control/matrix', destination: '/saas/security?tab=permissions', permanent: false },
      { source: '/settings/impersonate', destination: '/saas/security?tab=impersonate', permanent: false },
      { source: '/settings/delegations', destination: '/saas/security?tab=delegations', permanent: false },

      // ── Security & Compliance ──
      { source: '/settings/security-policies', destination: '/saas/security', permanent: false },
      { source: '/settings/security/:path*', destination: '/saas/security/:path*', permanent: false },
      { source: '/settings/security', destination: '/saas/security', permanent: false },
      { source: '/settings/mfa', destination: '/saas/security?tab=mfa', permanent: false },
      { source: '/settings/sso', destination: '/saas/security?tab=sso', permanent: false },
      { source: '/settings/ip-restrictions', destination: '/saas/security?tab=ip-restrictions', permanent: false },
      { source: '/settings/sessions', destination: '/saas/security?tab=sessions', permanent: false },
      { source: '/settings/compliance-governance', destination: '/saas/compliance', permanent: false },
      { source: '/settings/compliance', destination: '/saas/compliance', permanent: false },
      { source: '/settings/gdpr/:path*', destination: '/saas/compliance?tab=erasure', permanent: false },
      { source: '/settings/gdpr', destination: '/saas/compliance?tab=erasure', permanent: false },

      // ── Automation & Workflows ──
      { source: '/settings/approval-operations', destination: '/workflows', permanent: false },
      { source: '/settings/workflow-builder', destination: '/builder/erp/workflows', permanent: false },
      { source: '/settings/automation-rules', destination: '/saas/admin?tab=automation', permanent: false },

      // ── Branding & Communication ──
      { source: '/settings/branding-communication', destination: '/saas/settings?tab=branding', permanent: false },
      { source: '/settings/general-branding', destination: '/saas/settings?tab=branding', permanent: false },

      // ── System Operations ──
      { source: '/settings/system-operations', destination: '/saas/admin', permanent: false },
      { source: '/settings/backups', destination: '/saas/admin?tab=backups', permanent: false },
      { source: '/settings/db-schema', destination: '/saas/admin?tab=db', permanent: false },
      { source: '/settings/bulk-operations', destination: '/saas/admin?tab=bulk', permanent: false },

      // ── Platform Configuration ──
      { source: '/settings/integrations', destination: '/saas/settings?tab=integrations', permanent: false },
      { source: '/settings/domains', destination: '/saas/settings?tab=domains', permanent: false },
      { source: '/settings/environments', destination: '/saas/admin?tab=environments', permanent: false },
      { source: '/settings/updates', destination: '/saas/admin?tab=updates', permanent: false },
      { source: '/settings/subscription', destination: '/saas/billing', permanent: false },
      { source: '/settings/org-hierarchy', destination: '/saas/team/org-hierarchy', permanent: false },

      // ── Data & Integration ──
      { source: '/settings/api-platform', destination: '/saas/api-keys', permanent: false },
      { source: '/settings/api-keys/:path*', destination: '/saas/api-keys/:path*', permanent: false },
      { source: '/settings/api-keys', destination: '/saas/api-keys', permanent: false },
      { source: '/settings/import-export', destination: '/saas/exports', permanent: false },
      { source: '/settings/import-export/:path*', destination: '/saas/exports/:path*', permanent: false },
      { source: '/settings/localization', destination: '/saas/settings?tab=localization', permanent: false },
      { source: '/settings/devops', destination: '/saas/admin?tab=devops', permanent: false },
      { source: '/settings/data-quality', destination: '/saas/admin?tab=data-quality', permanent: false },

      // ── Reports ──
      { source: '/settings/scheduled-reports', destination: '/saas/admin?tab=reports', permanent: false },
      { source: '/settings/activity-feed', destination: '/saas/admin?tab=activity', permanent: false },
      { source: '/settings/notifications', destination: '/saas/settings?tab=notifications', permanent: false },
      { source: '/settings/tenant-analytics', destination: '/saas/admin?tab=analytics', permanent: false },

      // ── Module Manager / Marketplace ──
      // Module Manager's enable/disable toggle is superseded by the
      // App Store's install/uninstall surface.
      { source: '/settings/modules', destination: '/apps/store', permanent: false },
      // `/settings/marketplace` (submissions review + catalog) is a
      // dead duplicate — catalog/browse overlaps `/apps/store`, submission
      // review overlaps `/apps/developer`'s Review tab.
      { source: '/settings/marketplace', destination: '/apps/store', permanent: false },

      // ── AI Assistant ──
      // Must be before the catch-all `/settings/:path*` below.
      { source: '/settings/ai', destination: '/ai/settings', permanent: false },

      // ── Legacy settings index ──
      // Exact match before wildcard (/:path* with * matches zero segments
      // too, so ordering matters per the file's documented conventions).
      { source: '/settings', destination: '/saas/portal', permanent: false },
      { source: '/settings/:path*', destination: '/saas/portal/:path*', permanent: false },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
