'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, KPICard, DashboardChart } from '@unerp/ui';
import { Building2, Key, DollarSign, Wrench, TrendingUp, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function RealEstateDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ properties: 0, leases: 0, maintenance: 0, commissions: 0 });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [pRes, lRes, mRes, cRes] = await Promise.all([
          fetch('/api/v1/real-estate/properties', { headers }),
          fetch('/api/v1/real-estate/leases', { headers }),
          fetch('/api/v1/real-estate/maintenances', { headers }),
          fetch('/api/v1/real-estate/commissions', { headers }),
        ]);
        const p = pRes.ok ? await pRes.json() : []; const l = lRes.ok ? await lRes.json() : [];
        const m = mRes.ok ? await mRes.json() : []; const c = cRes.ok ? await cRes.json() : [];
        setStats({
          properties: (Array.isArray(p) ? p : p?.data || []).length,
          leases: (Array.isArray(l) ? l : l?.data || []).length,
          maintenance: (Array.isArray(m) ? m : m?.data || []).length,
          commissions: (Array.isArray(c) ? c : c?.data || []).length,
        });
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const occupancyTrend = [
    { name: 'Jan', rate: 85 }, { name: 'Feb', rate: 87 }, { name: 'Mar', rate: 90 },
    { name: 'Apr', rate: 88 }, { name: 'May', rate: 92 }, { name: 'Jun', rate: 94 },
  ];
  const rentCollection = [
    { name: 'Jan', collected: 125000, pending: 15000 }, { name: 'Feb', collected: 130000, pending: 12000 },
    { name: 'Mar', collected: 128000, pending: 18000 }, { name: 'Apr', collected: 135000, pending: 8000 },
    { name: 'May', collected: 132000, pending: 14000 }, { name: 'Jun', collected: 140000, pending: 10000 },
  ];

  const quickLinks = [
    { label: 'Properties', href: '/real-estate/properties', icon: Building2, color: 'var(--color-primary)' },
    { label: 'Leases', href: '/real-estate/leases', icon: Key, color: 'var(--color-success)' },
    { label: 'Maintenance', href: '/real-estate/maintenance', icon: Wrench, color: 'var(--color-warning)' },
    { label: 'Commissions', href: '/real-estate/commissions', icon: DollarSign, color: 'var(--color-info)' },
    { label: 'Tenants', href: '/real-estate/tenants', icon: Users, color: 'var(--color-primary)' },
    { label: 'Reports', href: '/real-estate/reports', icon: TrendingUp, color: 'var(--color-success)' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Real Estate" description="Property portfolio, leases, and maintenance management"
        breadcrumbs={[{ label: 'Real Estate' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Properties" value={stats.properties} icon={<Building2 size={18} />} color="var(--color-primary)" />
        <KPICard title="Active Leases" value={stats.leases} icon={<Key size={18} />} color="var(--color-success)" />
        <KPICard title="Work Orders" value={stats.maintenance} icon={<Wrench size={18} />} color="var(--color-warning)" />
        <KPICard title="Commissions" value={stats.commissions} icon={<DollarSign size={18} />} color="var(--color-info)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <DashboardChart title="Occupancy Rate" subtitle="Monthly occupancy percentage" data={occupancyTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'rate', name: 'Occupancy %', color: '#22c55e' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'line', 'bar']} height={280} />
        <DashboardChart title="Rent Collection" subtitle="Monthly collected vs pending" data={rentCollection}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'collected', name: 'Collected', color: '#22c55e' }, { dataKey: 'pending', name: 'Pending', color: '#f59e0b' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'composed']} height={280} />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s ease', background: 'var(--color-bg)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${link.color}15`, color: link.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><link.icon size={18} /></div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{link.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
