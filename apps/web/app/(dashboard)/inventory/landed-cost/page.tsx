'use client';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
  const apiFetch = useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(path, {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);

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
      const r = await apiFetch<{ allocations?: Allocation[] }>('/inventory/landed-cost/allocation-report');
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

  const voucherColumns: ListColumn[] = [
    { key: 'voucherNumber', header: 'Voucher #', render: (row) => <span className="font-mono">{(row as unknown as Voucher).voucherNumber}</span> },
    {
      key: 'status', header: 'Status', render: (row) => {
        const v = row as unknown as Voucher;
        return <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[v.status] ?? ''}`}>{v.status}</span>;
      },
    },
    { key: 'allocationMethod', header: 'Method' },
    { key: 'totalAmount', header: 'Total', render: (row) => Number((row as unknown as Voucher).totalAmount).toFixed(2) },
    { key: 'currency', header: 'Currency' },
    { key: 'invoiceRef', header: 'Invoice Ref', render: (row) => (row as unknown as Voucher).invoiceRef ?? '-' },
    {
      key: 'actions', header: 'Actions', render: (row) => {
        const v = row as unknown as Voucher;
        return (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setSelectedVoucher(v); setTab('charge-lines'); }} className="text-blue-600 underline text-xs">Charges</button>
            {v.status === 'DRAFT' && <button onClick={() => submitVoucher(v.id)} className="text-blue-600 underline text-xs">Submit</button>}
            {v.status === 'SUBMITTED' && <button onClick={() => allocate(v.id)} className="text-green-600 underline text-xs">Allocate</button>}
            {v.status !== 'ALLOCATED' && v.status !== 'CANCELLED' && <button onClick={() => cancelVoucher(v.id)} className="text-red-600 underline text-xs">Cancel</button>}
          </div>
        );
      },
    },
  ];

  const chargeLineColumns: ListColumn[] = [
    { key: 'chargeType', header: 'Type', render: (row) => <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{(row as unknown as ChargeLine).chargeType}</span> },
    { key: 'description', header: 'Description', render: (row) => (row as unknown as ChargeLine).description ?? '-' },
    { key: 'amount', header: 'Amount', render: (row) => Number((row as unknown as ChargeLine).amount).toFixed(2) },
    { key: 'currency', header: 'Currency' },
    { key: 'accountCode', header: 'Account', render: (row) => (row as unknown as ChargeLine).accountCode ?? '-' },
    {
      key: 'actions', header: 'Actions', render: (row) => {
        const l = row as unknown as ChargeLine;
        return selectedVoucher?.status === 'DRAFT' ? (
          <button onClick={() => removeChargeLine(l.id)} className="text-red-600 underline text-xs">Remove</button>
        ) : null;
      },
    },
  ];

  const allocationColumns: ListColumn[] = [
    { key: 'voucherId', header: 'Voucher', render: (row) => <span className="font-mono text-xs">{(row as unknown as Allocation).voucherId.slice(0, 8)}</span> },
    { key: 'chargeType', header: 'Charge Type', render: (row) => <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">{(row as unknown as Allocation).chargeType}</span> },
    { key: 'stockEntryId', header: 'Stock Entry', render: (row) => <span className="font-mono text-xs">{(row as unknown as Allocation).stockEntryId.slice(0, 8)}</span> },
    { key: 'basis', header: 'Basis', render: (row) => Number((row as unknown as Allocation).allocationPct).toFixed(2) },
    { key: 'allocationPct', header: 'Pct %', render: (row) => `${Number((row as unknown as Allocation).allocationPct).toFixed(2)}%` },
    { key: 'allocatedAmount', header: 'Allocated Amt', render: (row) => Number((row as unknown as Allocation).allocatedAmount).toFixed(2) },
    { key: 'addedToItemCost', header: 'Added to Cost', render: (row) => (row as unknown as Allocation).addedToItemCost ? '✓' : '-' },
  ];

  return (
    <RouteGuard permission="inventory.landed-cost.read">
    <div className="ui-page-shell">
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
        <div className="space-y-4">
          <StatCardRow stats={[
            { label: 'Total Vouchers', value: dashboard.totalVouchers },
            { label: 'Draft', value: dashboard.byStatus.draftCount },
            { label: 'Allocated', value: dashboard.byStatus.allocatedCount },
            { label: 'Total Allocated', value: `$${dashboard.totalAllocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          ]} />
          <StatCardRow stats={[
            { label: 'Draft', value: dashboard.byStatus.draftCount },
            { label: 'Submitted', value: dashboard.byStatus.submittedCount },
            { label: 'Allocated', value: dashboard.byStatus.allocatedCount },
            { label: 'Cancelled', value: dashboard.byStatus.cancelledCount },
          ]} />
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

          <ListPageTemplate columns={voucherColumns} data={vouchers as unknown as Record<string, unknown>[]} loading={loading} searchable />
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

          <ListPageTemplate columns={chargeLineColumns} data={chargeLines as unknown as Record<string, unknown>[]} loading={false} searchable />
        </div>
      )}

      {/* Allocations */}
      {tab === 'allocations' && (
        <div>
          <h2 className="text-lg font-medium mb-4">Allocation Report</h2>
          <ListPageTemplate columns={allocationColumns} data={allocations as unknown as Record<string, unknown>[]} loading={false} searchable />
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
