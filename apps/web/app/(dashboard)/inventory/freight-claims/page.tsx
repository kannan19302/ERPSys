'use client';
import { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

function useFrameworkFetch() {
  const client = useApiClient();
  return useCallback(<T,>(path: string, opts?: RequestInit) => client.request<T>(`/inventory/freight-claims${path}`, {
    method: opts?.method,
    body: opts?.body ? String(opts.body) : undefined,
  }), [client]);
}

const TABS = ['Dashboard', 'Damage Reports', 'File Claim', 'Claims', 'Events'] as const;
type Tab = typeof TABS[number];

export default function FreightClaimsPage() {
  const [tab, setTab] = useState<Tab>('Dashboard');

  return (
    <RouteGuard permission="inventory.freight-claims.read">
    <div className="ui-page-shell">
      <h1 className="text-2xl font-bold">Freight Claims & Cargo Damage</h1>
      <div className="flex gap-2 border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Dashboard' && <DashboardTab />}
      {tab === 'Damage Reports' && <DamageReportsTab />}
      {tab === 'File Claim' && <FileClaimTab />}
      {tab === 'Claims' && <ClaimsTab />}
      {tab === 'Events' && <EventsTab />}
    </div>
    </RouteGuard>
  );
}

function DashboardTab() {
  const apiFetch = useFrameworkFetch();
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { apiFetch('/dashboard').then(setStats).catch(console.error); }, []);
  if (!stats) return <p className="text-sm text-gray-500">Loading…</p>;
  const cards = [
    ['Total Reports', stats.totalReports], ['Draft Reports', stats.draftReports],
    ['Submitted Reports', stats.submittedReports], ['Total Claims', stats.totalClaims],
    ['Draft Claims', stats.draftClaims], ['Filed Claims', stats.filedClaims],
    ['Under Investigation', stats.underInvestigation], ['Settlement Offered', stats.settlementOffered],
  ];
  return (
    <StatCardRow stats={cards.map(([label, value]) => ({ label: label as string, value: value as string | number }))} />
  );
}

function DamageReportsTab() {
  const apiFetch = useFrameworkFetch();
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ description: '', severity: 'MINOR', discoveredAt: '', carrierId: '', notes: '' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>('/damage-reports').then(r => { setReports(r.items); setTotal(r.total); }).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/damage-reports', { method: 'POST', body: JSON.stringify({ ...form, discoveredAt: new Date(form.discoveredAt) }) });
      setMsg('Damage report created');
      setForm({ description: '', severity: 'MINOR', discoveredAt: '', carrierId: '', notes: '' });
      load();
    } catch (err: any) { setMsg(err.message); }
  };

  const doSubmit = async (id: string) => {
    try { await apiFetch(`/damage-reports/${id}/submit`, { method: 'PATCH' }); load(); } catch (err: any) { setMsg(err.message); }
  };

  const columns: ListColumn[] = [
    { key: 'reportNumber', header: 'Report #' },
    { key: 'description', header: 'Description' },
    { key: 'severity', header: 'Severity' },
    {
      key: 'status', header: 'Status',
      render: (row) => <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{String((row as unknown as { status: string }).status)}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (row) => {
        const r = row as unknown as { id: string; status: string };
        return r.status === 'DRAFT'
          ? <button onClick={() => doSubmit(r.id)} className="text-xs text-blue-600 hover:underline">Submit</button>
          : null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-sm">New Damage Report</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Description *</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Discovered At *</label>
            <input type="datetime-local" className="w-full border rounded px-2 py-1 text-sm" value={form.discoveredAt}
              onChange={e => setForm(f => ({ ...f, discoveredAt: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Severity</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              {['MINOR', 'MODERATE', 'SEVERE'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Carrier ID</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.carrierId}
              onChange={e => setForm(f => ({ ...f, carrierId: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Notes</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Create Report</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b text-sm font-medium">Reports ({total})</div>
        <ListPageTemplate columns={columns} data={reports as unknown as Record<string, unknown>[]} loading={false} searchable />
      </div>
    </div>
  );
}

function FileClaimTab() {
  const apiFetch = useFrameworkFetch();
  const [form, setForm] = useState({ damageReportId: '', carrierId: '', claimType: 'DAMAGE', claimedAmount: '', currency: 'USD', notes: '' });
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/claims', { method: 'POST', body: JSON.stringify({ ...form, claimedAmount: Number(form.claimedAmount) }) });
      setMsg('Claim filed successfully');
      setForm({ damageReportId: '', carrierId: '', claimType: 'DAMAGE', claimedAmount: '', currency: 'USD', notes: '' });
    } catch (err: any) { setMsg(err.message); }
  };

  return (
    <form onSubmit={submit} className="bg-white border rounded-lg p-4 max-w-lg space-y-3">
      <h2 className="font-semibold text-sm">File Freight Claim</h2>
      {[
        { label: 'Damage Report ID *', key: 'damageReportId' as const, required: true },
        { label: 'Carrier ID *', key: 'carrierId' as const, required: true },
        { label: 'Claimed Amount *', key: 'claimedAmount' as const, required: true, type: 'number' },
        { label: 'Currency', key: 'currency' as const },
        { label: 'Notes', key: 'notes' as const },
      ].map(({ label, key, required, type }) => (
        <div key={key}>
          <label className="text-xs text-gray-600">{label}</label>
          <input type={type ?? 'text'} className="w-full border rounded px-2 py-1 text-sm" value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={required} />
        </div>
      ))}
      <div>
        <label className="text-xs text-gray-600">Claim Type</label>
        <select className="w-full border rounded px-2 py-1 text-sm" value={form.claimType}
          onChange={e => setForm(f => ({ ...f, claimType: e.target.value }))}>
          {['DAMAGE', 'SHORTAGE', 'LOSS', 'DELAY', 'CONCEALED'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">File Claim</button>
      {msg && <p className="text-sm text-green-600">{msg}</p>}
    </form>
  );
}

function ClaimsTab() {
  const apiFetch = useFrameworkFetch();
  const [claims, setClaims] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: any[]; total: number }>('/claims').then(r => { setClaims(r.items); setTotal(r.total); }).catch(console.error);
  }, []);
  useEffect(load, [load]);

  const updateStatus = async (id: string) => {
    const status = statusInputs[id];
    if (!status) return;
    try {
      await apiFetch(`/claims/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setMsg(`Claim updated to ${status}`);
      load();
    } catch (err: any) { setMsg(err.message); }
  };

  const columns: ListColumn[] = [
    { key: 'claimNumber', header: 'Claim #' },
    { key: 'claimType', header: 'Type' },
    {
      key: 'amount', header: 'Amount',
      render: (row) => {
        const c = row as unknown as { currency: string; claimedAmount: number };
        return `${c.currency} ${c.claimedAmount}`;
      },
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">{String((row as unknown as { status: string }).status)}</span>,
    },
    {
      key: 'updateStatus', header: 'Update Status',
      render: (row) => {
        const c = row as unknown as { id: string };
        return (
          <div className="flex gap-2">
            <select className="border rounded px-1 py-0.5 text-xs"
              value={statusInputs[c.id] ?? ''}
              onChange={e => setStatusInputs(s => ({ ...s, [c.id]: e.target.value }))}>
              <option value="">-- select --</option>
              {['FILED', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'SETTLEMENT_OFFERED', 'ACCEPTED', 'REJECTED', 'CLOSED'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button onClick={() => updateStatus(c.id)} className="text-xs text-blue-600 hover:underline">Apply</button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b text-sm font-medium">Claims ({total})</div>
        <ListPageTemplate columns={columns} data={claims as unknown as Record<string, unknown>[]} loading={false} searchable />
      </div>
    </div>
  );
}

function EventsTab() {
  const apiFetch = useFrameworkFetch();
  const [claimId, setClaimId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ description: '', eventType: 'NOTE' });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    if (!claimId) return;
    apiFetch<any[]>(`/claims/${claimId}/events`).then(setEvents).catch(console.error);
  }, [claimId]);
  useEffect(load, [load]);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/claims/${claimId}/events`, { method: 'POST', body: JSON.stringify(form) });
      setMsg('Event added');
      setForm({ description: '', eventType: 'NOTE' });
      load();
    } catch (err: any) { setMsg(err.message); }
  };

  const columns: ListColumn[] = [
    { key: 'eventType', header: 'Type' },
    { key: 'description', header: 'Description' },
    {
      key: 'occurredAt', header: 'Occurred At',
      render: (row) => {
        const ev = row as unknown as { occurredAt: string };
        return <span className="text-xs text-gray-500">{new Date(ev.occurredAt).toLocaleString()}</span>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Claim ID" value={claimId}
          onChange={e => setClaimId(e.target.value)} />
        <button onClick={load} className="px-3 py-1 bg-gray-100 text-sm rounded">Load Events</button>
      </div>
      {claimId && (
        <form onSubmit={addEvent} className="bg-white border rounded-lg p-4 space-y-3 max-w-md">
          <h2 className="font-semibold text-sm">Add Event</h2>
          <div>
            <label className="text-xs text-gray-600">Description *</label>
            <input className="w-full border rounded px-2 py-1 text-sm" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-gray-600">Event Type</label>
            <select className="w-full border rounded px-2 py-1 text-sm" value={form.eventType}
              onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
              {['NOTE', 'DOCUMENT_UPLOADED', 'CARRIER_CONTACT', 'INSPECTION', 'STATUS_CHANGE'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded">Add Event</button>
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </form>
      )}
      <div className="bg-white border rounded-lg overflow-hidden">
        <ListPageTemplate columns={columns} data={events as unknown as Record<string, unknown>[]} loading={false} searchable />
      </div>
    </div>
  );
}
