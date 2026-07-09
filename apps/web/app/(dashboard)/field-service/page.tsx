'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, KPICard, DashboardChart } from '@unerp/ui';
import { Wrench, ClipboardList, MapPin, Users, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function FieldServiceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ openTickets: 0, dispatchesToday: 0, checklists: 0, preventives: 0 });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [tRes, dRes, cRes, pRes] = await Promise.all([
          fetch('/api/v1/ext/field-service/tickets', { headers }),
          fetch('/api/v1/ext/field-service/dispatches', { headers }),
          fetch('/api/v1/ext/field-service/checklists', { headers }),
          fetch('/api/v1/ext/field-service/preventive-maintenances', { headers }),
        ]);
        const t = tRes.ok ? await tRes.json() : [];
        const d = dRes.ok ? await dRes.json() : [];
        const c = cRes.ok ? await cRes.json() : [];
        const p = pRes.ok ? await pRes.json() : [];

        const ticketList = Array.isArray(t) ? t : t?.data || [];
        const dispatchList = Array.isArray(d) ? d : d?.data || [];

        setStats({
          openTickets: ticketList.filter((x: any) => x.status !== 'COMPLETED' && x.status !== 'RESOLVED').length,
          dispatchesToday: dispatchList.length,
          checklists: (Array.isArray(c) ? c : c?.data || []).length,
          preventives: (Array.isArray(p) ? p : p?.data || []).length,
        });
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const completionTrend = [
    { name: 'Mon', completed: 12, pending: 2 },
    { name: 'Tue', completed: 15, pending: 3 },
    { name: 'Wed', completed: 18, pending: 1 },
    { name: 'Thu', completed: 14, pending: 4 },
    { name: 'Fri', completed: 16, pending: 2 },
    { name: 'Sat', completed: 8, pending: 0 },
  ];

  const priorityBreakdown = [
    { name: 'Critical', count: 3 },
    { name: 'High', count: 8 },
    { name: 'Medium', count: 12 },
    { name: 'Low', count: 5 },
  ];

  const quickLinks = [
    { label: 'Service Tickets', href: '/field-service/tickets', icon: ClipboardList, color: 'var(--color-primary)' },
    { label: 'Dispatch Board', href: '/field-service/dispatch', icon: MapPin, color: 'var(--color-success)' },
    { label: 'Checklists', href: '/field-service/checklists', icon: ClipboardList, color: 'var(--color-info)' },
    { label: 'Preventive Maint.', href: '/field-service/preventive', icon: Calendar, color: 'var(--color-warning)' },
    { label: 'Technicians', href: '/field-service/technicians', icon: Users, color: 'var(--color-danger)' },
    { label: 'Reports', href: '/field-service/reports', icon: Clock, color: 'var(--color-success)' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Field Service" description="Dispatching, service tickets, preventive maintenance, and technician management"
        breadcrumbs={[{ label: 'Field Service' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Open Tickets" value={stats.openTickets} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
        <KPICard title="Dispatches Today" value={stats.dispatchesToday} icon={<MapPin size={18} />} color="var(--color-success)" />
        <KPICard title="Checklists" value={stats.checklists} icon={<CheckCircle2 size={18} />} color="var(--color-info)" />
        <KPICard title="Preventive Rules" value={stats.preventives} icon={<Calendar size={18} />} color="var(--color-warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <DashboardChart title="Ticket Status By Day" subtitle="Completed vs pending tasks" data={completionTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'completed', name: 'Completed', color: '#22c55e' }, { dataKey: 'pending', name: 'Pending', color: '#f59e0b' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'composed']} height={280} />
        <DashboardChart title="Tickets by Priority" subtitle="Active ticket priority distribution" data={priorityBreakdown}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Tickets', color: '#6366f1' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'pie', 'donut']} height={280} />
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
