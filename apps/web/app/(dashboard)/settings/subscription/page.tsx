'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Users, HardDrive, Plus, Minus, X, Check, Loader2, Receipt } from 'lucide-react';

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

const API_BASE = '/api/v1/admin/subscription';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export default function SubscriptionPage() {
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
        apiFetch<Subscription>('/current'),
        apiFetch<Plan[]>('/plans'),
        apiFetch<BillingRecord[]>('/billing-history'),
      ]);
      setSubscription(sub);
      setPlans(pl);
      setBilling(bl);
      setSeatCount(sub.currentSeats);
    } catch (e) {
      console.error('Error fetching subscription data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChangePlan = async (planId: string) => {
    setChangingPlan(planId);
    try {
      await apiFetch('/change-plan', { method: 'POST', body: JSON.stringify({ planId }) });
      setPlanModal(false);
      await fetchAll();
    } catch (e) {
      console.error('Change plan error', e);
    } finally {
      setChangingPlan('');
    }
  };

  const handleUpdateSeats = async () => {
    setSeatSaving(true);
    try {
      await apiFetch('/seats', { method: 'POST', body: JSON.stringify({ seats: seatCount }) });
      await fetchAll();
    } catch (e) {
      console.error('Update seats error', e);
    } finally {
      setSeatSaving(false);
    }
  };

  const statusColor = (s: string) => {
    const m: Record<string, string> = { ACTIVE: '#10b981', TRIALING: '#3b82f6', PAST_DUE: '#f59e0b', CANCELED: '#ef4444' };
    return m[s] || '#6b7280';
  };

  const billingBadgeColor = (t: string) => {
    const m: Record<string, string> = { INVOICE: '#3b82f6', PAYMENT: '#10b981', REFUND: '#f59e0b', CREDIT: '#8b5cf6' };
    return m[t] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const sub = subscription;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <CreditCard size={28} style={{ color: 'var(--color-primary)' }} />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>License &amp; Subscription</h1>
      </div>

      {sub && (
        <>
          {/* Current Plan Card */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1)' }}>Current Plan</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{sub.plan.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                ${sub.plan.price}/{sub.plan.interval === 'monthly' ? 'mo' : 'yr'} &middot; Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ background: statusColor(sub.status), color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>{sub.status}</span>
              <button onClick={() => setPlanModal(true)} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Change Plan</button>
            </div>
          </div>

          {/* Usage Meters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            {[
              { label: 'Users', icon: <Users size={18} />, used: sub.usedUsers, max: sub.plan.maxUsers, unit: '' },
              { label: 'Storage', icon: <HardDrive size={18} />, used: sub.usedStorageGb, max: sub.plan.maxStorageGb, unit: ' GB' },
            ].map(m => {
              const pct = m.max > 0 ? Math.min((m.used / m.max) * 100, 100) : 0;
              const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
              return (
                <div key={m.label} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--color-primary)' }}>{m.icon}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{m.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{m.used}{m.unit} / {m.max}{m.unit}</span>
                  </div>
                  <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                    <div style={{ background: barColor, height: '100%', width: `${pct}%`, borderRadius: 'var(--radius-full)', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat Management */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>Seat Management</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Current seats:</span>
              <button onClick={() => setSeatCount(Math.max(1, seatCount - 1))} style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-primary)' }}><Minus size={14} /></button>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', minWidth: 40, textAlign: 'center' }}>{seatCount}</span>
              <button onClick={() => setSeatCount(seatCount + 1)} style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-primary)' }}><Plus size={14} /></button>
              <button onClick={handleUpdateSeats} disabled={seatSaving || seatCount === sub.currentSeats} style={{ background: seatCount === sub.currentSeats ? 'var(--color-bg-tertiary)' : 'var(--color-primary)', color: seatCount === sub.currentSeats ? 'var(--color-text-secondary)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: seatCount === sub.currentSeats ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginLeft: 'var(--space-2)' }}>
                {seatSaving ? 'Saving...' : 'Update Seats'}
              </button>
            </div>
          </div>

          {/* Billing History */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Receipt size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Billing History</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Type', 'Amount', 'Currency', 'Description', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {billing.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No billing records.</td></tr>
                ) : billing.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ background: billingBadgeColor(b.type), color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{b.type}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)', fontWeight: 'var(--weight-medium)' }}>${b.amount.toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{b.currency}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)' }}>{b.description}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{new Date(b.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Plan Modal */}
      {planModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: 800, maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>Compare Plans</h2>
              <button onClick={() => setPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: 'var(--space-4)' }}>
              {plans.map(p => {
                const isCurrent = sub?.plan.id === p.id;
                return (
                  <div key={p.id} style={{ border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center', position: 'relative' }}>
                    {isCurrent && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-xs)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)' }}>Current</div>}
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>
                      ${p.price}<span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-normal)', color: 'var(--color-text-secondary)' }}>/{p.interval === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>{p.maxUsers} users &middot; {p.maxStorageGb} GB</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4) 0', textAlign: 'left' }}>
                      {p.features.map(f => (
                        <li key={f} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          <Check size={12} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => !isCurrent && handleChangePlan(p.id)}
                      disabled={isCurrent || changingPlan === p.id}
                      style={{ width: '100%', background: isCurrent ? 'var(--color-bg-tertiary)' : 'var(--color-primary)', color: isCurrent ? 'var(--color-text-secondary)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: isCurrent ? 'default' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}
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
  );
}
