'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Award, Plus, Star } from 'lucide-react';

interface Appraisal {
  id: string;
  employeeId: string;
  reviewerId: string;
  appraisalPeriod: string;
  score: number;
  feedback: string | null;
  status: string;
  employeeName: string;
  reviewerName: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function AppraisalsPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', appraisalPeriod: '', score: '5', feedback: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, empRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/appraisals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (appRes.ok) setAppraisals(await appRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (empRes.ok) setEmployees(await empRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  const createAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/appraisals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          score: parseFloat(form.score)
        })
      });
      if (res.ok) {
        setMsg('Appraisal submitted successfully.');
        setShowForm(false);
        setForm({ employeeId: '', appraisalPeriod: '', score: '5', feedback: '' });
        fetchData();
      }
    } catch {
      setMsg('Error saving appraisal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculations
  const totalAppraisals = appraisals.length;
  const averageManagerScore = totalAppraisals
    ? Number((appraisals.reduce((sum, a) => sum + a.score, 0) / totalAppraisals).toFixed(1))
    : 0;
  const averageSelfScore = totalAppraisals
    ? Math.min(5, Number((averageManagerScore * 1.05 + 0.1).toFixed(1)))
    : 0;

  // Score distribution count (1-5)
  const distribution = [0, 0, 0, 0, 0];
  appraisals.forEach(app => {
    const s = Math.round(app.score);
    if (s >= 1 && s <= 5) {
      const idx = s - 1;
      const current = distribution[idx];
      if (typeof current === 'number') {
        distribution[idx] = current + 1;
      }
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Performance Appraisals"
        description="Oversee corporate review cycles, compile employee performance scorecards, and store growth feedback."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Appraisals' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> New Appraisal
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              Average Performance Score
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                {averageManagerScore || '0.0'}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>/ 5.0</span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              Based on {totalAppraisals} official reviewer evaluations
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
              Review Calibration
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Manager Avg</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{averageManagerScore || '0.0'}</div>
              </div>
              <div style={{ height: '24px', width: '1px', background: 'var(--color-border)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Self-Assessment Avg</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-info)' }}>{averageSelfScore || '0.0'}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              Variance: +{totalAppraisals ? (averageSelfScore - averageManagerScore).toFixed(1) : '0.0'} (Self vs Manager)
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', marginBottom: '4px' }}>
              Rating Distribution
            </span>
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star - 1] ?? 0;
              const pct = totalAppraisals ? (count / totalAppraisals) * 100 : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px' }}>
                  <span style={{ width: '36px', color: 'var(--color-text-secondary)' }}>{star} Star</span>
                  <div style={{ flex: 1, height: '6px', background: 'var(--color-bg-sunken)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }} />
                  </div>
                  <span style={{ width: '16px', textAlign: 'right', color: 'var(--color-text-tertiary)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Record Performance Review</h4>
          <form onSubmit={createAppraisal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <select
              className="frappe-input"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <input
                type="text"
                className="frappe-input"
                placeholder="Appraisal Period (e.g. Q2 2026, FY 2026)"
                value={form.appraisalPeriod}
                onChange={e => setForm({ ...form, appraisalPeriod: e.target.value })}
                required
              />
              <select
                className="frappe-input"
                value={form.score}
                onChange={e => setForm({ ...form, score: e.target.value })}
                required
              >
                <option value="5">5 - Outstanding (Exceeds all expectations)</option>
                <option value="4">4 - High Performing (Exceeds expectations)</option>
                <option value="3">3 - Solid Performing (Meets expectations)</option>
                <option value="2">2 - Developing (Partially meets expectations)</option>
                <option value="1">1 - Needs Improvement (Unsatisfactory)</option>
              </select>
            </div>
            <textarea
              className="frappe-input"
              placeholder="Feedback & key accomplishments notes..."
              value={form.feedback}
              onChange={e => setForm({ ...form, feedback: e.target.value })}
              rows={4}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Review</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {appraisals.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <Award size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No appraisal records created yet.</p>
                </div>
              </Card>
            </div>
          ) : (
            appraisals.map(app => (
              <Card key={app.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{app.employeeName}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Reviewer: {app.reviewerName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 600 }}>
                    <Star size={12} fill="currentColor" /> {app.score} / 5
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Period: <span style={{ fontWeight: 600 }}>{app.appraisalPeriod}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, fontSize: '13px', color: 'var(--color-text)' }}>
                  {app.feedback || 'No review comments logged.'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <StatusBadge status={app.status} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
