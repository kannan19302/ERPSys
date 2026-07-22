'use client';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, Disclosure,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Plus, Box, Anchor, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ContainerEvent {
  location: string;
  event: string;
  timestamp: string;
  status: string;
}

interface Container {
  id: string;
  containerNumber: string;
  carrier: string;
  origin: string;
  destination: string;
  eta: string;
  status: string;
  lastEvent: string;
  daysInTransit: number;
  events: ContainerEvent[];
}

export default function ContainersPage() {
  const client = useApiClient();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ containerNumber: '', carrier: '', origin: '', destination: '', eta: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await client.get<Container[]>('/supply-chain/containers');
        setContainers(data ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.containerNumber) return;
    setSaving(true);
    try {
      const created = await client.post<Container>('/supply-chain/containers', form);
      setContainers((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm({ containerNumber: '', carrier: '', origin: '', destination: '', eta: '' });
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const isAtRisk = (c: Container) => c.status !== 'DELIVERED' && c.daysInTransit > 14;

  const columns: Column<Container>[] = [
    {
      key: 'containerNumber', header: 'Container #', sortable: true,
      render: (row) => (
        <span style={{ color: isAtRisk(row) ? 'var(--danger-600)' : undefined, fontWeight: isAtRisk(row) ? 600 : undefined }}>
          <Link href={`/supply-chain/containers/${row.id}`} className="ui-link">{row.containerNumber}</Link>
        </span>
      ),
    },
    { key: 'carrier', header: 'Carrier', sortable: true },
    { key: 'origin', header: 'Origin', sortable: true, render: (row) => <span className="ui-text-sm-muted"><MapPin size={12} /> {row.origin}</span> },
    { key: 'destination', header: 'Destination', render: (row) => <span className="ui-text-sm-muted"><MapPin size={12} /> {row.destination}</span> },
    { key: 'eta', header: 'ETA', sortable: true, render: (row) => new Date(row.eta).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'lastEvent', header: 'Last Event', render: (row) => <span className="ui-text-xs-muted">{row.lastEvent}</span> },
    {
      key: 'daysInTransit', header: 'Days in Transit', sortable: true,
      render: (row) => (
        <span style={{ color: isAtRisk(row) ? 'var(--danger-600)' : 'var(--neutral-600)', fontWeight: isAtRisk(row) ? 600 : 400 }}>
          {row.daysInTransit}d
        </span>
      ),
    },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="supply-chain.containers.read">
    <div className="ui-stack-6">
      <PageHeader title="Container Tracking" description="Monitor container shipments across global trade lanes"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Containers' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Track New Container</Button>}
      />

      {containers.filter(isAtRisk).length > 0 && (
        <Card style={{ border: '1px solid var(--danger-300)', background: 'var(--danger-50)' }}>
          <div className="ui-flex ui-gap-2 ui-items-center" style={{ color: 'var(--danger-700)', fontWeight: 600, fontSize: '0.85rem' }}>
            <Anchor size={16} />
            {containers.filter(isAtRisk).length} at-risk container(s) overdue — review immediately
          </div>
        </Card>
      )}

      <Card padding="none">
        <DataTable columns={columns} data={containers} rowKey={r => r.id}
          onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
          emptyTitle="No containers" emptyMessage="Start tracking your first container." emptyIcon={<Box size={48} />} />
      </Card>

      {expandedId && (() => {
        const c = containers.find((x) => x.id === expandedId);
        if (!c || !c.events?.length) return null;
        return (
          <Card key={c.id}>
            <div className="ui-stack-3">
              <div className="ui-flex ui-gap-2 ui-items-center">
                <Clock size={16} className="ui-text-secondary" />
                <h4 className="ui-heading-sm">Timeline — {c.containerNumber}</h4>
              </div>
              <div className="ui-stack-2">
                {c.events.map((ev, i) => (
                  <div key={i} className="ui-flex ui-gap-3" style={{ padding: '0.5rem 0', borderLeft: '2px solid var(--neutral-200)', paddingLeft: '1rem', marginLeft: '0.25rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', marginLeft: '-1.35rem', marginTop: '0.35rem', flexShrink: 0 }} />
                    <div className="ui-flex-1">
                      <div className="ui-text-sm-bold">{ev.event}</div>
                      <div className="ui-text-xs-muted">{ev.location}</div>
                    </div>
                    <div className="ui-text-xs-muted">{new Date(ev.timestamp).toLocaleString()}</div>
                    <StatusBadge status={ev.status} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })()}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Track New Container" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={saving}>{saving ? 'Saving...' : 'Start Tracking'}</Button></>}>
        <form onSubmit={handleCreate} className="ui-stack-4">
          <TextField label="Container #" required placeholder="MSCU-1234567" value={form.containerNumber} onChange={e => setForm({ ...form, containerNumber: e.target.value })} />
          <TextField label="Carrier" placeholder="Maersk" value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} />
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Origin" placeholder="Shanghai" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} />
            <TextField label="Destination" placeholder="Los Angeles" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
          </div>
          <TextField label="ETA" type="date" value={form.eta} onChange={e => setForm({ ...form, eta: e.target.value })} />
        </form>
      </Modal>
    </div>
    </RouteGuard>
  );
}
