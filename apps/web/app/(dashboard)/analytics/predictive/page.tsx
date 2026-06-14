'use client';

import React, { useState } from 'react';
import { TrendingUp, BarChart3, RefreshCw, Calendar, DollarSign, Users, Package, AlertTriangle } from 'lucide-react';

interface ForecastPoint {
  period: string;
  actual: number | null;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

interface PredictionModel {
  id: string;
  name: string;
  type: 'demand' | 'cashflow' | 'churn' | 'revenue';
  icon: React.ReactNode;
  accuracy: number;
  lastTrained: string;
  forecasts: ForecastPoint[];
  insights: string[];
}

export default function PredictiveAnalyticsPage() {
  const [activeModel, setActiveModel] = useState<string>('demand');
  const [isTraining, setIsTraining] = useState(false);
  const [horizon, setHorizon] = useState(6);

  const models: PredictionModel[] = [
    {
      id: 'demand',
      name: 'Demand Forecasting',
      type: 'demand',
      icon: <Package size={20} />,
      accuracy: 87.4,
      lastTrained: '2026-06-13',
      forecasts: [
        { period: 'Jan 2026', actual: 1250, predicted: 1230, lowerBound: 1100, upperBound: 1360 },
        { period: 'Feb 2026', actual: 1380, predicted: 1350, lowerBound: 1210, upperBound: 1490 },
        { period: 'Mar 2026', actual: 1420, predicted: 1440, lowerBound: 1300, upperBound: 1580 },
        { period: 'Apr 2026', actual: 1510, predicted: 1490, lowerBound: 1350, upperBound: 1630 },
        { period: 'May 2026', actual: 1580, predicted: 1600, lowerBound: 1450, upperBound: 1750 },
        { period: 'Jun 2026', actual: null, predicted: 1680, lowerBound: 1520, upperBound: 1840 },
        { period: 'Jul 2026', actual: null, predicted: 1750, lowerBound: 1580, upperBound: 1920 },
        { period: 'Aug 2026', actual: null, predicted: 1820, lowerBound: 1640, upperBound: 2000 },
      ],
      insights: [
        'Demand is trending upward with a 8.2% month-over-month growth rate.',
        'Seasonal peak expected in Q3 based on 3-year historical patterns.',
        'SKU-4532 (Industrial Widget) shows 92% prediction confidence.',
        'Recommend increasing safety stock by 15% for Q3.',
      ],
    },
    {
      id: 'cashflow',
      name: 'Cash Flow Prediction',
      type: 'cashflow',
      icon: <DollarSign size={20} />,
      accuracy: 91.2,
      lastTrained: '2026-06-12',
      forecasts: [
        { period: 'Jan 2026', actual: 245000, predicted: 240000, lowerBound: 220000, upperBound: 260000 },
        { period: 'Feb 2026', actual: 268000, predicted: 270000, lowerBound: 248000, upperBound: 292000 },
        { period: 'Mar 2026', actual: 290000, predicted: 285000, lowerBound: 262000, upperBound: 308000 },
        { period: 'Apr 2026', actual: 275000, predicted: 280000, lowerBound: 255000, upperBound: 305000 },
        { period: 'May 2026', actual: 310000, predicted: 305000, lowerBound: 278000, upperBound: 332000 },
        { period: 'Jun 2026', actual: null, predicted: 325000, lowerBound: 295000, upperBound: 355000 },
        { period: 'Jul 2026', actual: null, predicted: 340000, lowerBound: 308000, upperBound: 372000 },
        { period: 'Aug 2026', actual: null, predicted: 358000, lowerBound: 322000, upperBound: 394000 },
      ],
      insights: [
        'Net positive cash flow predicted for all months in forecast horizon.',
        'AR collection cycle averaging 28 days — recommend targeting 23 days.',
        'Largest cash outflow category: Vendor Payments (42% of disbursements).',
        'Cash reserve buffer of $50K recommended for July capex cycle.',
      ],
    },
    {
      id: 'churn',
      name: 'Customer Churn Risk',
      type: 'churn',
      icon: <Users size={20} />,
      accuracy: 84.6,
      lastTrained: '2026-06-11',
      forecasts: [
        { period: 'Jan 2026', actual: 3.2, predicted: 3.5, lowerBound: 2.8, upperBound: 4.2 },
        { period: 'Feb 2026', actual: 3.8, predicted: 3.6, lowerBound: 2.9, upperBound: 4.3 },
        { period: 'Mar 2026', actual: 2.9, predicted: 3.1, lowerBound: 2.4, upperBound: 3.8 },
        { period: 'Apr 2026', actual: 4.1, predicted: 3.8, lowerBound: 3.1, upperBound: 4.5 },
        { period: 'May 2026', actual: 3.5, predicted: 3.4, lowerBound: 2.7, upperBound: 4.1 },
        { period: 'Jun 2026', actual: null, predicted: 3.2, lowerBound: 2.5, upperBound: 3.9 },
        { period: 'Jul 2026', actual: null, predicted: 3.0, lowerBound: 2.3, upperBound: 3.7 },
        { period: 'Aug 2026', actual: null, predicted: 2.8, lowerBound: 2.1, upperBound: 3.5 },
      ],
      insights: [
        'Churn rate trending downward — 12% improvement vs. prior quarter.',
        '14 high-risk accounts identified for proactive engagement.',
        'Top churn predictor: No purchase in last 45 days (78% correlation).',
        'Recommend loyalty program activation for accounts with >$10K LTV.',
      ],
    },
    {
      id: 'revenue',
      name: 'Revenue Forecast',
      type: 'revenue',
      icon: <TrendingUp size={20} />,
      accuracy: 89.8,
      lastTrained: '2026-06-14',
      forecasts: [
        { period: 'Jan 2026', actual: 520000, predicted: 510000, lowerBound: 470000, upperBound: 550000 },
        { period: 'Feb 2026', actual: 548000, predicted: 540000, lowerBound: 500000, upperBound: 580000 },
        { period: 'Mar 2026', actual: 590000, predicted: 580000, lowerBound: 540000, upperBound: 620000 },
        { period: 'Apr 2026', actual: 615000, predicted: 610000, lowerBound: 565000, upperBound: 655000 },
        { period: 'May 2026', actual: 640000, predicted: 645000, lowerBound: 598000, upperBound: 692000 },
        { period: 'Jun 2026', actual: null, predicted: 680000, lowerBound: 630000, upperBound: 730000 },
        { period: 'Jul 2026', actual: null, predicted: 720000, lowerBound: 665000, upperBound: 775000 },
        { period: 'Aug 2026', actual: null, predicted: 755000, lowerBound: 695000, upperBound: 815000 },
      ],
      insights: [
        'Revenue growth trajectory: 7.5% compound monthly growth rate.',
        'Enterprise segment contributing 62% of total — up from 54%.',
        'Cross-sell opportunities detected for 28 accounts (est. $85K pipeline).',
        'Q3 revenue target of $2.15M is achievable with 95% confidence.',
      ],
    },
  ];

  const current = models.find(m => m.id === activeModel) ?? models[0]!;
  const maxVal = Math.max(...current.forecasts.map(f => f.upperBound));

  const handleRetrain = () => {
    setIsTraining(true);
    setTimeout(() => setIsTraining(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingUp style={{ color: 'var(--color-primary)' }} />
            Predictive Analytics
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            ML-powered forecasting for demand planning, cash flow, customer churn, and revenue projections.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Horizon:</label>
          <select value={horizon} onChange={e => setHorizon(Number(e.target.value))} style={{
            padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)'
          }}>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
          <button onClick={handleRetrain} disabled={isTraining} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
          }}>
            <RefreshCw size={14} className={isTraining ? 'animate-spin' : ''} style={isTraining ? { animation: 'spin 1s linear infinite' } : {}} />
            {isTraining ? 'Training...' : 'Retrain Models'}
          </button>
        </div>
      </div>

      {/* Model Selector Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-1)' }}>
        {models.map(m => (
          <button key={m.id} onClick={() => setActiveModel(m.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeModel === m.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeModel === m.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', transition: 'all 0.2s ease'
          }}>
            {m.icon} {m.name}
          </button>
        ))}
      </div>

      {/* Model Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Model Accuracy</div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: current.accuracy >= 85 ? 'var(--color-success)' : 'var(--color-warning)' }}>{current.accuracy}%</div>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Last Trained</div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Calendar size={16} /> {current.lastTrained}</div>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Forecast Horizon</div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>{horizon} months</div>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Data Points</div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>{current.forecasts.filter(f => f.actual !== null).length} actual / {current.forecasts.length} total</div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>
          <BarChart3 size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />
          Forecast Visualization
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: '220px', paddingBottom: 'var(--space-4)' }}>
          {current.forecasts.map((f, i) => {
            const barH = (f.predicted / maxVal) * 180;
            const actualH = f.actual ? (f.actual / maxVal) * 180 : 0;
            const isForecast = f.actual === null;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>
                  {f.predicted >= 1000 ? `${(f.predicted / 1000).toFixed(0)}K` : f.predicted.toFixed(1)}
                </span>
                <div style={{ position: 'relative', display: 'flex', gap: '2px' }}>
                  {f.actual !== null && (
                    <div style={{
                      width: '16px', height: `${actualH}px`, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      background: 'var(--color-primary)', opacity: 0.9
                    }} />
                  )}
                  <div style={{
                    width: '16px', height: `${barH}px`, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    background: isForecast ? 'var(--color-warning)' : 'var(--color-success)',
                    opacity: isForecast ? 0.7 : 0.9,
                    border: isForecast ? '1px dashed var(--color-warning)' : 'none'
                  }} />
                </div>
                <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', writingMode: 'vertical-lr', transform: 'rotate(180deg)', maxHeight: '60px' }}>
                  {f.period.replace(' 2026', '')}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }} /> Actual
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--color-success)', borderRadius: '2px' }} /> Predicted (Historical)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--color-warning)', borderRadius: '2px', border: '1px dashed var(--color-warning)' }} /> Forecast
          </div>
        </div>
      </div>

      {/* Insights */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
          AI-Generated Insights
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
          {current.insights.map((insight, i) => (
            <div key={i} style={{
              padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              fontSize: 'var(--text-sm)', color: 'var(--color-text)',
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)'
            }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)', minWidth: '20px' }}>#{i + 1}</span>
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
