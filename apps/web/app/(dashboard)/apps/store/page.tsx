'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, PageHeader, Badge } from '@unerp/ui';
import {
  Search,
  ArrowLeft,
  Download,
  CheckCircle,
  Star,
  TrendingUp,
  Heart,
  GraduationCap,
  Building2,
  Wrench,
  Truck,
  ShoppingBag,
  Cpu,
  Landmark,
  Users,
  Leaf,
  Plane,
  Utensils,
  Palette,
  Wifi,
} from 'lucide-react';

interface StoreApp {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  category: string;
  rating: number;
  reviews: number;
  installed: boolean;
  price: 'Free' | 'Included' | 'Premium';
  publisher: string;
  version: string;
}

const storeApps: StoreApp[] = [
  // Already installed apps
  {
    id: 'healthcare',
    name: 'Healthcare Module',
    description: 'Patient EHR, appointments, pharmacy, and insurance claims.',
    longDescription: 'Complete healthcare management with electronic health records, prescription management, lab orders, and HIPAA-compliant audit trails.',
    icon: Heart,
    color: '#ef4444',
    category: 'Industry',
    rating: 4.8,
    reviews: 142,
    installed: true,
    price: 'Included',
    publisher: 'UniERP Core',
    version: '1.0.0',
  },
  {
    id: 'education',
    name: 'Education Module',
    description: 'Student management, courses, fees, and library.',
    longDescription: 'Comprehensive education management covering admissions, timetabling, fee collection, attendance tracking, and library circulation.',
    icon: GraduationCap,
    color: '#2563eb',
    category: 'Industry',
    rating: 4.7,
    reviews: 98,
    installed: true,
    price: 'Included',
    publisher: 'UniERP Core',
    version: '1.0.0',
  },
  {
    id: 'real-estate',
    name: 'Real Estate Module',
    description: 'Property registry, leases, and maintenance.',
    longDescription: 'Property portfolio management with lease lifecycle, tenant portals, commission tracking, and NOI valuation modelling.',
    icon: Building2,
    color: '#ca8a04',
    category: 'Industry',
    rating: 4.6,
    reviews: 67,
    installed: true,
    price: 'Included',
    publisher: 'UniERP Core',
    version: '1.0.0',
  },
  {
    id: 'field-service',
    name: 'Field Service Module',
    description: 'Tickets, technician dispatch, and preventive maintenance.',
    longDescription: 'On-site service management with SLA tracking, GPS route mapping, technician checklists, and auto-invoicing for parts and labor.',
    icon: Wrench,
    color: '#78716c',
    category: 'Industry',
    rating: 4.5,
    reviews: 53,
    installed: true,
    price: 'Included',
    publisher: 'UniERP Core',
    version: '1.0.0',
  },
  // Available for install — NEW modules
  {
    id: 'logistics-pro',
    name: 'Logistics Pro',
    description: 'Advanced fleet management and route optimization.',
    longDescription: 'Multi-modal freight management with real-time GPS fleet tracking, route optimization AI, fuel cost analytics, and driver compliance.',
    icon: Truck,
    color: '#f97316',
    category: 'Industry',
    rating: 4.9,
    reviews: 203,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Marketplace',
    version: '2.1.0',
  },
  {
    id: 'ecommerce-bridge',
    name: 'E-Commerce Bridge',
    description: 'Sync orders from Shopify, WooCommerce, and Amazon.',
    longDescription: 'Bi-directional sync engine connecting your ERP inventory and pricing to major e-commerce platforms with real-time stock level updates.',
    icon: ShoppingBag,
    color: '#22c55e',
    category: 'Integration',
    rating: 4.7,
    reviews: 312,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Marketplace',
    version: '1.5.0',
  },
  {
    id: 'ai-forecasting',
    name: 'AI Demand Forecasting',
    description: 'ML-powered demand prediction and inventory optimization.',
    longDescription: 'Machine learning models that analyze historical sales, seasonality, and market signals to predict demand and auto-generate reorder suggestions.',
    icon: Cpu,
    color: '#8b5cf6',
    category: 'Intelligence',
    rating: 4.6,
    reviews: 87,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Labs',
    version: '0.9.0',
  },
  {
    id: 'govt-compliance',
    name: 'Government Compliance',
    description: 'GST, VAT, IRAS, HMRC tax filing automation.',
    longDescription: 'Automated tax computation and e-filing for multiple jurisdictions. Supports GST (India), VAT (EU/UK), and IRAS (Singapore) with audit-ready reports.',
    icon: Landmark,
    color: '#0ea5e9',
    category: 'Finance',
    rating: 4.8,
    reviews: 176,
    installed: false,
    price: 'Free',
    publisher: 'UniERP Core',
    version: '1.2.0',
  },
  {
    id: 'hr-recruitment',
    name: 'HR Recruitment Suite',
    description: 'Job postings, applicant tracking, and interview scheduling.',
    longDescription: 'End-to-end recruitment with career portal, resume parsing, interview scheduling, offer letter generation, and onboarding checklists.',
    icon: Users,
    color: '#ec4899',
    category: 'HR',
    rating: 4.5,
    reviews: 134,
    installed: false,
    price: 'Free',
    publisher: 'UniERP Core',
    version: '1.0.0',
  },
  {
    id: 'sustainability',
    name: 'ESG & Sustainability',
    description: 'Carbon tracking, ESG reporting, and compliance.',
    longDescription: 'Track carbon emissions, energy consumption, and waste across operations. Generate ESG reports aligned with GRI, SASB, and TCFD frameworks.',
    icon: Leaf,
    color: '#16a34a',
    category: 'Intelligence',
    rating: 4.4,
    reviews: 42,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Labs',
    version: '0.8.0',
  },
  {
    id: 'travel-expense',
    name: 'Travel & Expense',
    description: 'Trip planning, expense claims, and receipt OCR.',
    longDescription: 'Automated travel booking integrations, smart receipt scanning with OCR, policy compliance checks, and reimbursement workflow.',
    icon: Plane,
    color: '#06b6d4',
    category: 'Operations',
    rating: 4.6,
    reviews: 91,
    installed: false,
    price: 'Free',
    publisher: 'UniERP Core',
    version: '1.1.0',
  },
  {
    id: 'food-service',
    name: 'Food & Beverage',
    description: 'Restaurant management, menu costing, and kitchen display.',
    longDescription: 'Recipe management with ingredient costing, table reservations, kitchen display system (KDS), and integration with POS terminals.',
    icon: Utensils,
    color: '#ea580c',
    category: 'Industry',
    rating: 4.3,
    reviews: 38,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Marketplace',
    version: '1.0.0',
  },
  {
    id: 'brand-portal',
    name: 'Brand & Marketing Portal',
    description: 'Digital asset management and campaign tracking.',
    longDescription: 'Centralized brand asset library, marketing campaign performance tracking, email template builder, and social media scheduling.',
    icon: Palette,
    color: '#d946ef',
    category: 'Marketing',
    rating: 4.2,
    reviews: 29,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Labs',
    version: '0.7.0',
  },
  {
    id: 'iot-connector',
    name: 'IoT Device Connector',
    description: 'Connect sensors, PLCs, and smart devices.',
    longDescription: 'MQTT/HTTP bridge for industrial IoT devices. Monitor machine telemetry, trigger alerts on threshold breaches, and feed data into analytics.',
    icon: Wifi,
    color: '#14b8a6',
    category: 'Integration',
    rating: 4.1,
    reviews: 22,
    installed: false,
    price: 'Premium',
    publisher: 'UniERP Labs',
    version: '0.5.0',
  },
];

const storeCategories = ['All', 'Industry', 'Integration', 'Intelligence', 'Finance', 'HR', 'Operations', 'Marketing'];

export default function AppStorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [installedApps, setInstalledApps] = useState<Set<string>>(
    new Set(storeApps.filter((a) => a.installed).map((a) => a.id))
  );
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = (appId: string) => {
    setInstallingId(appId);
    // Simulate install
    setTimeout(() => {
      setInstalledApps((prev) => new Set([...prev, appId]));
      setInstallingId(null);
    }, 1500);
  };

  const filtered = storeApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const featured = storeApps.filter((a) => !a.installed && a.rating >= 4.6).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="App Store"
        description="Discover, search, and install modules to extend your ERP capabilities."
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Store' },
        ]}
        actions={
          <Link
            href="/apps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
              border: '1px solid var(--color-border)',
            }}
          >
            <ArrowLeft size={16} /> Back to Apps
          </Link>
        }
      />

      {/* Featured Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Featured & Trending</span>
          </div>
          <h2 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>
            Extend Your ERP with Powerful Modules
          </h2>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', opacity: 0.8, maxWidth: '600px' }}>
            Browse {storeApps.filter((a) => !a.installed).length}+ modules across industries, integrations, and intelligence.
            Install with one click and start using immediately.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {featured.map((app) => (
              <div
                key={app.id}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  minWidth: '200px',
                }}
              >
                <app.icon size={20} style={{ color: app.color }} />
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{app.name}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>{app.rating} ★ · {app.reviews} reviews</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card padding="md" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '200px' }}>
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
            id="store-search-input"
            type="text"
            placeholder="Search modules, integrations, and extensions..."
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
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {storeCategories.map((cat) => (
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

      {/* Store Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {filtered.map((app) => {
          const isInstalled = installedApps.has(app.id);
          const isInstalling = installingId === app.id;

          return (
            <Card
              key={app.id}
              padding="lg"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    background: `${app.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <app.icon size={24} style={{ color: app.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                    {app.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{app.publisher}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>·</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>v{app.version}</span>
                  </div>
                </div>
                <Badge variant={app.price === 'Free' ? 'success' : app.price === 'Included' ? 'info' : 'warning'}>
                  {app.price}
                </Badge>
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                {app.longDescription}
              </p>

              {/* Rating & Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      style={{ color: s <= Math.floor(app.rating) ? '#f59e0b' : 'var(--color-border)' }}
                      fill={s <= Math.floor(app.rating) ? '#f59e0b' : 'none'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
                  {app.rating} ({app.reviews})
                </span>
                <span style={{ fontSize: '10px', color: app.color, fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {app.category}
                </span>
              </div>

              {/* Action */}
              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                {isInstalled ? (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-success)',
                      background: 'transparent',
                      color: 'var(--color-success)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <CheckCircle size={15} /> Installed
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(app.id)}
                    disabled={isInstalling}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: isInstalling
                        ? 'var(--color-bg-sunken)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: isInstalling ? 'var(--color-text-secondary)' : '#fff',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      cursor: isInstalling ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: isInstalling ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isInstalling) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isInstalling ? (
                      <>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            border: '2px solid var(--color-text-tertiary)',
                            borderTopColor: 'transparent',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Install
                      </>
                    )}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Search size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
          <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
            No Modules Found
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Try adjusting your search or category filter.
          </p>
        </div>
      )}

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
