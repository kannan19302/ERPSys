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
  SearchCheck,
  Database,
  Inbox,
  ShoppingCart,
} from 'lucide-react';

interface WebStats {
  publishedPages: number;
  blogPosts: number;
  assets: number;
  templates: number;
  pages: number;
  seo: number;
  menus: number;
}

export default function WebBuilderPage() {
  const router = useRouter();
  const [stats, setStats] = useState<WebStats>({
    publishedPages: 0,
    blogPosts: 0,
    assets: 0,
    templates: 0,
    pages: 0,
    seo: 0,
    menus: 0,
  });

  useEffect(() => {
    fetch('/api/v1/builder/stats', { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } })
      .then(res => res.json())
      .then(data => {
        if (data && data.web) {
          setStats(data.web);
        }
      })
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
              Web Studio
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Dynamic CMS editor for managing public-facing website content in real time
          </p>
        </div>
        <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder')}>
          ← Studio
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Published Pages', value: stats.publishedPages.toString(), icon: Globe, color: '#7c3aed' },
          { label: 'Blog Posts', value: stats.blogPosts.toString(), icon: FileText, color: 'var(--color-primary)' },
          { label: 'Media Assets', value: stats.assets.toString(), icon: Image, color: '#059669' },
          { label: 'Templates', value: stats.templates.toString(), icon: Code2, color: '#d97706' },
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
            title: 'CMS Collections',
            description: 'Model dynamic content — products, projects, team, blog',
            icon: Database, color: '#6366f1',
            href: '/builder/web/collections',
            count: 'Dynamic content',
          },
          {
            title: 'Pages',
            description: 'Visual builder with 18+ blocks, CMS binding & publish',
            icon: Monitor, color: '#7c3aed',
            href: '/builder/web/pages',
            count: `${stats.pages} pages`,
          },
          {
            title: 'Orders',
            description: 'Storefront orders, revenue and fulfillment',
            icon: ShoppingCart, color: '#10b981',
            href: '/builder/web/orders',
            count: 'E-commerce',
          },
          {
            title: 'Form Submissions',
            description: 'Leads, contacts and newsletter sign-ups inbox',
            icon: Inbox, color: '#0891b2',
            href: '/builder/web/submissions',
            count: 'Inbox',
          },
          {
            title: 'Blog Posts',
            description: 'Write, edit, and publish blog articles',
            icon: FileText, color: 'var(--color-primary)',
            href: '/builder/web/blog',
            count: `${stats.blogPosts} posts`,
          },
          {
            title: 'Asset Manager',
            description: 'Upload and organize images, videos, documents',
            icon: Image, color: '#059669',
            href: '/builder/web/assets',
            count: `${stats.assets} files`,
          },
          {
            title: 'Templates',
            description: 'Manage reusable page and email templates',
            icon: Code2, color: '#d97706',
            href: '/builder/web/templates',
            count: `${stats.templates} templates`,
          },
          {
            title: 'Navigation Menus',
            description: 'Configure header, footer, and sidebar menus',
            icon: Layers, color: '#0891b2',
            href: '/builder/web/menus',
            count: `${stats.menus} menus`,
          },
          {
            title: 'SEO Settings',
            description: 'Manage page metadata and search visibility',
            icon: SearchCheck, color: '#7c3aed',
            href: '/builder/web/seo',
            count: `${stats.seo} entries`,
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
          <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
            Recent changes will appear after website content is created or updated.
          </div>
        </div>
      </div>
    </div>
  );
}
