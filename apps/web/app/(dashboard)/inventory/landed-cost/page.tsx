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

type Tab = 'dashboard' | 'vouchers' | 'charge-lines' | 'allocations';

interface Dashboard {
  totalVouchers: number;
  byStatus: { draftCount: number; submittedCount: number; allocatedCount: number; cancelledCount: number };
  totalAllocatedAmount: number;
}

interface Voucher {
  id: string;
  voucherNumber: string;
  description?: string;
  status: string;
  allocationMethod: string;
  totalAmount: string;
  currency: string;
  vendorId?: string;
  invoiceRef?: string;
  createdAt: string;
}

interface ChargeLine {
  id: string;
  voucherId: string;
  chargeType: string;
  description?: string;
  amount: string;
  currency: string;
  accountCode?: string;
}

interface Allocation {
  id: string;
  voucherId: string;
  chargeType: string;
  stockEntryId: string;
  allocationPct: string;
  allocatedAmount: string;
  addedToItemCost: boolean;
}

const METHODS = ['QTY', 'VALUE', 'WEIGHT', 'VOLUME', 'EQUAL'];
const CHARGE_TYPES = ['FREIGHT', 'DUTY', 'INSURANCE', 'BROKERAGE', 'OTHER'];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  ALLOCATED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function LandedCostPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [chargeLines, setChargeLines] = useState<ChargeLine[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', allocationMethod: 'VALUE', currency: 'USD', invoiceRef: '', notes: '' });
  const [chargeForm, setChargeForm] = useState({ chargeType: 'FREIGHT', description: '', amount: '', currency: 'USD', accountCode: '' });

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await apiFetch('/inventory/landed-cost/dashboard')); } catch { /* ignore */ }
  }, []);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try { setVouchers(await apiFetch('/inventory/landed-cost/vouchers')); } catch (e: unknown) { setError(String(e)); } finally { setLoading(false); }
  }, []);

  const loadChargeLines = useCallback(async (vid: string) => {
    try { setChargeLines(await apiFetch(`/inventory/landed-cost/vouchers/${vid}/charge-lines`)); } catch { /* ignore */ }
  }, []);

  const loadAllocations = useCallback(async () => {
    try {
      const r = await apiFetch('/inventory/landed-cost/allocation-report');
      setAllocations(r.allocations ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (tab === 'vouchers') loadVouchers(); }, [tab, loadVouchers]);
  useEffect(() => { if (tab === 'charge-lines' && selectedVoucher) loadChargeLines(selectedVoucher.id); }, [tab, selectedVoucher, loadChargeLines]);
  useEffect(() => { if (tab === 'allocations') loadAllocations(); }, [tab, loadAllocations]);

  const createVoucher = async () => {
    try {
      await apiFetch('/inventory/landed-cost/vouchers', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ description: '', allocationMethod: 'VALUE', currency: 'USD', invoiceRef: '', notes: '' });
      loadVouchers();
    } catch (e: unknown) { setError(String(e)); }
  };

  const submitVoucher = async (id: string) => {
    try { await apiFetch(`/inventory/landed-cost/vouchers/${id}/submit`, { method: 'PATCH' }); loadVouchers(); } catch (e: unknown) { setError(String(e)); }
  };

  const allocate = async (id: string) => {
    try { await apiFetch(`/inventory/landed-cost/vouchers/${id}/allocate`, { method: 'PATCH' }); loadVouchers(); loadDashboard(); } catch (e: unknown) { setError(String(e)); }
  };

  const cancelVoucher = async (id: string) => {
    try { await apiFetch(`/inventory/landed-cost/vouchers/${id}/cancel`, { method: 'PATCH' }); loadVouchers(); } catch (e: unknown) { setError(String(e)); }
  };

  const addChargeLine = async () => {
    if (!selectedVoucher) return;
    try {
      await apiFetch(`/inventory/landed-cost/vouchers/${selectedVoucher.id}/charge-lines`, {
        method: 'POST',
        body: JSON.stringify({ ...chargeForm, amount: parseFloat(chargeForm.amount) }),
      });
      setChargeForm({ chargeType: 'FREIGHT', description: '', amount: '', currency: 'USD', accountCode: '' });
      loadChargeLines(selectedVoucher.id);
    } catch (e: unknown) { setError(String(e)); }
  };

  const removeChargeLine = async (lineId: string) => {
    if (!selectedVoucher) return;
    try { await apiFetch(`/inventory/landed-cost/vouchers/${selectedVoucher.id}/charge-lines/${lineId}`, { method: 'DELETE' }); loadChargeLines(selectedVoucher.id); } catch (e: unknown) { setError(String(e)); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'vouchers', label: 'Vouchers' },
    { id: 'charge-lines', label: 'Charge Lines' },
    { id: 'allocations', label: 'Allocations' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Landed Cost Allocation</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}<button className="ml-2 underline" onClick={() => setError('')}>dismiss</button></div>}

      <div className="flex gap-2 border-b mb-6">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Vouchers', value: dashboard.totalVouchers },
              { label: 'Draft', value: dashboard.byStatus.draftCount },
              { label: 'Allocated', value: dashboard.byStatus.allocatedCount },
              { label: 'Total Allocated', value: `$${dashboard.totalAllocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            ].map(c => (
              <div key={c.label} className="bg-white border rounded-lg p-4">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Draft', val: dashboard.byStatus.draftCount, cls: 'bg-gray-50' },
              { label: 'Submitted', val: dashboard.byStatus.submittedCount, cls: 'bg-blue-50' },
              { label: 'Allocated', val: dashboard.byStatus.allocatedCount, cls: 'bg-green-50' },
              { label: 'Cancelled', val: dashboard.byStatus.cancelledCount, cls: 'bg-red-50' },
            ].map(c => (
              <div key={c.label} className={`${c.cls} border rounded-lg p-4 text-center`}>
                <div className="text-xl font-semibold">{c.val}</div>
                <div className="text-xs text-gray-600 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vouchers */}
      {tab === 'vouchers' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Landed Cost Vouchers</h2>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">+ New Voucher</button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Create Voucher</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Invoice Ref" value={form.invoiceRef} onChange={e => setForm(f => ({ ...f, invoiceRef: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <select value={form.allocationMethod} onChange={e => setForm(f => ({ ...f, allocationMethod: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
                <input placeholder="Currency (USD)" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={createVoucher} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Create</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>{['Voucher #', 'Status', 'Method', 'Total', 'Currency', 'Invoice Ref', 'Actions'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{v.voucherNumber}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[v.status] ?? ''}`}>{v.status}</span></td>
                      <td className="px-4 py-2">{v.allocationMethod}</td>
                      <td className="px-4 py-2">{Number(v.totalAmount).toFixed(2)}</td>
                      <td className="px-4 py-2">{v.currency}</td>
                      <td className="px-4 py-2">{v.invoiceRef ?? '-'}</td>
                      <td className="px-4 py-2 flex gap-2 flex-wrap">
                        <button onClick={() => { setSelectedVoucher(v); setTab('charge-lines'); }} className="text-blue-600 underline text-xs">Charges</button>
                        {v.status === 'DRAFT' && <button onClick={() => submitVoucher(v.id)} className="text-blue-600 underline text-xs">Submit</button>}
                        {v.status === 'SUBMITTED' && <button onClick={() => allocate(v.id)} className="text-green-600 underline text-xs">Allocate</button>}
                        {v.status !== 'ALLOCATED' && v.status !== 'CANCELLED' && <button onClick={() => cancelVoucher(v.id)} className="text-red-600 underline text-xs">Cancel</button>}
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No vouchers found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Charge Lines */}
      {tab === 'charge-lines' && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-medium">Charge Lines</h2>
            {selectedVoucher && <span className="text-sm text-gray-500">Voucher: {selectedVoucher.voucherNumber}</span>}
            {!selectedVoucher && <span className="text-sm text-yellow-600">Select a voucher from the Vouchers tab first</span>}
          </div>

          {selectedVoucher && selectedVoucher.status === 'DRAFT' && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3 text-sm">Add Charge Line</h3>
              <div className="grid grid-cols-3 gap-3">
                <select value={chargeForm.chargeType} onChange={e => setChargeForm(f => ({ ...f, chargeType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                  {CHARGE_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Description" value={chargeForm.description} onChange={e => setChargeForm(f => ({ ...f, description: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input type="number" placeholder="Amount" value={chargeForm.amount} onChange={e => setChargeForm(f => ({ ...f, amount: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Account Code" value={chargeForm.accountCode} onChange={e => setChargeForm(f => ({ ...f, accountCode: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
                <input placeholder="Currency" value={chargeForm.currency} onChange={e => setChargeForm(f => ({ ...f, currency: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              </div>
              <button onClick={addChargeLine} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm">Add Line</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead className="bg-gray-50">
                <tr>{['Type', 'Description', 'Amount', 'Currency', 'Account', 'Actions'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {chargeLines.map(l => (
                  <tr key={l.id} className="border-t">
                    <td className="px-4 py-2"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{l.chargeType}</span></td>
                    <td className="px-4 py-2">{l.description ?? '-'}</td>
                    <td className="px-4 py-2">{Number(l.amount).toFixed(2)}</td>
                    <td className="px-4 py-2">{l.currency}</td>
                    <td className="px-4 py-2">{l.accountCode ?? '-'}</td>
                    <td className="px-4 py-2">
                      {selectedVoucher?.status === 'DRAFT' && (
                        <button onClick={() => removeChargeLine(l.id)} className="text-red-600 underline text-xs">Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
                {chargeLines.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No charge lines</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocations */}
      {tab === 'allocations' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Allocation Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead className="bg-gray-50">
                <tr>{['Voucher', 'Charge Type', 'Stock Entry', 'Basis', 'Pct %', 'Allocated Amt', 'Added to Cost'].map(h => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{a.voucherId.slice(0, 8)}</td>
                    <td className="px-4 py-2"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">{a.chargeType}</span></td>
                    <td className="px-4 py-2 font-mono text-xs">{a.stockEntryId.slice(0, 8)}</td>
                    <td className="px-4 py-2">{Number(a.allocationPct).toFixed(2)}</td>
                    <td className="px-4 py-2">{Number(a.allocationPct).toFixed(2)}%</td>
                    <td className="px-4 py-2">{Number(a.allocatedAmount).toFixed(2)}</td>
                    <td className="px-4 py-2">{a.addedToItemCost ? '✓' : '-'}</td>
                  </tr>
                ))}
                {allocations.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No allocations yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
