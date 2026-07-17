'use client';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Dashboard {
  catchWeightConfigs: number;
  outOfToleranceReadings: number;
  recalls: { draft: number; issued: number; inProgress: number; completed: number };
}

interface CatchWeightConfig {
  id: string;
  productId: string;
  nominalWeightKg: number;
  tolerancePctPlus: number;
  tolerancePctMinus: number;
  pricingBasis: string;
  active: boolean;
}

interface Recall {
  id: string;
  recallNumber: string;
  productId: string;
  recallClass: string;
  status: string;
  title: string;
  reason: string;
  actionRequired: string;
  totalUnitsAffected: number;
  totalUnitsRecovered: number;
  issuedAt?: string;
  deadlineAt?: string;
  affectedStock: { id: string; qtyAffected: number; qtyRecovered: number }[];
  customerNotices: { id: string; acknowledgedAt?: string }[];
}

const BASE = '/inventory/catch-weight-recall';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-orange-100 text-orange-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CLASS_I: 'bg-red-100 text-red-700',
  CLASS_II: 'bg-orange-100 text-orange-700',
  CLASS_III: 'bg-yellow-100 text-yellow-700',
};

export default function CatchWeightRecallPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<'dashboard' | 'catch-weight' | 'recalls'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [configs, setConfigs] = useState<CatchWeightConfig[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecall, setSelectedRecall] = useState<Recall | null>(null);
  const apiFetch = useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(path, {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'dashboard') {
        setDashboard(await apiFetch<Dashboard>(`${BASE}/dashboard`));
      } else if (tab === 'catch-weight') {
        setConfigs(await apiFetch<CatchWeightConfig[]>(`${BASE}/configs`));
      } else if (tab === 'recalls') {
        setRecalls(await apiFetch<Recall[]>(`${BASE}/recalls`));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab, apiFetch]);

  useEffect(() => { load(); }, [load]);

  const recallAction = async (id: string, action: string) => {
    await apiFetch(`${BASE}/recalls/${id}/${action}`, { method: 'POST' });
    load();
  };

  const TABS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'catch-weight', label: 'Catch-Weight' },
    { key: 'recalls', label: 'Product Recalls' },
  ] as const;

  return (
    <RouteGuard permission="inventory.catch-weight-recall.read">
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catch-Weight & Product Recall</h1>
        <p className="text-sm text-gray-500 mt-1">
          Variable-measure item control and recall lifecycle management
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      {/* Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Catch-Weight Configs', value: dashboard.catchWeightConfigs },
              { label: 'Out-of-Tolerance Readings', value: dashboard.outOfToleranceReadings, warn: dashboard.outOfToleranceReadings > 0 },
              { label: 'Open Recalls', value: dashboard.recalls.issued + dashboard.recalls.inProgress, warn: (dashboard.recalls.issued + dashboard.recalls.inProgress) > 0 },
              { label: 'Completed Recalls', value: dashboard.recalls.completed },
            ].map(c => (
              <div key={c.label} className={`rounded-lg border p-4 ${c.warn ? 'border-red-200 bg-red-50' : 'bg-white'}`}>
                <div className={`text-2xl font-bold ${c.warn ? 'text-red-700' : 'text-gray-900'}`}>{c.value}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Recalls by Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(dashboard.recalls).map(([k, v]) => (
                <div key={k} className="text-center">
                  <div className="text-xl font-bold">{v}</div>
                  <div className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Catch-Weight Configs */}
      {tab === 'catch-weight' && (
        <ListPageTemplate
          columns={[
            { key: 'productId', header: 'Product ID', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
            { key: 'nominalWeightKg', header: 'Nominal Weight', render: (v) => `${Number(v).toFixed(3)} kg` },
            { key: 'tolerancePctPlus', header: 'Tolerance (+/-)', render: (v, row) => `+${Number(v).toFixed(1)}% / -${Number(row.tolerancePctMinus).toFixed(1)}%` },
            { key: 'pricingBasis', header: 'Pricing Basis' },
            { key: 'active', header: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v ? 'Active' : 'Inactive'}</span> },
          ] as ListColumn[]}
          data={configs as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No catch-weight configurations"
          emptyDescription="No configurations have been set up yet."
        />
      )}

      {/* Product Recalls */}
      {tab === 'recalls' && (
        <div className="space-y-3">
          {selectedRecall ? (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedRecall.recallNumber} — {selectedRecall.title}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedRecall.status] ?? ''}`}>{selectedRecall.status}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedRecall.recallClass] ?? ''}`}>{selectedRecall.recallClass}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedRecall(null)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="font-bold text-lg">{selectedRecall.totalUnitsAffected}</div>
                  <div className="text-xs text-gray-500">Units Affected</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="font-bold text-lg">{selectedRecall.totalUnitsRecovered}</div>
                  <div className="text-xs text-gray-500">Units Recovered</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="font-bold text-lg">{selectedRecall.affectedStock.length}</div>
                  <div className="text-xs text-gray-500">Stock Locations</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="font-bold text-lg">
                    {selectedRecall.customerNotices.filter(n => n.acknowledgedAt).length}/{selectedRecall.customerNotices.length}
                  </div>
                  <div className="text-xs text-gray-500">Notices Ack'd</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <strong>Reason:</strong> {selectedRecall.reason}
              </div>
              <div className="flex gap-2">
                {selectedRecall.status === 'DRAFT' && (
                  <button onClick={() => recallAction(selectedRecall.id, 'issue').then(() => setSelectedRecall(null))}
                    className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600">Issue Recall</button>
                )}
                {selectedRecall.status === 'IN_PROGRESS' && (
                  <>
                    <button onClick={() => recallAction(selectedRecall.id, 'send-notices').then(() => setSelectedRecall(null))}
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Send Notices</button>
                    <button onClick={() => recallAction(selectedRecall.id, 'complete').then(() => setSelectedRecall(null))}
                      className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600">Complete</button>
                  </>
                )}
                {['DRAFT','ISSUED','IN_PROGRESS'].includes(selectedRecall.status) && (
                  <button onClick={() => recallAction(selectedRecall.id, 'cancel').then(() => setSelectedRecall(null))}
                    className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Cancel</button>
                )}
              </div>
            </div>
          ) : (
            recalls.map(r => (
              <div key={r.id} className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-300"
                onClick={() => setSelectedRecall(r)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.recallNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.recallClass] ?? ''}`}>{r.recallClass}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-0.5">{r.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Action: {r.actionRequired} · {r.totalUnitsAffected} units affected · {r.totalUnitsRecovered} recovered
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </div>
            ))
          )}
          {recalls.length === 0 && !loading && !selectedRecall && (
            <div className="text-center py-12 text-gray-400">No product recalls on record</div>
          )}
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
