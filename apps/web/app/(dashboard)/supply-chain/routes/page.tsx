'use client';

import React, { useState } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, KPICard, DashboardChart,
} from '@unerp/ui';
import { MapPin, Truck, DollarSign, Clock, TrendingDown, BarChart3 } from 'lucide-react';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  cost: number;
  carrier: string;
  isOptimized: boolean;
  savings: number;
}

const MOCK_ROUTES: Route[] = [
  { id: '1', name: 'NYC → LA Express', origin: 'New York, NY', destination: 'Los Angeles, CA', distance: 2790, estimatedTime: 48, cost: 1250, carrier: 'FedEx', isOptimized: true, savings: 180 },
  { id: '2', name: 'Chicago → Miami', origin: 'Chicago, IL', destination: 'Miami, FL', distance: 1380, estimatedTime: 36, cost: 680, carrier: 'UPS', isOptimized: true, savings: 95 },
  { id: '3', name: 'Seattle → Dallas', origin: 'Seattle, WA', destination: 'Dallas, TX', distance: 2120, estimatedTime: 42, cost: 920, carrier: 'FedEx', isOptimized: false, savings: 0 },
  { id: '4', name: 'NYC → London Int\'l', origin: 'New York, NY', destination: 'London, UK', distance: 5570, estimatedTime: 72, cost: 3200, carrier: 'DHL', isOptimized: true, savings: 450 },
];

const COST_COMPARISON = [
  { name: 'FedEx', standard: 1250, optimized: 1070 },
  { name: 'UPS', standard: 680, optimized: 585 },
  { name: 'DHL', standard: 3200, optimized: 2750 },
  { name: 'USPS', standard: 420, optimized: 380 },
];

export default function RouteOptimizationPage() {
  const [routes] = useState(MOCK_ROUTES);
  const totalSavings = routes.reduce((a, r) => a + r.savings, 0);

  const columns: Column<Route>[] = [
    {
      key: 'route', header: 'Route',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.origin} → {row.destination}</div>
        </div>
      ),
    },
    { key: 'distance', header: 'Distance', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.distance.toLocaleString()} mi</span> },
    { key: 'time', header: 'Est. Time', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.estimatedTime}h</span> },
    { key: 'carrier', header: 'Carrier', render: (row) => <Badge variant="info">{row.carrier}</Badge> },
    { key: 'cost', header: 'Cost', align: 'right' as const, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>${row.cost.toLocaleString()}</span> },
    {
      key: 'optimized', header: 'Optimized',
      render: (row) => row.isOptimized ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Badge variant="success">Optimized</Badge>
          {row.savings > 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>-${row.savings}</span>}
        </div>
      ) : <Badge variant="warning">Not Optimized</Badge>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Route Optimization" description="Optimize shipping routes for cost and delivery time"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Routes' }]}
        actions={<Button variant="primary" onClick={() => {}}>Run Optimization</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Active Routes" value={routes.length} icon={<MapPin size={18} />} color="var(--color-primary)" />
        <KPICard title="Optimized" value={routes.filter(r => r.isOptimized).length} icon={<TrendingDown size={18} />} color="var(--color-success)" />
        <KPICard title="Total Savings" value={`$${totalSavings.toLocaleString()}`} icon={<DollarSign size={18} />} color="var(--color-success)" />
      </div>

      <DashboardChart title="Cost Comparison: Standard vs Optimized" subtitle="Per-carrier shipping cost comparison"
        data={COST_COMPARISON}
        config={{ xAxisKey: 'name', series: [
          { dataKey: 'standard', name: 'Standard', color: '#ef4444' },
          { dataKey: 'optimized', name: 'Optimized', color: '#22c55e' },
        ] }}
        defaultChartType="bar" allowedChartTypes={['bar', 'area']} height={280} />

      <Card padding="none">
        <DataTable columns={columns} data={routes} rowKey={r => r.id}
          emptyTitle="No routes configured" emptyMessage="Add shipping routes to optimize." emptyIcon={<MapPin size={48} />} />
      </Card>
    </div>
  );
}
