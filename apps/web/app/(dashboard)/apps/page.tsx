'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface AppDefinition {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  category: string;
  installed: boolean;
}

const applications: AppDefinition[] = [
  { name: 'Dashboard', description: 'Overview of key metrics and KPIs', href: '/dashboard', icon: Home, color: '#6366f1', category: 'Core', installed: true },
  { name: 'Finance & Accounting', description: 'Invoices, payments, and ledger management', href: '/finance', icon: CreditCard, color: '#10b981', category: 'Core', installed: true },
  { name: 'Human Resources', description: 'Employee records, departments, and onboarding', href: '/hr', icon: Users, color: '#f59e0b', category: 'Core', installed: true },
  { name: 'CRM & Sales', description: 'Customer relationships and pipeline management', href: '/crm', icon: BarChart3, color: '#3b82f6', category: 'Core', installed: true },
  { name: 'Inventory & Stock', description: 'Warehouses, products, and stock levels', href: '/inventory', icon: Package, color: '#8b5cf6', category: 'Core', installed: true },
  { name: 'Procurement', description: 'Vendor management and purchase orders', href: '/procurement', icon: ShoppingCart, color: '#ec4899', category: 'Operations', installed: true },
  { name: 'Sales & Orders', description: 'Quotations, sales orders, and delivery notes', href: '/sales', icon: ClipboardList, color: '#14b8a6', category: 'Operations', installed: true },
  { name: 'Supply Chain', description: 'Shipment tracking and carrier management', href: '/supply-chain', icon: Truck, color: '#f97316', category: 'Operations', installed: true },
  { name: 'Project Management', description: 'Projects, tasks, milestones, and timesheets', href: '/projects', icon: Briefcase, color: '#06b6d4', category: 'Operations', installed: true },
  { name: 'Manufacturing', description: 'BOM, work orders, and production planning', href: '/manufacturing', icon: Hammer, color: '#84cc16', category: 'Operations', installed: true },
  { name: 'Business Intelligence', description: 'Custom dashboards and analytics reports', href: '/analytics', icon: PieChart, color: '#a855f7', category: 'Intelligence', installed: true },
  { name: 'Document Management', description: 'File storage, folders, and version control', href: '/documents', icon: FolderOpen, color: '#eab308', category: 'Intelligence', installed: true },
  { name: 'Communication', description: 'Channels, messaging, and notifications', href: '/communication', icon: MessageSquare, color: '#22c55e', category: 'Intelligence', installed: true },
  { name: 'POS & Retail', description: 'Point of sale terminals and cash registers', href: '/pos', icon: Store, color: '#e11d48', category: 'Commerce', installed: true },
  { name: 'Advanced Finance', description: 'Multi-currency, chart of accounts, and budgets', href: '/finance/advanced', icon: Wallet, color: '#059669', category: 'Advanced', installed: true },
  { name: 'Advanced HR', description: 'Payroll, leave, attendance, and performance', href: '/hr/advanced', icon: FileSliders, color: '#d946ef', category: 'Advanced', installed: true },
  { name: 'Workflows', description: 'Approval chains and automation engine', href: '/workflows', icon: GitFork, color: '#0ea5e9', category: 'Platform', installed: true },
  { name: 'Files & Storage', description: 'Document templates and PDF generation', href: '/storage', icon: HardDrive, color: '#64748b', category: 'Platform', installed: true },
  { name: 'Advanced Reporting', description: 'Pivot tables, scheduled reports, and dashboards', href: '/analytics/advanced', icon: PieChart, color: '#7c3aed', category: 'Intelligence', installed: true },
  { name: 'Healthcare', description: 'Patient records, appointments, and pharmacy', href: '/healthcare', icon: Activity, color: '#ef4444', category: 'Industry', installed: true },
  { name: 'Education', description: 'Students, courses, fees, and library', href: '/education', icon: GraduationCap, color: '#2563eb', category: 'Industry', installed: true },
  { name: 'Real Estate', description: 'Properties, leases, and maintenance', href: '/real-estate', icon: Building2, color: '#ca8a04', category: 'Industry', installed: true },
  { name: 'Field Service', description: 'Tickets, dispatch, and technician management', href: '/field-service', icon: Wrench, color: '#78716c', category: 'Industry', installed: true },
  { name: 'API Platform', description: 'API keys, webhooks, and developer console', href: '/admin/api-keys', icon: Key, color: '#334155', category: 'Platform', installed: true },
  { name: 'Localization', description: 'Multi-language translations and RTL support', href: '/admin/localization', icon: Globe, color: '#0d9488', category: 'Platform', installed: true },
  { name: 'Sync Monitor', description: 'Offline queue reconciliation and PWA sync', href: '/admin/sync', icon: Smartphone, color: '#4f46e5', category: 'Platform', installed: true },
  { name: 'DevOps & Telemetry', description: 'System metrics, APM, and health checks', href: '/admin/devops', icon: Server, color: '#16a34a', category: 'Platform', installed: true },
  { name: 'SaaS Portal', description: 'Subscription plans, billing, and usage meters', href: '/saas/portal', icon: Cloud, color: '#9333ea', category: 'Platform', installed: true },
  { name: 'Administration', description: 'User management and security settings', href: '/admin/users', icon: ShieldAlert, color: '#dc2626', category: 'Core', installed: true },
];

const categories = ['All', 'Core', 'Operations', 'Intelligence', 'Commerce', 'Advanced', 'Industry', 'Platform'];

export default function AppsHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Apps Hub"
        description="Browse and launch all installed ERP applications. Navigate to the App Store to discover and install new modules."
        breadcrumbs={[{ label: 'Apps' }]}
        actions={
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
        }
      />

      {/* Search & Filter Bar */}
      <Card padding="md" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
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
            id="apps-search-input"
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              color: 'var(--color-text)',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedCategory === cat ? 'var(--color-primary)' : 'transparent',
                color: selectedCategory === cat ? '#fff' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* App Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {filtered.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
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
                {app.installed && (
                  <Star
                    size={14}
                    style={{ color: '#f59e0b', flexShrink: 0 }}
                    fill="#f59e0b"
                  />
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                {app.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <LayoutGrid size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
          <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
            No Applications Found
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Try adjusting your search or category filter.
          </p>
        </div>
      )}
    </div>
  );
}
