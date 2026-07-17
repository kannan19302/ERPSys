'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Users, HardDrive, Plus, Minus, X, Check, Loader2, Receipt } from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxStorageGb: number;
}

interface Subscription {
  id: string;
  plan: Plan;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  currentSeats: number;
  usedUsers: number;
  usedStorageGb: number;
  currentPeriodEnd: string;
}

interface BillingRecord {
  id: string;
  type: 'INVOICE' | 'PAYMENT' | 'REFUND' | 'CREDIT';
  amount: number;
  currency: string;
  description: string;
  date: string;
}

export default function SubscriptionPage() {
  const client = useApiClient();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [planModal, setPlanModal] = useState(false);
  const [seatCount, setSeatCount] = useState(0);
  const [seatSaving, setSeatSaving] = useState(false);
  const [changingPlan, setChangingPlan] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sub, pl, bl] = await Promise.all([
        client.get<Subscription>('/admin/subscription/current'),
        client.get<Plan[]>('/admin/subscription/plans'),
        client.get<BillingRecord[]>('/admin/subscription/billing-history'),
      ]);
      setSubscription(sub);
      setPlans(pl);
      setBilling(bl);
      setSeatCount(sub.currentSeats);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChangePlan = async (planId: string) => {
    setChangingPlan(planId);
    try {
      await client.post('/admin/subscription/change-plan', { planId });
      setPlanModal(false);
      await fetchAll();
    } catch {
    } finally {
      setChangingPlan('');
    }
  };

  const handleUpdateSeats = async () => {
    setSeatSaving(true);
    try {
      await client.post('/admin/subscription/seats', { seats: seatCount });
      await fetchAll();
    } catch {
    } finally {
      setSeatSaving(false);
    }
  };

  const statusColor = (s: string) => {
    const m: Record<string, string> = { ACTIVE: 'var(--color-success)', TRIALING: 'var(--color-info)', PAST_DUE: 'var(--color-warning)', CANCELED: 'var(--color-danger)' };
    return m[s] || 'var(--color-text-tertiary)';
  };

  const billingBadgeColor = (t: string) => {
    const m: Record<string, string> = { INVOICE: 'var(--color-info)', PAYMENT: 'var(--color-success)', REFUND: 'var(--color-warning)', CREDIT: 'var(--color-primary)' };
    return m[t] || 'var(--color-text-tertiary)';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={24} className={styles.spinner} />
      </div>
    );
  }

  const sub = subscription;

  return (
    <RouteGuard permission="settings.subscription.read">
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <CreditCard size={28} className="ui-text-primary" />
        <h1 className={styles.title}>License &amp; Subscription</h1>
      </div>

      {sub && (
        <>
          {/* Current Plan Card */}
          <div className={styles.planCard}>
            <div>
              <div className={styles.planLabel}>Current Plan</div>
              <div className={styles.planName}>{sub.plan.name}</div>
              <div className="ui-text-sm-muted">
                ${sub.plan.price}/{sub.plan.interval === 'monthly' ? 'mo' : 'yr'} &middot; Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </div>
            </div>
            <div className="ui-hstack-3">
              <span className={styles.statusBadge} style={{ background: statusColor(sub.status) }}>{sub.status}</span>
              <button onClick={() => setPlanModal(true)} className={styles.primaryButton}>Change Plan</button>
            </div>
          </div>

          {/* Usage Meters */}
          <div className={styles.usageGrid}>
            {[
              { label: 'Users', icon: <Users size={18} />, used: sub.usedUsers, max: sub.plan.maxUsers, unit: '' },
              { label: 'Storage', icon: <HardDrive size={18} />, used: sub.usedStorageGb, max: sub.plan.maxStorageGb, unit: ' GB' },
            ].map(m => {
              const pct = m.max > 0 ? Math.min((m.used / m.max) * 100, 100) : 0;
              const barColor = pct > 90 ? 'var(--color-danger)' : pct > 70 ? 'var(--color-warning)' : 'var(--color-success)';
              return (
                <div key={m.label} className={styles.usageCard}>
                  <div className={styles.usageHeader}>
                    <span className="ui-text-primary">{m.icon}</span>
                    <span className={styles.usageLabel}>{m.label}</span>
                    <span className={styles.usageAmount}>{m.used}{m.unit} / {m.max}{m.unit}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressValue} style={{ background: barColor, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat Management */}
          <div className={styles.seatCard}>
            <div className={styles.sectionTitle}>Seat Management</div>
            <div className="ui-hstack-3">
              <span className="ui-text-sm-muted">Current seats:</span>
              <button onClick={() => setSeatCount(Math.max(1, seatCount - 1))} className={styles.seatControl}><Minus size={14} /></button>
              <span className={styles.seatCount}>{seatCount}</span>
              <button onClick={() => setSeatCount(seatCount + 1)} className={styles.seatControl}><Plus size={14} /></button>
              <button onClick={handleUpdateSeats} disabled={seatSaving || seatCount === sub.currentSeats} className={styles.updateSeats}>
                {seatSaving ? 'Saving...' : 'Update Seats'}
              </button>
            </div>
          </div>

          {/* Billing History */}
          <div className={styles.billingCard}>
            <div className={styles.billingHeader}>
              <Receipt size={18} className="ui-text-primary" />
              <span className={styles.sectionTitle}>Billing History</span>
            </div>
            <ListPageTemplate
              columns={[
                { key: 'type', header: 'Type', render: (v) => <span className={styles.billingBadge} style={{ background: billingBadgeColor(String(v)) }}>{String(v)}</span> },
                { key: 'amount', header: 'Amount', render: (v) => <span className={styles.amount}>${Number(v).toFixed(2)}</span> },
                { key: 'currency', header: 'Currency' },
                { key: 'description', header: 'Description' },
                { key: 'date', header: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
              ] as ListColumn[]}
              data={billing as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No billing records"
              emptyDescription="No billing records."
            />
          </div>
        </>
      )}

      {/* Plan Modal */}
      {planModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="subscription-modal-title">
            <div className={styles.modalHeader}>
              <h2 id="subscription-modal-title" className={styles.modalTitle}>Compare Plans</h2>
              <button onClick={() => setPlanModal(false)} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
            </div>
            <div className={styles.planGrid} style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
              {plans.map(p => {
                const isCurrent = sub?.plan.id === p.id;
                return (
                  <div key={p.id} className={`${styles.planOption} ${isCurrent ? styles.currentPlan : ''}`}>
                    {isCurrent && <div className={styles.currentLabel}>Current</div>}
                    <div className={styles.optionName}>{p.name}</div>
                    <div className={styles.optionPrice}>
                      ${p.price}<span className={styles.optionInterval}>/{p.interval === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    <div className={styles.optionLimits}>{p.maxUsers} users &middot; {p.maxStorageGb} GB</div>
                    <ul className={styles.featureList}>
                      {p.features.map(f => (
                        <li key={f} className={styles.featureItem}>
                          <Check size={12} className={styles.featureCheck} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => !isCurrent && handleChangePlan(p.id)}
                      disabled={isCurrent || changingPlan === p.id}
                      className={`${styles.selectPlan} ${isCurrent ? styles.selectPlanCurrent : ''}`}
                    >
                      {changingPlan === p.id ? 'Switching...' : isCurrent ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
