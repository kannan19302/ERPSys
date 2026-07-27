'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import { Card, Button } from '@unerp/ui';
import { RouteGuard } from '@unerp/framework';

interface TrendResult {
  id: string;
  kpiName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  metadata: Record<string, unknown> | null;
}

export default function TrendsPage() {
  const client = useApiClient();
  const [trends, setTrends] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('MONTH');

  useEffect(() => { fetchTrends(); }, [client, groupBy]);

  const fetchTrends = async () => {
    try { setLoading(true); const r = await client.get<{ data: TrendResult[]; meta: unknown }>(`/analytics/trends?groupBy=${groupBy}`); setTrends(r.data || []); }
    catch { setTrends([]); }
    finally { setLoading(false); }
  };

  const computeTrends = async () => {
    try { setLoading(true); await client.post('/analytics/trends', { groupBy }); fetchTrends(); }
    catch { /* ignore */ }
  };

  return (
    <RouteGuard permission="analytics.trends.read">
      <div className="p-8 ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl ui-hstack-3"><TrendingUp size={28} className="ui-text-primary" /> Trend Analysis</h1>
            <p className="ui-text-muted mt-1">KPI trends over time with period-over-period change</p>
          </div>
          <Button onClick={computeTrends} disabled={loading}>Compute Trends</Button>
        </div>

        <Card className="p-6">
          <div className="ui-flex ui-gap-3 ui-items-center mb-4">
            <label className="text-sm font-medium">Group by:</label>
            <select className="ui-input w-48" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="DAY">Day</option><option value="WEEK">Week</option><option value="MONTH">Month</option><option value="QUARTER">Quarter</option><option value="YEAR">Year</option>
            </select>
          </div>
          {loading ? (
            <div className="ui-flex-center p-8"><Loader2 size={24} className="animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ui-table w-full">
                <thead><tr><th>KPI</th><th>Period</th><th>Value</th><th>Previous</th><th>Change</th></tr></thead>
                <tbody>
                  {trends.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.kpiName}</td>
                      <td className="ui-text-xs-muted">{t.period} {new Date(t.periodStart).toLocaleDateString()} - {new Date(t.periodEnd).toLocaleDateString()}</td>
                      <td className="font-mono">{t.value.toLocaleString()}</td>
                      <td className="font-mono">{t.previousValue?.toLocaleString() ?? '-'}</td>
                      <td className={t.changePercent !== null ? (t.changePercent >= 0 ? 'text-green-600' : 'text-red-600') : ''}>
                        {t.changePercent !== null ? `${t.changePercent >= 0 ? '+' : ''}${t.changePercent.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                  {trends.length === 0 && <tr><td colSpan={5} className="text-center ui-text-muted py-4">No trend data yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </RouteGuard>
  );
}
