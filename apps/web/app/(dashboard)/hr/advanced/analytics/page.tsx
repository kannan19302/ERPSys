'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import { BarChart3, Users, CreditCard, DollarSign } from 'lucide-react';

interface HeadcountAnalytics {
  total: number;
  byDepartment: Array<{ name: string; count: number }>;
  byEmploymentType: Array<{ employmentType: string; _count: number }>;
  byStatus: Array<{ status: string; _count: number }>;
  tenure: Record<string, number>;
  turnoverRate: number;
  timeToHire: number;
}

interface CompensationAnalytics {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

interface CostAnalytics {
  monthlyBreakdown: Array<{ period: string; gross: number; deductions: number; net: number }>;
  totalPaidThisYear: number;
  costPerEmployee: number;
  employeeCount: number;
}

interface BudgetVariance {
  departmentName: string;
  budgeted: number;
  actual: number;
  variance: number;
}

export default function AnalyticsPage() {
  const [headcount, setHeadcount] = useState<HeadcountAnalytics | null>(null);
  const [compensation, setCompensation] = useState<CompensationAnalytics | null>(null);
  const [cost, setCost] = useState<CostAnalytics | null>(null);
  const [budgetVariance, setBudgetVariance] = useState<BudgetVariance[]>([]);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [headRes, compRes, costRes, budgetRes] = await Promise.all([
        fetch('/api/v1/advanced-hr/analytics/headcount', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/analytics/compensation', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/analytics/cost', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/advanced-hr/positions/budget-variance', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (headRes.ok) setHeadcount(await headRes.json());
      if (compRes.ok) setCompensation(await compRes.json());
      if (costRes.ok) setCost(await costRes.json());
      if (budgetRes.ok) setBudgetVariance(await budgetRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Workforce Analytics"
        description="Review company-wide salary averages, monthly gross pay runs, and department headcount breakdowns."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Analytics' }]}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Headcount</span>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
                  <Users size={16} />
                </div>
              </div>
              <h2 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-2xl)' }}>{headcount?.total || 0}</h2>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Average Salary</span>
                <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
                  <CreditCard size={16} />
                </div>
              </div>
              <h2 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-2xl)' }}>
                ${Math.round(compensation?.average || 0).toLocaleString()}/mo
              </h2>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Annual Cost</span>
                <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: '4px', borderRadius: '4px' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <h2 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-2xl)' }}>
                ${Math.round(cost?.totalPaidThisYear || 0).toLocaleString()}
              </h2>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Turnover Rate</span>
                <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '4px', borderRadius: '4px' }}>
                  <BarChart3 size={16} />
                </div>
              </div>
              <h2 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-2xl)' }}>
                {headcount?.turnoverRate ? `${Number(headcount.turnoverRate).toFixed(1)}%` : '0%'}
              </h2>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Avg Time-to-Hire</span>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
                  <Users size={16} />
                </div>
              </div>
              <h2 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-2xl)' }}>
                {headcount?.timeToHire ? `${headcount.timeToHire} days` : '15 days'}
              </h2>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            {/* Department Headcount Breakdown */}
            <Card padding="md">
              <h3 style={{ margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} /> Department Headcount
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {headcount?.byDepartment.map(d => (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>{d.name}</span>
                      <span style={{ fontWeight: 600 }}>{d.count}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-sunken)', borderRadius: '4px' }}>
                      <div
                        style={{
                          width: headcount.total > 0 ? `${(d.count / headcount.total) * 100}%` : '0%',
                          height: '100%',
                          background: 'var(--color-primary)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                ))}
                {(!headcount || headcount.byDepartment.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '12px', color: 'var(--color-text-tertiary)' }}>No data available.</div>
                )}
              </div>
            </Card>

            {/* Compensation Metrics */}
            <Card padding="md">
              <h3 style={{ margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: 'var(--color-success)' }} /> Salary Statistics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Minimum Base Salary</span>
                  <span style={{ fontWeight: 600 }}>${(compensation?.min || 0).toLocaleString()}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Median Salary</span>
                  <span style={{ fontWeight: 600 }}>${(compensation?.median || 0).toLocaleString()}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Maximum Salary</span>
                  <span style={{ fontWeight: 600 }}>${(compensation?.max || 0).toLocaleString()}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Cost Per Active Employee</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                    ${Math.round(cost?.costPerEmployee || 0).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Budget Variance Card */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Card padding="md">
              <h3 style={{ margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} style={{ color: 'var(--color-warning)' }} /> Departmental Position Budget Variance
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Budgeted Headcount Payroll</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Actual Filled Payroll</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetVariance.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No positions configured for budget analysis.</td>
                    </tr>
                  ) : (
                    budgetVariance.map(v => (
                      <tr key={v.departmentName} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{v.departmentName}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>${Number(v.budgeted).toLocaleString()}/mo</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>${Number(v.actual).toLocaleString()}/mo</td>
                        <td style={{
                          padding: 'var(--space-3)',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: v.variance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>
                          {v.variance >= 0 ? `+${Number(v.variance).toLocaleString()}` : Number(v.variance).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
