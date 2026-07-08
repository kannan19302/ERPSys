/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, Tabs } from '@unerp/ui';
import { ShieldCheck, Plus, Car, CalendarClock, CreditCard, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

interface Policy { id: string; category: string; maxAmountPerItem: string | number | null; receiptRequiredAbove: string | number; isActive: boolean; }
interface MileageRate { id: string; ratePerMile: string | number; effectiveDate: string; endDate: string | null; notes: string | null; }
interface PerDiemRate { id: string; location: string; dailyRate: string | number; currency: string; isActive: boolean; }
interface CorporateCard { id: string; employeeId: string; provider: string; last4: string; nickname: string | null; isActive: boolean; }
interface CardTransaction { id: string; merchant: string; amount: string | number; transactionDate: string; status: string; card?: { last4: string; provider: string }; }

export default function ExpensePoliciesPage() {
  const [tab, setTab] = useState('policies');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [mileageRates, setMileageRates] = useState<MileageRate[]>([]);
  const [perDiemRates, setPerDiemRates] = useState<PerDiemRate[]>([]);
  const [cards, setCards] = useState<CorporateCard[]>([]);
  const [unmatched, setUnmatched] = useState<CardTransaction[]>([]);

  const [policyModal, setPolicyModal] = useState(false);
  const [pCategory, setPCategory] = useState('TRAVEL');
  const [pMax, setPMax] = useState('');
  const [pReceiptAbove, setPReceiptAbove] = useState('');

  const [mileageModal, setMileageModal] = useState(false);
  const [mRate, setMRate] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().substring(0, 10));

  const [perDiemModal, setPerDiemModal] = useState(false);
  const [dLocation, setDLocation] = useState('');
  const [dRate, setDRate] = useState('');

  const [cardModal, setCardModal] = useState(false);
  const [cEmployeeId, setCEmployeeId] = useState('');
  const [cProvider, setCProvider] = useState('VISA');
  const [cLast4, setCLast4] = useState('');

  const load = useCallback(async () => {
    try {
      const [pRes, mRes, dRes, cRes, uRes] = await Promise.all([
        fetch(`${API_BASE}/expense-policies`, { headers: authHeaders() }),
        fetch(`${API_BASE}/mileage-rates`, { headers: authHeaders() }),
        fetch(`${API_BASE}/per-diem-rates`, { headers: authHeaders() }),
        fetch(`${API_BASE}/corporate-cards`, { headers: authHeaders() }),
        fetch(`${API_BASE}/corporate-card-transactions/unmatched`, { headers: authHeaders() }),
      ]);
      setPolicies(await pRes.json());
      setMileageRates(await mRes.json());
      setPerDiemRates(await dRes.json());
      setCards(await cRes.json());
      setUnmatched(await uRes.json());
    } catch (e) {
      console.error('Failed to load expense policy data', e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePolicy = async () => {
    await fetch(`${API_BASE}/expense-policies`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ category: pCategory, maxAmountPerItem: pMax ? Number(pMax) : null, receiptRequiredAbove: pReceiptAbove ? Number(pReceiptAbove) : 0 }),
    });
    setPolicyModal(false); setPMax(''); setPReceiptAbove('');
    await load();
  };

  const deletePolicy = async (id: string) => {
    await fetch(`${API_BASE}/expense-policies/${id}`, { method: 'DELETE', headers: authHeaders() });
    await load();
  };

  const saveMileageRate = async () => {
    await fetch(`${API_BASE}/mileage-rates`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ ratePerMile: Number(mRate), effectiveDate: mDate }),
    });
    setMileageModal(false); setMRate('');
    await load();
  };

  const savePerDiemRate = async () => {
    await fetch(`${API_BASE}/per-diem-rates`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ location: dLocation, dailyRate: Number(dRate) }),
    });
    setPerDiemModal(false); setDLocation(''); setDRate('');
    await load();
  };

  const saveCard = async () => {
    await fetch(`${API_BASE}/corporate-cards`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ employeeId: cEmployeeId, provider: cProvider, last4: cLast4 }),
    });
    setCardModal(false); setCEmployeeId(''); setCLast4('');
    await load();
  };

  const ignoreTransaction = async (id: string) => {
    await fetch(`${API_BASE}/corporate-card-transactions/${id}/ignore`, { method: 'POST', headers: authHeaders() });
    await load();
  };

  const policyColumns: Column<Policy>[] = [
    { key: 'category', header: 'Category', render: (r) => <Badge variant="info">{r.category}</Badge> },
    { key: 'max', header: 'Max Per Item', render: (r) => r.maxAmountPerItem != null ? `$${Number(r.maxAmountPerItem).toFixed(2)}` : '—' },
    { key: 'receipt', header: 'Receipt Required Above', render: (r) => `$${Number(r.receiptRequiredAbove).toFixed(2)}` },
    { key: 'active', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (r) => <Button variant="danger" onClick={() => deletePolicy(r.id)}><Trash2 size={13} /></Button> },
  ];

  const mileageColumns: Column<MileageRate>[] = [
    { key: 'rate', header: 'Rate / Mile', render: (r) => `$${Number(r.ratePerMile).toFixed(4)}` },
    { key: 'effective', header: 'Effective From', render: (r) => new Date(r.effectiveDate).toLocaleDateString() },
    { key: 'end', header: 'Ends', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString() : '—' },
  ];

  const perDiemColumns: Column<PerDiemRate>[] = [
    { key: 'location', header: 'Location' },
    { key: 'rate', header: 'Daily Rate', render: (r) => `${r.currency} ${Number(r.dailyRate).toFixed(2)}` },
    { key: 'active', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const cardColumns: Column<CorporateCard>[] = [
    { key: 'provider', header: 'Provider', render: (r) => <Badge variant="info">{r.provider}</Badge> },
    { key: 'last4', header: 'Card', render: (r) => `•••• ${r.last4}` },
    { key: 'employee', header: 'Employee', render: (r) => r.employeeId },
    { key: 'active', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const txnColumns: Column<CardTransaction>[] = [
    { key: 'merchant', header: 'Merchant' },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (r) => `$${Number(r.amount).toFixed(2)}` },
    { key: 'date', header: 'Date', render: (r) => new Date(r.transactionDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (r) => <Badge variant="warning">{r.status}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (r) => <Button variant="secondary" onClick={() => ignoreTransaction(r.id)}>Ignore</Button> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Expense Policies & Rates" description="Category spending limits, mileage/per-diem rates, and corporate card feeds"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Expense Policies' }]}
      />

      <Tabs tabs={[
        { key: 'policies', label: 'Category Policies' },
        { key: 'mileage', label: 'Mileage Rates' },
        { key: 'perdiem', label: 'Per Diem Rates' },
        { key: 'cards', label: 'Corporate Cards' },
      ]} value={tab} onChange={setTab} />

      {tab === 'policies' && (
        <Card padding="none">
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setPolicyModal(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Policy</Button>
          </div>
          <DataTable columns={policyColumns} data={policies} rowKey={(r) => r.id} emptyTitle="No policies" emptyMessage="No category spending policies configured." emptyIcon={<ShieldCheck size={48} />} />
        </Card>
      )}

      {tab === 'mileage' && (
        <Card padding="none">
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setMileageModal(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Rate</Button>
          </div>
          <DataTable columns={mileageColumns} data={mileageRates} rowKey={(r) => r.id} emptyTitle="No mileage rates" emptyMessage="Configure a mileage reimbursement rate." emptyIcon={<Car size={48} />} />
        </Card>
      )}

      {tab === 'perdiem' && (
        <Card padding="none">
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setPerDiemModal(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Rate</Button>
          </div>
          <DataTable columns={perDiemColumns} data={perDiemRates} rowKey={(r) => r.id} emptyTitle="No per-diem rates" emptyMessage="Configure a per-diem daily rate for a location." emptyIcon={<CalendarClock size={48} />} />
        </Card>
      )}

      {tab === 'cards' && (
        <>
          <Card padding="none">
            <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setCardModal(true)}><Plus size={14} style={{ marginRight: 6 }} /> Register Card</Button>
            </div>
            <DataTable columns={cardColumns} data={cards} rowKey={(r) => r.id} emptyTitle="No corporate cards" emptyMessage="Register a corporate card to import transactions." emptyIcon={<CreditCard size={48} />} />
          </Card>
          <Card padding="none">
            <div style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>Unmatched Transactions</div>
            <DataTable columns={txnColumns} data={unmatched} rowKey={(r) => r.id} emptyTitle="Nothing unmatched" emptyMessage="All card transactions are matched or ignored." emptyIcon={<CreditCard size={48} />} />
          </Card>
        </>
      )}

      <Modal open={policyModal} onClose={() => setPolicyModal(false)} title="Add Category Policy" size="sm"
        footer={<><Button variant="secondary" onClick={() => setPolicyModal(false)}>Cancel</Button><Button variant="primary" onClick={savePolicy}>Save</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField label="Category">
            <Select value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
              <option value="TRAVEL">Travel</option><option value="MEALS">Meals</option>
              <option value="OFFICE">Office</option><option value="UTILITIES">Utilities</option>
              <option value="MILEAGE">Mileage</option><option value="PER_DIEM">Per Diem</option><option value="OTHER">Other</option>
            </Select>
          </FormField>
          <TextField label="Max Amount Per Item" type="number" value={pMax} onChange={(e) => setPMax(e.target.value)} />
          <TextField label="Receipt Required Above" type="number" value={pReceiptAbove} onChange={(e) => setPReceiptAbove(e.target.value)} />
        </div>
      </Modal>

      <Modal open={mileageModal} onClose={() => setMileageModal(false)} title="Add Mileage Rate" size="sm"
        footer={<><Button variant="secondary" onClick={() => setMileageModal(false)}>Cancel</Button><Button variant="primary" onClick={saveMileageRate}>Save</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <TextField label="Rate Per Mile" type="number" required value={mRate} onChange={(e) => setMRate(e.target.value)} />
          <TextField label="Effective Date" type="date" required value={mDate} onChange={(e) => setMDate(e.target.value)} />
        </div>
      </Modal>

      <Modal open={perDiemModal} onClose={() => setPerDiemModal(false)} title="Add Per Diem Rate" size="sm"
        footer={<><Button variant="secondary" onClick={() => setPerDiemModal(false)}>Cancel</Button><Button variant="primary" onClick={savePerDiemRate}>Save</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <TextField label="Location" required value={dLocation} onChange={(e) => setDLocation(e.target.value)} />
          <TextField label="Daily Rate" type="number" required value={dRate} onChange={(e) => setDRate(e.target.value)} />
        </div>
      </Modal>

      <Modal open={cardModal} onClose={() => setCardModal(false)} title="Register Corporate Card" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCardModal(false)}>Cancel</Button><Button variant="primary" onClick={saveCard}>Save</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <TextField label="Employee ID" required value={cEmployeeId} onChange={(e) => setCEmployeeId(e.target.value)} />
          <FormField label="Provider">
            <Select value={cProvider} onChange={(e) => setCProvider(e.target.value)}>
              <option value="VISA">Visa</option><option value="MASTERCARD">Mastercard</option><option value="AMEX">Amex</option><option value="OTHER">Other</option>
            </Select>
          </FormField>
          <TextField label="Last 4 Digits" required value={cLast4} onChange={(e) => setCLast4(e.target.value)} maxLength={4} />
        </div>
      </Modal>
    </div>
  );
}
