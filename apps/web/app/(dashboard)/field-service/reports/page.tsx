'use client';
import React from 'react';
import { PageHeader, KPICard, DashboardChart } from '@unerp/ui';
import { ClipboardList, Clock, Users, ShieldAlert } from 'lucide-react';
const FIXED_RATE = [{ name: 'Jan', rate: 82 }, { name: 'Feb', rate: 85 }, { name: 'Mar', rate: 88 }, { name: 'Apr', rate: 87 }, { name: 'May', rate: 91 }, { name: 'Jun', rate: 93 }];
const RESP_TIME = [{ name: 'Mon', hours: 2.5 }, { name: 'Tue', hours: 2.1 }, { name: 'Wed', hours: 1.8 }, { name: 'Thu', hours: 2.3 }, { name: 'Fri', hours: 1.9 }, { name: 'Sat', hours: 1.2 }];
const UTILIZATION = [{ name: 'John', value: 85 }, { name: 'Mark', value: 92 }, { name: 'Sarah', value: 78 }];

export default function FieldServiceReportsPage() {
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Field Service Reports" description="First-time fix rates, response times, and technician utilization" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Reports' }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
      <KPICard title="First-Time Fix Rate" value="93%" icon={<ClipboardList size={18} />} color="var(--color-success)" />
      <KPICard title="Avg Response Time" value="1.9 hrs" icon={<Clock size={18} />} color="var(--color-primary)" />
      <KPICard title="Tech Utilization" value="85%" icon={<Users size={18} />} color="var(--color-info)" />
      <KPICard title="SLA Breaches" value="0" icon={<ShieldAlert size={18} />} color="var(--color-success)" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
      <DashboardChart title="First-Time Fix Rate" subtitle="Monthly rate %" data={FIXED_RATE} config={{ xAxisKey: 'name', series: [{ dataKey: 'rate', name: 'Fix Rate %', color: '#22c55e' }] }} defaultChartType="area" allowedChartTypes={['area', 'line']} height={280} />
      <DashboardChart title="Average Response Time" subtitle="Daily response times (hours)" data={RESP_TIME} config={{ xAxisKey: 'name', series: [{ dataKey: 'hours', name: 'Hours', color: '#6366f1' }] }} defaultChartType="bar" allowedChartTypes={['bar', 'line']} height={280} />
    </div>
    <DashboardChart title="Technician Utilization" subtitle="Resting vs active percentage" data={UTILIZATION} config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Utilization %', color: '#f59e0b' }] }} defaultChartType="bar" allowedChartTypes={['bar']} height={260} />
  </div>);
}
