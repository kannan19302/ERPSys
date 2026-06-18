/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Monitor,
  ChevronRight,
  FileText,
  Image,
  Code2,
  Layers,
  Database,
} from 'lucide-react';

const RECENT_WEB = [
  { name: 'Homepage', slug: '/', status: 'Published', type: 'page' },
  { name: 'About Us', slug: '/about', status: 'Published', type: 'page' },
  { name: 'Introducing UniERP v12', slug: '/blog/v12', status: 'Draft', type: 'blog' },
];

export default function WebBuilderPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/builder/stats', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setStats(data.web))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Globe size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Website Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Dynamic CMS editor for managing public-facing website content in real time
          </p>
        </div>
        <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder')}>
          ← Builder Studio
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Published Pages', value: stats?.publishedPages?.toString() || '7', icon: Globe, color: '#7c3aed' },
          { label: 'Blog Posts', value: stats?.blogPosts?.toString() || '24', icon: FileText, color: 'var(--color-primary)' },
          { label: 'Media Assets', value: stats?.assets?.toString() || '86', icon: Image, color: '#059669' },
          { label: 'Templates', value: stats?.templates?.toString() || '6', icon: Code2, color: '#d97706' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
        {[
          {
            title: 'Pages',
            description: 'Design page layouts with drag-and-drop sections',
            icon: Monitor, color: '#7c3aed',
            href: '/builder/web/pages',
            count: '9 pages',
          },
          {
            title: 'Blog Posts',
            description: 'Write, edit, and publish blog articles',
            icon: FileText, color: 'var(--color-primary)',
            href: '/builder/web/blog',
            count: '24 posts',
          },
          {
            title: 'Asset Manager',
            description: 'Upload and organize images, videos, documents',
            icon: Image, color: '#059669',
            href: '/builder/web/assets',
            count: '86 files',
          },
          {
            title: 'Templates',
            description: 'Manage reusable page and email templates',
            icon: Code2, color: '#d97706',
            href: '/builder/web/templates',
            count: '6 templates',
          },
          {
            title: 'Navigation Menus',
            description: 'Configure header, footer, and sidebar menus',
            icon: Layers, color: '#0891b2',
            href: '/builder/web/menus',
            count: '3 menus',
          },
          {
            title: 'API Routes',
            description: 'Manage public-facing API routes and webhooks',
            icon: Database, color: '#7c3aed',
            href: '/builder/web/api-routes',
            count: '12 routes',
          },
        ].map(item => (
          <div
            key={item.title}
            className="frappe-card"
            onClick={() => router.push(item.href)}
            style={{ padding: 'var(--space-4)', cursor: 'pointer', transition: 'all var(--duration-fast)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = item.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={22} style={{ color: item.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{item.title}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{item.description}</p>
              <span style={{ fontSize: '10px', color: item.color, fontWeight: 'var(--weight-semibold)' }}>{item.count}</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4) 0', color: 'var(--color-text)' }}>
          Recent Website Changes
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {RECENT_WEB.map(item => (
            <div
              key={item.name}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2.5) var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              onClick={() => router.push('/builder/web/pages')}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.type === 'blog' ? <FileText size={13} style={{ color: '#7c3aed' }} /> : <Monitor size={13} style={{ color: '#7c3aed' }} />}
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', margin: 0, color: 'var(--color-text)' }}>{item.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, fontFamily: 'monospace' }}>{item.slug}</p>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: item.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: item.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
