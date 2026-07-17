'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, KPICard, DashboardChart } from '@unerp/ui';
import { Wrench, ClipboardList, MapPin, Users, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function FieldServiceDashboard() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ openTickets: 0, dispatchesToday: 0, checklists: 0, preventives: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [t, d, c, p] = await Promise.all([
          client.get<unknown>('/ext/field-service/tickets'),
          client.get<unknown>('/ext/field-service/dispatches'),
          client.get<unknown>('/ext/field-service/checklists'),
          client.get<unknown>('/ext/field-service/preventive-maintenances'),
        ]);
        const list = (value: unknown): Array<{ status?: string }> => Array.isArray(value) ? value as Array<{ status?: string }> : ((value as { data?: Array<{ status?: string }> })?.data || []);
        const ticketList = list(t);
        const dispatchList = list(d);

        setStats({
          openTickets: ticketList.filter((x: any) => x.status !== 'COMPLETED' && x.status !== 'RESOLVED').length,
          dispatchesToday: dispatchList.length,
          checklists: list(c).length,
          preventives: list(p).length,
        });
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

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

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="field-service.dashboard.read">
      <div className="ui-stack-6">
      <PageHeader title="Field Service" description="Dispatching, service tickets, preventive maintenance, and technician management"
        breadcrumbs={[{ label: 'Field Service' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Open Tickets" value={stats.openTickets} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
        <KPICard title="Dispatches Today" value={stats.dispatchesToday} icon={<MapPin size={18} />} color="var(--color-success)" />
        <KPICard title="Checklists" value={stats.checklists} icon={<CheckCircle2 size={18} />} color="var(--color-info)" />
        <KPICard title="Preventive Rules" value={stats.preventives} icon={<Calendar size={18} />} color="var(--color-warning)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Ticket Status By Day" subtitle="Completed vs pending tasks" data={completionTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'completed', name: 'Completed', color: '#22c55e' }, { dataKey: 'pending', name: 'Pending', color: '#f59e0b' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'composed']} height={280} />
        <DashboardChart title="Tickets by Priority" subtitle="Active ticket priority distribution" data={priorityBreakdown}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Tickets', color: '#6366f1' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'pie', 'donut']} height={280} />
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
