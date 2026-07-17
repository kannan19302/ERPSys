'use client';
import styles from './layout.module.css';
// This entire route group is an authenticated, client-only dashboard: every
// page validates its cookie-backed session and fetches tenant data client-side.
// There is no meaningful static HTML to produce for these routes, and
// attempting to statically prerender  pages at build time (Next's
// default when a page has no dynamic data fetching) causes prerender workers
// to blow up with "Cannot read properties of null (reading 'useState')" —
// forcing every page under (dashboard) onto the dynamic rendering path avoids
// the broken prerender pass entirely. See root-cause notes in git history.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { DemoBanner, Spinner, useTheme } from '@unerp/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, CreditCard, Users, BarChart3, Package, ClipboardList, 
  Settings, FolderOpen, ShoppingCart, ShoppingBag, Truck, Briefcase, 
  Hammer, PieChart, MessageSquare, Store, Globe, Activity, Cpu,
  FileText, LayoutGrid
} from 'lucide-react';


import { 
  getAppSpecificNavigation, formatSegment, allApplications, 
  switcherFolders, KERNEL_APP_IDS 
} from '@/navigation';
import { PermissionProvider } from '@/components/PermissionProvider';
import { AppSidebar } from '@/components/shell/AppSidebar';
import { AppHeader } from '@/components/shell/AppHeader';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { AICopilot } from '@/components/shell/AICopilot';
import { useApiClient } from '@unerp/framework';

const GLOBAL_SEARCH_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, type: 'App' },
  { name: 'Finance & Accounting', href: '/finance', icon: CreditCard, type: 'App' },
  { name: 'Human Resources', href: '/hr', icon: Users, type: 'App' },
  { name: 'CRM & Sales', href: '/crm', icon: BarChart3, type: 'App' },
  { name: 'Inventory & Stock', href: '/inventory', icon: Package, type: 'App' },
  { name: 'Procurement', href: '/procurement', icon: ShoppingCart, type: 'App' },
  { name: 'Sales & Orders', href: '/sales', icon: ClipboardList, type: 'App' },
  { name: 'Supply Chain', href: '/supply-chain', icon: Truck, type: 'App' },
  { name: 'Project Management', href: '/projects', icon: Briefcase, type: 'App' },
  { name: 'Manufacturing', href: '/manufacturing', icon: Hammer, type: 'App' },
  { name: 'Business Intelligence', href: '/analytics', icon: PieChart, type: 'App' },
  { name: 'Drive', href: '/drive', icon: FolderOpen, type: 'App' },
  { name: 'Connect', href: '/connect', icon: MessageSquare, type: 'App' },
  { name: 'POS & Retail', href: '/pos', icon: Store, type: 'App' },
  { name: 'E-Commerce', href: '/ecommerce', icon: Globe, type: 'App' },
  { name: 'Settings', href: '/settings', icon: Settings, type: 'App' },
  { name: 'Studio', href: '/builder', icon: Cpu, type: 'App' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useApiClient();
  const pathname = usePathname() || '';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  // Theme now lives in the root ThemeProvider (all design-system themes).
  // Downstream shell components only need a light/dark hint for their CSS pairs.
  const { resolvedTheme } = useTheme();
  const theme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';
  
  // Header Dropdowns visibility states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  
  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [dynamicAppNav, setDynamicAppNav] = useState<any>(null);

  useEffect(() => {
    if (!pathname.startsWith('/app/')) { setDynamicAppNav(null); return; }
    const slug = pathname.split('/')[2];
    if (!slug) { setDynamicAppNav(null); return; }
    let mounted = true;
    (async () => {
      try {
        const shell = await client.get<{ modules?: Array<{ enabled?: boolean; name: string; pages?: Array<{ title: string; slug: string; type?: string }> }>; app?: { name?: string } }>(`/admin/marketplace/installed/${slug}/modules`);
        const pageIcon = (t: string) => {
          const k = (t || '').toUpperCase();
          if (k === 'LIST') return ClipboardList;
          if (k === 'FORM') return FileText;
          if (k === 'DASHBOARD' || k === 'CUSTOM') return BarChart3;
          return LayoutGrid;
        };
        const items = [{ name: 'Overview', href: `/app/${slug}`, icon: Home }];
        if (slug === 'healthcare') items.push({ name: 'Clinical Tools', href: `/app/${slug}/clinical`, icon: Activity });
        for (const m of (shell.modules || []).filter((m: any) => m.enabled)) {
          items.push({
            name: m.name,
            isHeader: true,
            items: (m.pages || []).map((p: any) => ({ name: p.title, href: `/app/${slug}/${p.slug}`, icon: pageIcon(p.type) })),
          } as any);
        }
        items.push({ name: 'Manage Modules', isHeader: true, items: [{ name: 'Admin Console', href: `/app/${slug}?view=admin`, icon: Settings }] } as any);
        if (mounted) setDynamicAppNav({ slug, title: shell.app?.name || slug, icon: Activity, items });
      } catch { if (mounted) setDynamicAppNav(null); }
    })();
    return () => { mounted = false; };
  }, [pathname, client]);

  const userDropdownRef = React.useRef<HTMLDivElement>(null);
  const tenantDropdownRef = React.useRef<HTMLDivElement>(null);
  const appsDropdownRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; avatar?: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState<{ id?: string; name: string; slug: string }>({ name: '…', slug: '' });
  // Real memberships from the API — every tenant this account can sign in to.
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setTenantDropdownOpen(false);
      }
      if (appsDropdownRef.current && !appsDropdownRef.current.contains(event.target as Node)) {
        setAppsDropdownOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const profile = await client.get<{
          firstName: string;
          lastName: string;
          email: string;
          avatar?: string;
          tenant?: { name: string; slug: string };
        }>('/auth/me');
        if (!mounted) return;
        setUser(profile);
        if (profile.tenant) setCurrentTenant(profile.tenant);
        setIsLoading(false);

        client.get<Array<{ id: string; name: string; slug: string }>>('/auth/tenants')
          .then((list) => { if (mounted && Array.isArray(list)) setTenants(list); })
          .catch(() => { });

        const installedList = await client.get<string[]>('/saas/installed-apps');
        if (!mounted) return;
        setInstalledApps(installedList);
        const activeSegment = pathname.split('/')[1];
        const segmentToSlug: Record<string, string> = {
          education: 'education', 'real-estate': 'real-estate', 'field-service': 'field-service',
          finance: 'finance', hr: 'hr', crm: 'crm', inventory: 'inventory', procurement: 'procurement',
          sales: 'sales', 'supply-chain': 'supply-chain', projects: 'projects', manufacturing: 'manufacturing',
          analytics: 'analytics', drive: 'drive', storage: 'drive', connect: 'communication',
          communication: 'communication', pos: 'pos',
        };
        const guardedSlug = activeSegment ? segmentToSlug[activeSegment] : undefined;
        if (guardedSlug && !installedList.includes(guardedSlug)) router.push('/apps');

        client.get<{ loaded?: boolean }>('/admin/demo/status')
          .then((data) => { if (mounted && data?.loaded) setDemoDataLoaded(true); })
          .catch(() => { });
      } catch {
        if (mounted) router.push('/login');
      }
    };
    loadSession();
    return () => { mounted = false; };
  }, [router, pathname, client]);

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout');
    } catch { }
    router.push('/login');
  };

  const handleTenantSwitch = async (t: { name: string; slug: string }) => {
    setTenantDropdownOpen(false);
    if (t.slug === currentTenant.slug) return;
    try {
      // Server re-issues the session cookie scoped to the target tenant;
      // a full reload drops every tenant-scoped cache in one stroke.
      await client.post('/auth/switch-tenant', { tenantSlug: t.slug });
      window.location.assign('/apps');
    } catch {
      // Membership missing or revoked — leave the current session untouched.
    }
  };

  const isAppsLanding = pathname === '/apps' || pathname === '/apps/store';
  const hideSidebar = isAppsLanding || pathname === '/profile' || pathname.startsWith('/profile/');
  const appNav = (pathname.startsWith('/app/') && dynamicAppNav && dynamicAppNav.slug === pathname.split('/')[2])
    ? dynamicAppNav
    : getAppSpecificNavigation(pathname);

  const pathSegments = pathname.split('/').filter(Boolean);
  const showBreadcrumbs = !isAppsLanding && !pathname.startsWith('/builder') && pathSegments.length > 0;

  const breadcrumbsList = [];
  if (showBreadcrumbs) {
    breadcrumbsList.push({
      name: 'Apps',
      href: '/apps',
    });

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      if (segment === 'apps') return;

      breadcrumbsList.push({
        name: formatSegment(segment),
        href: currentPath,
      });
    });
  }

  const activeApps = allApplications.filter(app => KERNEL_APP_IDS.has(app.id) || installedApps.includes(app.id));
  const folderAppIds = switcherFolders.flatMap(f => f.appIds);
  const rootApps = activeApps.filter(app => !folderAppIds.includes(app.id));
  const visibleFolders = switcherFolders.filter(f => activeApps.filter(a => f.appIds.includes(a.id)).length > 0);

  const switcherItems = useMemo(() => [
    ...visibleFolders.map(folder => ({
      type: 'folder' as const,
      id: folder.id,
      name: folder.name,
      color: folder.color,
      apps: activeApps.filter(a => folder.appIds.includes(a.id)).sort((a, b) => a.name.localeCompare(b.name))
    })),
    ...rootApps.map(app => ({
      type: 'app' as const,
      id: app.id,
      name: app.name,
      href: app.href,
      icon: app.icon
    }))
  ].sort((a, b) => a.name.localeCompare(b.name)), [visibleFolders, activeApps, rootApps]);

  if (isLoading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PermissionProvider>
      <div
        suppressHydrationWarning
        className={styles.s2}
      >
        {/* Sidebar Component */}
        {!hideSidebar && (
          <AppSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            appNav={appNav}
            pathname={pathname}
            user={user}
          />
        )}

        {/* Main Workspace Section */}
        <div className={styles.s3}>
          {/* Header Component */}
          <AppHeader
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            theme={theme}
            currentTenant={currentTenant}
            tenants={tenants.length > 0 ? tenants : [currentTenant]}
            handleTenantSwitch={handleTenantSwitch}
            user={user}
            handleLogout={handleLogout}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            appsDropdownOpen={appsDropdownOpen}
            setAppsDropdownOpen={setAppsDropdownOpen}
            tenantDropdownOpen={tenantDropdownOpen}
            setTenantDropdownOpen={setTenantDropdownOpen}
            userDropdownOpen={userDropdownOpen}
            setUserDropdownOpen={setUserDropdownOpen}
            cmdPaletteOpen={cmdPaletteOpen}
            setCmdPaletteOpen={setCmdPaletteOpen}
            isAppsLanding={isAppsLanding}
            switcherItems={switcherItems}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            appsDropdownRef={appsDropdownRef}
            tenantDropdownRef={tenantDropdownRef}
            userDropdownRef={userDropdownRef}
            searchDropdownRef={searchDropdownRef}
            GLOBAL_SEARCH_ITEMS={GLOBAL_SEARCH_ITEMS}
          />

          {/* Content View Workspace */}
          <main
            id="main-content"
            role="main"
            style={{ padding: pathname.startsWith('/builder') ? '0' : 'var(--space-6) var(--space-8)' }} className={styles.s4}
          >
            <div style={{ maxWidth: pathname.startsWith('/builder') ? '100%' : 'var(--content-max-width)' }} className={styles.s5}>
              {showBreadcrumbs && breadcrumbsList.length > 0 && (
                <nav className="ui-breadcrumb" aria-label="breadcrumb">
                  {breadcrumbsList.map((crumb, idx) => {
                    const isLast = idx === breadcrumbsList.length - 1;
                    return (
                      <React.Fragment key={crumb.href}>
                        {idx > 0 && <span className="ui-breadcrumb-separator">/</span>}
                        {isLast ? (
                          <span className="ui-breadcrumb-active">
                            {crumb.name}
                          </span>
                        ) : (
                          <Link href={crumb.href} className="ui-breadcrumb-link">
                            {crumb.name}
                          </Link>
                        )}
                      </React.Fragment>
                    );
                  })}
                </nav>
              )}
              {demoDataLoaded && (
                <DemoBanner
                  currentModule={pathname.split('/')[1]}
                  onRemoved={() => setDemoDataLoaded(false)}
                />
              )}
              {children}
            </div>
          </main>
        </div>

        {/* Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          GLOBAL_SEARCH_ITEMS={GLOBAL_SEARCH_ITEMS}
          onLogout={handleLogout}
        />

        {/* Floating AI Chatbot Companion */}
        <AICopilot theme={theme} />
      </div>
    </PermissionProvider>
  );
}
