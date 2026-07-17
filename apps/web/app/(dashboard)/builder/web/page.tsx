'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@unerp/ui';
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
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { RouteGuard, useApiClient } from '@unerp/framework';
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
  const client = useApiClient();
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    client.get<{ web?: WebStats }>('/builder/stats')
      .then(data => { if (data.web) setStats(data.web); })
      .catch(console.error);
  }, [client]);

  return (
    <RouteGuard permission="builder.web.read">
    <div className={styles.s1}>
      {/* Header */}
      <PageHeader
        title="Web Studio"
        description="Dynamic CMS editor for managing public-facing website content in real time"
        actions={
          <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder')}>
            ← Studio
          </button>
        }
      />

      {/* Stats */}
      <div className={styles.s2}>
        {[
          { label: 'Published Pages', value: stats.publishedPages.toString(), icon: Globe, color: '#7c3aed' },
          { label: 'Blog Posts', value: stats.blogPosts.toString(), icon: FileText, color: 'var(--color-primary)' },
          { label: 'Media Assets', value: stats.assets.toString(), icon: Image, color: '#059669' },
          { label: 'Templates', value: stats.templates.toString(), icon: Code2, color: '#d97706' },
        ].map(stat => (
          <div key={stat.label} className={`ui-card ${styles.s3}`} >
            <div style={{ background: `${stat.color}20` }} className={styles.s4}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p className={styles.s5}>{stat.value}</p>
              <p className="ui-text-xs-muted m-0">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Traffic Analytics Chart */}
      {mounted && (
        <div className="ui-card p-5">
          <h3 className={styles.s6}>Web traffic & Visitor Trends</h3>
          <div className={styles.s7}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: '06/22', visitors: 140, pageviews: 310 },
                { date: '06/23', visitors: 190, pageviews: 450 },
                { date: '06/24', visitors: 220, pageviews: 520 },
                { date: '06/25', visitors: 170, pageviews: 380 },
                { date: '06/26', visitors: 280, pageviews: 610 },
                { date: '06/27', visitors: 310, pageviews: 730 },
                { date: '06/28', visitors: 420, pageviews: 980 },
              ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-text-secondary)" className={styles.s8} />
                <YAxis stroke="var(--color-text-secondary)" className={styles.s8} />
                <Tooltip contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#7c3aed" fillOpacity={1} fill="url(#colorVisitors)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* Quick Access Grid */}
      <div className={styles.s9}>
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
            className={`ui-card ${styles.s10} ${styles.accessCard}`}
            onClick={() => router.push(item.href)}
            style={{ '--hover-color': item.color } as React.CSSProperties}
          >
            <div style={{ background: `${item.color}20` }} className={styles.s11}>
              <item.icon size={22} style={{ color: item.color }} />
            </div>
            <div className="flex-1">
              <p className={styles.s12}>{item.title}</p>
              <p className="ui-text-xs-muted m-0">{item.description}</p>
              <span style={{ color: item.color }} className={styles.s13}>{item.count}</span>
            </div>
            <ChevronRight size={16} className={styles.s14} />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="ui-card p-4">
        <h3 className={styles.s15}>
          Recent Website Changes
        </h3>
        <div className="ui-stack-1">
          <div className={styles.s16}>
            Recent changes will appear after website content is created or updated.
          </div>
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}
