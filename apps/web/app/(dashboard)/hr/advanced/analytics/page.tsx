'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { BarChart3, Users, CreditCard, DollarSign } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
  const [headcount, setHeadcount] = useState<HeadcountAnalytics | null>(null);
  const [compensation, setCompensation] = useState<CompensationAnalytics | null>(null);
  const [cost, setCost] = useState<CostAnalytics | null>(null);
  const [budgetVariance, setBudgetVariance] = useState<BudgetVariance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [headRes, compRes, costRes, budgetRes] = await Promise.all([
        client.get<HeadcountAnalytics>('/api/v1/advanced-hr/analytics/headcount'),
        client.get<CompensationAnalytics>('/api/v1/advanced-hr/analytics/compensation'),
        client.get<CostAnalytics>('/api/v1/advanced-hr/analytics/cost'),
        client.get<BudgetVariance[]>('/api/v1/advanced-hr/positions/budget-variance'),
      ]);
      setHeadcount(headRes); setCompensation(compRes); setCost(costRes); setBudgetVariance(budgetRes);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard permission="hr.analytics.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Workforce Analytics"
        description="Review company-wide salary averages, monthly gross pay runs, and department headcount breakdowns."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Analytics' }]}
      />

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="ui-grid-auto">
            <Card>
              <div className="ui-flex-between">
                <span className={styles.kpiLabel}>Total Headcount</span>
                <div className={`${styles.kpiIcon} ${styles.primaryIcon}`}>
                  <Users size={16} />
                </div>
              </div>
              <h2 className={styles.kpiValue}>{headcount?.total || 0}</h2>
            </Card>

            <Card>
              <div className="ui-flex-between">
                <span className={styles.kpiLabel}>Average Salary</span>
                <div className={`${styles.kpiIcon} ${styles.successIcon}`}>
                  <CreditCard size={16} />
                </div>
              </div>
              <h2 className={styles.kpiValue}>
                ${Math.round(compensation?.average || 0).toLocaleString()}/mo
              </h2>
            </Card>

            <Card>
              <div className="ui-flex-between">
                <span className={styles.kpiLabel}>Total Annual Cost</span>
                <div className={`${styles.kpiIcon} ${styles.warningIcon}`}>
                  <DollarSign size={16} />
                </div>
              </div>
              <h2 className={styles.kpiValue}>
                ${Math.round(cost?.totalPaidThisYear || 0).toLocaleString()}
              </h2>
            </Card>

            <Card>
              <div className="ui-flex-between">
                <span className={styles.kpiLabel}>Turnover Rate</span>
                <div className={`${styles.kpiIcon} ${styles.dangerIcon}`}>
                  <BarChart3 size={16} />
                </div>
              </div>
              <h2 className={styles.kpiValue}>
                {headcount?.turnoverRate ? `${Number(headcount.turnoverRate).toFixed(1)}%` : '0%'}
              </h2>
            </Card>

            <Card>
              <div className="ui-flex-between">
                <span className={styles.kpiLabel}>Avg Time-to-Hire</span>
                <div className={`${styles.kpiIcon} ${styles.primaryIcon}`}>
                  <Users size={16} />
                </div>
              </div>
              <h2 className={styles.kpiValue}>
                {headcount?.timeToHire ? `${headcount.timeToHire} days` : '15 days'}
              </h2>
            </Card>
          </div>

          <div className="ui-grid-2 ui-gap-6">
            {/* Department Headcount Breakdown */}
            <Card padding="md">
              <h3 className={styles.sectionTitle}>
                <BarChart3 size={18} className="ui-text-primary" /> Department Headcount
              </h3>
              <div className="ui-stack-3">
                {headcount?.byDepartment.map(d => (
                  <div key={d.name}>
                    <div className={styles.departmentHeader}>
                      <span>{d.name}</span>
                      <span className="font-semibold">{d.count}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barValue}
                        style={{
                          width: headcount.total > 0 ? `${(d.count / headcount.total) * 100}%` : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {(!headcount || headcount.byDepartment.length === 0) && (
                  <div className={styles.emptyData}>No data available.</div>
                )}
              </div>
            </Card>

            {/* Compensation Metrics */}
            <Card padding="md">
              <h3 className={styles.sectionTitle}>
                <CreditCard size={18} className="ui-text-success" /> Salary Statistics
              </h3>
              <div className={styles.metrics}>
                <div className={styles.metricRow}>
                  <span className="ui-text-muted">Minimum Base Salary</span>
                  <span className="font-semibold">${(compensation?.min || 0).toLocaleString()}/mo</span>
                </div>
                <div className={styles.metricRow}>
                  <span className="ui-text-muted">Median Salary</span>
                  <span className="font-semibold">${(compensation?.median || 0).toLocaleString()}/mo</span>
                </div>
                <div className={styles.metricRow}>
                  <span className="ui-text-muted">Maximum Salary</span>
                  <span className="font-semibold">${(compensation?.max || 0).toLocaleString()}/mo</span>
                </div>
                <div className="ui-flex-between">
                  <span className="ui-text-muted">Cost Per Active Employee</span>
                  <span className={styles.successValue}>
                    ${Math.round(cost?.costPerEmployee || 0).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Budget Variance */}
          <div className={styles.budgetSection}>
            {(() => {
              const budgetVarianceColumns: ListColumn[] = [
                { key: 'departmentName', header: 'Department' },
                { key: 'budgeted', header: 'Budgeted Payroll', render: (v) => `$${Number(v).toLocaleString()}/mo` },
                { key: 'actual', header: 'Actual Payroll', render: (v) => `$${Number(v).toLocaleString()}/mo` },
                { key: 'variance', header: 'Variance', render: (v) => (
                  <span className={Number(v) >= 0 ? styles.positiveVariance : styles.negativeVariance}>
                    {Number(v) >= 0 ? `+${Number(v).toLocaleString()}` : Number(v).toLocaleString()}
                  </span>
                ) },
              ];
              return (
                <ListPageTemplate
                  title="Departmental Position Budget Variance"
                  columns={budgetVarianceColumns}
                  data={budgetVariance as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No positions configured for budget analysis."
                />
              );
            })()}
          </div>
        </>
      )}
    </div>
    </RouteGuard>
  );
}
