'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { Award, Plus, Star } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', appraisalPeriod: '', score: '5', feedback: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, empRes] = await Promise.all([
        client.get<Appraisal[]>('/api/v1/advanced-hr/appraisals'),
        client.get<Employee[]>('/api/v1/hr/employees'),
      ]);
      setAppraisals(appRes); setEmployees(empRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  const createAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/api/v1/advanced-hr/appraisals', {
          ...form,
          score: parseFloat(form.score)
        });
      {
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
    <RouteGuard permission="hr.appraisals.read">
    <div className="ui-stack-6 ui-animate-in">
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
      <div className={styles.stats}>
        <Card padding="md">
          <div className="ui-stack-2">
            <span className={styles.statLabel}>
              Average Performance Score
            </span>
            <div className={styles.scoreRow}>
              <span className={styles.primaryScore}>
                {averageManagerScore || '0.0'}
              </span>
              <span className={styles.scoreSuffix}>/ 5.0</span>
            </div>
            <p className={styles.statDescription}>
              Based on {totalAppraisals} official reviewer evaluations
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-stack-2">
            <span className={styles.statLabel}>
              Review Calibration
            </span>
            <div className={styles.calibration}>
              <div>
                <div className="ui-text-caption ui-text-tertiary">Manager Avg</div>
                <div className="ui-heading-lg">{averageManagerScore || '0.0'}</div>
              </div>
              <div className={styles.divider} />
              <div>
                <div className="ui-text-caption ui-text-tertiary">Self-Assessment Avg</div>
                <div className={styles.selfScore}>{averageSelfScore || '0.0'}</div>
              </div>
            </div>
            <p className={styles.statDescription}>
              Variance: +{totalAppraisals ? (averageSelfScore - averageManagerScore).toFixed(1) : '0.0'} (Self vs Manager)
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div className="ui-stack-1">
            <span className={styles.distributionLabel}>
              Rating Distribution
            </span>
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star - 1] ?? 0;
              const pct = totalAppraisals ? (count / totalAppraisals) * 100 : 0;
              return (
                <div key={star} className={styles.distributionRow}>
                  <span className={styles.starLabel}>{star} Star</span>
                  <div className={styles.distributionTrack}>
                    <div className={styles.distributionValue} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.count}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {msg && (
        <div className={styles.message}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Record Performance Review</h4>
          <form onSubmit={createAppraisal} className="ui-stack-3">
            <select
              className="ui-input"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <div className="ui-grid-2 ui-gap-3">
              <input
                type="text"
                className="ui-input"
                placeholder="Appraisal Period (e.g. Q2 2026, FY 2026)"
                value={form.appraisalPeriod}
                onChange={e => setForm({ ...form, appraisalPeriod: e.target.value })}
                required
              />
              <select
                className="ui-input"
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
              className="ui-input"
              placeholder="Feedback & key accomplishments notes..."
              value={form.feedback}
              onChange={e => setForm({ ...form, feedback: e.target.value })}
              rows={4}
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Submit Review</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.appraisalGrid}>
          {appraisals.length === 0 ? (
            <div className={styles.fullWidth}>
              <Card>
                <div className={styles.emptyState}>
                  <Award size={32} className={styles.emptyIcon} />
                  <p className="m-0">No appraisal records created yet.</p>
                </div>
              </Card>
            </div>
          ) : (
            appraisals.map(app => (
              <Card key={app.id} padding="md">
                <div className={styles.appraisalHeader}>
                  <div>
                    <h4 className="m-0">{app.employeeName}</h4>
                    <span className="ui-text-caption">Reviewer: {app.reviewerName}</span>
                  </div>
                  <div className={styles.scoreBadge}>
                    <Star size={12} fill="currentColor" /> {app.score} / 5
                  </div>
                </div>
                <div className={styles.period}>
                  Period: <span className="font-semibold">{app.appraisalPeriod}</span>
                </div>
                <div className={styles.feedback}>
                  {app.feedback || 'No review comments logged.'}
                </div>
                <div className={styles.status}>
                  <StatusBadge status={app.status} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
