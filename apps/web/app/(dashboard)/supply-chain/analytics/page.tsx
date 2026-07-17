'use client';
import React from 'react';
import { PageHeader, KPICard, DashboardChart, Card } from '@unerp/ui';
import { Truck, Clock, DollarSign, CheckCircle, TrendingUp, AlertTriangle, Package } from 'lucide-react';

const ON_TIME_DATA = [
  { name: 'Jan', rate: 92 }, { name: 'Feb', rate: 94 }, { name: 'Mar', rate: 89 },
  { name: 'Apr', rate: 91 }, { name: 'May', rate: 95 }, { name: 'Jun', rate: 93 },
];

const COST_TREND = [
  { name: 'Jan', cost: 12400 }, { name: 'Feb', cost: 13200 }, { name: 'Mar', cost: 11800 },
  { name: 'Apr', cost: 14500 }, { name: 'May', cost: 13000 }, { name: 'Jun', cost: 15200 },
];

const CARRIER_PERF = [
  { name: 'FedEx', onTime: 96, avgDays: 2.8, cost: 14200 },
  { name: 'UPS', onTime: 93, avgDays: 3.5, cost: 11800 },
  { name: 'DHL', onTime: 91, avgDays: 4.2, cost: 8900 },
  { name: 'USPS', onTime: 85, avgDays: 6.1, cost: 4200 },
];

export default function SupplyChainAnalyticsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader title="Supply Chain Analytics" description="Performance metrics, cost analysis, and carrier benchmarks"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Analytics' }]} />

      <div className="ui-grid-auto">
        <KPICard title="On-Time Delivery" value="93%" change={2} changeLabel="vs last month" icon={<Clock size={18} />} color="var(--color-success)" />
        <KPICard title="Avg Cost/Shipment" value="$245" change={-5} changeLabel="vs last month" icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Shipments (MTD)" value="128" icon={<Package size={18} />} color="var(--color-info)" />
        <KPICard title="Delivery Exceptions" value="4" icon={<AlertTriangle size={18} />} color="var(--color-danger)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="On-Time Delivery Rate" subtitle="Monthly on-time percentage"
          data={ON_TIME_DATA}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'rate', name: 'On-Time %', color: '#22c55e' }] }}
          defaultChartType="line" allowedChartTypes={['line', 'area', 'bar']} height={280} />
        <DashboardChart title="Shipping Cost Trend" subtitle="Monthly total shipping costs"
          data={COST_TREND}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'cost', name: 'Cost ($)', color: '#6366f1' }] }}
          defaultChartType="area" allowedChartTypes={['area', 'bar', 'line']} height={280} />
      </div>

      <DashboardChart title="Carrier Performance Comparison" subtitle="On-time rate by carrier"
        data={CARRIER_PERF}
        config={{ xAxisKey: 'name', series: [
          { dataKey: 'onTime', name: 'On-Time %', color: '#22c55e' },
          { dataKey: 'avgDays', name: 'Avg Days', color: '#f59e0b' },
        ] }}
        defaultChartType="bar" allowedChartTypes={['bar', 'composed']} height={300} />
    </div>
  );
}
