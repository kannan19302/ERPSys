'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, PageHeader } from '@unerp/ui';
import {
  Home,
  CreditCard,
  Users,
  BarChart3,
  Package,
  ShoppingCart,
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
  GraduationCap,
  Building2,
  Wrench,
  Key,
  Globe,
  Smartphone,
  Server,
  Cloud,
  ShieldAlert,
  Search,
  Star,
  LayoutGrid,
  ShoppingBag,
  Folder as FolderIcon,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface AppDefinition {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  category: string;
  installed: boolean;
}

const applications: AppDefinition[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Overview of key metrics and KPIs', href: '/dashboard', icon: Home, color: '#6366f1', category: 'Core', installed: true },
  { id: 'finance', name: 'Finance & Accounting', description: 'Invoices, payments, and ledger management', href: '/finance', icon: CreditCard, color: '#10b981', category: 'Core', installed: true },
  { id: 'hr', name: 'Human Resources', description: 'Employee records, departments, and onboarding', href: '/hr', icon: Users, color: '#f59e0b', category: 'Core', installed: true },
  { id: 'crm', name: 'CRM & Sales', description: 'Customer relationships and pipeline management', href: '/crm', icon: BarChart3, color: '#3b82f6', category: 'Core', installed: true },
  { id: 'inventory', name: 'Inventory & Stock', description: 'Warehouses, products, and stock levels', href: '/inventory', icon: Package, color: '#8b5cf6', category: 'Core', installed: true },
  { id: 'procurement', name: 'Procurement', description: 'Vendor management and purchase orders', href: '/procurement', icon: ShoppingCart, color: '#ec4899', category: 'Operations', installed: true },
  { id: 'sales', name: 'Sales & Orders', description: 'Quotations, sales orders, and delivery notes', href: '/sales', icon: ClipboardList, color: '#14b8a6', category: 'Operations', installed: true },
  { id: 'supply-chain', name: 'Supply Chain', description: 'Shipment tracking and carrier management', href: '/supply-chain', icon: Truck, color: '#f97316', category: 'Operations', installed: true },
  { id: 'projects', name: 'Project Management', description: 'Projects, tasks, milestones, and timesheets', href: '/projects', icon: Briefcase, color: '#06b6d4', category: 'Operations', installed: true },
  { id: 'manufacturing', name: 'Manufacturing', description: 'BOM, work orders, and production planning', href: '/manufacturing', icon: Hammer, color: '#84cc16', category: 'Operations', installed: true },
  { id: 'analytics', name: 'Business Intelligence', description: 'Custom dashboards and analytics reports', href: '/analytics', icon: PieChart, color: '#a855f7', category: 'Intelligence', installed: true },
  { id: 'documents', name: 'Document Management', description: 'File storage, folders, and version control', href: '/documents', icon: FolderOpen, color: '#eab308', category: 'Intelligence', installed: true },
  { id: 'communication', name: 'Communication', description: 'Channels, messaging, and notifications', href: '/communication', icon: MessageSquare, color: '#22c55e', category: 'Intelligence', installed: true },
  { id: 'pos', name: 'POS & Retail', description: 'Point of sale terminals and cash registers', href: '/pos', icon: Store, color: '#e11d48', category: 'Commerce', installed: true },
  { id: 'finance-advanced', name: 'Advanced Finance', description: 'Multi-currency, chart of accounts, and budgets', href: '/finance/advanced', icon: Wallet, color: '#059669', category: 'Advanced', installed: true },
  { id: 'hr-advanced', name: 'Advanced HR', description: 'Payroll, leave, attendance, and performance', href: '/hr/advanced', icon: FileSliders, color: '#d946ef', category: 'Advanced', installed: true },
  { id: 'workflows', name: 'Workflows', description: 'Approval chains and automation engine', href: '/workflows', icon: GitFork, color: '#0ea5e9', category: 'Platform', installed: true },
  { id: 'storage', name: 'Files & Storage', description: 'Document templates and PDF generation', href: '/storage', icon: HardDrive, color: '#64748b', category: 'Platform', installed: true },
  { id: 'reporting', name: 'Advanced Reporting', description: 'Pivot tables, scheduled reports, and dashboards', href: '/analytics/advanced', icon: PieChart, color: '#7c3aed', category: 'Intelligence', installed: true },
  { id: 'healthcare', name: 'Healthcare Module', description: 'Patient records, appointments, and pharmacy', href: '/healthcare', icon: Activity, color: '#ef4444', category: 'Industry', installed: false },
  { id: 'education', name: 'Education Module', description: 'Students, courses, fees, and library', href: '/education', icon: GraduationCap, color: '#2563eb', category: 'Industry', installed: false },
  { id: 'real-estate', name: 'Real Estate Module', description: 'Properties, leases, and maintenance', href: '/real-estate', icon: Building2, color: '#ca8a04', category: 'Industry', installed: false },
  { id: 'field-service', name: 'Field Service Module', description: 'Tickets, dispatch, and technician management', href: '/field-service', icon: Wrench, color: '#78716c', category: 'Industry', installed: false },
  { id: 'api-keys', name: 'API Platform', description: 'API keys, webhooks, and developer console', href: '/admin/api-keys', icon: Key, color: '#334155', category: 'Platform', installed: true },
  { id: 'localization', name: 'Localization', description: 'Multi-language translations and RTL support', href: '/admin/localization', icon: Globe, color: '#0d9488', category: 'Platform', installed: true },
  { id: 'sync', name: 'Sync Monitor', description: 'Offline queue reconciliation and PWA sync', href: '/admin/sync', icon: Smartphone, color: '#4f46e5', category: 'Platform', installed: true },
  { id: 'devops', name: 'DevOps & Telemetry', description: 'System metrics, APM, and health checks', href: '/admin/devops', icon: Server, color: '#16a34a', category: 'Platform', installed: true },
  { id: 'saas', name: 'SaaS Portal', description: 'Subscription plans, billing, and usage meters', href: '/saas/portal', icon: Cloud, color: '#9333ea', category: 'Platform', installed: true },
  { id: 'admin', name: 'Administration', description: 'User management and security settings', href: '/admin/users', icon: ShieldAlert, color: '#dc2626', category: 'Core', installed: true },
];

interface FolderDefinition {
  name: string;
  description: string;
  color: string;
  categories: string[];
  appIds: string[];
}

const folders: FolderDefinition[] = [
  {
    name: 'Core Business',
    description: 'Finance, HR, CRM, and basic business configurations',
    color: '#6366f1',
    categories: ['Core'],
    appIds: ['dashboard', 'finance', 'hr', 'crm', 'inventory', 'admin'],
  },
  {
    name: 'Operations & Supply Chain',
    description: 'Procurement, sales workflows, project management, and production plans',
    color: '#10b981',
    categories: ['Operations'],
    appIds: ['procurement', 'sales', 'supply-chain', 'projects', 'manufacturing'],
  },
  {
    name: 'Intelligence & Documents',
    description: 'Reporting, pivot analysis, file directory management, and communications',
    color: '#a855f7',
    categories: ['Intelligence'],
    appIds: ['analytics', 'documents', 'communication', 'reporting'],
  },
  {
    name: 'Commerce & Advanced',
    description: 'Retail POS terminals, multi-currency ledger, and payroll automation',
    color: '#ec4899',
    categories: ['Commerce', 'Advanced'],
    appIds: ['pos', 'finance-advanced', 'hr-advanced'],
  },
  {
    name: 'Industry Specific Modules',
    description: 'Healthcare EHR, university registries, leasing, and field dispatching',
    color: '#f59e0b',
    categories: ['Industry'],
    appIds: ['healthcare', 'education', 'real-estate', 'field-service'],
  },
  {
    name: 'Platform & Dev Tools',
    description: 'Workflows design, S3 storage, developer API keys, and server monitoring',
    color: '#64748b',
    categories: ['Platform'],
    appIds: ['workflows', 'storage', 'api-keys', 'localization', 'sync', 'devops', 'saas'],
  },
];

export default function AppsHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstalled = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/saas/installed-apps', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setInstalledIds(data);
        }
      } catch {
        // failed to load installed apps list
      } finally {
        setLoading(false);
      }
    };
    fetchInstalled();
  }, []);

  const isAppVisible = (app: AppDefinition) => {
    // Core/system apps are always visible
    if (app.category !== 'Industry') {
      return true;
    }
    return installedIds.includes(app.id);
  };

  const getInstalledAppsInFolder = (folder: FolderDefinition) => {
    return applications.filter((app) => folder.appIds.includes(app.id) && isAppVisible(app));
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && isAppVisible(app);
  });

  const handleBackToFolders = () => {
    setActiveFolder(null);
  };

  const selectedFolderObj = folders.find((f) => f.name === activeFolder);
  const activeFolderApps = selectedFolderObj ? getInstalledAppsInFolder(selectedFolderObj) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title={activeFolder ? activeFolder : 'Applications Hub'}
        description={
          activeFolder
            ? selectedFolderObj?.description
            : 'Access your active ERP applications. Grouped into categories for a clean enterprise interface.'
        }
        breadcrumbs={activeFolder ? [{ label: 'Apps', href: '/apps' }, { label: activeFolder }] : [{ label: 'Apps' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {activeFolder && (
              <button
                onClick={handleBackToFolders}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
              >
                <ArrowLeft size={16} /> Back to Folders
              </button>
            )}
            <Link
              href="/apps/store"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-sm)',
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
              }}
            >
              <ShoppingBag size={16} /> App Store
            </Link>
          </div>
        }
      />

      {/* Search Bar - Premium CSS Glassmorphic Focus */}
      <Card padding="md" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
            }}
          />
          <input
            id="apps-search-input"
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeFolder) setActiveFolder(null); // Bypass folder mode during search
            }}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4) var(--space-3) var(--space-10)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--color-border)',
              background: 'var(--color-bg)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              color: 'var(--color-text)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : searchQuery ? (
        /* Flat Grid View during active search */
        <div>
          <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
            Search Results ({filteredApps.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
          {filteredApps.length === 0 && <EmptyState />}
        </div>
      ) : activeFolder ? (
        /* Folder Contents Grid View */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {activeFolderApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
          {activeFolderApps.length === 0 && <EmptyState />}
        </div>
      ) : (
        /* Desktop-style Collapsible Group Folders Landing Page */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {folders.map((folder) => {
            const apps = getInstalledAppsInFolder(folder);
            return (
              <Card
                key={folder.name}
                padding="lg"
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--color-bg-elevated)',
                }}
                onClick={() => setActiveFolder(folder.name)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.borderColor = folder.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Folder Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-lg)',
                      background: `${folder.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: folder.color,
                    }}
                  >
                    <FolderIcon size={24} fill={`${folder.color}25`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                      {folder.name}
                    </h3>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {apps.length} active application{apps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>

                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5', flex: 1 }}>
                  {folder.description}
                </p>

                {/* Previews of apps inside this folder */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                  {apps.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      title={app.name}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-md)',
                        background: `${app.color}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: app.color,
                      }}
                    >
                      <app.icon size={15} />
                    </div>
                  ))}
                  {apps.length > 5 && (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-sunken)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 'var(--weight-bold)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      +{apps.length - 5}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modern Popover/Modal overlay showing active folder applications */}
      {activeFolder && selectedFolderObj && (
        <div
          onClick={() => setActiveFolder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '680px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: 'var(--space-5) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: `linear-gradient(to right, ${selectedFolderObj.color}08, transparent)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-lg)',
                    background: `${selectedFolderObj.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedFolderObj.color,
                  }}
                >
                  <FolderIcon size={20} fill={`${selectedFolderObj.color}25`} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                    {selectedFolderObj.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {selectedFolderObj.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveFolder(null)}
                style={{
                  background: 'var(--color-bg-sunken)',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 'var(--text-sm)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-sunken)')}
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Apps Grid */}
            <div style={{ padding: 'var(--space-6)', maxHeight: '450px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
                {activeFolderApps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
              {activeFolderApps.length === 0 && <EmptyState />}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Keyframes for Loader spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AppCard({ app }: { app: AppDefinition }) {
  return (
    <Link href={app.href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
        padding="md"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          border: '1px solid var(--color-border)',
          height: '100%',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.borderColor = app.color;
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              background: `${app.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <app.icon size={22} style={{ color: app.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {app.name}
            </h3>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 'var(--weight-medium)',
                color: app.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {app.category}
            </span>
          </div>
          {app.category !== 'Industry' && (
            <Star
              size={13}
              style={{ color: '#f59e0b', flexShrink: 0 }}
              fill="#f59e0b"
            />
          )}
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
          {app.description}
        </p>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
      <LayoutGrid size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
      <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
        No Applications Found
      </h4>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Try adjusting your filters or reinstalling modules.
      </p>
    </div>
  );
}
