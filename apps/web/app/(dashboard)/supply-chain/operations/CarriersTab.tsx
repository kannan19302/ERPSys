'use client';
import styles from './operations.module.css';
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard, Spinner,
} from '@unerp/ui';
import { useApiClient, RouteGuard } from '@unerp/framework';
import { Truck, Plus, Star, DollarSign, Clock, Mail, Phone, ExternalLink } from 'lucide-react';

interface Carrier {
  id: string;
  code: string;
  name: string;
  trackingUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
}

export default function CarriersTab() {
  const client = useApiClient();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    trackingUrl: '',
    contactEmail: '',
    contactPhone: '',
  });

  const fetchCarriers = async () => {
    try {
      const data = await client.get<Carrier[] | { data?: Carrier[] }>('/supply-chain/carriers');
      setCarriers(Array.isArray(data) ? data : data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCarriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSaving(true);
    try {
      await client.post('/supply-chain/carriers', form);
      setCreateOpen(false);
      setForm({ code: '', name: '', trackingUrl: '', contactEmail: '', contactPhone: '' });
      fetchCarriers();
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  const columns: Column<Carrier>[] = [
    {
      key: 'name', header: 'Carrier',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.carrierIconWell}>
            <Truck size={18} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.name}</div>
            <div className="ui-text-xs-tertiary">Code: {row.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact', header: 'Contact',
      render: (row) => (
        <div className="ui-stack-1">
          {row.contactEmail && (
            <div className="ui-hstack-1 ui-items-center text-xs text-muted">
              <Mail size={12} className="mr-1" /> {row.contactEmail}
            </div>
          )}
          {row.contactPhone && (
            <div className="ui-hstack-1 ui-items-center text-xs text-muted">
              <Phone size={12} className="mr-1" /> {row.contactPhone}
            </div>
          )}
          {!row.contactEmail && !row.contactPhone && <span className="text-xs text-tertiary">—</span>}
        </div>
      ),
    },
    {
      key: 'trackingUrl', header: 'Tracking Link',
      render: (row) => row.trackingUrl ? (
        <a href={row.trackingUrl} target="_blank" rel="noopener noreferrer" className="ui-hstack-1 ui-items-center text-xs text-primary hover:underline">
          <ExternalLink size={12} className="mr-1" /> Open
        </a>
      ) : <span className="text-xs text-tertiary">—</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>,
    },
  ];

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="supply-chain.carrier.read">
      <div className="ui-stack-6">
        <div className="ui-flex-end">
          <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Carrier</Button>
        </div>

        <div className="ui-grid-auto">
          <KPICard title="Active Carriers" value={carriers.filter(c => c.isActive).length} icon={<Truck size={18} />} color="var(--color-primary)" />
          <KPICard title="Total Configured" value={carriers.length} icon={<Star size={18} />} color="var(--color-info)" />
        </div>

        <Card padding="none">
          <DataTable columns={columns} data={carriers} rowKey={r => r.id}
            emptyTitle="No carriers" emptyMessage="Add shipping carriers to manage your logistics network." emptyIcon={<Truck size={48} />} />
        </Card>

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Carrier" size="md"
          footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={saving}>Save Carrier</Button></>}>
          <div className="ui-stack-4">
            <TextField label="Carrier Code (Unique)" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="FEDEX" />
            <TextField label="Carrier Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="FedEx" />
            <TextField label="Tracking URL Format" value={form.trackingUrl} onChange={e => setForm({ ...form, trackingUrl: e.target.value })} placeholder="https://track.fedex.com/track/input?tracknum={trackingNumber}" />
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Contact Email" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} placeholder="business@carrier.com" />
              <TextField label="Contact Phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} placeholder="+1-800-000-0000" />
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
