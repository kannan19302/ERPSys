'use client';
import styles from './page.module.css';
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
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  { id: 'finance', name: 'Finance & Accounting', description: 'Invoices, payments, and ledger management', href: '/finance', icon: CreditCard, color: 'var(--color-primary)', category: 'Core', installed: true },
  { id: 'hr', name: 'Human Resources', description: 'Employee records, departments, and onboarding', href: '/hr', icon: Users, color: 'var(--color-warning)', category: 'People', installed: true },
  { id: 'crm', name: 'CRM & Sales', description: 'Customer relationships and pipeline management', href: '/crm', icon: BarChart3, color: 'var(--color-primary)', category: 'Core', installed: true },
  { id: 'inventory', name: 'Inventory & Stock', description: 'Warehouses, products, and stock levels', href: '/inventory', icon: Package, color: 'var(--color-primary)', category: 'Operations', installed: true },
  { id: 'procurement', name: 'Procurement', description: 'Vendor management and purchase orders', href: '/procurement', icon: ShoppingCart, color: 'var(--color-primary)', category: 'Operations', installed: true },
  { id: 'sales', name: 'Sales & Orders', description: 'Quotations, sales orders, and delivery notes', href: '/sales', icon: ClipboardList, color: 'var(--color-primary)', category: 'Operations', installed: true },
  { id: 'supply-chain', name: 'Supply Chain', description: 'Shipment tracking and carrier management', href: '/supply-chain', icon: Truck, color: 'var(--color-primary)', category: 'Operations', installed: true },
  { id: 'projects', name: 'Project Management', description: 'Projects, tasks, milestones, and timesheets', href: '/projects', icon: Briefcase, color: 'var(--color-primary)', category: 'Projects', installed: true },
  { id: 'manufacturing', name: 'Manufacturing', description: 'BOM, work orders, and production planning', href: '/manufacturing', icon: Hammer, color: 'var(--color-primary)', category: 'Operations', installed: true },
  { id: 'analytics', name: 'Business Intelligence', description: 'Custom dashboards and analytics reports', href: '/analytics', icon: PieChart, color: 'var(--color-primary)', category: 'Intelligence', installed: true },
  { id: 'drive', name: 'Drive', description: 'Sleek document library, sharing, and version control', href: '/drive', icon: FolderOpen, color: 'var(--color-primary)', category: 'Files', installed: true },
  { id: 'communication', name: 'Connect', description: 'Spaces, chat, threads, DMs, meetings, and calendar', href: '/connect', icon: MessageSquare, color: 'var(--color-success)', category: 'Communication', installed: true },
  { id: 'pos', name: 'POS & Retail', description: 'Point of sale terminals and cash registers', href: '/pos', icon: Store, color: 'var(--color-primary)', category: 'Finance', installed: true },
  { id: 'healthcare', name: 'Healthcare Module', description: 'Patient records, appointments, and pharmacy', href: '/healthcare', icon: Activity, color: 'var(--color-danger)', category: 'Industry', installed: false },
  { id: 'education', name: 'Education Module', description: 'Students, courses, fees, and library', href: '/education', icon: GraduationCap, color: 'var(--color-primary)', category: 'Industry', installed: false },
  { id: 'real-estate', name: 'Real Estate Module', description: 'Properties, leases, and maintenance', href: '/real-estate', icon: Building2, color: 'var(--color-primary)', category: 'Industry', installed: false },
  { id: 'field-service', name: 'Field Service Module', description: 'Tickets, dispatch, and technician management', href: '/field-service', icon: Wrench, color: 'var(--color-primary)', category: 'Industry', installed: false },
  { id: 'api-keys', name: 'API Platform', description: 'API keys, webhooks, and developer console', href: '/settings/api-keys', icon: Key, color: 'var(--color-primary)', category: 'Developer', installed: true },
  { id: 'saas', name: 'SaaS Portal', description: 'Subscription plans, billing, and usage meters', href: '/saas/portal', icon: Cloud, color: 'var(--color-primary)', category: 'Platform', installed: true },
  { id: 'app-store', name: 'App Store', description: 'Browse additional apps and modules', href: '/apps/store', icon: ShoppingBag, color: 'var(--color-primary)', category: 'Developer', installed: true },
  { id: 'builder', name: 'Studio', description: 'Low-code App Studio and Web Studio for custom ERP apps and website management', href: '/builder', icon: Cpu, color: 'var(--color-primary)', category: 'Developer', installed: true },
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
    color: 'var(--color-primary)',
    appIds: ['api-keys', 'app-store', 'builder', 'saas'],
  },
];

function FolderTile({ folder, onClick, activeApps }: { folder: SubfolderDefinition; onClick: () => void; activeApps: AppDefinition[] }) {
  const appsInFolder = activeApps.filter(a => folder.appIds.includes(a.id));
  const previewApps = appsInFolder.slice(0, 4);

  if (appsInFolder.length === 0) return null;

  return (
    <div
      onClick={onClick}
      className={styles.s1}
    >
      {/* Folder icon — 2x2 mini app grid */}
      <div className="relative">
        <div style={{ '--tile-color': folder.color } as React.CSSProperties} className={`${styles.s2} ${styles.folderTile}`}>
          {previewApps.length > 0 ? previewApps.map((app) => (
            <div key={app.id} style={{ background: `${app.color}22` }} className={styles.s3}>
              <app.icon size={11} style={{ color: app.color }} />
            </div>
          )) : (
            // Empty slots
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: `${folder.color}15` }} className={styles.s4} />
            ))
          )}
        </div>
        {/* Badge */}
        <div style={{ background: folder.color }} className={styles.s5}>
          {appsInFolder.length}
        </div>
      </div>
      <span className={styles.s6}>
        {folder.name}
      </span>
    </div>
  );
}

function SingleAppTile({ app }: { app: AppDefinition }) {
  return (
    <Link href={app.href} className={styles.s7}>
      <div
        className={styles.s1}
      >
        <div style={{ '--tile-color': app.color } as React.CSSProperties} className={`${styles.s8} ${styles.appTile}`}>
          <app.icon size={34} style={{ color: app.color }} />
        </div>
        <span className={styles.s6}>
          {app.name}
        </span>
      </div>
    </Link>
  );
}

export default function AppsHubPage() {
  const client = useApiClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [marketplaceApps, setMarketplaceApps] = useState<AppDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstalled = async () => {
      try {
        const [saasApps, marketplace] = await Promise.all([
          client.get<string[]>('/saas/installed-apps'),
          client.get<Array<Record<string, unknown>>>('/admin/marketplace/installed'),
        ]);

        setInstalledApps(new Set(saasApps));

        {
          const list = marketplace;
          // Installed industry/marketplace apps run at /app/<slug> (the in-app shell).
          const dynamic: AppDefinition[] = list
            .filter(a => a.source === 'MARKETPLACE' && typeof a.appSlug === 'string')
            .map(a => ({
              id: `mkt:${String(a.appSlug)}`,
              name: String(a.appName || a.appSlug),
              description: 'Installed industry app — open to manage its modules.',
              href: `/app/${String(a.appSlug)}`,
              icon: Activity,
              color: 'var(--color-danger)',
              category: 'Industry',
              installed: true,
            }));
          setMarketplaceApps(dynamic);
        }
      } catch (err) {
        console.error('Failed to load installed apps', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstalled();
  }, [client]);

  // Kernel apps are always shown on the Desk; every other app (core business module
  // or industry app) appears only while installed for the tenant — so uninstalling
  // one hides its icon here.
  const KERNEL_APP_IDS = new Set(['dashboard', 'api-keys', 'saas', 'app-store', 'builder']);
  const activeApps = [
    ...applications.filter(app => (KERNEL_APP_IDS.has(app.id) || installedApps.has(app.id)) && app.category !== 'Industry'),
    ...marketplaceApps,
  ];
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
    <RouteGuard permission="apps.read">
    <div className={styles.s9}>
      {/* Center card */}
      <div className={styles.s10}>
        <div className={`ui-card ${styles.s11}`} >
          {/* Header */}
          <div className={styles.s12}>
            <div>
              <h2 className={styles.s13}>
                {openFolder ? openFolderObj?.name : 'Desk'}
              </h2>
              {openFolder && (
                <button
                  onClick={() => setOpenFolder(null)}
                  className={styles.s14}
                >
                  ← Back to All Apps
                </button>
              )}
            </div>

            {/* Search */}
            <div className={styles.s15}>
              <Search size={14} className={styles.s16} />
              <input
                className={`ui-input ${styles.s17}`}
                type="text"
                placeholder={openFolder ? `Search in ${openFolderObj?.name}...` : 'Search all apps...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={styles.s18}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={styles.s19}>
            {/* Search Results */}
            {searchQuery.trim() ? (
              <div>
                {searchResults.length === 0 ? (
                  <div className={styles.s20}>
                    <Search size={40} className={styles.s21} />
                    <p className={styles.s22}>No apps found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className={styles.s23}>
                    {searchResults.map(({ app, folderName }) => (
                      <div key={app.id} className={styles.s24}>
                        <SingleAppTile app={app} />
                        {folderName && (
                          <span className={styles.s25}>in {folderName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : openFolder ? (
              /* Folder content */
              <div>
                <div className={styles.s23}>
                  {appsInOpenFolder.map(app => (
                    <SingleAppTile key={app.id} app={app} />
                  ))}
                </div>
              </div>
            ) : (
              /* Root grid: subfolders + individual apps mixed alphabetically */
              <div className={styles.s23}>
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
          <div className={styles.s26}>
            <span className="ui-text-xs-tertiary">
              {sortedActiveApps.length} apps · {sortedSubfolders.length} folders
            </span>
            <div className="ui-flex ui-gap-3">
              <Link href="/apps/store" className={styles.s27}>
                <ShoppingBag size={12} />
                App Store
                <ChevronRight size={10} />
              </Link>
              <button
                onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); }}
                className={styles.s28}
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
          className={styles.s29}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={styles.s30}
          >
            {/* Modal header */}
            <div style={{ background: openFolderObj ? `linear-gradient(135deg, ${openFolderObj.color}08 0%, transparent 100%)` : '' }} className={styles.s12}>
              <div className="ui-hstack-3">
                {openFolderObj && (
                  <div style={{ background: `${openFolderObj.color}18` }} className={styles.s31}>
                    {applications.filter(a => openFolderObj.appIds.includes(a.id)).slice(0, 4).map((app) => (
                      <div key={app.id} style={{ background: `${app.color}28` }} className={styles.s32}>
                        <app.icon size={8} style={{ color: app.color }} />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <h3 className={styles.s13}>{openFolderObj?.name}</h3>
                  <p className="ui-text-xs-muted m-0">{appsInOpenFolder.length} apps in this folder</p>
                </div>
              </div>
              <button onClick={() => setOpenFolder(null)} className={styles.s33}>
                <X size={16} />
              </button>
            </div>

            {/* Modal apps grid */}
            <div className={styles.s34}>
              <div className={styles.s23}>
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
    </RouteGuard>
  );
}
