'use client';

import { useState, useEffect, useCallback } from 'react';

interface Dashboard {
  coldChainProducts: number;
  openExcursions: number;
  criticalExcursions: number;
  pendingWriteDowns: number;
  pendingWriteOffs: number;
  totalWriteOffValue: number;
}

interface ColdChainReq {
  id: string;
  productId: string;
  minTempCelsius: number;
  maxTempCelsius: number;
  maxExcursionMins?: number;
  active: boolean;
}

interface Excursion {
  id: string;
  warehouseId: string;
  recordedTempC: number;
  severity: string;
  status: string;
  excursionStartAt: string;
  requirement: { productId: string };
}

interface WriteDown {
  id: string;
  requestNumber: string;
  productId: string;
  quantity: number;
  originalValuePerUnit: number;
  proposedValuePerUnit: number;
  status: string;
  writeDownReason: string;
}

interface WriteOff {
  id: string;
  writeOffNumber: string;
  productId: string;
  quantity: number;
  totalWriteOff: number;
  disposalMethod: string;
  status: string;
}

const BASE = '/api/inventory/cold-chain-writeoff';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const SEVERITY_COLORS: Record<string, string> = {
  MINOR: 'bg-yellow-100 text-yellow-700',
  MODERATE: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  QUARANTINED: 'bg-purple-100 text-purple-700',
  RELEASED: 'bg-green-100 text-green-700',
  DISPOSED: 'bg-gray-100 text-gray-500',
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  WRITTEN_DOWN: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'requirements', label: 'Cold Chain' },
  { key: 'excursions', label: 'Excursions' },
  { key: 'write-downs', label: 'Write-Downs' },
  { key: 'write-offs', label: 'Write-Offs' },
] as const;

export default function ColdChainWriteoffPage() {
  const [tab, setTab] = useState<'dashboard' | 'requirements' | 'excursions' | 'write-downs' | 'write-offs'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [requirements, setRequirements] = useState<ColdChainReq[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [writeDowns, setWriteDowns] = useState<WriteDown[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'dashboard') setDashboard(await apiFetch(`${BASE}/dashboard`));
      else if (tab === 'requirements') setRequirements(await apiFetch(`${BASE}/requirements`));
      else if (tab === 'excursions') setExcursions(await apiFetch(`${BASE}/excursions`));
      else if (tab === 'write-downs') setWriteDowns(await apiFetch(`${BASE}/write-downs`));
      else if (tab === 'write-offs') setWriteOffs(await apiFetch(`${BASE}/write-offs`));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const action = async (path: string, method = 'PATCH', body?: object) => {
    await apiFetch(`${BASE}${path}`, { method, body: body ? JSON.stringify(body) : undefined });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cold Chain & Write-Off Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cold-chain storage requirements, temperature excursion logging, stock write-downs and write-offs
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Cold Chain Products', value: dashboard.coldChainProducts },
              { label: 'Open Excursions', value: dashboard.openExcursions, red: dashboard.openExcursions > 0 },
              { label: 'Critical Excursions', value: dashboard.criticalExcursions, red: dashboard.criticalExcursions > 0 },
              { label: 'Pending Write-Downs', value: dashboard.pendingWriteDowns },
              { label: 'Pending Write-Offs', value: dashboard.pendingWriteOffs },
              { label: 'Total Written Off', value: `$${Number(dashboard.totalWriteOffValue).toLocaleString()}` },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-lg border p-4">
                <div className={`text-2xl font-bold ${(c as any).red ? 'text-red-600' : 'text-gray-900'}`}>{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cold Chain Requirements */}
      {tab === 'requirements' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Product', 'Min Temp (°C)', 'Max Temp (°C)', 'Max Excursion (min)', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requirements.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.productId.slice(-8)}</td>
                  <td className="px-4 py-3 font-medium text-blue-700">{Number(r.minTempCelsius).toFixed(1)}</td>
                  <td className="px-4 py-3 font-medium text-blue-700">{Number(r.maxTempCelsius).toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-500">{r.maxExcursionMins ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {requirements.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No cold-chain requirements defined</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Temperature Excursions */}
      {tab === 'excursions' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Product', 'Warehouse', 'Temp (°C)', 'Severity', 'Status', 'Occurred', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {excursions.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.requirement?.productId?.slice(-8)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.warehouseId.slice(-8)}</td>
                  <td className="px-4 py-3 font-medium">{Number(e.recordedTempC).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[e.severity] ?? 'bg-gray-100 text-gray-700'}`}>{e.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-700'}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.excursionStartAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {e.status === 'OPEN' && (
                      <button onClick={() => action(`/excursions/${e.id}/review`, 'PATCH', { status: 'UNDER_REVIEW' })}
                        className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {excursions.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No temperature excursions logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Write-Down Requests */}
      {tab === 'write-downs' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Number', 'Product', 'Qty', 'Original Value', 'Proposed Value', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {writeDowns.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{w.requestNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{w.productId.slice(-8)}</td>
                  <td className="px-4 py-3">{Number(w.quantity).toFixed(2)}</td>
                  <td className="px-4 py-3">${Number(w.originalValuePerUnit).toFixed(2)}</td>
                  <td className="px-4 py-3 text-orange-600">${Number(w.proposedValuePerUnit).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{w.writeDownReason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-700'}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    {w.status === 'PENDING_APPROVAL' && (
                      <>
                        <button onClick={() => action(`/write-downs/${w.id}/approve`)}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
                        <button onClick={() => action(`/write-downs/${w.id}/reject`, 'PATCH', { rejectionNotes: 'Rejected' })}
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {w.status === 'APPROVED' && (
                      <button onClick={() => action(`/write-downs/${w.id}/apply`)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Apply</button>
                    )}
                  </td>
                </tr>
              ))}
              {writeDowns.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No write-down requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Write-Off Records */}
      {tab === 'write-offs' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Number', 'Product', 'Qty', 'Total Write-Off', 'Disposal', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {writeOffs.map(w => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{w.writeOffNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{w.productId.slice(-8)}</td>
                  <td className="px-4 py-3">{Number(w.quantity).toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium text-red-600">${Number(w.totalWriteOff).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{w.disposalMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-700'}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    {w.status === 'PENDING_APPROVAL' && (
                      <>
                        <button onClick={() => action(`/write-offs/${w.id}/approve`)}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
                        <button onClick={() => action(`/write-offs/${w.id}/reject`, 'PATCH', { rejectionNotes: 'Rejected' })}
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {w.status === 'APPROVED' && (
                      <button onClick={() => action(`/write-offs/${w.id}/complete`)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Complete</button>
                    )}
                  </td>
                </tr>
              ))}
              {writeOffs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No write-off records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
