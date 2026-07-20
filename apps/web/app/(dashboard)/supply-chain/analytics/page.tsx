'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, KPICard, DashboardChart, Card } from '@unerp/ui';
import { Truck, Clock, DollarSign, CheckCircle, TrendingUp, AlertTriangle, Package, BarChart3 } from 'lucide-react';

interface DashboardData {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  totalWeight: number;
  activeCarriers: number;
  openExceptions: number;
  pendingReturns: number;
  totalCarriers: number;
  totalReturns: number;
}

interface CarrierPerf {
  carrierId: string;
  carrierName: string;
  total: number;
  delivered: number;
  onTime: number;
  onTimeRate: number;
}

interface OnTimeDelivery {
  totalDelivered: number;
  onTime: number;
  late: number;
  onTimeRate: number;
}

interface CostAnalysis {
  totalShippingCost: number;
  avgCostPerShipment: number;
  shipmentCount: number;
  currency: string;
}

interface LeadTime {
  totalTracked: number;
  avgLeadTimeDays: number;
  early: number;
  onTime: number;
  late: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export default function SupplyChainAnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [carrierPerf, setCarrierPerf] = useState<CarrierPerf[]>([]);
  const [onTime, setOnTime] = useState<OnTimeDelivery | null>(null);
  const [cost, setCost] = useState<CostAnalysis | null>(null);
  const [leadTime, setLeadTime] = useState<LeadTime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJson<DashboardData>('/api/supply-chain/analytics/dashboard').then(setDashboard).catch(() => {}),
      fetchJson<CarrierPerf[]>('/api/supply-chain/analytics/carrier-performance').then(setCarrierPerf).catch(() => {}),
      fetchJson<OnTimeDelivery>('/api/supply-chain/analytics/on-time-delivery').then(setOnTime).catch(() => {}),
      fetchJson<CostAnalysis>('/api/supply-chain/analytics/cost-analysis').then(setCost).catch(() => {}),
      fetchJson<LeadTime>('/api/supply-chain/analytics/lead-time').then(setLeadTime).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ui-stack-6">
        <PageHeader title="Supply Chain Analytics" description="Loading performance metrics..."
          breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Analytics' }]} />
        <div className="ui-p-8 ui-text-center"><p className="ui-text-xs-tertiary">Loading analytics data...</p></div>
      </div>
    );
  }

  return (
    <div className="ui-stack-6">
      <PageHeader title="Supply Chain Analytics" description="Performance metrics, cost analysis, and carrier benchmarks"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Analytics' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Total Shipments" value={String(dashboard?.totalShipments ?? 0)} icon={<Package size={18} />} color="var(--color-primary)" />
        <KPICard title="In Transit" value={String(dashboard?.inTransit ?? 0)} icon={<Truck size={18} />} color="var(--color-warning)" />
        <KPICard title="Delivered" value={String(dashboard?.delivered ?? 0)} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="On-Time Rate" value={onTime ? `${onTime.onTimeRate}%` : '—'} icon={<Clock size={18} />} color="var(--color-info)" />
      </div>

      <div className="ui-grid-auto">
        <KPICard title="Avg Cost/Shipment" value={cost ? `${cost.currency} ${cost.avgCostPerShipment.toFixed(2)}` : '—'} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Active Carriers" value={String(dashboard?.activeCarriers ?? 0)} icon={<Truck size={18} />} color="var(--color-info)" />
        <KPICard title="Open Exceptions" value={String(dashboard?.openExceptions ?? 0)} icon={<AlertTriangle size={18} />} color="var(--color-danger)" />
        <KPICard title="Pending Returns" value={String(dashboard?.pendingReturns ?? 0)} icon={<BarChart3 size={18} />} color="var(--color-warning)" />
      </div>

      {carrierPerf.length > 0 && (
        <DashboardChart title="Carrier On-Time Performance" subtitle="On-time delivery rate by carrier"
          data={carrierPerf.map(c => ({ name: c.carrierName, rate: c.onTimeRate, delivered: c.delivered }))}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'rate', name: 'On-Time %', color: '#22c55e' },
            { dataKey: 'delivered', name: 'Delivered', color: '#6366f1' },
          ] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'composed']} height={300} />
      )}

      <div className="ui-grid-2">
        <Card title="On-Time vs Late" className="ui-p-4">
          {onTime ? (
            <div className="ui-grid-2">
              <KPICard title="On Time" value={String(onTime.onTime)} icon={<CheckCircle size={18} />} color="var(--color-success)" />
              <KPICard title="Late" value={String(onTime.late)} icon={<Clock size={18} />} color="var(--color-danger)" />
              <KPICard title="Total Delivered" value={String(onTime.totalDelivered)} icon={<Package size={18} />} color="var(--color-info)" />
              <KPICard title="On-Time Rate" value={`${onTime.onTimeRate}%`} icon={<TrendingUp size={18} />} color="var(--color-success)" />
            </div>
          ) : <p className="ui-text-xs-tertiary">No delivery data available</p>}
        </Card>

        <Card title="Lead Time Analysis" className="ui-p-4">
          {leadTime ? (
            <div className="ui-grid-2">
              <KPICard title="Avg Lead Time" value={`${leadTime.avgLeadTimeDays} days`} icon={<Clock size={18} />} color="var(--color-info)" />
              <KPICard title="Early" value={String(leadTime.early)} icon={<TrendingUp size={18} />} color="var(--color-success)" />
              <KPICard title="On Time" value={String(leadTime.onTime)} icon={<CheckCircle size={18} />} color="var(--color-primary)" />
              <KPICard title="Late" value={String(leadTime.late)} icon={<AlertTriangle size={18} />} color="var(--color-danger)" />
            </div>
          ) : <p className="ui-text-xs-tertiary">No lead time data available</p>}
        </Card>
      </div>
    </div>
  );
}
