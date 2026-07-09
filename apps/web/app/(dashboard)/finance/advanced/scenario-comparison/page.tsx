'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, AlertTriangle, ArrowRight, Check, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

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

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra };
}

export default function ScenarioComparisonPage() {
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
        fetch(`${API}/budget-scenarios`, { headers: authHeaders() }),
        fetch(`${API}/accounts`, { headers: authHeaders() }),
      ]);
      
      if (scenRes.ok) {
        const scenData = await scenRes.json() as BudgetScenario[];
        setScenarios(scenData);
        if (scenData.length > 0) {
          setScenarioAId(scenData[0]?.id || '');
          if (scenData.length > 1) {
            setScenarioBId(scenData[1]?.id || '');
          } else {
            setScenarioBId('actuals');
          }
        }
      }
      if (accRes.ok) setAccounts(await accRes.json() as GLAccount[]);
    } catch {
      setError('Failed to fetch budget scenarios or GL accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompare = async () => {
    if (!scenarioAId || !scenarioBId || !fiscalYear) return;
    setComparing(true);
    setError('');
    try {
      const res = await fetch(
        `${API}/budget-scenarios/compare?scenarioAId=${scenarioAId}&scenarioBId=${scenarioBId}&fiscalYear=${fiscalYear}`,
        { headers: authHeaders() },
      );
      if (res.ok) {
        setComparison(await res.json() as ComparisonResult);
      } else {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to compare budget scenarios');
      }
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
    <div className="frappe-page-container">
      <div className="frappe-page-head">
        <div className="frappe-page-head-content">
          <nav className="frappe-breadcrumb">
            <span>Finance</span><span className="frappe-breadcrumb-sep">/</span>
            <span>FP&A</span><span className="frappe-breadcrumb-sep">/</span>
            <span className="frappe-breadcrumb-current">Scenario Comparison</span>
          </nav>
          <div className="frappe-title-section">
            <BarChart3 className="frappe-title-icon" size={20} />
            <h1 className="frappe-page-title">Scenario Comparison & Variance</h1>
          </div>
          <p className="frappe-page-subtitle">
            Analyze variances between budget scenarios (Base vs Downside) or compare budget scenarios vs actual GL ledger outcomes.
          </p>
        </div>
      </div>

      {error && (
        <div className="frappe-alert frappe-alert-error mb-4">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Selectors Panel */}
      <Card className="frappe-card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="frappe-form-group">
            <label className="frappe-label">Scenario A (Baseline)</label>
            <select
              className="frappe-input"
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

          <div className="frappe-form-group">
            <label className="frappe-label">Scenario B (Comparison Target)</label>
            <select
              className="frappe-input"
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

          <div className="frappe-form-group">
            <label className="frappe-label">Fiscal Year</label>
            <input
              type="number"
              className="frappe-input"
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
          <div className="frappe-grid-3 mb-4">
            <Card className="frappe-card p-4 bg-blue-50/50">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">Total Baseline (A)</h3>
              <div className="text-2xl font-bold mt-2 text-blue-800">
                ${Number(comparison.summary.totalA).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-2 truncate">
                Scenario: <span className="font-semibold">{comparison.scenarioA.name}</span>
              </p>
            </Card>

            <Card className="frappe-card p-4 bg-teal-50/50">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">Total Comparison (B)</h3>
              <div className="text-2xl font-bold mt-2 text-teal-800">
                ${Number(comparison.summary.totalB).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-2 truncate">
                Scenario: <span className="font-semibold">{comparison.scenarioB.name}</span>
              </p>
            </Card>

            <Card className="frappe-card p-4 bg-gray-50">
              <h3 className="text-xs text-gray-500 uppercase font-semibold">Net Scenario Variance</h3>
              <div className="text-2xl font-bold mt-2">
                ${Number(comparison.summary.netVariance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                A minus B outcome.
              </p>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card className="frappe-list-card">
            <h3 className="font-semibold text-sm p-4 border-b border-gray-100">Account Variance Detail</h3>
            <table className="frappe-table">
              <thead>
                <tr>
                  <th className="frappe-th">GL Account</th>
                  <th className="frappe-th text-right">Baseline (A)</th>
                  <th className="frappe-th text-right">Comparison (B)</th>
                  <th className="frappe-th text-right">Variance</th>
                  <th className="frappe-th text-right">Variance %</th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => {
                  const acc = accountMap.get(row.accountId);
                  const isNegative = Number(row.varianceAmount) < 0;
                  return (
                    <tr key={row.accountId} className="frappe-tr">
                      <td className="frappe-td">
                        <div className="font-semibold">{acc ? `${acc.code} — ${acc.name}` : row.accountId}</div>
                        <div className="text-xs text-gray-400 capitalize">{acc?.type.toLowerCase() || 'Account'}</div>
                      </td>
                      <td className="frappe-td text-right font-medium">
                        ${Number(row.scenarioATotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="frappe-td text-right font-medium">
                        ${Number(row.scenarioBTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`frappe-td text-right font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        ${Number(row.varianceAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`frappe-td text-right font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {row.variancePercent ? `${row.variancePercent}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
