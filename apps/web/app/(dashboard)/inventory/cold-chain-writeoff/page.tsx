'use client';
import styles from './page.module.css';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [tab, setTab] = useState<'dashboard' | 'requirements' | 'excursions' | 'write-downs' | 'write-offs'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [requirements, setRequirements] = useState<ColdChainReq[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [writeDowns, setWriteDowns] = useState<WriteDown[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiFetch = useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(path.replace('/api', ''), {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (tab === 'dashboard') setDashboard(await apiFetch<Dashboard>(`${BASE}/dashboard`));
      else if (tab === 'requirements') setRequirements(await apiFetch<ColdChainReq[]>(`${BASE}/requirements`));
      else if (tab === 'excursions') setExcursions(await apiFetch<Excursion[]>(`${BASE}/excursions`));
      else if (tab === 'write-downs') setWriteDowns(await apiFetch<WriteDown[]>(`${BASE}/write-downs`));
      else if (tab === 'write-offs') setWriteOffs(await apiFetch<WriteOff[]>(`${BASE}/write-offs`));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const action = async (path: string, method = 'PATCH', body?: object) => {
    await apiFetch(`${BASE}${path}`, { method, body: body ? JSON.stringify(body) : undefined });
    load();
  };

  return (
    <RouteGuard permission="inventory.cold-chain-writeoff.read">
    <div className="ui-page-shell">
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
        <ListPageTemplate
          columns={[
            { key: 'productId', header: 'Product', render: (v) => <span className="font-mono text-xs">{String(v).slice(-8)}</span> },
            { key: 'minTempCelsius', header: 'Min Temp (°C)', render: (v) => <span className="ui-text-primary">{Number(v).toFixed(1)}</span> },
            { key: 'maxTempCelsius', header: 'Max Temp (°C)', render: (v) => <span className="ui-text-primary">{Number(v).toFixed(1)}</span> },
            { key: 'maxExcursionMins', header: 'Max Excursion (min)', render: (v) => String(v ?? '—') },
            { key: 'active', header: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v ? 'Active' : 'Inactive'}</span> },
          ] as ListColumn[]}
          data={requirements as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No cold-chain requirements"
          emptyDescription="No cold-chain requirements have been defined."
        />
      )}

      {/* Temperature Excursions */}
      {tab === 'excursions' && (
        <ListPageTemplate
          columns={[
            { key: 'requirement', header: 'Product', render: (v) => <span className="font-mono text-xs">{String((v as any)?.productId ?? '').slice(-8)}</span> },
            { key: 'warehouseId', header: 'Warehouse', render: (v) => String(v).slice(-8) },
            { key: 'recordedTempC', header: 'Temp (°C)', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
            { key: 'severity', header: 'Severity', render: (v) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[String(v)] ?? 'bg-gray-100 text-gray-700'}`}>{String(v)}</span> },
            { key: 'status', header: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[String(v)] ?? 'bg-gray-100 text-gray-700'}`}>{String(v)}</span> },
            { key: 'excursionStartAt', header: 'Occurred', render: (v) => new Date(String(v)).toLocaleDateString() },
            { key: 'id', header: 'Actions', render: (v, row) => row.status === 'OPEN' ? (
              <button onClick={() => action(`/excursions/${v}/review`, 'PATCH', { status: 'UNDER_REVIEW' })} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">Review</button>
            ) : null },
          ] as ListColumn[]}
          data={excursions as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No temperature excursions"
          emptyDescription="No temperature excursions have been logged."
        />
      )}

      {/* Write-Down Requests */}
      {tab === 'write-downs' && (
        <ListPageTemplate
          columns={[
            { key: 'requestNumber', header: 'Number', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
            { key: 'productId', header: 'Product', render: (v) => <span className="font-mono text-xs">{String(v).slice(-8)}</span> },
            { key: 'quantity', header: 'Qty', render: (v) => Number(v).toFixed(2) },
            { key: 'originalValuePerUnit', header: 'Original Value', render: (v) => `$${Number(v).toFixed(2)}` },
            { key: 'proposedValuePerUnit', header: 'Proposed Value', render: (v) => <span className={styles.s1}>${Number(v).toFixed(2)}</span> },
            { key: 'writeDownReason', header: 'Reason' },
            { key: 'status', header: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[String(v)] ?? 'bg-gray-100 text-gray-700'}`}>{String(v)}</span> },
            { key: 'id', header: 'Actions', render: (v, row) => (
              <div className={styles.s2}>
                {row.status === 'PENDING_APPROVAL' && <>
                  <button onClick={() => action(`/write-downs/${v}/approve`)} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
                  <button onClick={() => action(`/write-downs/${v}/reject`, 'PATCH', { rejectionNotes: 'Rejected' })} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Reject</button>
                </>}
                {row.status === 'APPROVED' && <button onClick={() => action(`/write-downs/${v}/apply`)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Apply</button>}
              </div>
            )},
          ] as ListColumn[]}
          data={writeDowns as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No write-down requests"
          emptyDescription="No write-down requests have been submitted."
        />
      )}

      {/* Write-Off Records */}
      {tab === 'write-offs' && (
        <ListPageTemplate
          columns={[
            { key: 'writeOffNumber', header: 'Number', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
            { key: 'productId', header: 'Product', render: (v) => <span className="font-mono text-xs">{String(v).slice(-8)}</span> },
            { key: 'quantity', header: 'Qty', render: (v) => Number(v).toFixed(2) },
            { key: 'totalWriteOff', header: 'Total Write-Off', render: (v) => <span className={styles.s3}>${Number(v).toLocaleString()}</span> },
            { key: 'disposalMethod', header: 'Disposal' },
            { key: 'status', header: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[String(v)] ?? 'bg-gray-100 text-gray-700'}`}>{String(v)}</span> },
            { key: 'id', header: 'Actions', render: (v, row) => (
              <div className={styles.s2}>
                {row.status === 'PENDING_APPROVAL' && <>
                  <button onClick={() => action(`/write-offs/${v}/approve`)} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
                  <button onClick={() => action(`/write-offs/${v}/reject`, 'PATCH', { rejectionNotes: 'Rejected' })} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Reject</button>
                </>}
                {row.status === 'APPROVED' && <button onClick={() => action(`/write-offs/${v}/complete`)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Complete</button>}
              </div>
            )},
          ] as ListColumn[]}
          data={writeOffs as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No write-off records"
          emptyDescription="No write-off records found."
        />
      )}
    </div>
    </RouteGuard>
  );
}
