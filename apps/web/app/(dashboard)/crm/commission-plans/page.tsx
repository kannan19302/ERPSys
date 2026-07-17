'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { DollarSign, Plus, X, Calculator, CheckCircle2, CreditCard } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';

interface Tier {
  id: string;
  minAttainmentPct: number | string;
  maxAttainmentPct: number | string | null;
  commissionRate: number | string;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  tiers: Tier[];
  _count?: { payouts: number; spiffs: number };
}

interface Payout {
  id: string;
  userId: string;
  userName: string;
  period: string;
  quotaAmount: number | string;
  attainedAmount: number | string;
  attainmentPct: number | string;
  tieredCommission: number | string;
  spiffBonus: number | string;
  totalPayout: number | string;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  plan?: { name: string };
}

export default function CommissionPlansPage() {
  const [tab, setTab] = useState<'plans' | 'payouts'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [tierModalPlanId, setTierModalPlanId] = useState<string | null>(null);
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', description: '', effectiveStart: new Date().toISOString().slice(0, 10) });
  const [tierForm, setTierForm] = useState({ minAttainmentPct: 0, maxAttainmentPct: '', commissionRate: 5 });
  const [calcForm, setCalcForm] = useState({ planId: '', period: '' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, po] = await Promise.all([
        apiGet<Plan[]>('/crm/commission-plans'),
        apiGet<Payout[]>('/crm/commission-plans/payouts/all'),
      ]);
      setPlans(Array.isArray(p) ? p : []);
      setPayouts(Array.isArray(po) ? po : []);
    } catch (err) {
      toast.error('Could not load commission plans', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const createPlan = async () => {
    setBusy(true);
    try {
      await apiPost('/crm/commission-plans', planForm);
      toast.success('Commission plan created');
      setPlanModalOpen(false);
      setPlanForm({ name: '', description: '', effectiveStart: new Date().toISOString().slice(0, 10) });
      await load();
    } catch (err) {
      toast.error('Could not create plan', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const addTier = async () => {
    if (!tierModalPlanId) return;
    setBusy(true);
    try {
      await apiPost(`/crm/commission-plans/${tierModalPlanId}/tiers`, {
        minAttainmentPct: tierForm.minAttainmentPct,
        maxAttainmentPct: tierForm.maxAttainmentPct === '' ? undefined : Number(tierForm.maxAttainmentPct),
        commissionRate: tierForm.commissionRate,
      });
      toast.success('Accelerator tier added');
      setTierModalPlanId(null);
      setTierForm({ minAttainmentPct: 0, maxAttainmentPct: '', commissionRate: 5 });
      await load();
    } catch (err) {
      toast.error('Could not add tier', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const calculatePayouts = async () => {
    setBusy(true);
    try {
      const results = await apiPost<Payout[]>('/crm/commission-plans/calculate-payouts', calcForm);
      toast.success('Payouts calculated', `${results.length} rep payout(s) computed for ${calcForm.period}`);
      setCalcModalOpen(false);
      setTab('payouts');
      await load();
    } catch (err) {
      toast.error('Calculation failed', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const approvePayout = async (id: string) => {
    try {
      await apiPost(`/crm/commission-plans/payouts/${id}/approve`, {});
      toast.success('Payout approved');
      await load();
    } catch (err) {
      toast.error('Could not approve payout', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const markPaid = async (id: string) => {
    try {
      await apiPost(`/crm/commission-plans/payouts/${id}/mark-paid`, {});
      toast.success('Payout marked paid');
      await load();
    } catch (err) {
      toast.error('Could not mark paid', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const planColumns: Column<Plan>[] = [
    { key: 'name', header: 'Plan', render: (p) => <strong>{p.name}</strong> },
    { key: 'tiers', header: 'Accelerator Tiers', render: (p) => (
      <div className={styles.p20}>
        {p.tiers.length === 0 ? <span className="ui-text-muted">None yet</span> : p.tiers.map((t) => (
          <Badge key={t.id} variant="default">{Number(t.minAttainmentPct)}–{t.maxAttainmentPct ? Number(t.maxAttainmentPct) : '∞'}% → {Number(t.commissionRate)}%</Badge>
        ))}
      </div>
    ) },
    { key: 'spiffs', header: 'SPIFFs', align: 'right', render: (p) => p._count?.spiffs ?? 0 },
    { key: 'payouts', header: 'Payouts', align: 'right', render: (p) => p._count?.payouts ?? 0 },
    { key: 'isActive', header: 'Status', render: (p) => <Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => (
      <ProtectedComponent permission="crm.commission.manage">
        <Button variant="secondary" onClick={() => setTierModalPlanId(p.id)}>Add Tier</Button>
      </ProtectedComponent>
    ) },
  ];

  const payoutColumns: Column<Payout>[] = [
    { key: 'userName', header: 'Rep' },
    { key: 'plan', header: 'Plan', render: (p) => p.plan?.name ?? '—' },
    { key: 'period', header: 'Period' },
    { key: 'attainmentPct', header: 'Attainment', align: 'right', render: (p) => `${Number(p.attainmentPct).toFixed(1)}%` },
    { key: 'tieredCommission', header: 'Tiered Commission', align: 'right', render: (p) => `$${Number(p.tieredCommission).toLocaleString()}` },
    { key: 'spiffBonus', header: 'SPIFF Bonus', align: 'right', render: (p) => `$${Number(p.spiffBonus).toLocaleString()}` },
    { key: 'totalPayout', header: 'Total', align: 'right', render: (p) => <strong>${Number(p.totalPayout).toLocaleString()}</strong> },
    { key: 'status', header: 'Status', render: (p) => <Badge variant={p.status === 'PAID' ? 'success' : p.status === 'APPROVED' ? 'info' : 'default'}>{p.status}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => (
      <ProtectedComponent permission="crm.commission.manage">
        <div className="ui-flex-end ui-gap-2">
          {p.status === 'DRAFT' && <Button variant="secondary" onClick={() => approvePayout(p.id)} className="ui-flex ui-items-center ui-gap-1"><CheckCircle2 size={14} /> Approve</Button>}
          {p.status === 'APPROVED' && <Button variant="primary" onClick={() => markPaid(p.id)} className="ui-flex ui-items-center ui-gap-1"><CreditCard size={14} /> Mark Paid</Button>}
        </div>
      </ProtectedComponent>
    ) },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Commission Plan Automation"
        description="Quota-attainment accelerator tiers and SPIFF bonuses — deepens the existing per-deal commission rules with Xactly/CaptivateIQ-style plan automation."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Commission Plans' }]}
        actions={
          <ProtectedComponent permission="crm.commission.manage">
            <div className="ui-flex ui-gap-2">
              <Button variant="secondary" onClick={() => setCalcModalOpen(true)} className="ui-hstack-2">
                <Calculator size={16} /> Calculate Payouts
              </Button>
              <Button variant="primary" onClick={() => setPlanModalOpen(true)} className="ui-hstack-2">
                <Plus size={16} /> New Plan
              </Button>
            </div>
          </ProtectedComponent>
        }
      />

      <div className={styles.p21}>
        {(['plans', 'payouts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: tab === t ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s1}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="ui-center-pad"><Spinner size="lg" /></div>
        ) : tab === 'plans' ? (
          plans.length === 0 ? (
            <div className="ui-empty-state">
              <DollarSign size={48} className="ui-hr-faded" />
              <div className="font-semibold">No Commission Plans</div>
              <div className="text-sm">Create a plan and add attainment-based accelerator tiers.</div>
            </div>
          ) : (
            <DataTable<Plan> columns={planColumns} data={plans} rowKey={(p) => p.id} />
          )
        ) : payouts.length === 0 ? (
          <div className="ui-empty-state">
            <Calculator size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Payouts Calculated Yet</div>
          </div>
        ) : (
          <DataTable<Payout> columns={payoutColumns} data={payouts} rowKey={(p) => p.id} />
        )}
      </Card>

      {planModalOpen && (
        <div className={styles.p22}>
          <Card>
            <div className={styles.p23}>
              <div className="ui-flex-between">
                <h3 className="m-0">New Commission Plan</h3>
                <button onClick={() => setPlanModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
              </div>
              <input placeholder="Plan name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="p-2" />
              <textarea placeholder="Description (optional)" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} className="p-2" />
              <label className="text-sm">Effective start
                <input type="date" value={planForm.effectiveStart} onChange={(e) => setPlanForm({ ...planForm, effectiveStart: e.target.value })} className={styles.p24} />
              </label>
              <Button variant="primary" onClick={createPlan} disabled={busy || !planForm.name}>Create Plan</Button>
            </div>
          </Card>
        </div>
      )}

      {tierModalPlanId && (
        <div className={styles.p25}>
          <Card>
            <div className={styles.p26}>
              <div className="ui-flex-between">
                <h3 className="m-0">Add Accelerator Tier</h3>
                <button onClick={() => setTierModalPlanId(null)} className="ui-btn-icon"><X size={18} /></button>
              </div>
              <label className="text-sm">Min attainment %
                <input type="number" value={tierForm.minAttainmentPct} onChange={(e) => setTierForm({ ...tierForm, minAttainmentPct: Number(e.target.value) })} className={styles.p27} />
              </label>
              <label className="text-sm">Max attainment % (blank = uncapped)
                <input type="number" value={tierForm.maxAttainmentPct} onChange={(e) => setTierForm({ ...tierForm, maxAttainmentPct: e.target.value })} className={styles.p28} />
              </label>
              <label className="text-sm">Commission rate %
                <input type="number" value={tierForm.commissionRate} onChange={(e) => setTierForm({ ...tierForm, commissionRate: Number(e.target.value) })} className={styles.p29} />
              </label>
              <Button variant="primary" onClick={addTier} disabled={busy}>Add Tier</Button>
            </div>
          </Card>
        </div>
      )}

      {calcModalOpen && (
        <div className={styles.p210}>
          <Card>
            <div className={styles.p211}>
              <div className="ui-flex-between">
                <h3 className="m-0">Calculate Payouts</h3>
                <button onClick={() => setCalcModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
              </div>
              <select value={calcForm.planId} onChange={(e) => setCalcForm({ ...calcForm, planId: e.target.value })} className="p-2">
                <option value="">Select a plan…</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input placeholder="Period (e.g. 2026-Q3)" value={calcForm.period} onChange={(e) => setCalcForm({ ...calcForm, period: e.target.value })} className="p-2" />
              <Button variant="primary" onClick={calculatePayouts} disabled={busy || !calcForm.planId || !calcForm.period}>Calculate</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
