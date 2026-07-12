'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@unerp/ui';
import { Activity, TrendingDown, BarChart2, Package, AlertTriangle, Warehouse } from 'lucide-react';

interface AnalyticsDashboard {
  healthScore: number;
  slowMoverCount: number;
  netMovement30d: number;
  totalInbound30d: number;
  totalOutbound30d: number;
}

interface HealthScore {
  healthScore: number;
  totalProducts: number;
  activeProducts: number;
  movingProductRate: number;
  lowStockProducts: number;
  activeHolds: number;
}

interface SlowMovers {
  period: string;
  slowMoverCount: number;
  items: { productId: string; warehouseId: string; onHandQty: number }[];
}

interface DIO {
  averageDio: number;
  products: { productId: string; onHand: number; avgDailySales: number; daysInventoryOutstanding: number | null }[];
}

interface FillRate {
  period: string;
  fillRate: number;
  totalPickWaves: number;
  completedWaves: number;
  partialWaves: number;
  totalOrderLines: number;
  fulfilledOrderLines: number;
}

interface VolumeTrends {
  period: string;
  totalInbound: number;
  totalOutbound: number;
  netMovement: number;
  daily: { date: string; inbound: number; outbound: number }[];
}

interface Shrinkage {
  period: string;
  totalAdjustments: number;
  negativeAdjustments: number;
  totalShrinkage: number;
  byProduct: { productId: string; shrinkage: number }[];
}

interface CapacityRow {
  warehouseId: string;
  warehouse: { id: string; name: string; code: string } | null;
  occupiedBins: number;
  totalQuantity: number;
}

interface MultiWarehouse {
  warehouseId: string;
  warehouse: { id: string; name: string; code: string } | null;
  onHandQty: number;
  occupiedBins: number;
  inbound30d: number;
  outbound30d: number;
  transactions30d: number;
}

type Tab = 'dashboard' | 'health' | 'slow' | 'dio' | 'fillrate' | 'trends' | 'shrinkage' | 'capacity' | 'multiwarehouse';

export default function InventoryAnalyticsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [overview, setOverview] = useState<AnalyticsDashboard | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [slow, setSlow] = useState<SlowMovers | null>(null);
  const [dio, setDio] = useState<DIO | null>(null);
  const [fillRate, setFillRate] = useState<FillRate | null>(null);
  const [trends, setTrends] = useState<VolumeTrends | null>(null);
  const [shrinkage, setShrinkage] = useState<Shrinkage | null>(null);
  const [capacity, setCapacity] = useState<CapacityRow[]>([]);
  const [multi, setMulti] = useState<MultiWarehouse[]>([]);

  useEffect(() => {
    fetch('/api/inventory/analytics/dashboard').then(r => r.ok ? r.json() : null).then(d => d && setOverview(d));
  }, []);

  useEffect(() => {
    if (tab === 'health') fetch('/api/inventory/analytics/health').then(r => r.ok ? r.json() : null).then(d => d && setHealth(d));
    if (tab === 'slow') fetch('/api/inventory/analytics/slow-moving').then(r => r.ok ? r.json() : null).then(d => d && setSlow(d));
    if (tab === 'dio') fetch('/api/inventory/analytics/dio').then(r => r.ok ? r.json() : null).then(d => d && setDio(d));
    if (tab === 'fillrate') fetch('/api/inventory/analytics/fill-rate').then(r => r.ok ? r.json() : null).then(d => d && setFillRate(d));
    if (tab === 'trends') fetch('/api/inventory/analytics/volume-trends').then(r => r.ok ? r.json() : null).then(d => d && setTrends(d));
    if (tab === 'shrinkage') fetch('/api/inventory/analytics/shrinkage').then(r => r.ok ? r.json() : null).then(d => d && setShrinkage(d));
    if (tab === 'capacity') fetch('/api/inventory/analytics/capacity').then(r => r.ok ? r.json() : null).then(d => d && setCapacity(d ?? []));
    if (tab === 'multiwarehouse') fetch('/api/inventory/analytics/multi-warehouse').then(r => r.ok ? r.json() : null).then(d => d && setMulti(d ?? []));
  }, [tab]);

  const scoreColor = (n: number) => n >= 75 ? 'text-green-600' : n >= 50 ? 'text-yellow-600' : 'text-red-600';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'health', label: 'Health Score' },
    { key: 'slow', label: 'Slow Movers' },
    { key: 'dio', label: 'DIO' },
    { key: 'fillrate', label: 'Fill Rate' },
    { key: 'trends', label: 'Volume Trends' },
    { key: 'shrinkage', label: 'Shrinkage' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'multiwarehouse', label: 'Multi-Warehouse' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Analytics</h1>
        <p className="text-sm text-muted-foreground">Health, trends, fill rate, and warehouse performance</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Health Score', value: `${overview.healthScore}`, icon: Activity, color: scoreColor(overview.healthScore) },
            { label: 'Slow Movers', value: overview.slowMoverCount, icon: TrendingDown, color: 'text-orange-600' },
            { label: 'Net Movement (30d)', value: Math.round(overview.netMovement30d), icon: BarChart2, color: 'text-blue-600' },
            { label: 'Inbound (30d)', value: Math.round(overview.totalInbound30d), icon: Package, color: 'text-green-600' },
            { label: 'Outbound (30d)', value: Math.round(overview.totalOutbound30d), icon: Package, color: 'text-purple-600' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color}`} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && overview && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">30-Day Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Inventory Health</span><span className={`font-bold ${scoreColor(overview.healthScore)}`}>{overview.healthScore}/100</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Slow-Moving SKUs</span><span className="font-semibold">{overview.slowMoverCount}</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Total Inbound</span><span className="font-semibold">{Math.round(overview.totalInbound30d).toLocaleString()}</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Total Outbound</span><span className="font-semibold">{Math.round(overview.totalOutbound30d).toLocaleString()}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Net Movement</span><span className={`font-semibold ${overview.netMovement30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>{overview.netMovement30d >= 0 ? '+' : ''}{Math.round(overview.netMovement30d).toLocaleString()}</span></div>
          </div>
        </Card>
      )}

      {tab === 'health' && health && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${scoreColor(health.healthScore)}`}>{health.healthScore}</div>
            <div>
              <p className="font-semibold">Inventory Health Score</p>
              <p className="text-sm text-muted-foreground">Based on movement, holds, and stock levels</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              ['Total Products', health.totalProducts],
              ['Active (moving)', health.activeProducts],
              ['Moving Rate', `${health.movingProductRate}%`],
              ['Low Stock SKUs', health.lowStockProducts],
              ['Active Holds', health.activeHolds],
            ].map(([label, value]) => (
              <div key={String(label)} className="border rounded p-3">
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="font-bold text-lg">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'slow' && slow && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Slow-Moving Inventory ({slow.period})</h3>
            <Badge variant="warning">{slow.slowMoverCount} SKUs</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="py-2">Product ID</th><th className="py-2">Warehouse</th><th className="py-2 text-right">On-Hand Qty</th></tr></thead>
              <tbody>
                {slow.items.slice(0, 100).map((i, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{i.productId}</td>
                    <td className="py-2 font-mono text-xs">{i.warehouseId}</td>
                    <td className="py-2 text-right">{i.onHandQty.toFixed(0)}</td>
                  </tr>
                ))}
                {slow.items.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No slow movers found</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'dio' && dio && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl font-bold text-blue-600">{dio.averageDio}</div>
            <div><p className="font-semibold">Avg Days Inventory Outstanding</p><p className="text-sm text-muted-foreground">Across all products with sales history</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">On-Hand</th>
                <th className="py-2 text-right">Avg Daily Sales</th>
                <th className="py-2 text-right">DIO</th>
              </tr></thead>
              <tbody>
                {dio.products.filter(p => p.daysInventoryOutstanding !== null).sort((a, b) => (b.daysInventoryOutstanding ?? 0) - (a.daysInventoryOutstanding ?? 0)).slice(0, 50).map((p) => (
                  <tr key={p.productId} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{p.productId}</td>
                    <td className="py-2 text-right">{p.onHand.toFixed(0)}</td>
                    <td className="py-2 text-right">{p.avgDailySales.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">{p.daysInventoryOutstanding?.toFixed(1) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'fillrate' && fillRate && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${scoreColor(fillRate.fillRate)}`}>{fillRate.fillRate}%</div>
            <div><p className="font-semibold">Fill Rate ({fillRate.period})</p><p className="text-sm text-muted-foreground">Order fulfillment from pick waves</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              ['Total Waves', fillRate.totalPickWaves],
              ['Completed', fillRate.completedWaves],
              ['Partial', fillRate.partialWaves],
              ['Total Order Lines', fillRate.totalOrderLines],
              ['Fulfilled Lines', fillRate.fulfilledOrderLines],
            ].map(([label, value]) => (
              <div key={String(label)} className="border rounded p-3">
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="font-bold text-lg">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'trends' && trends && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Volume Trends ({trends.period})</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">In: {Math.round(trends.totalInbound).toLocaleString()}</span>
              <span className="text-red-600 font-medium">Out: {Math.round(trends.totalOutbound).toLocaleString()}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="py-2">Date</th><th className="py-2 text-right">Inbound</th><th className="py-2 text-right">Outbound</th><th className="py-2 text-right">Net</th></tr></thead>
              <tbody>
                {trends.daily.slice(-30).reverse().map((d) => (
                  <tr key={d.date} className="border-b last:border-0">
                    <td className="py-1.5">{d.date}</td>
                    <td className="py-1.5 text-right text-green-600">{d.inbound.toFixed(0)}</td>
                    <td className="py-1.5 text-right text-red-600">{d.outbound.toFixed(0)}</td>
                    <td className={`py-1.5 text-right font-medium ${d.inbound - d.outbound >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(d.inbound - d.outbound).toFixed(0)}</td>
                  </tr>
                ))}
                {trends.daily.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No movement data</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'shrinkage' && shrinkage && (
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="font-semibold">Shrinkage Report ({shrinkage.period})</p>
              <p className="text-sm text-muted-foreground">Total shrinkage: <strong>{shrinkage.totalShrinkage.toFixed(2)}</strong> units across {shrinkage.negativeAdjustments} negative adjustments</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2">Product ID</th><th className="py-2 text-right">Shrinkage</th></tr></thead>
            <tbody>
              {shrinkage.byProduct.map((p) => (
                <tr key={p.productId} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{p.productId}</td>
                  <td className="py-2 text-right text-red-600 font-medium">{p.shrinkage.toFixed(2)}</td>
                </tr>
              ))}
              {shrinkage.byProduct.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No shrinkage recorded</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'capacity' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Warehouse Capacity Utilization</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2">Warehouse</th><th className="py-2">Code</th><th className="py-2 text-right">Occupied Bins</th><th className="py-2 text-right">Total Qty</th></tr></thead>
            <tbody>
              {capacity.map((c) => (
                <tr key={c.warehouseId} className="border-b last:border-0">
                  <td className="py-2">{c.warehouse?.name ?? c.warehouseId}</td>
                  <td className="py-2 font-mono text-xs">{c.warehouse?.code ?? '—'}</td>
                  <td className="py-2 text-right">{c.occupiedBins}</td>
                  <td className="py-2 text-right font-semibold">{c.totalQuantity.toLocaleString()}</td>
                </tr>
              ))}
              {capacity.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No capacity data</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'multiwarehouse' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Multi-Warehouse Comparison (30d)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">
                <th className="py-2">Warehouse</th>
                <th className="py-2 text-right">On-Hand</th>
                <th className="py-2 text-right">Bins</th>
                <th className="py-2 text-right">Inbound</th>
                <th className="py-2 text-right">Outbound</th>
                <th className="py-2 text-right">Transactions</th>
              </tr></thead>
              <tbody>
                {multi.map((w) => (
                  <tr key={w.warehouseId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{w.warehouse?.name ?? w.warehouseId}</td>
                    <td className="py-2 text-right">{w.onHandQty.toLocaleString()}</td>
                    <td className="py-2 text-right">{w.occupiedBins}</td>
                    <td className="py-2 text-right text-green-600">{Math.round(w.inbound30d).toLocaleString()}</td>
                    <td className="py-2 text-right text-red-600">{Math.round(w.outbound30d).toLocaleString()}</td>
                    <td className="py-2 text-right">{w.transactions30d}</td>
                  </tr>
                ))}
                {multi.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No warehouse data</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
