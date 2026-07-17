'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, KPICard, DashboardChart } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Building2, Key, DollarSign, Wrench, TrendingUp, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

export default function RealEstateDashboard() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ properties: 0, leases: 0, maintenance: 0, commissions: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [pRes, lRes, mRes, cRes] = await Promise.all([
          client.get<unknown>('/ext/real-estate/properties'),
          client.get<unknown>('/ext/real-estate/leases'),
          client.get<unknown>('/ext/real-estate/maintenances'),
          client.get<unknown>('/ext/real-estate/commissions'),
        ]);
        const p = pRes; const l = lRes; const m = mRes; const c = cRes;
        const count = (value: unknown): number => {
          if (Array.isArray(value)) return value.length;
          if (typeof value === 'object' && value !== null && 'data' in value && Array.isArray(value.data)) return value.data.length;
          return 0;
        };
        setStats({ properties: count(p), leases: count(l), maintenance: count(m), commissions: count(c) });
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

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

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="real-estate.read">
    <div className="ui-stack-6">
      <PageHeader title="Real Estate" description="Property portfolio, leases, and maintenance management"
        breadcrumbs={[{ label: 'Real Estate' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Properties" value={stats.properties} icon={<Building2 size={18} />} color="var(--color-primary)" />
        <KPICard title="Active Leases" value={stats.leases} icon={<Key size={18} />} color="var(--color-success)" />
        <KPICard title="Work Orders" value={stats.maintenance} icon={<Wrench size={18} />} color="var(--color-warning)" />
        <KPICard title="Commissions" value={stats.commissions} icon={<DollarSign size={18} />} color="var(--color-info)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Occupancy Rate" subtitle="Monthly occupancy percentage" data={occupancyTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'rate', name: 'Occupancy %', color: '#22c55e' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'line', 'bar']} height={280} />
        <DashboardChart title="Rent Collection" subtitle="Monthly collected vs pending" data={rentCollection}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'collected', name: 'Collected', color: '#22c55e' }, { dataKey: 'pending', name: 'Pending', color: '#f59e0b' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'composed']} height={280} />
      </div>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4">Quick Access</h3>
          <div className={styles.s1}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className={styles.s2}>
                <div className={`${styles.s3} ${styles.qlHover}`}>
                  <div style={{ background: `${link.color}15`, color: link.color }} className={styles.s4}><link.icon size={18} /></div>
                  <span className={styles.s5}>{link.label}</span>
                  <ArrowRight size={14} className={styles.s6} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
    </RouteGuard>
  );
}
