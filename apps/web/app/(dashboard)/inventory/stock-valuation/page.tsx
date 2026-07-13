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

type Tab = 'dashboard' | 'policies' | 'ledger' | 'adjustments' | 'revaluations' | 'summary';

interface Dashboard {
  totalPolicies: number;
  activePolicies: number;
  totalAdjustments: number;
  pendingAdjustments: number;
  totalRevaluations: number;
  postedRevaluations: number;
  totalRevaluationImpact: number;
  totalAdjustmentImpact: number;
}

interface Policy {
  id: string;
  productId?: string;
  warehouseId?: string;
  method: string;
  standardCost?: string;
  currency: string;
  isActive: boolean;
  effectiveFrom: string;
}

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  oldUnitCost: string;
  newUnitCost: string;
  qty: string;
  impactAmount: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface Revaluation {
  id: string;
  revaluationNumber: string;
  description?: string;
  status: string;
  totalImpact: string;
  revaluationDate: string;
  lines: { id: string; productId: string; currentUnitCost: string; newUnitCost: string; impactAmount: string }[];
}

const METHODS = ['FIFO', 'LIFO', 'WEIGHTED_AVG', 'STANDARD_COST', 'ACTUAL_COST'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  POSTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function StockValuationPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [revaluations, setRevaluations] = useState<Revaluation[]>([]);
  const [ledger, setLedger] = useState<unknown[]>([]);
  const [summary, setSummary] = useState<{ products: unknown[]; totalValue: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forms
  const [policyForm, setPolicyForm] = useState({ productId: '', warehouseId: '', method: 'WEIGHTED_AVG', standardCost: '', currency: 'USD', notes: '' });
  const [adjForm, setAdjForm] = useState({ productId: '', warehouseId: '', oldUnitCost: '', newUnitCost: '', qty: '', reason: '' });
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showAdjForm, setShowAdjForm] = useState(false);

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await apiFetch('/inventory/stock-valuation/dashboard')); } catch { /* ignore */ }
  }, []);
  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try { setPolicies(await apiFetch('/inventory/stock-valuation/policies')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  const loadAdjustments = useCallback(async () => {
    setLoading(true);
    try { setAdjustments(await apiFetch('/inventory/stock-valuation/adjustments')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  const loadRevaluations = useCallback(async () => {
    setLoading(true);
    try { setRevaluations(await apiFetch('/inventory/stock-valuation/revaluations')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  const loadLedger = useCallback(async () => {
    setLoading(true);
    try { setLedger(await apiFetch('/inventory/stock-valuation/ledger?limit=50')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  const loadSummary = useCallback(async () => {
    setLoading(true);
    try { setSummary(await apiFetch('/inventory/stock-valuation/valuation-summary')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    if (tab === 'policies') loadPolicies();
    else if (tab === 'adjustments') loadAdjustments();
    else if (tab === 'revaluations') loadRevaluations();
    else if (tab === 'ledger') loadLedger();
    else if (tab === 'summary') loadSummary();
  }, [tab, loadPolicies, loadAdjustments, loadRevaluations, loadLedger, loadSummary]);

  const savePolicy = async () => {
    try {
      await apiFetch('/inventory/stock-valuation/policies', {
        method: 'POST',
        body: JSON.stringify({
          ...policyForm,
          productId: policyForm.productId || undefined,
          warehouseId: policyForm.warehouseId || undefined,
          standardCost: policyForm.standardCost ? parseFloat(policyForm.standardCost) : undefined,
        }),
      });
      setShowPolicyForm(false);
      loadPolicies();
    } catch (e: unknown) { setError(String(e)); }
  };

  const saveAdj = async () => {
    try {
      await apiFetch('/inventory/stock-valuation/adjustments', {
        method: 'POST',
        body: JSON.stringify({
          ...adjForm,
          warehouseId: adjForm.warehouseId || undefined,
          oldUnitCost: parseFloat(adjForm.oldUnitCost),
          newUnitCost: parseFloat(adjForm.newUnitCost),
          qty: parseFloat(adjForm.qty),
        }),
      });
      setShowAdjForm(false);
      loadAdjustments();
    } catch (e: unknown) { setError(String(e)); }
  };

  const adjAction = async (id: string, action: string) => {
    try {
      await apiFetch(`/inventory/stock-valuation/adjustments/${id}/${action}`, { method: 'PATCH' });
      loadAdjustments(); loadDashboard();
    } catch (e: unknown) { setError(String(e)); }
  };

  const postRevaluation = async (id: string) => {
    try { await apiFetch(`/inventory/stock-valuation/revaluations/${id}/post`, { method: 'PATCH' }); loadRevaluations(); loadDashboard(); } catch (e: unknown) { setError(String(e)); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'policies', label: 'Policies' },
    { id: 'adjustments', label: 'Cost Adjustments' },
    { id: 'revaluations', label: 'Revaluations' },
    { id: 'ledger', label: 'Valuation Ledger' },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Stock Valuation</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}<button className="ml-2 underline" onClick={() => setError('')}>dismiss</button></div>}

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
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Policies', value: `${dashboard.activePolicies}/${dashboard.totalPolicies}` },
              { label: 'Pending Adjustments', value: dashboard.pendingAdjustments },
              { label: 'Total Revaluations', value: dashboard.totalRevaluations },
              { label: 'Revaluation Impact', value: `$${dashboard.totalRevaluationImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            ].map(c => (
              <div key={c.label} className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Adjustments</h3>
              <div className="text-sm text-gray-600">Total: {dashboard.totalAdjustments} | Pending: {dashboard.pendingAdjustments}</div>
              <div className="text-sm text-gray-600">Posted Impact: ${dashboard.totalAdjustmentImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Revaluations</h3>
              <div className="text-sm text-gray-600">Total: {dashboard.totalRevaluations} | Posted: {dashboard.postedRevaluations}</div>
              <div className="text-sm text-gray-600">Total Impact: ${dashboard.totalRevaluationImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      )}

      {/* Policies */}
      {tab === 'policies' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Valuation Policies</h2>
            <button onClick={() => setShowPolicyForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Policy</button>
          </div>
          {showPolicyForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3 text-sm">Set Policy</h3>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Product ID (optional)" value={policyForm.productId} onChange={e => setPolicyForm(f => ({ ...f, productId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Warehouse ID (optional)" value={policyForm.warehouseId} onChange={e => setPolicyForm(f => ({ ...f, warehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <select value={policyForm.method} onChange={e => setPolicyForm(f => ({ ...f, method: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
                <input placeholder="Standard Cost (if STANDARD_COST)" value={policyForm.standardCost} onChange={e => setPolicyForm(f => ({ ...f, standardCost: e.target.value }))} className="border rounded px-3 py-2 text-sm" type="number" />
                <input placeholder="Currency" value={policyForm.currency} onChange={e => setPolicyForm(f => ({ ...f, currency: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Notes" value={policyForm.notes} onChange={e => setPolicyForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={savePolicy} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save</button>
                <button onClick={() => setShowPolicyForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Product', 'Warehouse', 'Method', 'Standard Cost', 'Currency', 'Active', 'Effective From'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {policies.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-2">{p.productId ?? 'All'}</td>
                      <td className="px-4 py-2">{p.warehouseId ?? 'All'}</td>
                      <td className="px-4 py-2"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{p.method}</span></td>
                      <td className="px-4 py-2">{p.standardCost ? Number(p.standardCost).toFixed(4) : '-'}</td>
                      <td className="px-4 py-2">{p.currency}</td>
                      <td className="px-4 py-2">{p.isActive ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(p.effectiveFrom).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {policies.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No policies defined</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cost Adjustments */}
      {tab === 'adjustments' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Cost Adjustments</h2>
            <button onClick={() => setShowAdjForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Adjustment</button>
          </div>
          {showAdjForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3 text-sm">New Cost Adjustment</h3>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Product ID*" value={adjForm.productId} onChange={e => setAdjForm(f => ({ ...f, productId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Warehouse ID (optional)" value={adjForm.warehouseId} onChange={e => setAdjForm(f => ({ ...f, warehouseId: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Old Unit Cost*" value={adjForm.oldUnitCost} onChange={e => setAdjForm(f => ({ ...f, oldUnitCost: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="New Unit Cost*" value={adjForm.newUnitCost} onChange={e => setAdjForm(f => ({ ...f, newUnitCost: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Qty*" value={adjForm.qty} onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Reason*" value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={saveAdj} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Submit</button>
                <button onClick={() => setShowAdjForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Adj #', 'Product', 'Old Cost', 'New Cost', 'Qty', 'Impact', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {adjustments.map(a => (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-2 font-mono">{a.adjustmentNumber}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{a.productId}</td>
                      <td className="px-4 py-2">{Number(a.oldUnitCost).toFixed(4)}</td>
                      <td className="px-4 py-2">{Number(a.newUnitCost).toFixed(4)}</td>
                      <td className="px-4 py-2">{Number(a.qty).toFixed(2)}</td>
                      <td className={`px-4 py-2 ${Number(a.impactAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Number(a.impactAmount) >= 0 ? '+' : ''}{Number(a.impactAmount).toFixed(2)}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[a.status] ?? ''}`}>{a.status}</span></td>
                      <td className="px-4 py-2 flex gap-2 flex-wrap">
                        {a.status === 'PENDING' && <button onClick={() => adjAction(a.id, 'approve')} className="text-blue-600 underline text-xs">Approve</button>}
                        {a.status === 'APPROVED' && <button onClick={() => adjAction(a.id, 'post')} className="text-green-600 underline text-xs">Post</button>}
                        {a.status === 'PENDING' && <button onClick={() => adjAction(a.id, 'reject')} className="text-red-600 underline text-xs">Reject</button>}
                      </td>
                    </tr>
                  ))}
                  {adjustments.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No adjustments</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Revaluations */}
      {tab === 'revaluations' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Stock Revaluations</h2>
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="space-y-4">
              {revaluations.map(r => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-medium">{r.revaluationNumber}</span>
                      {r.description && <span className="ml-2 text-gray-600">{r.description}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</span>
                      {r.status === 'DRAFT' && <button onClick={() => postRevaluation(r.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Post</button>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Date: {new Date(r.revaluationDate).toLocaleDateString()} | Total Impact: {Number(r.totalImpact) >= 0 ? '+' : ''}{Number(r.totalImpact).toFixed(2)}</div>
                  {r.lines.length > 0 && (
                    <table className="w-full text-xs mt-3 border rounded">
                      <thead className="bg-gray-50"><tr>{['Product', 'Current Cost', 'New Cost', 'Impact'].map(h => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead>
                      <tbody>
                        {r.lines.map(l => (
                          <tr key={l.id} className="border-t">
                            <td className="px-2 py-1 truncate">{l.productId}</td>
                            <td className="px-2 py-1">{Number(l.currentUnitCost).toFixed(4)}</td>
                            <td className="px-2 py-1">{Number(l.newUnitCost).toFixed(4)}</td>
                            <td className={`px-2 py-1 ${Number(l.impactAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Number(l.impactAmount) >= 0 ? '+' : ''}{Number(l.impactAmount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
              {revaluations.length === 0 && <div className="text-center text-gray-400 py-8">No revaluations</div>}
            </div>
          )}
        </div>
      )}

      {/* Ledger */}
      {tab === 'ledger' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Valuation Ledger (last 50)</h2>
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Product', 'Method', 'Txn Type', 'Ref', 'Qty', 'Unit Cost', 'Total Cost', 'Running Qty', 'Running Value', 'Avg Cost'].map(h => <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(ledger as Record<string, unknown>[]).map((e, i) => (
                    <tr key={i} className="border-t text-xs">
                      <td className="px-3 py-2 truncate max-w-xs">{String(e.productId ?? '')}</td>
                      <td className="px-3 py-2">{String(e.method ?? '')}</td>
                      <td className="px-3 py-2">{String(e.transactionType ?? '')}</td>
                      <td className="px-3 py-2 font-mono">{String(e.transactionRef ?? '')}</td>
                      <td className="px-3 py-2">{Number(e.qty).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(e.unitCost).toFixed(4)}</td>
                      <td className="px-3 py-2">{Number(e.totalCost).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(e.runningQty).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(e.runningValue).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(e.runningAvgCost ?? 0).toFixed(4)}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No ledger entries</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {tab === 'summary' && summary && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Inventory Valuation Summary</h2>
            <div className="text-lg font-bold">Total: ${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead className="bg-gray-50">
                <tr>{['Product', 'Method', 'Qty', 'Value', 'Avg Cost'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(summary.products as Record<string, unknown>[]).map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 truncate">{String(p.productId ?? '')}</td>
                    <td className="px-4 py-2"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{String(p.method ?? '')}</span></td>
                    <td className="px-4 py-2">{Number(p.qty).toFixed(2)}</td>
                    <td className="px-4 py-2">${Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2">{Number(p.avgCost).toFixed(4)}</td>
                  </tr>
                ))}
                {summary.products.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No valuations</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
