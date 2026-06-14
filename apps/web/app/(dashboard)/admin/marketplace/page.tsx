'use client';

import React, { useState } from 'react';
import {
  Star, Download, Search, Tag, CheckCircle, Clock, Puzzle
} from 'lucide-react';

interface AppListing {
  id: string;
  name: string;
  publisher: string;
  category: string;
  rating: number;
  reviews: number;
  installs: number;
  price: string;
  description: string;
  tags: string[];
  verified: boolean;
  icon: string;
  screenshots: string[];
  version: string;
  lastUpdated: string;
  installed: boolean;
}

export default function AppMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<AppListing | null>(null);

  const categories = ['ALL', 'Finance', 'HR', 'Manufacturing', 'Sales', 'Analytics', 'Integration', 'Utilities'];

  const [apps] = useState<AppListing[]>([
    { id: 'app-1', name: 'QuickBooks Connector', publisher: 'UniERP Labs', category: 'Finance', rating: 4.8, reviews: 234, installs: 12500, price: 'Free', description: 'Seamlessly sync your invoices, payments, and chart of accounts with QuickBooks Online. Two-way sync with conflict resolution.', tags: ['accounting', 'sync', 'quickbooks'], verified: true, icon: '📊', screenshots: [], version: '3.2.1', lastUpdated: '2026-06-10', installed: true },
    { id: 'app-2', name: 'Stripe Payment Gateway', publisher: 'UniERP Labs', category: 'Finance', rating: 4.9, reviews: 567, installs: 28900, price: 'Free', description: 'Accept credit cards, ACH, and international payments. Automatic reconciliation with your General Ledger.', tags: ['payments', 'stripe', 'gateway'], verified: true, icon: '💳', screenshots: [], version: '2.8.0', lastUpdated: '2026-06-12', installed: false },
    { id: 'app-3', name: 'Slack Notifications', publisher: 'Community', category: 'Integration', rating: 4.5, reviews: 89, installs: 5600, price: 'Free', description: 'Send ERP notifications to Slack channels. Configure rules per module, entity, and event type.', tags: ['slack', 'notifications', 'chat'], verified: false, icon: '💬', screenshots: [], version: '1.4.2', lastUpdated: '2026-06-08', installed: false },
    { id: 'app-4', name: 'Barcode Scanner Pro', publisher: 'ScanTech', category: 'Manufacturing', rating: 4.7, reviews: 156, installs: 8200, price: '$9.99/mo', description: 'Advanced barcode and QR code scanning with batch processing, camera-based scanning, and multi-format support.', tags: ['barcode', 'scanner', 'inventory'], verified: true, icon: '📱', screenshots: [], version: '4.1.0', lastUpdated: '2026-06-05', installed: true },
    { id: 'app-5', name: 'AI Resume Parser', publisher: 'TalentAI', category: 'HR', rating: 4.3, reviews: 42, installs: 2100, price: '$14.99/mo', description: 'Automatically parse resumes and extract skills, experience, and education. Integrates with HR recruitment pipeline.', tags: ['ai', 'resume', 'recruitment'], verified: true, icon: '🤖', screenshots: [], version: '1.2.0', lastUpdated: '2026-05-28', installed: false },
    { id: 'app-6', name: 'Advanced Charts', publisher: 'DataViz Co', category: 'Analytics', rating: 4.6, reviews: 198, installs: 9400, price: 'Free', description: 'Enhanced charting library with Sankey diagrams, heatmaps, treemaps, and geographic maps for dashboards.', tags: ['charts', 'visualization', 'analytics'], verified: true, icon: '📈', screenshots: [], version: '2.5.3', lastUpdated: '2026-06-01', installed: false },
    { id: 'app-7', name: 'Salesforce CRM Bridge', publisher: 'CloudConnect', category: 'Sales', rating: 4.4, reviews: 67, installs: 3800, price: '$19.99/mo', description: 'Bi-directional sync between UniERP CRM and Salesforce. Map custom fields, automate lead imports.', tags: ['salesforce', 'crm', 'sync'], verified: false, icon: '☁️', screenshots: [], version: '1.0.5', lastUpdated: '2026-06-07', installed: false },
    { id: 'app-8', name: 'PDF Report Generator', publisher: 'UniERP Labs', category: 'Utilities', rating: 4.7, reviews: 312, installs: 15600, price: 'Free', description: 'Generate custom PDF reports from any module data. Template engine with conditional logic and dynamic tables.', tags: ['pdf', 'reports', 'export'], verified: true, icon: '📄', screenshots: [], version: '3.0.0', lastUpdated: '2026-06-11', installed: true },
  ]);

  const filteredApps = apps.filter(a => {
    if (activeCategory !== 'ALL' && a.category !== activeCategory) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={12} style={{ color: i < Math.floor(rating) ? 'hsl(45, 90%, 50%)' : 'var(--color-border)', fill: i < Math.floor(rating) ? 'hsl(45, 90%, 50%)' : 'none' }} />
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Puzzle style={{ color: 'var(--color-primary)' }} />
            App Marketplace
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Browse, install, and manage extensions for your ERP system.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)', width: '300px' }}>
          <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search apps..." style={{ flex: 1, border: 'none', background: 'transparent', padding: 'var(--space-2.5) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-1)' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
            border: activeCategory === cat ? 'none' : '1px solid var(--color-border)',
            background: activeCategory === cat ? 'var(--color-primary)' : 'transparent',
            color: activeCategory === cat ? '#fff' : 'var(--color-text-secondary)',
            cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
            whiteSpace: 'nowrap'
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* App Detail Overlay */}
      {selectedApp && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>{selectedApp.icon}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0 }}>{selectedApp.name}</h2>
                  {selectedApp.verified && <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>by {selectedApp.publisher} • v{selectedApp.version}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
                  <div style={{ display: 'flex' }}>{renderStars(selectedApp.rating)}</div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{selectedApp.rating} ({selectedApp.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: selectedApp.price === 'Free' ? 'var(--color-success)' : 'var(--color-text)' }}>{selectedApp.price}</span>
              <button onClick={() => setSelectedApp(null)} style={{
                background: selectedApp.installed ? 'var(--color-bg)' : 'var(--color-primary)',
                color: selectedApp.installed ? 'var(--color-text-secondary)' : '#fff',
                border: selectedApp.installed ? '1px solid var(--color-border)' : 'none',
                padding: 'var(--space-2.5) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)'
              }}>
                {selectedApp.installed ? 'Installed ✓' : 'Install'}
              </button>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: '8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
            </div>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6, margin: 0 }}>{selectedApp.description}</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={14} /> {selectedApp.installs.toLocaleString()} installs</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Updated {selectedApp.lastUpdated}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> {selectedApp.category}</div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {selectedApp.tags.map(t => <span key={t} style={{ fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>#{t}</span>)}
          </div>
        </div>
      )}

      {/* App Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {filteredApps.map(app => (
          <div key={app.id} onClick={() => setSelectedApp(app)} style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{app.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{app.name}</span>
                    {app.verified && <CheckCircle size={12} style={{ color: 'var(--color-success)' }} />}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{app.publisher}</div>
                </div>
              </div>
              {app.installed && <span style={{ fontSize: '9px', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)' }}>Installed</span>}
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex' }}>{renderStars(app.rating)}</div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{app.rating}</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: app.price === 'Free' ? 'var(--color-success)' : 'var(--color-text)' }}>{app.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
