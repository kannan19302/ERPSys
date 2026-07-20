'use client';
import React, { useState, useCallback } from 'react';
import {
  Card, Button, DataTable, type Column, KPICard, DashboardChart,
} from '@unerp/ui';
import { MapPin, TrendingDown, Route, Navigation, Clock } from 'lucide-react';

interface RouteRow {
  order: number;
  stop: string;
  lat: string;
  lng: string;
}

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  priority?: number;
}

interface OptimizedRoute {
  orderedStops: { id: string; name: string; lat: number; lng: number; priority?: number }[];
  totalDistance: number;
  estimatedDuration: number;
}

const SAMPLE_STOPS: RouteStop[] = [
  { id: '1', name: 'Warehouse A', lat: 40.7128, lng: -74.006, priority: 90 },
  { id: '2', name: 'Customer B', lat: 40.758, lng: -73.9855, priority: 50 },
  { id: '3', name: 'Customer C', lat: 40.7282, lng: -73.7949, priority: 70 },
  { id: '4', name: 'Customer D', lat: 40.6892, lng: -74.0445, priority: 30 },
  { id: '5', name: 'Warehouse B', lat: 40.7831, lng: -73.9712, priority: 60 },
];

export default function RoutesTab() {
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/supply-chain/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stops: SAMPLE_STOPS, startLat: 40.7128, startLng: -74.006 }),
      });
      if (!res.ok) throw new Error('Route optimization failed');
      const data = await res.json();
      setOptimizedRoute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const routeColumns: Column<RouteRow>[] = [
    { key: 'order', header: '#' },
    { key: 'stop', header: 'Stop' },
    { key: 'lat', header: 'Latitude' },
    { key: 'lng', header: 'Longitude' },
  ];

  const routeData = optimizedRoute
    ? optimizedRoute.orderedStops.map((s, i) => ({ order: i + 1, stop: s.name, lat: s.lat.toFixed(4), lng: s.lng.toFixed(4) }))
    : SAMPLE_STOPS.map((s, i) => ({ order: i + 1, stop: s.name, lat: s.lat.toFixed(4), lng: s.lng.toFixed(4) }));

  const totalSavings = optimizedRoute ? Math.round(optimizedRoute.totalDistance * 0.15) : 0;

  return (
    <div className="ui-stack-4">
      <div className="ui-flex ui-items-center ui-gap-2" style={{ marginBottom: 8 }}>
        <Button onClick={handleOptimize} disabled={loading} variant="primary" size="sm">
          <Route size={14} />
          <span>{loading ? 'Optimizing...' : 'Run Route Optimization'}</span>
        </Button>
        {error && <span className="ui-text-xs-tertiary" style={{ color: 'var(--color-danger)' }}>{error}</span>}
      </div>

      <div className="ui-grid-auto">
        <KPICard title="Stops" value={String(SAMPLE_STOPS.length)} icon={<MapPin size={18} />} color="var(--color-primary)" />
        <KPICard title="Optimized Distance" value={optimizedRoute ? `${optimizedRoute.totalDistance} km` : '—'} icon={<Navigation size={18} />} color="var(--color-info)" />
        <KPICard title="Est. Duration" value={optimizedRoute ? `${optimizedRoute.estimatedDuration} min` : '—'} icon={<Clock size={18} />} color="var(--color-warning)" />
        <KPICard title="Est. Savings" value={optimizedRoute ? `$${totalSavings}` : '—'} change={optimizedRoute ? -15 : undefined} changeLabel="vs unoptimized" icon={<TrendingDown size={18} />} color="var(--color-success)" />
      </div>

      {optimizedRoute && (
        <DashboardChart title="Optimized Route Order" subtitle="Nearest-neighbor heuristic with priority boost"
          data={optimizedRoute.orderedStops.map((s, i) => ({
            stop: s.name, order: i + 1, distance: i > 0 ? Math.round(optimizedRoute.totalDistance / optimizedRoute.orderedStops.length * 10) / 10 : 0,
          }))}
          config={{ xAxisKey: 'stop', series: [{ dataKey: 'order', name: 'Stop Order', color: '#6366f1' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'line']} height={200} />
      )}

      <Card title="Optimized Route">
        <DataTable columns={routeColumns} data={routeData} rowKey={(r: RouteRow) => String(r.order)} />
      </Card>

      {!optimizedRoute && (
        <div className="ui-card ui-p-4 ui-text-center">
          <p className="ui-text-xs-tertiary">Click "Run Route Optimization" to optimize the sample delivery route using the nearest-neighbor heuristic with priority boosting.</p>
        </div>
      )}
    </div>
  );
}
