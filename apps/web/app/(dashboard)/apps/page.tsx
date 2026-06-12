'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@unerp/ui';
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
  { id: 'dashboard', name: 'Dashboard', description: 'Overview of key metrics and KPIs', href: '/dashboard', icon: Home, color: 'var(--color-primary)', category: 'Core', installed: true },
  { id: 'finance', name: 'Finance & Accounting', description: 'Invoices, payments, and ledger management', href: '/finance', icon: CreditCard, color: '#10b981', category: 'Core', installed: true },
  { id: 'hr', name: 'Human Resources', description: 'Employee records, departments, and onboarding', href: '/hr', icon: Users, color: 'var(--color-warning)', category: 'Core', installed: true },
  { id: 'crm', name: 'CRM & Sales', description: 'Customer relationships and pipeline management', href: '/crm', icon: BarChart3, color: '#3b82f6', category: 'Core', installed: true },
  { id: 'inventory', name: 'Inventory & Stock', description: 'Warehouses, products, and stock levels', href: '/inventory', icon: Package, color: '#8b5cf6', category: 'Core', installed: true },
  { id: 'procurement', name: 'Procurement', description: 'Vendor management and purchase orders', href: '/procurement', icon: ShoppingCart, color: '#ec4899', category: 'Operations', installed: true },
  { id: 'sales', name: 'Sales & Orders', description: 'Quotations, sales orders, and delivery notes', href: '/sales', icon: ClipboardList, color: '#14b8a6', category: 'Operations', installed: true },
  { id: 'supply-chain', name: 'Supply Chain', description: 'Shipment tracking and carrier management', href: '/supply-chain', icon: Truck, color: '#f97316', category: 'Operations', installed: true },
  { id: 'projects', name: 'Project Management', description: 'Projects, tasks, milestones, and timesheets', href: '/projects', icon: Briefcase, color: '#06b6d4', category: 'Operations', installed: true },
  { id: 'manufacturing', name: 'Manufacturing', description: 'BOM, work orders, and production planning', href: '/manufacturing', icon: Hammer, color: '#84cc16', category: 'Operations', installed: true },
  { id: 'analytics', name: 'Business Intelligence', description: 'Custom dashboards and analytics reports', href: '/analytics', icon: PieChart, color: '#a855f7', category: 'Intelligence', installed: true },
  { id: 'documents', name: 'Document Management', description: 'File storage, folders, and version control', href: '/documents', icon: FolderOpen, color: '#eab308', category: 'Intelligence', installed: true },
  { id: 'communication', name: 'Communication', description: 'Channels, messaging, and notifications', href: '/communication', icon: MessageSquare, color: 'var(--color-success)', category: 'Intelligence', installed: true },
  { id: 'pos', name: 'POS & Retail', description: 'Point of sale terminals and cash registers', href: '/pos', icon: Store, color: '#e11d48', category: 'Commerce', installed: true },

  { id: 'workflows', name: 'Workflows', description: 'Approval chains and automation engine', href: '/workflows', icon: GitFork, color: '#0ea5e9', category: 'Platform', installed: true },
  { id: 'storage', name: 'Files & Storage', description: 'Document templates and PDF generation', href: '/storage', icon: HardDrive, color: '#64748b', category: 'Platform', installed: true },
  { id: 'healthcare', name: 'Healthcare Module', description: 'Patient records, appointments, and pharmacy', href: '/healthcare', icon: Activity, color: 'var(--color-danger)', category: 'Industry', installed: false },
  { id: 'education', name: 'Education Module', description: 'Students, courses, fees, and library', href: '/education', icon: GraduationCap, color: '#2563eb', category: 'Industry', installed: false },
  { id: 'real-estate', name: 'Real Estate Module', description: 'Properties, leases, and maintenance', href: '/real-estate', icon: Building2, color: '#ca8a04', category: 'Industry', installed: false },
  { id: 'field-service', name: 'Field Service Module', description: 'Tickets, dispatch, and technician management', href: '/field-service', icon: Wrench, color: '#78716c', category: 'Industry', installed: false },
  { id: 'api-keys', name: 'API Platform', description: 'API keys, webhooks, and developer console', href: '/admin/api-keys', icon: Key, color: '#334155', category: 'Platform', installed: true },
  { id: 'localization', name: 'Localization', description: 'Multi-language translations and RTL support', href: '/admin/localization', icon: Globe, color: '#0d9488', category: 'Platform', installed: true },
  { id: 'sync', name: 'Sync Monitor', description: 'Offline queue reconciliation and PWA sync', href: '/admin/sync', icon: Smartphone, color: '#4f46e5', category: 'Platform', installed: true },
  { id: 'devops', name: 'DevOps & Telemetry', description: 'System metrics, APM, and health checks', href: '/admin/devops', icon: Server, color: '#16a34a', category: 'Platform', installed: true },
  { id: 'saas', name: 'SaaS Portal', description: 'Subscription plans, billing, and usage meters', href: '/saas/portal', icon: Cloud, color: '#9333ea', category: 'Platform', installed: true },
  { id: 'admin', name: 'Administration', description: 'User management and security settings', href: '/admin/users', icon: ShieldAlert, color: '#dc2626', category: 'Core', installed: true },
  { id: 'app-store', name: 'App Store', description: 'Browse additional apps and modules', href: '/apps/store', icon: ShoppingBag, color: '#7c3aed', category: 'Platform', installed: true },
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
    color: 'var(--color-primary)',
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
    appIds: ['analytics', 'documents', 'communication'],
  },
  {
    name: 'Commerce & Advanced',
    description: 'Retail POS terminals, multi-currency ledger, and payroll automation',
    color: '#ec4899',
    categories: ['Commerce', 'Advanced'],
    appIds: ['pos'],
  },
  {
    name: 'Industry Specific Modules',
    description: 'Healthcare EHR, university registries, leasing, and field dispatching',
    color: 'var(--color-warning)',
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
  const [folderSearch, setFolderSearch] = useState('');
  const [defaultApp, setDefaultApp] = useState<string | null>(() => {
    try {
      return localStorage.getItem('defaultApp');
    } catch {
      return null;
    }
  });
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

  const setAsDefault = (appId: string) => {
    try {
      localStorage.setItem('defaultApp', appId);
      setDefaultApp(appId);
    } catch {
      // ignore
    }
  };

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

  const selectedFolderObj = folders.find((f) => f.name === activeFolder);
  const activeFolderApps = selectedFolderObj ? getInstalledAppsInFolder(selectedFolderObj) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out', position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : activeFolder ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {activeFolderApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
          {activeFolderApps.length === 0 && <EmptyState />}
        </div>
      ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <Card padding="lg" style={{ width: '920px', textAlign: 'center', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', position: 'relative' }}>
              {/* Compact search in top-right */}
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '220px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '13px' }}
                  />
                </div>
              </div>
              <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: 'var(--color-text-secondary)' }}>Select an app to continue</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 88px)', gap: 'var(--space-3)', justifyContent: 'center' }}>
                {filteredApps.map((app) => (
                  <div key={app.id} style={{ width: '88px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ position: 'relative' }}>
                      <Link href={app.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: app.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <app.icon size={36} style={{ color: app.color }} />
                        </div>
                      </Link>
                      {defaultApp === app.id && (
                        <div title="Default app" style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 999, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-elevated)', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                          ✓
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', lineHeight: '1.2' }}>{app.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '18px' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>⇢ Logout</a>
              </div>
            </Card>
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
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    Quick access to tools — inspired by popular ERP dashboards (Odoo / ERPNext).
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
              {/* Folder-level search */}
              <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={12} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search within folder..."
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-8)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
                  {activeFolderApps
                    .filter((a) => a.name.toLowerCase().includes(folderSearch.toLowerCase()) || a.description.toLowerCase().includes(folderSearch.toLowerCase()))
                    .map((app) => (
                      <div key={app.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ position: 'relative' }}>
                          <Link href={app.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-lg)', background: app.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <app.icon size={36} style={{ color: app.color }} />
                            </div>
                          </Link>
                          <button
                            title={defaultApp === app.id ? 'Default app' : 'Set as default'}
                            onClick={() => setAsDefault(app.id)}
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              border: 'none',
                              background: defaultApp === app.id ? '#10b981' : 'var(--color-bg-elevated)',
                              color: defaultApp === app.id ? 'var(--color-bg-elevated)' : '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                              cursor: 'pointer',
                            }}
                          >
                            {defaultApp === app.id ? '✓' : '○'}
                          </button>
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</span>
                      </div>
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
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
              background: `${app.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <app.icon size={18} style={{ color: app.color }} />
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
            <div style={{ marginTop: '6px', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              {app.installed ? (
                <span style={{ fontSize: '11px', padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: '999px', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                  Installed
                </span>
              ) : (
                <span style={{ fontSize: '11px', padding: 'var(--space-1) var(--space-2)', background: app.color + '12', borderRadius: '999px', color: app.color, border: '1px solid ' + app.color + '22' }}>
                  Available
                </span>
              )}
            </div>
          </div>
          {app.category !== 'Industry' && (
            <Star
              size={13}
              style={{ color: 'var(--color-warning)', flexShrink: 0 }}
              fill="var(--color-warning)"
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
