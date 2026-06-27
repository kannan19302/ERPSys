'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { DollarSign, Plus, RefreshCw, TrendingUp, Globe, ArrowRight } from 'lucide-react';

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ fromCurrency: 'USD', toCurrency: 'EUR', rate: '', effectiveDate: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/v1/advanced-finance/exchange-rates', {
          headers: { Authorization: `Bearer ${getToken() || ''}` },
        });
        if (res.ok) setRates(await res.json());
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rate || !form.effectiveDate) return;
    setCreating(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...form, rate: parseFloat(form.rate) }),
      });
      if (res.ok) { setCreateOpen(false); const data = await res.json(); setRates(prev => [data, ...prev]); }
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const columns: Column<ExchangeRate>[] = [
    {
      key: 'pair', header: 'Currency Pair',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge variant="info">{row.fromCurrency}</Badge>
          <ArrowRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
          <Badge variant="info">{row.toCurrency}</Badge>
        </div>
      ),
    },
    { key: 'rate', header: 'Rate', render: (row) => <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{row.rate.toFixed(6)}</span> },
    { key: 'effectiveDate', header: 'Effective Date', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.effectiveDate}</span> },
    { key: 'source', header: 'Source', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.source || 'Manual'}</span> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Multi-Currency & Exchange Rates" description="Manage exchange rates for multi-currency transactions and revaluation"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Exchange Rates' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => {}}><RefreshCw size={14} style={{ marginRight: 6 }} /> Fetch Latest</Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Rate</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Currency Pairs" value={rates.length} icon={<Globe size={18} />} color="var(--color-primary)" />
        <KPICard title="Base Currency" value="USD" icon={<DollarSign size={18} />} color="var(--color-success)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={rates} loading={loading} rowKey={(r) => r.id}
          emptyTitle="No exchange rates" emptyMessage="Add your first currency exchange rate." emptyIcon={<Globe size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Exchange Rate" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Saving...' : 'Save Rate'}</Button></>}
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="From Currency" required>
              <Select value={form.fromCurrency} onChange={(e) => setForm({ ...form, fromCurrency: e.target.value })}>
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option><option value="JPY">JPY</option>
              </Select>
            </FormField>
            <FormField label="To Currency" required>
              <Select value={form.toCurrency} onChange={(e) => setForm({ ...form, toCurrency: e.target.value })}>
                <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="INR">INR</option><option value="JPY">JPY</option>
              </Select>
            </FormField>
          </div>
          <TextField label="Exchange Rate" type="number" step="0.000001" required placeholder="0.920000" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          <TextField label="Effective Date" type="date" required value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}
