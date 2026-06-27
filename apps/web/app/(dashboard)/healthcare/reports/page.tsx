'use client';

import React from 'react';
import { PageHeader, KPICard, DashboardChart } from '@unerp/ui';
import { Users, Calendar, Pill, DollarSign, TrendingUp, Activity } from 'lucide-react';

const PATIENT_TREND = [
  { name: 'Jan', new: 28, total: 380 }, { name: 'Feb', new: 35, total: 415 },
  { name: 'Mar', new: 22, total: 437 }, { name: 'Apr', new: 40, total: 477 },
  { name: 'May', new: 18, total: 495 }, { name: 'Jun', new: 32, total: 527 },
];

const APPOINTMENT_UTIL = [
  { name: 'Mon', scheduled: 30, completed: 28 }, { name: 'Tue', scheduled: 35, completed: 32 },
  { name: 'Wed', scheduled: 28, completed: 25 }, { name: 'Thu', scheduled: 40, completed: 38 },
  { name: 'Fri', scheduled: 25, completed: 24 }, { name: 'Sat', scheduled: 15, completed: 14 },
];

const RX_BY_CATEGORY = [
  { name: 'Antibiotics', count: 45 }, { name: 'Analgesics', count: 38 },
  { name: 'Cardiovascular', count: 32 }, { name: 'Respiratory', count: 18 },
  { name: 'Antidepressants', count: 12 }, { name: 'Other', count: 25 },
];

const REVENUE_TREND = [
  { name: 'Jan', revenue: 125000 }, { name: 'Feb', revenue: 142000 },
  { name: 'Mar', revenue: 118000 }, { name: 'Apr', revenue: 155000 },
  { name: 'May', revenue: 138000 }, { name: 'Jun', revenue: 160000 },
];

export default function HealthcareReportsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Healthcare Reports" description="Patient demographics, appointment utilization, and revenue analytics"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Reports' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Patients" value="527" change={6} changeLabel="vs last month" icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Appt Completion" value="93%" icon={<Calendar size={18} />} color="var(--color-success)" />
        <KPICard title="Rx This Month" value="170" icon={<Pill size={18} />} color="var(--color-info)" />
        <KPICard title="Monthly Revenue" value="$160K" change={16} changeLabel="vs last month" icon={<DollarSign size={18} />} color="var(--color-warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <DashboardChart title="Patient Growth" subtitle="New patients and cumulative total"
          data={PATIENT_TREND}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'new', name: 'New Patients', color: '#6366f1' },
            { dataKey: 'total', name: 'Total', color: '#22c55e' },
          ] }}
          defaultChartType="composed" allowedChartTypes={['composed', 'bar', 'area']} height={280} />
        <DashboardChart title="Appointment Utilization" subtitle="Scheduled vs completed appointments"
          data={APPOINTMENT_UTIL}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'scheduled', name: 'Scheduled', color: '#6366f1' },
            { dataKey: 'completed', name: 'Completed', color: '#22c55e' },
          ] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area']} height={280} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <DashboardChart title="Prescriptions by Category" subtitle="Top medication categories"
          data={RX_BY_CATEGORY}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Prescriptions', color: '#f59e0b' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'pie', 'donut']} height={260} />
        <DashboardChart title="Revenue Trend" subtitle="Monthly billing revenue"
          data={REVENUE_TREND}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'revenue', name: 'Revenue ($)', color: '#22c55e' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'line', 'bar']} height={260} />
      </div>
    </div>
  );
}
