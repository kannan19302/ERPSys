'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, AlertTriangle, ArrowRight, Check, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface BudgetScenario {
  id: string;
  name: string;
  type: string;
  fiscalYear: number;
}

interface ComparisonRow {
  accountId: string;
  scenarioATotal: string;
  scenarioBTotal: string;
  varianceAmount: string;
  variancePercent: string | null;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface ComparisonResult {
  scenarioA: { id: string; name: string };
  scenarioB: { id: string; name: string };
  fiscalYear: number;
  rows: ComparisonRow[];
  summary: {
    totalA: string;
    totalB: string;
    netVariance: string;
  };
}

const API = '/api/v1/advanced-finance';

export default function ScenarioComparisonPage() {
  const client = useApiClient();
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [scenarioAId, setScenarioAId] = useState<string>('');
  const [scenarioBId, setScenarioBId] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>('2026');

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  const fetchMetadata = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scenRes, accRes] = await Promise.all([
        client.get<BudgetScenario[]>(`${API}/budget-scenarios`),
        client.get<GLAccount[]>(`${API}/accounts`),
      ]);
      setScenarios(scenRes);
      if (scenRes.length > 0) {
        setScenarioAId(scenRes[0]?.id || '');
        if (scenRes.length > 1) {
          setScenarioBId(scenRes[1]?.id || '');
        } else {
          setScenarioBId('actuals');
        }
      }
      setAccounts(accRes);
    } catch {
      setError('Failed to fetch budget scenarios or GL accounts');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const handleCompare = async () => {
    if (!scenarioAId || !scenarioBId || !fiscalYear) return;
    setComparing(true);
    setError('');
    try {
      setComparison(await client.get<ComparisonResult>(`${API}/budget-scenarios/compare?scenarioAId=${scenarioAId}&scenarioBId=${scenarioBId}&fiscalYear=${fiscalYear}`));
    } catch {
      setError('Network error');
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Map of accountId to account details for quick lookup
  const accountMap = React.useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a]));
  }, [accounts]);

  return (
    <RouteGuard permission="finance.scenarios.read">
    <div className="ui-page-container">
      <div className="ui-page-head">
        <div className="ui-page-head-content">
          <nav className="ui-breadcrumb">
            <span>Finance</span><span className="ui-breadcrumb-sep">/</span>
            <span>FP&A</span><span className="ui-breadcrumb-sep">/</span>
            <span className="ui-breadcrumb-current">Scenario Comparison</span>
          </nav>
          <div className="ui-title-section">
            <BarChart3 className="ui-title-icon" size={20} />
            <h1 className="ui-page-title">Scenario Comparison & Variance</h1>
          </div>
          <p className="ui-page-subtitle">
            Analyze variances between budget scenarios (Base vs Downside) or compare budget scenarios vs actual GL ledger outcomes.
          </p>
        </div>
      </div>

      {error && (
        <div className="ui-alert ui-alert-error mb-4">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Selectors Panel */}
      <Card className="ui-card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="ui-form-group">
            <label className="ui-label">Scenario A (Baseline)</label>
            <select
              className="ui-input"
              value={scenarioAId}
              onChange={(e) => setScenarioAId(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose Scenario A...</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
              ))}
            </select>
          </div>

          <div className="ui-form-group">
            <label className="ui-label">Scenario B (Comparison Target)</label>
            <select
              className="ui-input"
              value={scenarioBId}
              onChange={(e) => setScenarioBId(e.target.value)}
              disabled={loading}
            >
              <option value="actuals">Actuals (GL Balance Sheet/P&L)</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
              ))}
            </select>
          </div>

          <div className="ui-form-group">
            <label className="ui-label">Fiscal Year</label>
            <input
              type="number"
              className="ui-input"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Button
              className="w-full"
              onClick={handleCompare}
              disabled={comparing || !scenarioAId || !scenarioBId}
            >
              {comparing ? <RefreshCw className="animate-spin mr-1" size={16} /> : null}
              Run Comparison
            </Button>
          </div>
        </div>
      </Card>

      {/* Comparison Results Summary */}
      {comparison && (
        <>
          <StatCardRow stats={[
            { label: `Total Baseline (A) — ${comparison.scenarioA.name}`, value: `$${Number(comparison.summary.totalA).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <TrendingUp size={20} />, color: '#1e40af' },
            { label: `Total Comparison (B) — ${comparison.scenarioB.name}`, value: `$${Number(comparison.summary.totalB).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <Layers size={20} />, color: '#0f766e' },
            { label: 'Net Scenario Variance', value: `$${Number(comparison.summary.netVariance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <BarChart3 size={20} />, color: 'var(--color-primary)' },
          ]} />

          {/* Comparison Table */}
          <Card className="ui-list-card">
            <h3 className="font-semibold text-sm p-4 border-b border-gray-100">Account Variance Detail</h3>
            {(() => {
              const compColumns: ListColumn[] = [
                { key: 'accountId', header: 'GL Account', render: (v, row) => { const acc = accountMap.get(v as string); return <div><div className="font-semibold">{acc ? `${acc.code} — ${acc.name}` : v as string}</div><div className={styles.s1}>{acc?.type.toLowerCase() || 'Account'}</div></div>; } },
                { key: 'scenarioATotal', header: 'Baseline (A)', render: (v) => <span className={styles.s2}>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                { key: 'scenarioBTotal', header: 'Comparison (B)', render: (v) => <span className={styles.s2}>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                { key: 'varianceAmount', header: 'Variance', render: (v) => <span style={{ color: Number(v) < 0 ? '#dc2626' : '#16a34a' }} className={styles.s3}>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                { key: 'variancePercent', header: 'Variance %', render: (v, row) => { const va = Number((row as unknown as ComparisonRow).varianceAmount); return <span style={{ color: va < 0 ? '#dc2626' : '#16a34a' }} className={styles.s3}>{v ? `${v}%` : '—'}</span>; } },
              ];
              return (
                <ListPageTemplate
                  columns={compColumns}
                  data={comparison.rows as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No Comparison Data"
                  emptyDescription="Run a comparison to see variance details."
                  searchable
                />
              );
            })()}
          </Card>
        </>
      )}
    </div>
    </RouteGuard>
  );
}
