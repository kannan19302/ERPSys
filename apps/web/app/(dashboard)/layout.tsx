'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { DemoBanner } from '@unerp/ui';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Award, Coffee, CalendarDays, DollarSign, Clock, Monitor, FileText, UserPlus, UserMinus, Target, Star, TrendingUp, HelpCircle, CheckSquare, Trash2, Percent } from 'lucide-react';
import {
  Home,
  CreditCard,
  Users,
  BarChart3,
  Package,
  ShieldAlert,
  LayoutDashboard,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Building,
  ShoppingCart,
  ShoppingBag,
  ClipboardList,
  Truck,
  Briefcase,
  Hammer,
  PieChart,
  FolderOpen,
  MessageSquare,
  Store,
  Wallet,
  FileSliders,
  GitFork,
  HardDrive,
  Activity,
  Mail,
  GraduationCap,
  Building2,
  Wrench,
  Key,
  Globe,
  Smartphone,
  Server,
  Cloud,
  LayoutGrid,
  History,
  ShieldCheck,
  QrCode,
  MapPin,
  ClipboardCheck,
  Warehouse,
  Layers,
  Play,
  Cpu,
  FileCode2,
  Workflow,
  Database,
  Inbox,
  Image,
  Code2,
  Zap,
  BookOpen,
  Send,
  Upload,
  Plug,
  Webhook,
  ExternalLink,
  Box,
  Shield,
  Download,
  RefreshCw,
  Receipt,
  Eye,
  Scale,
  Calendar,
  Video,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  isHeader?: boolean;
  items?: SidebarItem[];
}

import { getAppSpecificNavigation, SEGMENT_NAMES, formatSegment, allApplications, switcherFolders, KERNEL_APP_IDS } from '@/navigation';
import type { ModuleNav } from '@/navigation';
import { useResolvedNav } from '@/navigation/useResolvedNav';

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
  { name: 'Admin', href: '/admin', icon: ShieldAlert, type: 'App' },
  { name: 'Studio', href: '/builder', icon: Cpu, type: 'App' },
  // Actions — General
  { name: 'Create New User', href: '/admin/users/new', icon: UserIcon, type: 'Action' },
  { name: 'Create Invoice', href: '/finance', icon: CreditCard, type: 'Action' },
  { name: 'Add Product', href: '/inventory/products/new', icon: Package, type: 'Action' },
  // Finance — Core Accounting
  { name: 'Chart of Accounts', href: '/finance/advanced/chart-of-accounts', icon: CreditCard, type: 'Action' },
  { name: 'Journal Entries', href: '/finance/advanced/journal-entries', icon: FileSliders, type: 'Action' },
  { name: 'Financial Periods', href: '/finance/advanced/financial-periods', icon: Activity, type: 'Action' },
  { name: 'Fixed Assets', href: '/finance/advanced/fixed-assets', icon: Building2, type: 'Action' },
  // Finance — Payables & Treasury
  { name: 'Bank Accounts', href: '/finance/advanced/bank-accounts', icon: Wallet, type: 'Action' },
  { name: 'AP Automation', href: '/finance/advanced/ap-automation', icon: ShoppingCart, type: 'Action' },
  { name: 'AR Automation', href: '/finance/advanced/ar-automation', icon: ClipboardList, type: 'Action' },
  { name: 'Treasury & Investments', href: '/finance/advanced/treasury', icon: BarChart3, type: 'Action' },
  // Finance — Tax & Compliance
  { name: 'Tax Engine', href: '/finance/advanced/tax-engine', icon: GitFork, type: 'Action' },
  { name: 'Tax Filing', href: '/finance/advanced/tax-filing', icon: ShieldAlert, type: 'Action' },
  // Finance — Planning & Reporting
  { name: 'Budgeting & Planning', href: '/finance/advanced/budgeting', icon: PieChart, type: 'Action' },
  { name: 'Financial Reports', href: '/finance/advanced/reports', icon: FolderOpen, type: 'Action' },
  // Admin — Actions & Pages
  { name: 'User Groups & Teams', href: '/admin/groups', icon: Users, type: 'Action' },
  { name: 'User Roles Configuration', href: '/admin/access-control/roles', icon: ShieldCheck, type: 'Action' },
  { name: 'Access Packages Configuration', href: '/admin/access-control/packages', icon: Package, type: 'Action' },
  { name: 'Permissions Matrix Checkbox Grid', href: '/admin/access-control/matrix', icon: LayoutGrid, type: 'Action' },
  { name: 'SSO Configuration', href: '/admin/sso', icon: Key, type: 'Action' },
  { name: 'MFA / 2FA Settings', href: '/admin/mfa', icon: Smartphone, type: 'Action' },
  { name: 'Password Policies', href: '/admin/password-policy', icon: Key, type: 'Action' },
  { name: 'Session Management', href: '/admin/sessions', icon: Clock, type: 'Action' },
  { name: 'Login Impersonation', href: '/admin/impersonate', icon: UserIcon, type: 'Action' },
  { name: 'IP Whitelist & Geo Rules', href: '/admin/ip-restrictions', icon: Globe, type: 'Action' },
  { name: 'Audit Trail Viewer', href: '/admin/audit-trail', icon: History, type: 'Action' },
  { name: 'Login History', href: '/admin/login-history', icon: Clock, type: 'Action' },
  { name: 'Data Retention Policies', href: '/admin/data-retention', icon: Database, type: 'Action' },
  { name: 'Compliance Reports', href: '/admin/compliance', icon: ShieldCheck, type: 'Action' },
  { name: 'GDPR Erasure Requests Registry', href: '/admin/gdpr/erasure', icon: ShieldCheck, type: 'Action' },
  { name: 'GDPR Retention Rules Configurator', href: '/admin/gdpr/retention', icon: Database, type: 'Action' },
  { name: 'Workflow Configuration Templates', href: '/admin/workflows/templates', icon: GitFork, type: 'Action' },
  { name: 'Active Workflow Approvals Log', href: '/admin/workflows/approvals', icon: CheckSquare, type: 'Action' },
  { name: 'Bulk Workflow Approvals', href: '/admin/workflows/bulk', icon: CheckSquare, type: 'Action' },
  { name: 'Workflow Approvals Cycle Analytics', href: '/admin/workflows/analytics', icon: BarChart3, type: 'Action' },
  { name: 'Workflow Dynamic Routing Rules', href: '/admin/workflows/routing', icon: Zap, type: 'Action' },
  { name: 'Email Approvals & Expiry Settings', href: '/admin/workflows/email', icon: Mail, type: 'Action' },
  { name: 'General Settings Profile & Prefix', href: '/admin/settings/general', icon: Settings, type: 'Action' },
  { name: 'Branding Settings Color & Logo', href: '/admin/settings/branding', icon: Image, type: 'Action' },
  { name: 'Integrations Settings SMTP & Stripe', href: '/admin/settings/integrations', icon: Plug, type: 'Action' },
  { name: 'API Keys Registry & Scopes', href: '/admin/api-keys', icon: Key, type: 'Action' },
  { name: 'Webhooks Configuration Registry', href: '/admin/webhooks', icon: Webhook, type: 'Action' },
  { name: 'Webhook Deliveries Logs History', href: '/admin/webhook-logs', icon: ExternalLink, type: 'Action' },
  { name: 'SSO & OAuth 2.0 Clients Registry', href: '/admin/api-platform/oauth', icon: Shield, type: 'Action' },
  { name: 'Developer Sandboxes Isolation Hub', href: '/admin/api-platform/sandbox', icon: Box, type: 'Action' },
  { name: 'API Latency Metrics & Analytics', href: '/admin/api-platform/analytics', icon: BarChart3, type: 'Action' },
  { name: 'Import Data CSV & JSON Tool', href: '/admin/import', icon: Upload, type: 'Action' },
  { name: 'Export Data CSV & JSON Tool', href: '/admin/export', icon: Download, type: 'Action' },
  { name: 'Custom Login Page Designer', href: '/admin/login-customizer', icon: Image, type: 'Action' },
  { name: 'Email Server (SMTP) Configuration', href: '/admin/email-config', icon: Mail, type: 'Action' },
  { name: 'Email Templates Manager', href: '/admin/email-templates', icon: FileText, type: 'Action' },
  { name: 'Announcements', href: '/admin/announcements', icon: Bell, type: 'Action' },
  { name: 'Maintenance Mode Control', href: '/admin/maintenance', icon: ShieldAlert, type: 'Action' },
  { name: 'System Health Dashboard', href: '/admin/system-health', icon: Activity, type: 'Action' },
  { name: 'Background Jobs Monitor', href: '/admin/jobs', icon: Layers, type: 'Action' },
  { name: 'Scheduled Tasks Cron Manager', href: '/admin/scheduled-tasks', icon: CalendarDays, type: 'Action' },
  { name: 'Error Logs Viewer', href: '/admin/error-logs', icon: ShieldAlert, type: 'Action' },
  { name: 'Backup & Restore Manager', href: '/admin/backups', icon: Database, type: 'Action' },
  { name: 'DB Schema Manager', href: '/admin/db-schema', icon: Database, type: 'Action' },
  { name: 'Module Manager', href: '/admin/modules', icon: Settings, type: 'Action' },
  { name: 'Feature Flags Toggles', href: '/admin/feature-flags', icon: Zap, type: 'Action' },
  { name: 'Custom Domains Configuration', href: '/admin/domains', icon: Globe, type: 'Action' },
  { name: 'Environment Sync Sandbox', href: '/admin/environments', icon: Server, type: 'Action' },
  { name: 'System Updates Checker', href: '/admin/updates', icon: Cpu, type: 'Action' },
  { name: 'Tenant Usage & Storage Analytics', href: '/admin/tenant-analytics', icon: BarChart3, type: 'Action' },
];

function SidebarNavigation({ appNav, pathname, collapsed }: { appNav: ModuleNav; pathname: string; collapsed: boolean }) {
  const searchParams = useSearchParams();
  const enhancedItems = useResolvedNav(appNav, pathname);

  const renderItem = (item: SidebarItem, isSub = false) => {
    if (item.isHeader) {
      if (collapsed) {
        return (
          <React.Fragment key={item.name}>
            <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }} />
            {item.items?.map(sub => renderItem(sub, true))}
          </React.Fragment>
        );
      }
      return (
        <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-3)' }}>
          <div style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.05em',
            padding: 'var(--space-1) var(--space-3)',
          }}>
            {item.name}
          </div>
          {item.items?.map(sub => renderItem(sub, true))}
        </div>
      );
    }

    const href = item.href || '#';
    const isActive = (() => {
      const parts = href.split('?');
      const itemPath = parts[0] || '';
      const itemQuery = parts[1] || '';

      const isPathMatch = (itemPath === '/inventory' || itemPath === '/builder' || itemPath === '/dashboard' || itemPath === '/drive' || itemPath === '/storage')
        ? pathname === itemPath
        : (pathname === itemPath || pathname.startsWith(itemPath + '/'));

      if (!isPathMatch) return false;

      if (itemPath === '/drive') {
        const activeView = searchParams.get('view') || 'personal';
        const itemParams = new URLSearchParams(itemQuery);
        const itemView = itemParams.get('view') || 'personal';
        return activeView === itemView;
      }

      if ((itemPath.includes('/hr/advanced') || itemPath.includes('/inventory/advanced')) && itemQuery) {
        const activeTab = searchParams.get('tab') || (itemPath.includes('/hr/advanced') ? 'payroll' : 'entries');
        const itemParams = new URLSearchParams(itemQuery);
        const itemTab = itemParams.get('tab');
        return pathname === itemPath && activeTab === itemTab;
      }

      return true;
    })();
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-2.5) var(--space-3)',
          paddingLeft: isSub && !collapsed ? 'var(--space-5)' : 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          color: isActive ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
          background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
          textDecoration: 'none',
          fontSize: 'var(--text-sm)',
          fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
          transition: 'all var(--duration-fast) var(--ease-default)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--color-sidebar-hover)';
            e.currentTarget.style.color = 'var(--color-sidebar-text-active)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-sidebar-text)';
          }
        }}
      >
        {Icon && <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--color-primary)' : 'inherit' }} />}
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <>
      {enhancedItems.map(item => renderItem(item))}
    </>
  );
}



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdSelectedIdx, setCmdSelectedIdx] = useState(0);
  const cmdInputRef = React.useRef<HTMLInputElement>(null);
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  // Dynamic sidebar navigation for installed marketplace apps (/app/<slug>).
  // Built from the app manifest (enabled modules -> grouped pages) so third-party
  // industry apps get a native sidebar exactly like the core modules.
  const [dynamicAppNav, setDynamicAppNav] = useState<{ slug: string; title: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; items: SidebarItem[] } | null>(null);

  useEffect(() => {
    if (!pathname.startsWith('/app/')) { setDynamicAppNav(null); return; }
    const slug = pathname.split('/')[2];
    if (!slug) { setDynamicAppNav(null); return; }
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/admin/marketplace/installed/${slug}/modules`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (mounted) setDynamicAppNav(null); return; }
        const shell = await res.json();
        const pageIcon = (t: string) => {
          const k = (t || '').toUpperCase();
          if (k === 'LIST') return ClipboardList;
          if (k === 'FORM') return FileText;
          if (k === 'DASHBOARD' || k === 'CUSTOM') return BarChart3;
          return LayoutGrid;
        };
        const items: SidebarItem[] = [{ name: 'Overview', href: `/app/${slug}`, icon: Home }];
        if (slug === 'healthcare') items.push({ name: 'Clinical Tools', href: `/app/${slug}/clinical`, icon: Activity });
        for (const m of (shell.modules || []).filter((m: any) => m.enabled)) {
          items.push({
            name: m.name,
            isHeader: true,
            items: (m.pages || []).map((p: any) => ({ name: p.title, href: `/app/${slug}/${p.slug}`, icon: pageIcon(p.type) })),
          });
        }
        items.push({ name: 'Manage Modules', isHeader: true, items: [{ name: 'Admin Console', href: `/app/${slug}?view=admin`, icon: Settings }] });
        if (mounted) setDynamicAppNav({ slug, title: shell.app?.name || slug, icon: Activity, items });
      } catch { if (mounted) setDynamicAppNav(null); }
    })();
    return () => { mounted = false; };
  }, [pathname]);

  const userDropdownRef = React.useRef<HTMLDivElement>(null);
  const tenantDropdownRef = React.useRef<HTMLDivElement>(null);
  const appsDropdownRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; avatar?: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState({ name: 'Acme Corp', slug: 'acme' });
  const tenants = [
    { name: 'Acme Corp', slug: 'acme' },
    { name: 'Stark Industries', slug: 'stark' },
    { name: 'Wayne Enterprises', slug: 'wayne' },
  ];

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
        setCmdQuery('');
        setCmdSelectedIdx(0);
      }
      if (e.key === 'Escape' && cmdPaletteOpen) {
        setCmdPaletteOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cmdPaletteOpen]);

  useEffect(() => {
    if (cmdPaletteOpen && cmdInputRef.current) {
      cmdInputRef.current.focus();
    }
  }, [cmdPaletteOpen]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      // Verify token with backend (cookie carries auth; Bearer sent for compat)
      fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` },
        credentials: 'include',
      }).then(res => {
        if (res.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
        }
      }).catch(() => { });

      // Fetch installed apps for the switcher
      const fetchInstalledApps = async () => {
        try {
          const res = await fetch('/api/v1/saas/installed-apps', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const installedList: string[] = await res.json();
            setInstalledApps(installedList);

            // Redirect to the App Store if the user navigates to a module they have
            // uninstalled. Covers both bundle industry apps and gated core business
            // modules; kernel apps and unmapped paths are never guarded. Some apps are
            // served under a segment that differs from their app slug (Connect, Drive).
            const segments = pathname.split('/');
            const activeSegment = segments[1];
            const segmentToSlug: Record<string, string> = {
              education: 'education', 'real-estate': 'real-estate', 'field-service': 'field-service',
              finance: 'finance', hr: 'hr', crm: 'crm', inventory: 'inventory', procurement: 'procurement',
              sales: 'sales', 'supply-chain': 'supply-chain', projects: 'projects', manufacturing: 'manufacturing',
              analytics: 'analytics', drive: 'drive', storage: 'drive', connect: 'communication',
              communication: 'communication', pos: 'pos',
            };
            const guardedSlug = activeSegment ? segmentToSlug[activeSegment] : undefined;
            if (guardedSlug && !installedList.includes(guardedSlug)) {
              // Not installed! Redirect back to Apps landing
              router.push('/apps');
            }
          }
        } catch {
          // failed to verify app installation state
        }
      };
      fetchInstalledApps();

      // Fetch demo data status
      fetch('/api/v1/admin/demo/status', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      }).then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.loaded) setDemoDataLoaded(true); })
        .catch(() => { });
    } else {
      router.push('/login');
    }

    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(currentTheme);
  }, [router, pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* best-effort */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleTenantSwitch = (t: typeof currentTenant) => {
    setCurrentTenant(t);
    setTenantDropdownOpen(false);
  };

  const isAppsLanding = pathname === '/apps' || pathname === '/apps/store';
  const hideSidebar = isAppsLanding || pathname === '/profile' || pathname.startsWith('/profile/');
  const appNav = (pathname.startsWith('/app/') && dynamicAppNav && dynamicAppNav.slug === pathname.split('/')[2])
    ? dynamicAppNav
    : getAppSpecificNavigation(pathname);

  // Dynamic Breadcrumb Computation
  const pathSegments = pathname.split('/').filter(Boolean);
  const showBreadcrumbs = !isAppsLanding && !pathname.startsWith('/builder') && pathSegments.length > 0;

  const breadcrumbsList = [];
  if (showBreadcrumbs) {
    // Always start with the Desk/Apps root link
    breadcrumbsList.push({
      name: 'Apps',
      href: '/apps',
    });

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      if (segment === 'apps') return; // Skip duplicate apps segment

      breadcrumbsList.push({
        name: formatSegment(segment),
        href: currentPath,
      });
    });
  }

  // Navigation registry (allApplications, switcherFolders, KERNEL_APP_IDS)
  // is imported from '@/navigation'.
  const activeApps = allApplications.filter(app => KERNEL_APP_IDS.has(app.id) || installedApps.includes(app.id));
  const folderAppIds = switcherFolders.flatMap(f => f.appIds);
  const rootApps = activeApps.filter(app => !folderAppIds.includes(app.id));
  const visibleFolders = switcherFolders.filter(f => activeApps.filter(a => f.appIds.includes(a.id)).length > 0);

  const switcherItems = [
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
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <a href="#main-content" style={{ position: 'absolute', left: '-9999px', top: 'var(--space-2)', zIndex: 9999, padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', textDecoration: 'none' }} onFocus={(e) => { e.currentTarget.style.left = 'var(--space-2)'; }} onBlur={(e) => { e.currentTarget.style.left = '-9999px'; }}>Skip to main content</a>
      {/* Sidebar Section */}
      {!hideSidebar && (
        <aside
          style={{
            width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
            background: 'var(--color-sidebar-bg)',
            borderRight: '1px solid var(--color-sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width var(--duration-normal) var(--ease-default)',
            zIndex: 100,
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          {/* Sidebar Header / Brand Logo */}
          <div
            style={{
              height: 'var(--header-height)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: '0 var(--space-4)',
              borderBottom: '1px solid var(--color-sidebar-border)',
            }}
          >
            {!collapsed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-sidebar-text-active)',
                }}
              >
                <appNav.icon size={18} style={{ color: 'var(--color-primary)' }} />
                <span>{appNav.title}</span>
              </div>
            )}
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Menu size={18} />
              </button>
            ) : (
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav
            aria-label="Module navigation"
            style={{
              flex: 1,
              padding: 'var(--space-4) var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              overflowY: 'auto',
            }}
          >
            <Suspense fallback={<div className="flex-1" />}>
              <SidebarNavigation appNav={appNav} pathname={pathname} collapsed={collapsed} />
            </Suspense>
          </nav>

          {/* Sidebar Footer */}
          <div
            style={{
              padding: 'var(--space-4)',
              borderTop: '1px solid var(--color-sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Menu size={18} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xs)',
                    flexShrink: 0,
                  }}
                >
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-sidebar-text-active)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-sidebar-text)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user ? user.email : 'admin@uni-erp.com'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Workspace Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Panel */}
        <header
          style={{
            height: 'var(--header-height)',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
            zIndex: 90,
          }}
        >
          {/* Top Left: Apps Switcher & Tenant Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {!isAppsLanding && (
                <div style={{ position: 'relative' }} ref={appsDropdownRef}>
                  <button
                    onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
                    className="frappe-btn frappe-btn-secondary"
                    style={{ padding: 'var(--space-1.5) var(--space-3)', gap: 'var(--space-1)' }}
                  >
                    <span>Switch App</span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: 'var(--color-text-secondary)',
                        transform: appsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--duration-fast) var(--ease-default)',
                      }}
                    />
                  </button>
                  {appsDropdownOpen && (
                    <div className="frappe-dropdown frappe-dropdown-left frappe-dropdown-apps">
                      <p className="frappe-dropdown-header">Applications</p>
                      {switcherItems.map((item) => {
                        if (item.type === 'folder') {
                          const isExpanded = !!expandedFolders[item.id];
                          return (
                            <React.Fragment key={item.id}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setExpandedFolders(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }));
                                }}
                                className="frappe-dropdown-item frappe-dropdown-folder"
                              >
                                <FolderOpen size={14} style={{ color: item.color }} />
                                <span>{item.name}</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                                  <ChevronRight
                                    size={12}
                                    style={{
                                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                      transition: 'transform var(--duration-fast) var(--ease-default)',
                                    }}
                                  />
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="frappe-dropdown-item-nested-container">
                                  {item.apps.map((app) => {
                                    const isSubActive = pathname.startsWith(app.href);
                                    return (
                                      <button
                                        key={app.name}
                                        onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                                        className={`frappe-dropdown-item-nested ${isSubActive ? 'active' : ''}`}
                                      >
                                        <app.icon size={13} style={{ opacity: 0.6 }} />
                                        <span>{app.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        } else {
                          const app = item;
                          const isPathActive = pathname.startsWith(app.href);
                          return (
                            <button
                              key={app.name}
                              onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                              className={`frappe-dropdown-item ${isPathActive ? 'active' : ''}`}
                            >
                              <app.icon size={14} style={{ color: isPathActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', opacity: 0.8 }} />
                              <span>{app.name}</span>
                            </button>
                          );
                        }
                      })}
                      <div className="frappe-dropdown-divider" />
                      <button
                        onClick={() => { router.push('/apps'); setAppsDropdownOpen(false); }}
                        className="frappe-dropdown-item"
                      >
                        <LayoutGrid size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        <span>Desk</span>
                      </button>
                      <button
                        onClick={() => { router.push('/apps/store'); setAppsDropdownOpen(false); }}
                        className="frappe-dropdown-item"
                      >
                        <ShoppingBag size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        <span>App store</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tenant Selector Dropdown */}
              <div style={{ position: 'relative' }} ref={tenantDropdownRef}>
                <button
                  onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                  className="frappe-btn frappe-btn-secondary"
                  style={{ padding: 'var(--space-1.5) var(--space-3)', gap: 'var(--space-1)' }}
                >
                  <span>{currentTenant.name}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--color-text-secondary)',
                      transform: tenantDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform var(--duration-fast) var(--ease-default)',
                    }}
                  />
                </button>
                {tenantDropdownOpen && (
                  <div className="frappe-dropdown frappe-dropdown-left frappe-dropdown-tenant">
                    <p className="frappe-dropdown-header">Switch Tenant</p>
                    {tenants.map((t) => {
                      const isTenantActive = currentTenant.slug === t.slug;
                      return (
                        <button
                          key={t.slug}
                          onClick={() => handleTenantSwitch(t)}
                          className={`frappe-dropdown-item ${isTenantActive ? 'active' : ''}`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Right: Search, Dark mode, Notification, Profiler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {!isAppsLanding && (
              <div
                ref={searchDropdownRef}
                style={{
                  position: 'relative',
                  width: '16rem',
                  display: 'block',
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-tertiary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search apps, actions... (Ctrl+K)"
                  value={searchQuery}
                  onClick={() => { setCmdPaletteOpen(true); }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(e.target.value.length > 0);
                  }}
                  className="frappe-input"
                  style={{
                    paddingLeft: 'var(--space-8)',
                  }}
                  onFocus={(e) => {
                    if (searchQuery.length > 0) setSearchOpen(true);
                  }}
                />

                {/* Dynamic Search Dropdown Results */}
                {searchOpen && searchQuery.length > 0 && (
                  <div className="frappe-dropdown frappe-dropdown-right frappe-dropdown-search">
                    <p className="frappe-dropdown-header">Search Results</p>
                    {GLOBAL_SEARCH_ITEMS.filter(item =>
                      item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).slice(0, 10).map((result) => (
                      <button
                        key={result.name}
                        onClick={() => { router.push(result.href); setSearchOpen(false); setSearchQuery(''); }}
                        className="frappe-dropdown-item"
                      >
                        <result.icon size={14} style={{ color: result.type === 'App' ? 'var(--color-primary)' : 'var(--color-text-secondary)', opacity: 0.8 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'var(--weight-medium)' }}>{result.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{result.type}</span>
                        </div>
                      </button>
                    ))}
                    {GLOBAL_SEARCH_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div style={{ padding: 'var(--space-3) var(--space-2)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="frappe-btn frappe-btn-secondary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <button
              className="frappe-btn frappe-btn-secondary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-danger)',
                }}
              />
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 var(--space-1)' }} />

            {/* User Dropdown */}
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--color-text-secondary)',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--duration-fast) var(--ease-default)',
                  }}
                />
              </button>

              {userDropdownOpen && (
                <div className="frappe-dropdown frappe-dropdown-right frappe-dropdown-user">
                  <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-0.5)' }}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user ? user.email : 'admin@uni-erp.com'}
                    </p>
                  </div>
                  <button
                    onClick={() => { router.push('/profile'); setUserDropdownOpen(false); }}
                    className="frappe-dropdown-item"
                  >
                    <UserIcon size={14} style={{ color: 'var(--color-text-secondary)' }} /> Profile
                  </button>
                  <button
                    onClick={() => { router.push('/admin/settings'); setUserDropdownOpen(false); }}
                    className="frappe-dropdown-item"
                  >
                    <Settings size={14} style={{ color: 'var(--color-text-secondary)' }} /> Settings
                  </button>
                  <div className="frappe-dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="frappe-dropdown-item frappe-dropdown-item-danger"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Workspace */}
        <main
          id="main-content"
          role="main"
          style={{
            flex: 1,
            padding: pathname.startsWith('/builder') ? '0' : 'var(--space-6) var(--space-8)',
            overflowY: 'auto',
            background: 'var(--color-bg)',
          }}
        >
          <div style={{ maxWidth: pathname.startsWith('/builder') ? '100%' : 'var(--content-max-width)', margin: '0 auto' }}>
            {showBreadcrumbs && breadcrumbsList.length > 0 && (
              <nav className="frappe-breadcrumb" aria-label="breadcrumb">
                {breadcrumbsList.map((crumb, idx) => {
                  const isLast = idx === breadcrumbsList.length - 1;
                  return (
                    <React.Fragment key={crumb.href}>
                      {idx > 0 && <span className="frappe-breadcrumb-separator">/</span>}
                      {isLast ? (
                        <span className="frappe-breadcrumb-active">
                          {crumb.name}
                        </span>
                      ) : (
                        <Link href={crumb.href} className="frappe-breadcrumb-link">
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

      {/* SVG Gradient declaration for Brand Logo */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      {/* Command Palette (Ctrl+K) */}
      {cmdPaletteOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setCmdPaletteOpen(false)}
        >
          <div
            style={{ width: '560px', maxHeight: '420px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.3))', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalSlideUp 0.15s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-3)' }}>
              <Search size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
              <input
                ref={cmdInputRef}
                type="text"
                placeholder="Search apps, pages, actions..."
                value={cmdQuery}
                onChange={(e) => { setCmdQuery(e.target.value); setCmdSelectedIdx(0); }}
                onKeyDown={(e) => {
                  const results = GLOBAL_SEARCH_ITEMS.filter(item => item.name.toLowerCase().includes(cmdQuery.toLowerCase())).slice(0, 10);
                  if (e.key === 'ArrowDown') { e.preventDefault(); setCmdSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setCmdSelectedIdx(i => Math.max(i - 1, 0)); }
                  if (e.key === 'Enter' && results[cmdSelectedIdx]) { router.push(results[cmdSelectedIdx].href); setCmdPaletteOpen(false); setCmdQuery(''); }
                }}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--color-text)' }}
              />
              <kbd style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>ESC</kbd>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
              {(() => {
                const results = GLOBAL_SEARCH_ITEMS.filter(item => !cmdQuery || item.name.toLowerCase().includes(cmdQuery.toLowerCase())).slice(0, 12);
                if (results.length === 0) return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No results found</div>;
                return results.map((item, idx) => (
                  <button
                    key={item.name + item.href}
                    onClick={() => { router.push(item.href); setCmdPaletteOpen(false); setCmdQuery(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', padding: 'var(--space-2.5) var(--space-3)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                      background: idx === cmdSelectedIdx ? 'var(--color-primary-light)' : 'transparent',
                      color: 'var(--color-text)',
                    }}
                    onMouseEnter={() => setCmdSelectedIdx(idx)}
                  >
                    <item.icon size={16} style={{ color: item.type === 'App' ? 'var(--color-primary)' : 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{item.type}</span>
                  </button>
                ));
              })()}
            </div>
            <div style={{ padding: 'var(--space-2) var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              <span><kbd style={{ padding: '1px 4px', border: '1px solid var(--color-border)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>↑↓</kbd> navigate</span>
              <span><kbd style={{ padding: '1px 4px', border: '1px solid var(--color-border)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>↵</kbd> open</span>
              <span><kbd style={{ padding: '1px 4px', border: '1px solid var(--color-border)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
