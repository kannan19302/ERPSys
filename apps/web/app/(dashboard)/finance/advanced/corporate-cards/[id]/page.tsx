/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField,
  Select, Tabs, ChangeHistory, ProtectedComponent,
} from '@unerp/ui';
import { Plus, Trash2, Snowflake, PlayCircle, TrendingUp, ShieldCheck, History, ArrowUpCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

interface CorporateCard { id: string; employeeId: string; provider: string; last4: string; nickname: string | null; isActive: boolean; isFrozen: boolean; }
interface SpendLimit { id: string; scopeType: string; scopeId: string | null; period: string; amountCap: string | number; currentSpend: string | number; isActive: boolean; breachCount: number; }
interface CategoryLimit { id: string; mccCategory: string; amountCap: string | number; currentSpend: string | number; period: string; isActive: boolean; breachCount: number; }
interface UtilizationEntry { id: string; period: string; spend: number; cap: number; utilizationPct: number; scopeType?: string; mccCategory?: string; }
interface Utilization { spendLimits: UtilizationEntry[]; categoryLimits: UtilizationEntry[]; }
interface AuditRow { id: string; action: string; oldValue: unknown; newValue: unknown; createdAt: string; changedByUserId: string | null; }

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'var(--color-danger)' : pct >= 80 ? 'var(--color-warning)' : 'var(--color-success)';
  return (
    <div style={{ width: '100%', height: 8, borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

export default function CorporateCardDetailPage() {
  const params = useParams();
  const cardId = params.id as string;

  const [tab, setTab] = useState('limits');
  const [card, setCard] = useState<CorporateCard | null>(null);
  const [spendLimits, setSpendLimits] = useState<SpendLimit[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [utilization, setUtilization] = useState<Utilization>({ spendLimits: [], categoryLimits: [] });
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [selectedLimitId, setSelectedLimitId] = useState<string | null>(null);

  const [limitModal, setLimitModal] = useState(false);
  const [scopeType, setScopeType] = useState('CARD');
  const [scopeId, setScopeId] = useState('');
  const [period, setPeriod] = useState('MONTHLY');
  const [amountCap, setAmountCap] = useState('');

  const [categoryModal, setCategoryModal] = useState(false);
  const [mccCategory, setMccCategory] = useState('TRAVEL');
  const [catAmountCap, setCatAmountCap] = useState('');
  const [catPeriod, setCatPeriod] = useState('MONTHLY');

  const [increaseModal, setIncreaseModal] = useState(false);
  const [increaseLimitId, setIncreaseLimitId] = useState<string | null>(null);
  const [requestedCap, setRequestedCap] = useState('');
  const [increaseReason, setIncreaseReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [cardsRes, limitsRes, catLimitsRes, utilRes] = await Promise.all([
        fetch(`${API_BASE}/corporate-cards`, { headers: authHeaders() }),
        fetch(`${API_BASE}/corporate-cards/${cardId}/limits`, { headers: authHeaders() }),
        fetch(`${API_BASE}/corporate-cards/${cardId}/category-limits`, { headers: authHeaders() }),
        fetch(`${API_BASE}/corporate-cards/${cardId}/utilization`, { headers: authHeaders() }),
      ]);
      const cards: CorporateCard[] = await cardsRes.json();
      setCard(cards.find((c) => c.id === cardId) || null);
      setSpendLimits(await limitsRes.json());
      setCategoryLimits(await catLimitsRes.json());
      setUtilization(await utilRes.json());
    } catch (e) {
      console.error('Failed to load corporate card data', e);
    }
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  const loadAudit = useCallback(async (limitId: string) => {
    setSelectedLimitId(limitId);
    const res = await fetch(`${API_BASE}/corporate-cards/${cardId}/limits/${limitId}/audit`, { headers: authHeaders() });
    setAuditRows(await res.json());
  }, [cardId]);

  const saveSpendLimit = async () => {
    await fetch(`${API_BASE}/corporate-cards/${cardId}/limits`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ scopeType, scopeId: scopeId || undefined, period, amountCap: Number(amountCap) }),
    });
    setLimitModal(false); setScopeId(''); setAmountCap('');
    await load();
  };

  const deleteSpendLimit = async (id: string) => {
    await fetch(`${API_BASE}/corporate-cards/${cardId}/limits/${id}`, { method: 'DELETE', headers: authHeaders() });
    await load();
  };

  const saveCategoryLimit = async () => {
    await fetch(`${API_BASE}/corporate-cards/${cardId}/category-limits`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ mccCategory, amountCap: Number(catAmountCap), period: catPeriod }),
    });
    setCategoryModal(false); setCatAmountCap('');
    await load();
  };

  const deleteCategoryLimit = async (id: string) => {
    await fetch(`${API_BASE}/corporate-cards/${cardId}/category-limits/${id}`, { method: 'DELETE', headers: authHeaders() });
    await load();
  };

  const toggleFreeze = async () => {
    const action = card?.isFrozen ? 'unfreeze' : 'freeze';
    await fetch(`${API_BASE}/corporate-cards/${cardId}/${action}`, { method: 'POST', headers: authHeaders() });
    await load();
  };

  const openIncreaseModal = (limitId: string, currentCap: number) => {
    setIncreaseLimitId(limitId);
    setRequestedCap(String(currentCap));
    setIncreaseModal(true);
  };

  const submitIncreaseRequest = async () => {
    if (!increaseLimitId) return;
    await fetch(`${API_BASE}/corporate-cards/${cardId}/limits/${increaseLimitId}/request-increase`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ requestedCap: Number(requestedCap), reason: increaseReason || undefined }),
    });
    setIncreaseModal(false); setIncreaseReason(''); setIncreaseLimitId(null);
    await load();
  };

  const limitColumns: Column<SpendLimit>[] = [
    { key: 'scope', header: 'Scope', render: (r) => <Badge variant="info">{r.scopeType}{r.scopeId ? `: ${r.scopeId}` : ''}</Badge> },
    { key: 'period', header: 'Period', render: (r) => r.period },
    { key: 'cap', header: 'Cap', align: 'right' as const, render: (r) => `$${Number(r.amountCap).toFixed(2)}` },
    { key: 'spend', header: 'Current Spend', align: 'right' as const, render: (r) => `$${Number(r.currentSpend).toFixed(2)}` },
    { key: 'breaches', header: 'Breaches', render: (r) => r.breachCount > 0 ? <Badge variant="danger">{r.breachCount}</Badge> : <Badge variant="default">0</Badge> },
    { key: 'active', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '', align: 'right' as const, render: (r) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <ProtectedComponent permission="finance.corporate-card-limit.request-increase">
            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openIncreaseModal(r.id, Number(r.amountCap)); }}><ArrowUpCircle size={13} /></Button>
          </ProtectedComponent>
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); loadAudit(r.id); setTab('audit'); }}><History size={13} /></Button>
          <ProtectedComponent permission="finance.corporate-card-limit.delete">
            <Button variant="danger" onClick={(e) => { e.stopPropagation(); deleteSpendLimit(r.id); }}><Trash2 size={13} /></Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];

  const categoryColumns: Column<CategoryLimit>[] = [
    { key: 'category', header: 'Category', render: (r) => <Badge variant="info">{r.mccCategory}</Badge> },
    { key: 'period', header: 'Period', render: (r) => r.period },
    { key: 'cap', header: 'Cap', align: 'right' as const, render: (r) => `$${Number(r.amountCap).toFixed(2)}` },
    { key: 'spend', header: 'Current Spend', align: 'right' as const, render: (r) => `$${Number(r.currentSpend).toFixed(2)}` },
    { key: 'breaches', header: 'Breaches', render: (r) => r.breachCount > 0 ? <Badge variant="danger">{r.breachCount}</Badge> : <Badge variant="default">0</Badge> },
    {
      key: 'actions', header: '', align: 'right' as const, render: (r) => (
        <ProtectedComponent permission="finance.corporate-card-limit.update">
          <Button variant="danger" onClick={(e) => { e.stopPropagation(); deleteCategoryLimit(r.id); }}><Trash2 size={13} /></Button>
        </ProtectedComponent>
      ),
    },
  ];

  const auditColumns: Column<AuditRow>[] = [
    { key: 'action', header: 'Action', render: (r) => <Badge variant={r.action === 'BREACH' ? 'danger' : 'info'}>{r.action}</Badge> },
    { key: 'user', header: 'Changed By', render: (r) => r.changedByUserId || 'system' },
    { key: 'date', header: 'When', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title={card ? `Card •••• ${card.last4} (${card.provider})` : 'Corporate Card'}
        description="Spend limits, category limits, utilization, and freeze controls"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Advanced', href: '/finance/advanced' },
          { label: 'Expense Policies', href: '/finance/advanced/expense-policies' },
          { label: 'Card Detail' },
        ]}
        actions={card ? (
          <ProtectedComponent permission="finance.corporate-card.freeze">
            <Button variant={card.isFrozen ? 'primary' : 'danger'} onClick={toggleFreeze}>
              {card.isFrozen ? <PlayCircle size={14} style={{ marginRight: 6 }} /> : <Snowflake size={14} style={{ marginRight: 6 }} />}
              {card.isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
            </Button>
          </ProtectedComponent>
        ) : undefined}
      />

      {card?.isFrozen && (
        <Card padding="md" style={{ borderLeft: '3px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-danger)' }}>
            <Snowflake size={16} /> This card is frozen. Transactions will be declined until unfrozen.
          </div>
        </Card>
      )}

      <Tabs tabs={[
        { key: 'limits', label: 'Spend Limits' },
        { key: 'categories', label: 'Category Limits' },
        { key: 'utilization', label: 'Utilization' },
        { key: 'audit', label: 'Audit Trail' },
      ]} value={tab} onChange={setTab} />

      {tab === 'limits' && (
        <Card padding="none">
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <ProtectedComponent permission="finance.corporate-card-limit.create">
              <Button variant="primary" onClick={() => setLimitModal(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Spend Limit</Button>
            </ProtectedComponent>
          </div>
          <DataTable columns={limitColumns} data={spendLimits} rowKey={(r) => r.id} emptyTitle="No spend limits" emptyMessage="Add a card, employee, or department spend limit." emptyIcon={<ShieldCheck size={48} />} />
        </Card>
      )}

      {tab === 'categories' && (
        <Card padding="none">
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <ProtectedComponent permission="finance.corporate-card-limit.update">
              <Button variant="primary" onClick={() => setCategoryModal(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Category Limit</Button>
            </ProtectedComponent>
          </div>
          <DataTable columns={categoryColumns} data={categoryLimits} rowKey={(r) => r.id} emptyTitle="No category limits" emptyMessage="Add an MCC-category spending cap for this card." emptyIcon={<ShieldCheck size={48} />} />
        </Card>
      )}

      {tab === 'utilization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card padding="md">
            <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>Spend Limits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {utilization.spendLimits.length === 0 && <div style={{ color: 'var(--color-text-secondary)' }}>No active spend limits.</div>}
              {utilization.spendLimits.map((u) => (
                <div key={u.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                    <span>{u.scopeType} · {u.period}</span>
                    <span>${u.spend.toFixed(2)} / ${u.cap.toFixed(2)} ({u.utilizationPct}%)</span>
                  </div>
                  <ProgressBar pct={u.utilizationPct} />
                </div>
              ))}
            </div>
          </Card>
          <Card padding="md">
            <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>Category Limits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {utilization.categoryLimits.length === 0 && <div style={{ color: 'var(--color-text-secondary)' }}>No active category limits.</div>}
              {utilization.categoryLimits.map((u) => (
                <div key={u.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                    <span>{u.mccCategory} · {u.period}</span>
                    <span>${u.spend.toFixed(2)} / ${u.cap.toFixed(2)} ({u.utilizationPct}%)</span>
                  </div>
                  <ProgressBar pct={u.utilizationPct} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'audit' && (
        <Card padding="none">
          <div style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {selectedLimitId ? `Showing audit trail for limit ${selectedLimitId}` : 'Select a limit row (History icon) to view its audit trail.'}
          </div>
          <DataTable columns={auditColumns} data={auditRows} rowKey={(r) => r.id} emptyTitle="No audit entries" emptyMessage="No changes recorded yet for this limit." emptyIcon={<TrendingUp size={48} />} />
        </Card>
      )}

      <Modal open={limitModal} onClose={() => setLimitModal(false)} title="Add Spend Limit" size="sm"
        footer={<><Button variant="secondary" onClick={() => setLimitModal(false)}>Cancel</Button><Button variant="primary" onClick={saveSpendLimit}>Save</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField label="Scope Type">
            <Select value={scopeType} onChange={(e) => setScopeType(e.target.value)}>
              <option value="CARD">Card</option><option value="EMPLOYEE">Employee</option><option value="DEPARTMENT">Department</option>
            </Select>
          </FormField>
          {scopeType !== 'CARD' && <TextField label="Scope ID" value={scopeId} onChange={(e) => setScopeId(e.target.value)} placeholder={`${scopeType} ID`} />}
          <FormField label="Period">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
            </Select>
          </FormField>
          <TextField label="Amount Cap" type="number" required value={amountCap} onChange={(e) => setAmountCap(e.target.value)} />
        </div>
      </Modal>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title="Add Category Limit" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCategoryModal(false)}>Cancel</Button><Button variant="primary" onClick={saveCategoryLimit}>Save</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField label="MCC Category">
            <Select value={mccCategory} onChange={(e) => setMccCategory(e.target.value)}>
              <option value="TRAVEL">Travel</option><option value="MEALS">Meals</option><option value="OFFICE">Office</option>
              <option value="UTILITIES">Utilities</option><option value="SOFTWARE">Software</option><option value="OTHER">Other</option>
            </Select>
          </FormField>
          <FormField label="Period">
            <Select value={catPeriod} onChange={(e) => setCatPeriod(e.target.value)}>
              <option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
            </Select>
          </FormField>
          <TextField label="Amount Cap" type="number" required value={catAmountCap} onChange={(e) => setCatAmountCap(e.target.value)} />
        </div>
      </Modal>

      <Modal open={increaseModal} onClose={() => setIncreaseModal(false)} title="Request Limit Increase" size="sm"
        footer={<><Button variant="secondary" onClick={() => setIncreaseModal(false)}>Cancel</Button><Button variant="primary" onClick={submitIncreaseRequest}>Submit Request</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <TextField label="Requested Cap" type="number" required value={requestedCap} onChange={(e) => setRequestedCap(e.target.value)} />
          <TextField label="Reason (optional)" value={increaseReason} onChange={(e) => setIncreaseReason(e.target.value)} />
        </div>
      </Modal>

      <ChangeHistory entityType="CardSpendLimit" entityId={cardId} />
    </div>
  );
}
