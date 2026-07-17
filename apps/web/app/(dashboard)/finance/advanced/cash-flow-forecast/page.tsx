'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import {
  RefreshCw, TrendingUp, Download, Info,
  Loader2, CheckCircle2, AlertCircle, Edit,
  Settings, Trash2, Sliders, Play, Calculator
} from 'lucide-react';

interface ForecastWeek {
  weekStart: string;
  weekEnd: string;
  projectedInflow: number;
  projectedOutflow: number;
  adjustments: number;
  net: number;
  cumulativeBalance: number;
  comments: string | null;
}

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  inflowFactor: number | string;
  outflowFactor: number | string;
  status: string;
}

interface ForecastResponse {
  scenarioId: string;
  scenarioName: string;
  startingCash: number;
  forecast: ForecastWeek[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function CashFlowForecastPage() {
  const client = useApiClient();
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenarioId, setSelectedScenarioId] = useState('baseline');

  // Overrides Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [targetWeek, setTargetWeek] = useState<ForecastWeek | null>(null);
  const [overrideAdjustment, setOverrideAdjustment] = useState(0);
  const [overrideComments, setOverrideComments] = useState('');

  // Scenario Manager State
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [inflowFactor, setInflowFactor] = useState(1.0);
  const [outflowFactor, setOutflowFactor] = useState(1.0);

  const fetchForecast = useCallback(async () => {
    try {
      const path = selectedScenarioId && selectedScenarioId !== 'baseline'
        ? `/advanced-finance/cash-flow/forecast?scenarioId=${selectedScenarioId}`
        : '/advanced-finance/cash-flow/forecast';
      setForecastData(await client.get<ForecastResponse>(path));
    } catch {
    }
  }, [client, selectedScenarioId]);

  const fetchScenarios = useCallback(async () => {
    try {
      setScenarios(await client.get<Scenario[]>('/advanced-finance/cash-flow/forecast/scenarios'));
    } catch {
    }
  }, [client]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchForecast(), fetchScenarios()]);
    setLoading(false);
  }, [fetchForecast, fetchScenarios]);

  useEffect(() => {
    loadData();
  }, [selectedScenarioId]);

  const handleExportCsv = async () => {
    try {
      const csvText = await client.text('/advanced-finance/cash-flow/forecast/export');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `13_week_cash_flow_forecast_${selectedScenarioId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWeek) return;
    try {
      await client.post('/advanced-finance/cash-flow/forecast/adjust', {
          weekStart: targetWeek.weekStart,
          adjustments: Number(overrideAdjustment),
          comments: overrideComments,
      });
        setShowOverrideModal(false);
        fetchForecast();

    } catch {
      alert('Error saving override');
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/advanced-finance/cash-flow/forecast/scenarios', {
          name: scenarioName,
          description: scenarioDesc,
          inflowFactor: Number(inflowFactor),
          outflowFactor: Number(outflowFactor),
          status: 'ACTIVE',
      });
        setShowScenarioModal(false);
        setScenarioName('');
        setScenarioDesc('');
        setInflowFactor(1.0);
        setOutflowFactor(1.0);
        await fetchScenarios();
        alert('Scenario successfully created.');
    } catch {
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this forecast scenario?')) return;
    try {
      await client.delete(`/advanced-finance/cash-flow/forecast/scenarios/${id}`);
        if (selectedScenarioId === id) setSelectedScenarioId('baseline');
        fetchScenarios();
    } catch {
    }
  };

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className={styles.s1}>
        <div>
          <h1 className="text-3xl">13-Week Rolling Cash Flow Forecast</h1>
          <p className="ui-text-muted mt-1">
            Model rolling liquidity week-by-week by projecting AR Invoices, AP Payment Schedules, manual weekly adjustments, and scenarios.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <select className={`ui-input ${styles.s2}`}
            value={selectedScenarioId}
            onChange={e => setSelectedScenarioId(e.target.value)}
          >
            <option value="baseline">Baseline Projection</option>
            {scenarios.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.name} ({Number(sc.inflowFactor).toFixed(1)}x In, {Number(sc.outflowFactor).toFixed(1)}x Out)</option>
            ))}
          </select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download size={16} className="mr-2" />Export CSV
          </Button>
          <Button variant="primary" onClick={() => setShowScenarioModal(true)}>
            <Sliders size={16} className="mr-2" />Configure Scenario
          </Button>
        </div>
      </div>

      {forecastData && (
        <>
          {/* Starting cash overview */}
          <div className={`ui-grid-3 ${styles.s3}`}>
            {[
              { label: 'Forecast Pool Scenario', value: forecastData.scenarioName, icon: <Sliders size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
              { label: 'Starting Cash Pool', value: fmt(forecastData.startingCash), icon: <Calculator size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
              { label: 'Projected Ending cash (Week 13)', value: fmt(forecastData.forecast[12]?.cumulativeBalance || 0), icon: <TrendingUp size={20} />, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
            ].map(kpi => (
              <Card key={kpi.label} className="ui-card p-5">
                <div className="ui-flex-between">
                  <div>
                    <p className={styles.s4}>{kpi.label}</p>
                    <p className={styles.kpiValue} style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                  <div className={styles.kpiIcon} style={{ background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Projections Table */}
          <Card className="ui-card">
            <div className={styles.s5}>
              <h3 className="ui-heading-base">Weekly Forecast Calculations</h3>
              <span className="ui-text-xs-muted">Click Adjust to register manual overrides (tax, payroll, investment transfers)</span>
            </div>
            <div className="builder-table-wrapper">
              <ListPageTemplate
                columns={[
                  { key: 'weekStart', header: 'Week Start', render: (v) => <span className="font-semibold">{new Date(String(v)).toLocaleDateString()}</span> },
                  { key: 'projectedInflow', header: 'Inflow (AR)', render: (v) => <span className={styles.s6}>{fmt(Number(v))}</span> },
                  { key: 'projectedOutflow', header: 'Outflow (AP)', render: (v) => <span className={styles.s7}>{fmt(Number(v))}</span> },
                  { key: 'adjustments', header: 'Adjustments', render: (v) => <span className={Number(v) !== 0 ? styles.adjustment : styles.adjustmentZero}>{Number(v) > 0 ? '+' : ''}{fmt(Number(v))}</span> },
                  { key: 'net', header: 'Net Cash Flow', render: (v) => <span className={`${styles.netCash} ${Number(v) > 0 ? styles.cashPositive : styles.cashNegative}`}>{Number(v) > 0 ? '+' : ''}{fmt(Number(v))}</span> },
                  { key: 'cumulativeBalance', header: 'Pool Balance', render: (v) => <span className={`${styles.poolBalance} ${Number(v) > 0 ? styles.balancePositive : styles.cashNegative}`}>{fmt(Number(v))}</span> },
                  { key: 'comments', header: 'Comments', render: (v) => <span className={styles.s8}>{String(v || '—')}</span> },
                  { key: 'weekStart', header: 'Action', render: (v, row) => (
                    <Button variant="outline" size="sm" onClick={() => { setTargetWeek(row as any); setOverrideAdjustment(Number(row.adjustments)); setOverrideComments(String(row.comments || '')); setShowOverrideModal(true); }} className={styles.s9}>
                      <Edit size={12} className={styles.s10} />Adjust
                    </Button>
                  ) },
                ] as ListColumn[]}
                data={(forecastData.forecast as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No forecast data"
                emptyDescription="No weekly forecasts available."
              />
            </div>
          </Card>

          {/* Scenario configurations registry list */}
          <Card className="ui-card">
            <div className={styles.s11}>
              <h3 className="ui-heading-base">Active Simulation Scenarios</h3>
            </div>
            {scenarios.length === 0 ? (
              <div className={styles.s12}>No custom scenarios created. Use Configure Scenario button to add simulation weights.</div>
            ) : (
              <div className="ui-flex-col">
                {scenarios.map(sc => (
                  <div key={sc.id} className={styles.s13}>
                    <div>
                      <p className="font-semibold">{sc.name}</p>
                      <p className="ui-text-xs-muted">{sc.description || 'No description provided.'}</p>
                    </div>
                    <div className="ui-hstack-4">
                      <span className="ui-text-xs-muted">
                        Inflow Multiplier: <b>{Number(sc.inflowFactor).toFixed(2)}x</b> • Outflow Multiplier: <b>{Number(sc.outflowFactor).toFixed(2)}x</b>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteScenario(sc.id)} className={styles.s14}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Adjustments Override Modal */}
      {showOverrideModal && targetWeek && (
        <div className={styles.s15}>
          <Card className={`ui-card ${styles.s16}`}>
            <div className={styles.s17}>
              <h3 className="ui-heading-lg">Manual cash override</h3>
              <Button variant="outline" size="sm" onClick={() => setShowOverrideModal(false)}>Close</Button>
            </div>
            <form onSubmit={handleSaveOverride} className="p-5 ui-stack-4">
              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Week Starting
                </label>
                <input
                  type="text"
                  className="ui-input"
                  value={new Date(targetWeek.weekStart).toLocaleDateString()}
                  disabled
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Adjustment Amount ($ USD)
                </label>
                <input
                  type="number"
                  className="ui-input"
                  value={overrideAdjustment}
                  onChange={e => setOverrideAdjustment(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. -5000 for tax payment, +15000 for asset sales"
                  required
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Comments / Notes
                </label>
                <textarea className={`ui-input ${styles.s18}`}
                  value={overrideComments}
                  onChange={e => setOverrideComments(e.target.value)}
                  placeholder="Provide reason for override..."
                />
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Apply Adjustment</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Scenario Manager Modal */}
      {showScenarioModal && (
        <div className={styles.s19}>
          <Card className={`ui-card ${styles.s20}`}>
            <div className={styles.s21}>
              <h3 className="ui-heading-lg">Configure simulation scenario</h3>
              <Button variant="outline" size="sm" onClick={() => setShowScenarioModal(false)}>Close</Button>
            </div>
            <form onSubmit={handleCreateScenario} className="p-5 ui-stack-4">
              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Scenario Name
                </label>
                <input
                  type="text"
                  className="ui-input"
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                  placeholder="e.g. Sales Surge (+15%)"
                  required
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Description
                </label>
                <input
                  type="text"
                  className="ui-input"
                  value={scenarioDesc}
                  onChange={e => setScenarioDesc(e.target.value)}
                  placeholder="Reason for simulation"
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Inflow Multiplier Factor (AR)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  className="ui-input"
                  value={inflowFactor}
                  onChange={e => setInflowFactor(parseFloat(e.target.value) || 1.0)}
                  required
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Outflow Multiplier Factor (AP)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  className="ui-input"
                  value={outflowFactor}
                  onChange={e => setOutflowFactor(parseFloat(e.target.value) || 1.0)}
                  required
                />
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowScenarioModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Establish Scenario</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
