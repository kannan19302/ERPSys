'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { TrendingUp, Plus } from 'lucide-react';

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
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [form, setForm] = useState({ position: '', currentHolderId: '', riskLevel: 'LOW', readinessLevel: 'NOT_READY', successorId: '', developmentPlan: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [succRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/succession', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (succRes.ok) setPlans(await succRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/succession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Succession plan assigned.');
        setShowForm(false);
        setForm({ position: '', currentHolderId: '', riskLevel: 'LOW', readinessLevel: 'NOT_READY', successorId: '', developmentPlan: '' });
        fetchData();
      }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
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
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Design Role Succession Plan</h4>
          <form onSubmit={createPlan} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              className="frappe-input"
              placeholder="Corporate Role Position (e.g. Chief Executive Officer)"
              value={form.position}
              onChange={e => setForm({ ...form, position: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Current Position Holder</label>
                <select
                  className="frappe-input"
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
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Target Successor</label>
                <select
                  className="frappe-input"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Vacancy Risk Level</label>
                <select
                  className="frappe-input"
                  value={form.riskLevel}
                  onChange={e => setForm({ ...form, riskLevel: e.target.value })}
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk / Critical</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Readiness Timeline</label>
                <select
                  className="frappe-input"
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
              className="frappe-input"
              placeholder="Candidate training and mentoring development pathway details..."
              value={form.developmentPlan}
              onChange={e => setForm({ ...form, developmentPlan: e.target.value })}
              rows={3}
            />

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Save Plan</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Critical Role</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Current Holder</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Designated Successor</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Vacancy Risk</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <TrendingUp size={24} style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0 }}>No critical succession plans mapped yet.</p>
                  </td>
                </tr>
              ) : (
                plans.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{p.position}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{getEmpName(p.currentHolderId)}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{getEmpName(p.successorId)}</td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: p.riskLevel === 'HIGH' ? 'var(--color-danger-light)' : p.riskLevel === 'MEDIUM' ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                        color: p.riskLevel === 'HIGH' ? 'var(--color-danger-text)' : p.riskLevel === 'MEDIUM' ? 'var(--color-warning-text)' : 'var(--color-success)'
                      }}>
                        {p.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <StatusBadge status={p.readinessLevel} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
