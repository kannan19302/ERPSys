'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Card, PageHeader, Badge, useToast, Button, Input, ListPageTemplate, type ListColumn } from '@unerp/ui';
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

  const planColumns: ListColumn[] = [
    { key: 'customerName', header: 'Customer', render: (_, row) => String((row.customer as Record<string, unknown>)?.name || 'Unknown') },
    { key: 'name', header: 'Plan Name' },
    { key: 'objectives', header: 'Objectives', render: (v) => String(v || 'None') },
    { key: 'status', header: 'Status', render: (v) => <Badge variant="success">{String(v)}</Badge> },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader title="Account Planning & Health" description="Create strategic account plans, log customer health metrics, and merge accounts"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Account Plans' }]} />

      {/* Account Plans List */}
      <ListPageTemplate
        title="Strategic Account Plans"
        columns={planColumns}
        data={plans as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No account plans created yet"
      />

      {/* Grid of Forms */}
      <div className={styles.p20}>
        {/* Create Plan Form */}
        <Card>
          <div className="p-6">
            <h3 className={styles.p21}>
              <Plus size={18} /> New Account Plan
            </h3>
            <form onSubmit={handleCreatePlan} className="ui-stack-4">
              <div>
                <label className={styles.p22}>Select Customer</label>
                <select
                  value={newPlan.customerId}
                  onChange={(e) => setNewPlan({ ...newPlan, customerId: e.target.value })}
                  className={styles.p23}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.p24}>Plan Name</label>
                <Input
                  type="text"
                  placeholder="e.g. FY2026 Expansion Plan"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.p25}>Strategic Objectives</label>
                <textarea
                  placeholder="Objectives and initiatives..."
                  value={newPlan.objectives}
                  onChange={(e) => setNewPlan({ ...newPlan, objectives: e.target.value })}
                  className={styles.p26}
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
          <div className="p-6">
            <h3 className={styles.p27}>
              <Activity size={18} /> Log Customer Health
            </h3>
            <form onSubmit={handleLogHealth} className="ui-stack-4">
              <div>
                <label className={styles.p28}>Select Customer</label>
                <select
                  value={healthLog.customerId}
                  onChange={(e) => setHealthLog({ ...healthLog, customerId: e.target.value })}
                  className={styles.p29}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.p210}>Health Score (0-100)</label>
                <Input
                  type="number"
                  placeholder="e.g. 85"
                  value={healthLog.score}
                  onChange={(e) => setHealthLog({ ...healthLog, score: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={styles.p211}>Status</label>
                <select
                  value={healthLog.status}
                  onChange={(e) => setHealthLog({ ...healthLog, status: e.target.value })}
                  className={styles.p212}
                  required
                >
                  <option value="GREEN">GREEN (Healthy)</option>
                  <option value="YELLOW">YELLOW (Risk)</option>
                  <option value="RED">RED (At Churn Risk)</option>
                </select>
              </div>
              <div>
                <label className={styles.p213}>Reason / Notes</label>
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
          <div className="p-6">
            <h3 className={styles.p214}>
              <Layers size={18} /> Merge Accounts
            </h3>
            <form onSubmit={handleMergeAccounts} className="ui-stack-4">
              <div>
                <label className={styles.p215}>Source Customer (To Delete)</label>
                <select
                  value={merge.sourceCustomerId}
                  onChange={(e) => setMerge({ ...merge, sourceCustomerId: e.target.value })}
                  className={styles.p216}
                  required
                >
                  <option value="">-- Choose Source --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.p217}>Target Customer (To Keep)</label>
                <select
                  value={merge.targetCustomerId}
                  onChange={(e) => setMerge({ ...merge, targetCustomerId: e.target.value })}
                  className={styles.p218}
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
