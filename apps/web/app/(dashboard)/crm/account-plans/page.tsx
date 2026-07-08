'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge, useToast, Button, Input } from '@unerp/ui';
import { Shield, Activity, Plus, Layers } from 'lucide-react';
import { apiGet } from '../_components/api';

export default function AccountPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState({ customerId: '', name: '', objectives: '' });
  const [healthLog, setHealthLog] = useState({ customerId: '', score: '', status: 'GREEN', reason: '' });
  const [merge, setMerge] = useState({ sourceCustomerId: '', targetCustomerId: '' });
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [submittingHealth, setSubmittingHealth] = useState(false);
  const [submittingMerge, setSubmittingMerge] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [pns, custs] = await Promise.all([
        apiGet<any[]>('/crm/expansion/account-plans'),
        apiGet<any[]>('/crm/customers'), // Fetching active customers
      ]);
      setPlans(Array.isArray(pns) ? pns : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (err) {
      toast.error('Could not load account planning data', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [toast]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.customerId || !newPlan.name) {
      toast.error('Validation Error', 'Customer and Plan Name are required.');
      return;
    }
    setSubmittingPlan(true);
    try {
      const { apiPost } = await import('../_components/api');
      await apiPost('/crm/expansion/account-plans', newPlan);
      toast.success('Success', 'Account plan created.');
      setNewPlan({ customerId: '', name: '', objectives: '' });
      loadData();
    } catch (err) {
      toast.error('Error creating plan', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleLogHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthLog.customerId || !healthLog.score) {
      toast.error('Validation Error', 'Customer and Health Score are required.');
      return;
    }
    setSubmittingHealth(true);
    try {
      const { apiPost } = await import('../_components/api');
      await apiPost(`/crm/expansion/customers/${healthLog.customerId}/health`, {
        score: parseInt(healthLog.score),
        status: healthLog.status,
        reason: healthLog.reason,
      });
      toast.success('Success', 'Customer health log created.');
      setHealthLog({ customerId: '', score: '', status: 'GREEN', reason: '' });
      loadData();
    } catch (err) {
      toast.error('Error logging health', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmittingHealth(false);
    }
  };

  const handleMergeAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merge.sourceCustomerId || !merge.targetCustomerId) {
      toast.error('Validation Error', 'Source and Target Customers are required.');
      return;
    }
    if (merge.sourceCustomerId === merge.targetCustomerId) {
      toast.error('Validation Error', 'Source and Target Customer cannot be the same.');
      return;
    }
    setSubmittingMerge(true);
    try {
      const { apiPost } = await import('../_components/api');
      await apiPost('/crm/expansion/customers/merge', merge);
      toast.success('Success', 'Accounts merged successfully.');
      setMerge({ sourceCustomerId: '', targetCustomerId: '' });
      loadData();
    } catch (err) {
      toast.error('Error merging accounts', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmittingMerge(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader title="Account Planning & Health" description="Create strategic account plans, log customer health metrics, and merge accounts"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Account Plans' }]} />

      {/* Account Plans List */}
      <Card>
        <div style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Shield size={18} /> Strategic Account Plans
          </h3>
          {plans.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No account plans created yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Plan Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Objectives</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>{p.customer?.name || 'Unknown'}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{p.name}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{p.objectives || 'None'}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <Badge variant="success">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Grid of Forms */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
        {/* Create Plan Form */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={18} /> New Account Plan
            </h3>
            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Select Customer</label>
                <select
                  value={newPlan.customerId}
                  onChange={(e) => setNewPlan({ ...newPlan, customerId: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-elevated)', color: 'var(--color-text)' }}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Plan Name</label>
                <Input
                  type="text"
                  placeholder="e.g. FY2026 Expansion Plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Strategic Objectives</label>
                <textarea
                  placeholder="Objectives and initiatives..."
                  value={newPlan.objectives}
                  onChange={(e) => setNewPlan({ ...newPlan, objectives: e.target.value })}
                  style={{ width: '100%', height: 80, padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-elevated)', color: 'var(--color-text)', resize: 'none' }}
                />
              </div>
              <Button type="submit" disabled={submittingPlan}>
                {submittingPlan ? 'Saving...' : 'Create Plan'}
              </Button>
            </form>
          </div>
        </Card>

        {/* Health Log Form */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Activity size={18} /> Log Customer Health
            </h3>
            <form onSubmit={handleLogHealth} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Select Customer</label>
                <select
                  value={healthLog.customerId}
                  onChange={(e) => setHealthLog({ ...healthLog, customerId: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-elevated)', color: 'var(--color-text)' }}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Health Score (0-100)</label>
                <Input
                  type="number"
                  placeholder="e.g. 85"
                  value={healthLog.score}
                  onChange={(e) => setHealthLog({ ...healthLog, score: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Status</label>
                <select
                  value={healthLog.status}
                  onChange={(e) => setHealthLog({ ...healthLog, status: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-elevated)', color: 'var(--color-text)' }}
                  required
                >
                  <option value="GREEN">GREEN (Healthy)</option>
                  <option value="YELLOW">YELLOW (Risk)</option>
                  <option value="RED">RED (At Churn Risk)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Reason / Notes</label>
                <Input
                  type="text"
                  placeholder="e.g. High product usage"
                  value={healthLog.reason}
                  onChange={(e) => setHealthLog({ ...healthLog, reason: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={submittingHealth}>
                {submittingHealth ? 'Logging...' : 'Log Health'}
              </Button>
            </form>
          </div>
        </Card>

        {/* Merge Accounts Form */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ margin: 0, marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-lg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Layers size={18} /> Merge Accounts
            </h3>
            <form onSubmit={handleMergeAccounts} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Source Customer (To Delete)</label>
                <select
                  value={merge.sourceCustomerId}
                  onChange={(e) => setMerge({ ...merge, sourceCustomerId: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-elevated)', color: 'var(--color-text)' }}
                  required
                >
                  <option value="">-- Choose Source --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Target Customer (To Keep)</label>
                <select
                  value={merge.targetCustomerId}
                  onChange={(e) => setMerge({ ...merge, targetCustomerId: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-background-elevated)', color: 'var(--color-text)' }}
                  required
                >
                  <option value="">-- Choose Target --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={submittingMerge} variant="danger">
                {submittingMerge ? 'Merging...' : 'Merge Accounts'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
