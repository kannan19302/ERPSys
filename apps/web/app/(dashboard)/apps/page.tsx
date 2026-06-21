'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShoppingBag,
  // (unused imports removed)
  Cpu,
  X,
  ChevronRight,
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
  { id: 'hr', name: 'Human Resources', description: 'Employee records, departments, and onboarding', href: '/hr', icon: Users, color: 'var(--color-warning)', category: 'People', installed: true },
  { id: 'crm', name: 'CRM & Sales', description: 'Customer relationships and pipeline management', href: '/crm', icon: BarChart3, color: '#3b82f6', category: 'Core', installed: true },
  { id: 'inventory', name: 'Inventory & Stock', description: 'Warehouses, products, and stock levels', href: '/inventory', icon: Package, color: '#8b5cf6', category: 'Operations', installed: true },
  { id: 'procurement', name: 'Procurement', description: 'Vendor management and purchase orders', href: '/procurement', icon: ShoppingCart, color: '#ec4899', category: 'Operations', installed: true },
  { id: 'sales', name: 'Sales & Orders', description: 'Quotations, sales orders, and delivery notes', href: '/sales', icon: ClipboardList, color: '#14b8a6', category: 'Operations', installed: true },
  { id: 'supply-chain', name: 'Supply Chain', description: 'Shipment tracking and carrier management', href: '/supply-chain', icon: Truck, color: '#f97316', category: 'Operations', installed: true },
  { id: 'projects', name: 'Project Management', description: 'Projects, tasks, milestones, and timesheets', href: '/projects', icon: Briefcase, color: '#06b6d4', category: 'Projects', installed: true },
  { id: 'manufacturing', name: 'Manufacturing', description: 'BOM, work orders, and production planning', href: '/manufacturing', icon: Hammer, color: '#84cc16', category: 'Operations', installed: true },
  { id: 'analytics', name: 'Business Intelligence', description: 'Custom dashboards and analytics reports', href: '/analytics', icon: PieChart, color: '#a855f7', category: 'Intelligence', installed: true },
  { id: 'drive', name: 'Drive', description: 'Sleek document library, sharing, and version control', href: '/drive', icon: FolderOpen, color: '#eab308', category: 'Files', installed: true },
  { id: 'communication', name: 'Connect', description: 'Spaces, chat, threads, DMs, meetings, and calendar', href: '/connect', icon: MessageSquare, color: 'var(--color-success)', category: 'Communication', installed: true },
  { id: 'pos', name: 'POS & Retail', description: 'Point of sale terminals and cash registers', href: '/pos', icon: Store, color: '#e11d48', category: 'Finance', installed: true },
  { id: 'workflows', name: 'Workflows', description: 'Approval chains and automation engine', href: '/workflows', icon: GitFork, color: '#0ea5e9', category: 'Platform', installed: true },
  { id: 'storage', name: 'Files & Storage', description: 'Document templates and PDF generation', href: '/storage', icon: HardDrive, color: '#64748b', category: 'Files', installed: true },
  { id: 'healthcare', name: 'Healthcare Module', description: 'Patient records, appointments, and pharmacy', href: '/healthcare', icon: Activity, color: 'var(--color-danger)', category: 'Industry', installed: false },
  { id: 'education', name: 'Education Module', description: 'Students, courses, fees, and library', href: '/education', icon: GraduationCap, color: '#2563eb', category: 'Industry', installed: false },
  { id: 'real-estate', name: 'Real Estate Module', description: 'Properties, leases, and maintenance', href: '/real-estate', icon: Building2, color: '#ca8a04', category: 'Industry', installed: false },
  { id: 'field-service', name: 'Field Service Module', description: 'Tickets, dispatch, and technician management', href: '/field-service', icon: Wrench, color: '#78716c', category: 'Industry', installed: false },
  { id: 'api-keys', name: 'API Platform', description: 'API keys, webhooks, and developer console', href: '/admin/api-keys', icon: Key, color: '#334155', category: 'Developer', installed: true },
  { id: 'localization', name: 'Localization', description: 'Multi-language translations and RTL support', href: '/admin/localization', icon: Globe, color: '#0d9488', category: 'Platform', installed: true },
  { id: 'sync', name: 'Sync Monitor', description: 'Offline queue reconciliation and PWA sync', href: '/admin/sync', icon: Smartphone, color: '#4f46e5', category: 'Platform', installed: true },
  { id: 'devops', name: 'DevOps & Telemetry', description: 'System metrics, APM, and health checks', href: '/admin/devops', icon: Server, color: '#16a34a', category: 'Developer', installed: true },
  { id: 'saas', name: 'SaaS Portal', description: 'Subscription plans, billing, and usage meters', href: '/saas/portal', icon: Cloud, color: '#9333ea', category: 'Platform', installed: true },
  { id: 'admin', name: 'Administration', description: 'User management and security settings', href: '/admin/users', icon: ShieldAlert, color: '#dc2626', category: 'Platform', installed: true },
  { id: 'app-store', name: 'App Store', description: 'Browse additional apps and modules', href: '/apps/store', icon: ShoppingBag, color: '#7c3aed', category: 'Developer', installed: true },
  { id: 'builder', name: 'Studio', description: 'Low-code App Studio and Web Studio for custom ERP apps and website management', href: '/builder', icon: Cpu, color: '#0ea5e9', category: 'Developer', installed: true },
];

interface SubfolderDefinition {
  id: string;
  name: string;
  color: string;
  appIds: string[];
}

const SUBFOLDERS: SubfolderDefinition[] = [
  {
    id: 'developer',
    name: 'Developer',
    color: '#334155',
    appIds: ['api-keys', 'app-store', 'builder', 'devops'],
  },
  {
    id: 'system',
    name: 'System',
    color: '#dc2626',
    appIds: ['admin', 'localization', 'sync', 'saas'],
  },
];

function FolderTile({ folder, onClick, activeApps }: { folder: SubfolderDefinition; onClick: () => void; activeApps: AppDefinition[] }) {
  const appsInFolder = activeApps.filter(a => folder.appIds.includes(a.id));
  const previewApps = appsInFolder.slice(0, 4);
  const [hovered, setHovered] = React.useState(false);

  if (appsInFolder.length === 0) return null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)',
        cursor: 'pointer', width: '88px',
      }}
    >
      {/* Folder icon — 2x2 mini app grid */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '18px',
          background: hovered ? `${folder.color}28` : `${folder.color}18`,
          border: `1.5px solid ${folder.color}30`,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
          padding: '10px',
          transition: 'all 0.15s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: hovered ? `0 8px 20px ${folder.color}30` : 'none',
        }}>
          {previewApps.length > 0 ? previewApps.map((app) => (
            <div key={app.id} style={{ borderRadius: '5px', background: `${app.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <app.icon size={11} style={{ color: app.color }} />
            </div>
          )) : (
            // Empty slots
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ borderRadius: '5px', background: `${folder.color}15` }} />
            ))
          )}
        </div>
        {/* Badge */}
        <div style={{
          position: 'absolute', top: '-6px', right: '-6px',
          minWidth: '20px', height: '20px', borderRadius: '10px',
          background: folder.color, color: 'white',
          fontSize: '10px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 5px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}>
          {appsInFolder.length}
        </div>
      </div>
      <span style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.2, maxWidth: '88px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {folder.name}
      </span>
    </div>
  );
}

function SingleAppTile({ app }: { app: AppDefinition }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link href={app.href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', width: '88px', cursor: 'pointer' }}
      >
        <div style={{
          width: '72px', height: '72px', borderRadius: '18px',
          background: hovered ? `${app.color}28` : `${app.color}1a`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          boxShadow: hovered ? `0 8px 20px ${app.color}30` : 'none',
        }}>
          <app.icon size={34} style={{ color: app.color }} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.2, maxWidth: '88px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {app.name}
        </span>
      </div>
    </Link>
  );
}

export default function AppsHubPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstalled = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/v1/saas/installed-apps', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInstalledApps(new Set(data));
        }
      } catch (err) {
        console.error('Failed to load installed apps', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstalled();
  }, []);

  const activeApps = applications.filter(app => app.installed || installedApps.has(app.id));
  const sortedActiveApps = [...activeApps].sort((a, b) => a.name.localeCompare(b.name));

  const openFolderObj = SUBFOLDERS.find(f => f.id === openFolder);
  const appsInOpenFolder = openFolderObj ? sortedActiveApps.filter(a => openFolderObj.appIds.includes(a.id)) : [];

  // Search across all apps
  const searchResults = searchQuery.trim()
    ? sortedActiveApps.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(app => {
        const folder = SUBFOLDERS.find(f => f.appIds.includes(app.id));
        return { app, folderName: folder?.name ?? null };
      })
    : [];

  const folderAppIds = SUBFOLDERS.flatMap(f => f.appIds);
  const rootApps = sortedActiveApps.filter(app => !folderAppIds.includes(app.id));
  const visibleSubfolders = SUBFOLDERS.filter(f => sortedActiveApps.filter(a => f.appIds.includes(a.id)).length > 0);
  const sortedSubfolders = [...visibleSubfolders].sort((a, b) => a.name.localeCompare(b.name));

  // Combine folders and rootApps into a single list sorted alphabetically
  const gridItems = [
    ...sortedSubfolders.map(folder => ({ type: 'folder' as const, id: folder.id, name: folder.name, data: folder })),
    ...rootApps.map(app => ({ type: 'app' as const, id: app.id, name: app.name, data: app }))
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minHeight: '80vh', position: 'relative' }}>
      {/* Center card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-8)' }}>
        <div className="frappe-card" style={{
          width: '940px', maxWidth: '100%',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
        }}>
          {/* Header */}
          <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
                {openFolder ? openFolderObj?.name : 'Desk'}
              </h2>
              {openFolder && (
                <button
                  onClick={() => setOpenFolder(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-sm)', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                >
                  ← Back to All Apps
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input
                className="frappe-input"
                type="text"
                placeholder={openFolder ? `Search in ${openFolderObj?.name}...` : 'Search all apps...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 'var(--space-6)', minHeight: '400px' }}>
            {/* Search Results */}
            {searchQuery.trim() ? (
              <div>
                {searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)' }}>
                    <Search size={40} style={{ margin: '0 auto var(--space-3)', display: 'block', opacity: 0.3 }} />
                    <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>No apps found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
                    {searchResults.map(({ app, folderName }) => (
                      <div key={app.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)', width: '88px' }}>
                        <SingleAppTile app={app} />
                        {folderName && (
                          <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>in {folderName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : openFolder ? (
              /* Folder content */
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
                  {appsInOpenFolder.map(app => (
                    <SingleAppTile key={app.id} app={app} />
                  ))}
                </div>
              </div>
            ) : (
              /* Root grid: subfolders + individual apps mixed alphabetically */
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
                {gridItems.map(item => {
                  if (item.type === 'folder') {
                    return (
                      <FolderTile
                        key={item.id}
                        folder={item.data}
                        onClick={() => setOpenFolder(item.id)}
                        activeApps={sortedActiveApps}
                      />
                    );
                  } else {
                    return <SingleAppTile key={item.id} app={item.data} />;
                  }
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: 'var(--space-3) var(--space-6)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {sortedActiveApps.length} apps · {sortedSubfolders.length} folders
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Link href="/apps/store" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShoppingBag size={12} />
                App Store
                <ChevronRight size={10} />
              </Link>
              <button
                onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Folder Modal Overlay */}
      {openFolder && (
        <div
          onClick={() => setOpenFolder(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '640px', maxWidth: '92vw', maxHeight: '80vh',
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden', animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Modal header */}
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: openFolderObj ? `linear-gradient(135deg, ${openFolderObj.color}08 0%, transparent 100%)` : '' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {openFolderObj && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${openFolderObj.color}18`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '8px' }}>
                    {applications.filter(a => openFolderObj.appIds.includes(a.id)).slice(0, 4).map((app) => (
                      <div key={app.id} style={{ borderRadius: '3px', background: `${app.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <app.icon size={8} style={{ color: app.color }} />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{openFolderObj?.name}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{appsInOpenFolder.length} apps in this folder</p>
                </div>
              </div>
              <button onClick={() => setOpenFolder(null)} style={{ background: 'var(--color-bg-sunken)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal apps grid */}
            <div style={{ padding: 'var(--space-6)', overflowY: 'auto', maxHeight: '60vh' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
                {appsInOpenFolder.map(app => (
                  <SingleAppTile key={app.id} app={app} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
