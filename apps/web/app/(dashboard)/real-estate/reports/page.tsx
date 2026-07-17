'use client';
import React from 'react';
import { PageHeader, KPICard, DashboardChart } from '@unerp/ui';
import { Building2, DollarSign, Wrench, TrendingUp } from 'lucide-react';
const OCCUPANCY = [{ name: 'Q1', rate: 88 }, { name: 'Q2', rate: 92 }, { name: 'Q3', rate: 90 }, { name: 'Q4', rate: 95 }];
const RENT = [{ name: 'Jan', collected: 125000, overdue: 8000 }, { name: 'Feb', collected: 130000, overdue: 5000 }, { name: 'Mar', collected: 128000, overdue: 12000 }, { name: 'Apr', collected: 135000, overdue: 3000 }, { name: 'May', collected: 132000, overdue: 7000 }, { name: 'Jun', collected: 140000, overdue: 4000 }];
const MAINTENANCE_COST = [{ name: 'Plumbing', cost: 12000 }, { name: 'Electrical', cost: 8500 }, { name: 'HVAC', cost: 15000 }, { name: 'Painting', cost: 6000 }, { name: 'Landscaping', cost: 4500 }];

export default function RealEstateReportsPage() {
  return (<div className="ui-stack-6">
    <PageHeader title="Reports" description="Occupancy, rent collection, and maintenance cost analysis" breadcrumbs={[{ label: 'Real Estate', href: '/real-estate' }, { label: 'Reports' }]} />
    <div className="ui-grid-auto-sm">
      <KPICard title="Occupancy Rate" value="92%" icon={<Building2 size={18} />} color="var(--color-success)" />
      <KPICard title="Annual Revenue" value="$1.56M" icon={<DollarSign size={18} />} color="var(--color-primary)" />
      <KPICard title="Maintenance YTD" value="$46K" icon={<Wrench size={18} />} color="var(--color-warning)" />
      <KPICard title="NOI" value="$1.2M" icon={<TrendingUp size={18} />} color="var(--color-info)" />
    </div>
    <div className="ui-grid-2">
      <DashboardChart title="Occupancy Rate" subtitle="Quarterly occupancy %" data={OCCUPANCY} config={{ xAxisKey: 'name', series: [{ dataKey: 'rate', name: 'Occupancy %', color: '#22c55e' }] }} defaultChartType="line" allowedChartTypes={['line', 'area', 'bar']} height={280} />
      <DashboardChart title="Rent Collection" subtitle="Collected vs overdue" data={RENT} config={{ xAxisKey: 'name', series: [{ dataKey: 'collected', name: 'Collected', color: '#22c55e' }, { dataKey: 'overdue', name: 'Overdue', color: '#ef4444' }] }} defaultChartType="bar" allowedChartTypes={['bar', 'area']} height={280} />
    </div>
    <DashboardChart title="Maintenance Costs by Category" subtitle="Year-to-date breakdown" data={MAINTENANCE_COST} config={{ xAxisKey: 'name', series: [{ dataKey: 'cost', name: 'Cost ($)', color: '#f59e0b' }] }} defaultChartType="bar" allowedChartTypes={['bar', 'pie']} height={260} />
  </div>);
}
