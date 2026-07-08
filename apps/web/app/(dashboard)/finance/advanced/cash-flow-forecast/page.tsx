/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@unerp/ui';
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

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function CashFlowForecastPage() {
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
      const url = selectedScenarioId && selectedScenarioId !== 'baseline'
        ? `${API_BASE}/cash-flow/forecast?scenarioId=${selectedScenarioId}`
        : `${API_BASE}/cash-flow/forecast`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        setForecastData(await res.json() as ForecastResponse);
      }
    } catch (e) {
      console.error('Error fetching cash flow forecast:', e);
    }
  }, [selectedScenarioId]);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/cash-flow/forecast/scenarios`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setScenarios(await res.json() as Scenario[]);
      }
    } catch (e) {
      console.error('Error fetching scenarios:', e);
    }
  }, []);

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
      const res = await fetch(`${API_BASE}/cash-flow/forecast/export`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const csvText = await res.text();
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `13_week_cash_flow_forecast_${selectedScenarioId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('Error exporting CSV:', e);
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWeek) return;
    try {
      const res = await fetch(`${API_BASE}/cash-flow/forecast/adjust`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weekStart: targetWeek.weekStart,
          adjustments: Number(overrideAdjustment),
          comments: overrideComments,
        }),
      });
      if (res.ok) {
        setShowOverrideModal(false);
        fetchForecast();
      } else {
        alert('Failed to save adjustment');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving override');
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/cash-flow/forecast/scenarios`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: scenarioName,
          description: scenarioDesc,
          inflowFactor: Number(inflowFactor),
          outflowFactor: Number(outflowFactor),
          status: 'ACTIVE',
        }),
      });
      if (res.ok) {
        setShowScenarioModal(false);
        setScenarioName('');
        setScenarioDesc('');
        setInflowFactor(1.0);
        setOutflowFactor(1.0);
        await fetchScenarios();
        alert('Scenario successfully created.');
      } else {
        alert('Failed to create scenario');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this forecast scenario?')) return;
    try {
      const res = await fetch(`${API_BASE}/cash-flow/forecast/scenarios/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        if (selectedScenarioId === id) setSelectedScenarioId('baseline');
        fetchScenarios();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>13-Week Rolling Cash Flow Forecast</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Model rolling liquidity week-by-week by projecting AR Invoices, AP Payment Schedules, manual weekly adjustments, and scenarios.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select
            className="frappe-input"
            value={selectedScenarioId}
            onChange={e => setSelectedScenarioId(e.target.value)}
            style={{ width: '220px', height: '38px', margin: 0 }}
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
            <Download size={16} style={{ marginRight: 'var(--space-2)' }} />Export CSV
          </Button>
          <Button variant="primary" onClick={() => setShowScenarioModal(true)}>
            <Sliders size={16} style={{ marginRight: 'var(--space-2)' }} />Configure Scenario
          </Button>
        </div>
      </div>

      {forecastData && (
        <>
          {/* Starting cash overview */}
          <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
            {[
              { label: 'Forecast Pool Scenario', value: forecastData.scenarioName, icon: <Sliders size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
              { label: 'Starting Cash Pool', value: fmt(forecastData.startingCash), icon: <Calculator size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
              { label: 'Projected Ending cash (Week 13)', value: fmt(forecastData.forecast[12]?.cumulativeBalance || 0), icon: <TrendingUp size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            ].map(kpi => (
              <Card key={kpi.label} className="frappe-card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{kpi.label}</p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: kpi.color, marginTop: 'var(--space-2)' }}>{kpi.value}</p>
                  </div>
                  <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Projections Table */}
          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Weekly Forecast Calculations</h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Click Adjust to register manual overrides (tax, payroll, investment transfers)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Week Start</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Projected Inflow (AR)</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Projected Outflow (AP)</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Manual Adjustments</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Net Cash Flow</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Projected Pool Balance</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Adjustment Comments</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.forecast.map((w, index) => {
                    return (
                      <tr key={w.weekStart} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>{new Date(w.weekStart).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: '#22c55e' }}>{fmt(w.projectedInflow)}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: '#ef4444' }}>{fmt(w.projectedOutflow)}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: w.adjustments !== 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                          {w.adjustments > 0 ? '+' : ''}{fmt(w.adjustments)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: w.net > 0 ? '#22c55e' : '#ef4444' }}>
                          {w.net > 0 ? '+' : ''}{fmt(w.net)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: w.cumulativeBalance > 0 ? 'var(--color-text-primary)' : '#ef4444' }}>
                          {fmt(w.cumulativeBalance)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {w.comments || '—'}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <Button variant="outline" size="sm" onClick={() => {
                            setTargetWeek(w);
                            setOverrideAdjustment(w.adjustments);
                            setOverrideComments(w.comments || '');
                            setShowOverrideModal(true);
                          }} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px' }}>
                            <Edit size={12} style={{ marginRight: '4px' }} />Adjust
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Scenario configurations registry list */}
          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Active Simulation Scenarios</h3>
            </div>
            {scenarios.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No custom scenarios created. Use Configure Scenario button to add simulation weights.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {scenarios.map(sc => (
                  <div key={sc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ fontWeight: 'var(--weight-semibold)' }}>{sc.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{sc.description || 'No description provided.'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        Inflow Multiplier: <b>{Number(sc.inflowFactor).toFixed(2)}x</b> • Outflow Multiplier: <b>{Number(sc.outflowFactor).toFixed(2)}x</b>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteScenario(sc.id)} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
          <Card className="frappe-card" style={{ width: '450px', background: 'var(--color-surface-primary)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Manual cash override</h3>
              <Button variant="outline" size="sm" onClick={() => setShowOverrideModal(false)}>Close</Button>
            </div>
            <form onSubmit={handleSaveOverride} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Week Starting
                </label>
                <input
                  type="text"
                  className="frappe-input"
                  value={new Date(targetWeek.weekStart).toLocaleDateString()}
                  disabled
                  style={{ width: '100%' }}
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Adjustment Amount ($ USD)
                </label>
                <input
                  type="number"
                  className="frappe-input"
                  value={overrideAdjustment}
                  onChange={e => setOverrideAdjustment(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%' }}
                  placeholder="e.g. -5000 for tax payment, +15000 for asset sales"
                  required
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Comments / Notes
                </label>
                <textarea
                  className="frappe-input"
                  value={overrideComments}
                  onChange={e => setOverrideComments(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '8px' }}
                  placeholder="Provide reason for override..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button variant="outline" type="button" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Apply Adjustment</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Scenario Manager Modal */}
      {showScenarioModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
          <Card className="frappe-card" style={{ width: '450px', background: 'var(--color-surface-primary)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Configure simulation scenario</h3>
              <Button variant="outline" size="sm" onClick={() => setShowScenarioModal(false)}>Close</Button>
            </div>
            <form onSubmit={handleCreateScenario} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Scenario Name
                </label>
                <input
                  type="text"
                  className="frappe-input"
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                  placeholder="e.g. Sales Surge (+15%)"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Description
                </label>
                <input
                  type="text"
                  className="frappe-input"
                  value={scenarioDesc}
                  onChange={e => setScenarioDesc(e.target.value)}
                  placeholder="Reason for simulation"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Inflow Multiplier Factor (AR)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  className="frappe-input"
                  value={inflowFactor}
                  onChange={e => setInflowFactor(parseFloat(e.target.value) || 1.0)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Outflow Multiplier Factor (AP)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  className="frappe-input"
                  value={outflowFactor}
                  onChange={e => setOutflowFactor(parseFloat(e.target.value) || 1.0)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button variant="outline" type="button" onClick={() => setShowScenarioModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Establish Scenario</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
