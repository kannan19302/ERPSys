'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { TrendingUp, Plus } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface SuccessionPlan {
  id: string;
  position: string;
  currentHolderId: string | null;
  riskLevel: string;
  readinessLevel: string;
  successorId: string | null;
  developmentPlan: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function SuccessionPage() {
  const client = useApiClient();
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [form, setForm] = useState({ position: '', currentHolderId: '', riskLevel: 'LOW', readinessLevel: 'NOT_READY', successorId: '', developmentPlan: '' });

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, employeesData] = await Promise.all([
        client.get<SuccessionPlan[] | { data?: SuccessionPlan[] }>('/advanced-hr/succession'),
        client.get<Employee[] | { data?: Employee[] }>('/hr/employees'),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : (plansData.data || []));
      setEmployees(Array.isArray(employeesData) ? employeesData : (employeesData.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/advanced-hr/succession', form);
      setMsg('Succession plan assigned.');
      setShowForm(false);
      setForm({ position: '', currentHolderId: '', riskLevel: 'LOW', readinessLevel: 'NOT_READY', successorId: '', developmentPlan: '' });
      fetchData();
    } catch {
      setMsg('Error saving succession plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEmpName = (id: string | null) => {
    if (!id) return 'None';
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Succession Plan"
        description="Address organizational vacancy risks, map high-potential successor roles, and coordinate readiness development plans."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Succession' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Design Plan
          </Button>
        }
      />

      {msg && (
        <div className={styles.s0}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 className={styles.s1}>Design Role Succession Plan</h4>
          <form onSubmit={createPlan} className="ui-stack-3">
            <input
              className="ui-input"
              placeholder="Corporate Role Position (e.g. Chief Executive Officer)"
              value={form.position}
              onChange={e => setForm({ ...form, position: e.target.value })}
              required
            />
            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Current Position Holder</label>
                <select
                  className="ui-input"
                  value={form.currentHolderId}
                  onChange={e => setForm({ ...form, currentHolderId: e.target.value })}
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-text-caption">Target Successor</label>
                <select
                  className="ui-input"
                  value={form.successorId}
                  onChange={e => setForm({ ...form, successorId: e.target.value })}
                >
                  <option value="">Select Successor</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ui-grid-2 ui-gap-3">
              <div>
                <label className="ui-text-caption">Vacancy Risk Level</label>
                <select
                  className="ui-input"
                  value={form.riskLevel}
                  onChange={e => setForm({ ...form, riskLevel: e.target.value })}
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk / Critical</option>
                </select>
              </div>
              <div>
                <label className="ui-text-caption">Readiness Timeline</label>
                <select
                  className="ui-input"
                  value={form.readinessLevel}
                  onChange={e => setForm({ ...form, readinessLevel: e.target.value })}
                >
                  <option value="READY">Ready Now</option>
                  <option value="READY_1_YEAR">Ready within 1 Year</option>
                  <option value="READY_3_YEARS">Ready 1-3 Years</option>
                  <option value="NOT_READY">Developing / Long Term</option>
                </select>
              </div>
            </div>

            <textarea
              className="ui-input"
              placeholder="Candidate training and mentoring development pathway details..."
              value={form.developmentPlan}
              onChange={e => setForm({ ...form, developmentPlan: e.target.value })}
              rows={3}
            />

            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Save Plan</Button>
            </div>
          </form>
        </Card>
      )}

      {(() => {
        const successionColumns: ListColumn[] = [
          { key: 'position', header: 'Critical Role' },
          { key: 'currentHolderId', header: 'Current Holder', render: (v) => getEmpName(v as string | null) },
          { key: 'successorId', header: 'Designated Successor', render: (v) => getEmpName(v as string | null) },
          { key: 'riskLevel', header: 'Vacancy Risk', render: (v) => (
            <span className={styles.dyn0} style={{ background: v === 'HIGH' ? 'var(--color-danger-light)' : v === 'MEDIUM' ? 'var(--color-warning-light)' : 'var(--color-success-light)', color: v === 'HIGH' ? 'var(--color-danger-text)' : v === 'MEDIUM' ? 'var(--color-warning-text)' : 'var(--color-success)' }}>{String(v)}</span>
          ) },
          { key: 'readinessLevel', header: 'Readiness', render: (v) => <StatusBadge status={String(v)} /> },
        ];
        return (
          <ListPageTemplate
            title=""
            columns={successionColumns}
            data={plans as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyTitle="No critical succession plans mapped yet."
          />
        );
      })()}
    </div>
  );
}


