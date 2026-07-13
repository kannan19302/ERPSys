'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Tab = 'dashboard' | 'stock-takes' | 'variances' | 'accuracy';

interface Dashboard {
  total: number;
  byStatus: Record<string, number>;
  variances: { pending: number; approved: number };
}

interface StockTake {
  id: string; stockTakeNumber: string; warehouseId: string; status: string;
  countType: string; countDate: string; createdAt: string;
  _count?: { sheets: number; variances: number };
}

interface StockTakeVariance {
  id: string; productId: string; warehouseId: string; systemQty: string;
  countedQty: string; varianceQty: string; variancePct: string;
  varianceValue?: string; status: string;
}

interface AccuracyRow {
  stockTakeNumber: string; warehouseId: string; postedAt?: string;
  totalLines: number; varianceLines: number; accuracyRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COUNTING: 'bg-yellow-100 text-yellow-700',
  VARIANCE_REVIEW: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  POSTED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function StockTakesPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyRow[]>([]);
  const [selectedSt, setSelectedSt] = useState<string | null>(null);
  const [variances, setVariances] = useState<StockTakeVariance[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ warehouseId: '', countDate: '', countType: 'FULL', notes: '' });

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await apiFetch('/inventory/stock-takes/dashboard')); } catch { /* ignore */ }
  }, []);

  const loadStockTakes = useCallback(async () => {
    setLoading(true);
    try { setStockTakes(await apiFetch('/inventory/stock-takes')); }
    catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  const loadAccuracy = useCallback(async () => {
    setLoading(true);
    try { setAccuracy(await apiFetch('/inventory/stock-takes/accuracy-report')); }
    catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  const loadVariances = useCallback(async (id: string) => {
    try {
      const result = await apiFetch(`/inventory/stock-takes/${id}/variances`);
      setVariances(result);
      setSelectedSt(id);
    } catch (e: unknown) { setError(String(e)); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    if (tab === 'stock-takes') loadStockTakes();
    else if (tab === 'accuracy') loadAccuracy();
  }, [tab, loadStockTakes, loadAccuracy]);

  const createStockTake = async () => {
    try {
      await apiFetch('/inventory/stock-takes', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false); loadStockTakes(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const action = async (id: string, act: string, body?: unknown) => {
    try {
      await apiFetch(`/inventory/stock-takes/${id}/${act}`, {
        method: 'PATCH', ...(body ? { body: JSON.stringify(body) } : {}),
      });
      loadStockTakes(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const varianceAction = async (varianceId: string, act: string, body?: unknown) => {
    try {
      await apiFetch(`/inventory/stock-takes/variances/${varianceId}/${act}`, {
        method: 'PATCH', ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (selectedSt) loadVariances(selectedSt);
      loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'stock-takes', label: 'Stock Takes' },
    { id: 'variances', label: 'Variance Review' },
    { id: 'accuracy', label: 'Accuracy Report' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Physical Inventory / Stock Takes</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}<button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      <div className="flex gap-2 border-b mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Stock Takes', value: dashboard.total },
              { label: 'In Progress', value: (dashboard.byStatus.inProgress ?? 0) + (dashboard.byStatus.counting ?? 0) },
              { label: 'Pending Variances', value: dashboard.variances.pending },
              { label: 'Posted', value: dashboard.byStatus.posted ?? 0 },
            ].map(c => (
              <div key={c.label} className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">By Status</h3>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {Object.entries(dashboard.byStatus).map(([key, val]) => (
                <div key={key} className={`rounded-lg p-2 text-center ${STATUS_COLORS[key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, '_$1').toUpperCase()] ?? 'bg-gray-50'}`}>
                  <div className="text-lg font-semibold">{val}</div>
                  <div className="text-xs mt-0.5 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock Takes List */}
      {tab === 'stock-takes' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Stock Takes</h2>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Stock Take</button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Create Stock Take</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <input placeholder="Warehouse ID*" value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="date" value={form.countDate} onChange={e => setForm(f => ({ ...f, countDate: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <select value={form.countType} onChange={e => setForm(f => ({ ...f, countType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {['FULL', 'ZONE', 'CATEGORY'].map(t => <option key={t}>{t}</option>)}
                </select>
                <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={createStockTake} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Stock Take #', 'Warehouse', 'Type', 'Count Date', 'Status', 'Sheets', 'Variances', 'Actions'].map(h =>
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {stockTakes.map(st => (
                    <tr key={st.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{st.stockTakeNumber}</td>
                      <td className="px-3 py-2 text-xs">{st.warehouseId.slice(0, 8)}</td>
                      <td className="px-3 py-2 text-xs">{st.countType}</td>
                      <td className="px-3 py-2 text-xs">{new Date(st.countDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[st.status] ?? ''}`}>{st.status}</span></td>
                      <td className="px-3 py-2">{st._count?.sheets ?? 0}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => { setTab('variances'); loadVariances(st.id); }}
                          className="text-blue-600 underline text-xs">{st._count?.variances ?? 0}</button>
                      </td>
                      <td className="px-3 py-2 flex gap-1 flex-wrap">
                        {st.status === 'DRAFT' && <button onClick={() => action(st.id, 'start')} className="text-blue-600 underline text-xs">Start</button>}
                        {['COUNTING', 'IN_PROGRESS'].includes(st.status) && <button onClick={() => action(st.id, 'generate-variances')} className="text-orange-600 underline text-xs">Gen Variances</button>}
                        {st.status === 'VARIANCE_REVIEW' && <button onClick={() => action(st.id, 'approve')} className="text-green-600 underline text-xs">Approve</button>}
                        {st.status === 'APPROVED' && <button onClick={() => action(st.id, 'post')} className="text-emerald-600 underline text-xs">Post</button>}
                        {!['POSTED', 'CANCELLED'].includes(st.status) && <button onClick={() => action(st.id, 'cancel')} className="text-red-600 underline text-xs">Cancel</button>}
                      </td>
                    </tr>
                  ))}
                  {stockTakes.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No stock takes</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Variance Review */}
      {tab === 'variances' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Variance Review{selectedSt ? ` — ${selectedSt.slice(0, 8)}` : ''}</h2>
          {!selectedSt ? (
            <div className="text-center text-gray-400 py-8 border rounded-lg">
              Select a stock take from the Stock Takes tab to review its variances.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Product', 'System Qty', 'Counted Qty', 'Variance', 'Variance %', 'Value', 'Status', 'Actions'].map(h =>
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {variances.map(v => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs font-mono">{v.productId.slice(0, 10)}</td>
                      <td className="px-3 py-2">{v.systemQty}</td>
                      <td className="px-3 py-2">{v.countedQty}</td>
                      <td className={`px-3 py-2 font-medium ${Number(v.varianceQty) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(v.varianceQty) > 0 ? '+' : ''}{v.varianceQty}
                      </td>
                      <td className="px-3 py-2">{Number(v.variancePct).toFixed(1)}%</td>
                      <td className="px-3 py-2">{v.varianceValue ? `$${Number(v.varianceValue).toFixed(2)}` : '-'}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[v.status] ?? ''}`}>{v.status}</span></td>
                      <td className="px-3 py-2 flex gap-1">
                        {v.status === 'PENDING' && <>
                          <button onClick={() => varianceAction(v.id, 'approve')} className="text-green-600 underline text-xs">Approve</button>
                          <button onClick={() => varianceAction(v.id, 'reject', { rejectionReason: 'Rejected' })} className="text-red-600 underline text-xs">Reject</button>
                        </>}
                      </td>
                    </tr>
                  ))}
                  {variances.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No variances found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Accuracy Report */}
      {tab === 'accuracy' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Inventory Accuracy Report (Last 10 Posted)</h2>
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Stock Take #', 'Warehouse', 'Posted At', 'Total Lines', 'Variance Lines', 'Accuracy Rate'].map(h =>
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {accuracy.map((row, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{row.stockTakeNumber}</td>
                      <td className="px-3 py-2 text-xs">{row.warehouseId.slice(0, 8)}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{row.postedAt ? new Date(row.postedAt).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2">{row.totalLines}</td>
                      <td className="px-3 py-2 text-red-600">{row.varianceLines}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${row.accuracyRate}%` }} />
                          </div>
                          <span className={row.accuracyRate >= 95 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                            {row.accuracyRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accuracy.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No posted stock takes yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
