'use client';
import { useState, useEffect, useCallback } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Tab = 'dashboard' | 'forecasts' | 'reorder-points' | 'replenishment' | 'stockout' | 'safety-stock';

export default function DemandForecastingPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [reorderPoints, setReorderPoints] = useState<any[]>([]);
  const [replenishments, setReplenishments] = useState<any[]>([]);
  const [stockouts, setStockouts] = useState<any[]>([]);
  const [safetyConfigs, setSafetyConfigs] = useState<any[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (tab === 'dashboard') {
        const [dash, alerts] = await Promise.all([
          apiFetch('/inventory/demand-forecasting/dashboard'),
          apiFetch('/inventory/demand-forecasting/reorder-alerts'),
        ]);
        setDashboard(dash); setReorderAlerts(alerts);
      } else if (tab === 'forecasts') {
        setForecasts(await apiFetch('/inventory/demand-forecasting/forecasts'));
      } else if (tab === 'reorder-points') {
        setReorderPoints(await apiFetch('/inventory/demand-forecasting/reorder-points'));
      } else if (tab === 'replenishment') {
        setReplenishments(await apiFetch('/inventory/demand-forecasting/replenishment-orders'));
      } else if (tab === 'stockout') {
        setStockouts(await apiFetch('/inventory/demand-forecasting/stockout-predictions'));
      } else if (tab === 'safety-stock') {
        setSafetyConfigs(await apiFetch('/inventory/demand-forecasting/safety-stock'));
      }
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'forecasts', label: 'Forecasts' },
    { id: 'reorder-points', label: 'Reorder Points' },
    { id: 'replenishment', label: 'Replenishment' },
    { id: 'stockout', label: 'Stockout Risk' },
    { id: 'safety-stock', label: 'Safety Stock' },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Demand Forecasting</h1>
        <button
          onClick={load}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {loading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}

      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Active Forecasts', value: dashboard.activeForecasts, color: 'blue' },
              { label: 'Active ROP Configs', value: dashboard.activeReorderPoints, color: 'green' },
              { label: 'Pending Replenishments', value: dashboard.pendingReplenishments, color: 'yellow' },
              { label: 'Critical Stockouts', value: dashboard.criticalStockouts, color: 'red' },
              { label: 'Below ROP', value: dashboard.belowRopCount, color: 'orange' },
            ].map((m) => (
              <div key={m.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Urgent Replenishments', value: dashboard.urgentReplenishments },
              { label: 'High Stockout Risk', value: dashboard.highStockouts },
              { label: 'Total Safety Configs', value: dashboard.totalSafetyConfigs },
              { label: 'Avg Forecast MAPE', value: dashboard.avgMape != null ? `${(dashboard.avgMape * 100).toFixed(1)}%` : 'N/A' },
            ].map((m) => (
              <div key={m.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{m.value}</p>
              </div>
            ))}
          </div>
          {reorderAlerts.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">⚠ Reorder Alerts ({reorderAlerts.length})</h3>
              <div className="space-y-2">
                {reorderAlerts.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm text-yellow-700 dark:text-yellow-400">
                    <span>{a.productId}</span>
                    <span>Stock: {a.currentQty} / ROP: {a.reorderPoint} {a.belowSafetyStock && '🔴 BELOW SAFETY'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'forecasts' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await apiFetch('/inventory/demand-forecasting/forecasts/run-engine', {
                    method: 'POST',
                    body: JSON.stringify({ horizon: 30, method: 'MOVING_AVG', lookbackDays: 90 }),
                  });
                  load();
                } catch (e: any) { setError(e.message); }
              }}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Run Forecast Engine
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Product', 'Date', 'Horizon', 'Method', 'Forecasted Qty', 'Actual Qty', 'MAPE', 'Status'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {forecasts.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">{f.productId.slice(0, 12)}…</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{new Date(f.forecastDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{f.horizon}d</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{f.method}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(f.forecastedQty).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{f.actualQty ? Number(f.actualQty).toFixed(2) : '—'}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{f.mape ? `${(Number(f.mape) * 100).toFixed(1)}%` : '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        f.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : f.status === 'SUPERSEDED' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{f.status}</span>
                    </td>
                  </tr>
                ))}
                {!forecasts.length && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No forecasts. Run the engine to generate.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reorder-points' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Product', 'Warehouse', 'Reorder Point', 'Reorder Qty', 'Safety Stock', 'Lead Time', 'Avg Daily Demand', 'Service Level', 'Active'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {reorderPoints.map((rp) => (
                <tr key={rp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white">{rp.productId.slice(0, 12)}…</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{rp.warehouseId ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(rp.reorderPoint).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(rp.reorderQty).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(rp.safetyStock).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{rp.leadTimeDays}d</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{Number(rp.avgDailyDemand).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{(Number(rp.serviceLevel) * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${rp.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {rp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {!reorderPoints.length && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No reorder points configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'replenishment' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const r = await apiFetch('/inventory/demand-forecasting/replenishment-orders/auto-generate', { method: 'POST' });
                  setError(`Generated ${r.generated} replenishment orders`);
                  load();
                } catch (e: any) { setError(e.message); }
              }}
              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Auto-Generate from ROP
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Order #', 'Product', 'Warehouse', 'Suggested Qty', 'Trigger', 'Priority', 'Status', 'Created'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {replenishments.map((ro) => (
                  <tr key={ro.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{ro.orderNumber}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-300">{ro.productId.slice(0, 12)}…</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{ro.warehouseId}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(ro.suggestedQty).toFixed(2)} {ro.uom}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{ro.triggerType}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ro.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : ro.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{ro.priority}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        ro.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                        : ro.status === 'APPROVED' ? 'bg-blue-100 text-blue-700'
                        : ro.status === 'ORDERED' ? 'bg-purple-100 text-purple-700'
                        : ro.status === 'RECEIVED' ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>{ro.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{new Date(ro.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!replenishments.length && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No replenishment orders.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stockout' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const r = await apiFetch('/inventory/demand-forecasting/stockout-predictions/generate', {
                    method: 'POST',
                    body: JSON.stringify({ riskThresholdDays: 30 }),
                  });
                  setError(`Generated ${r.generated} predictions`);
                  load();
                } catch (e: any) { setError(e.message); }
              }}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Generate Predictions
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Product', 'Warehouse', 'Current Stock', 'Avg Daily Demand', 'Days of Stock', 'Predicted Stockout', 'Risk', 'Acknowledged'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {stockouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white">{p.productId.slice(0, 12)}…</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{p.warehouseId}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(p.currentStock).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{Number(p.avgDailyDemand).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{Number(p.daysOfStock).toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {p.predictedStockoutDate ? new Date(p.predictedStockoutDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : p.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700'
                        : p.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                      }`}>{p.riskLevel}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${p.acknowledged ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.acknowledged ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stockouts.length && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No stockout predictions.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'safety-stock' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Product', 'Warehouse', 'Method', 'Fixed Qty', 'Coverage Days', 'Service Level', 'Calculated Safety', 'Last Recalc'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {safetyConfigs.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white">{c.productId.slice(0, 12)}…</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.warehouseId ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.method}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{c.fixedQty ? Number(c.fixedQty).toFixed(2) : '—'}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.coverageDays ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.serviceLevel ? `${(Number(c.serviceLevel) * 100).toFixed(0)}%` : '—'}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{c.calculatedSafety ? Number(c.calculatedSafety).toFixed(2) : '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{c.lastRecalcAt ? new Date(c.lastRecalcAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!safetyConfigs.length && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No safety stock configurations.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
