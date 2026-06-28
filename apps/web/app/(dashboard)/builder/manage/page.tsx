'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge } from '@unerp/ui';
import { History, GitFork, Activity, Shield, ChevronRight, Cpu, Link, Store, GitBranch, Settings, Database, Smartphone } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';

const SECTIONS = [
  { href: '/builder/manage/releases', title: 'Releases', desc: 'Browse versioned release snapshots of your apps, compare changes and roll back.', icon: History, color: 'var(--color-primary)', status: 'Available' },
  { href: '/builder/manage/environments', title: 'Environments', desc: 'Promote apps across development, staging and production with diff and preview.', icon: GitFork, color: '#7c3aed', status: 'Available' },
  { href: '/builder/manage/logs', title: 'Run Logs', desc: 'Unified execution logs for workflows, automation rules, form submissions and sites.', icon: Activity, color: '#059669', status: 'Available' },
  { href: '/builder/manage/access', title: 'Access Control', desc: 'Control who can edit and publish each app, form, workflow and site.', icon: Shield, color: '#d97706', status: 'Available' },
  { href: '/builder/manage/components', title: 'Component Library', desc: 'Browse templates, workflows, schemas and components across all apps.', icon: Cpu, color: '#2563eb', status: 'Available' },
  { href: '/builder/manage/connectors', title: 'Connectors', desc: 'Manage reusable API connectors and third-party data integrations.', icon: Link, color: '#06b6d4', status: 'Available' },
  { href: '/builder/manage/marketplace', title: 'Marketplace Store', desc: 'Browse community plugins, layouts, templates, and integration extensions.', icon: Store, color: '#f43f5e', status: 'Available' },
  { href: '/builder/manage/query-builder', title: 'Query Builder', desc: 'Build database queries, computed columns and virtual fields.', icon: Database, color: '#10b981', status: 'Available' },
  { href: '/builder/manage/widgets', title: 'Widget SDK', desc: 'Configure custom layout widgets, embeds, and variant inspectors.', icon: Settings, color: '#6366f1', status: 'Available' },
  { href: '/builder/manage/git', title: 'Git Control', desc: 'Visual source control commits, change requests and collaboration annotations.', icon: GitBranch, color: '#ec4899', status: 'Available' },
  { href: '/builder/manage/mobile-export', title: 'Export & Mobile', desc: 'Setup animation timelines, offline features and native Android/iOS shells.', icon: Smartphone, color: '#f59e0b', status: 'Available' },
];

export default function ManageHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Manage & Governance" description="Governance, environment configuration, system logs, and operations for everything you build in Studio." />

      {/* System Telemetry Section */}
      {mounted && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={16} /> API Request Latency Telemetry
            </h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { time: '13:00', latency: 45 },
                  { time: '13:05', latency: 60 },
                  { time: '13:10', latency: 38 },
                  { time: '13:15', latency: 75 },
                  { time: '13:20', latency: 50 },
                  { time: '13:25', latency: 42 },
                  { time: '13:30', latency: 48 },
                ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" stroke="var(--color-text-secondary)" style={{ fontSize: 11 }} />
                  <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                  <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={16} /> Log Severity Distribution
            </h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Info', count: 1240, fill: '#059669' },
                  { name: 'Warn', count: 85, fill: '#d97706' },
                  { name: 'Error', count: 12, fill: '#dc2626' }
                ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" style={{ fontSize: 11 }} />
                  <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {[
                      { fill: '#059669' },
                      { fill: '#d97706' },
                      { fill: '#dc2626' }
                    ].map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Nav Hub Cards */}
      <div className="frappe-grid-2">
        {SECTIONS.map((s) => (
          <div key={s.href} className="frappe-card" style={{ cursor: 'pointer' }} onClick={() => router.push(s.href)}>
            <div className="frappe-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={22} style={{ color: 'white' }} />
                </div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{s.title}</h3>
                <span style={{ marginLeft: 'auto' }}><Badge variant={s.status === 'Available' ? 'success' : 'warning'}>{s.status}</Badge></span>
                <ChevronRight size={18} style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

