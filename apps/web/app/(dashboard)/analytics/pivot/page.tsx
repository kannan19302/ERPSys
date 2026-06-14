'use client';

import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: string;
}

interface PivotItem {
  row: string;
  column: string;
  value: number;
  count: number;
}

export default function AnalyticsPivotPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  
  // Pivot aggregation states
  const [rowFields, setRowFields] = useState<string[]>(['Quarter']);
  const [colFields, setColFields] = useState<string[]>(['Channel']);
  const [aggregations, setAggregations] = useState<string[]>(['SUM(totalAmount)']);
  const [pivotData, setPivotData] = useState<PivotItem[]>([]);
  const [pivotLoading, setPivotLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/v1/analytics/reports', { headers });
        if (res.ok) {
          const data = await res.json();
          setReports(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            setSelectedReportId(data[0].id);
          }
        }
      } catch {
        // ignore
      }
    };
    loadReports();
  }, []);

  const handleRunPivot = async () => {
    if (!selectedReportId) return;
    try {
      setPivotLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/analytics/reports/${selectedReportId}/pivot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rowFields, colFields, aggregations })
      });
      const data = await res.json();
      if (data.pivotData) {
        setPivotData(data.pivotData);
      }
    } catch {
      alert('Error running pivot aggregation query.');
    } finally {
      setPivotLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReportId) {
      handleRunPivot();
    }
  }, [selectedReportId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers style={{ color: 'var(--color-primary)' }} />
            Pivot Matrix Aggregator
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Aggregate large tabular data series across dynamic row/column groups.
          </p>
        </div>

        <button 
          className="frappe-btn"
          onClick={handleRunPivot}
          disabled={pivotLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', color: 'white', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}
        >
          <RefreshCw size={14} className={pivotLoading ? 'spin-animation' : ''} />
          {pivotLoading ? 'Calculating matrix...' : 'Calculate Pivot'}
        </button>
      </div>

      <div className="frappe-card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Select Base Data Report</label>
            <select
              value={selectedReportId}
              onChange={e => setSelectedReportId(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-1.5)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', marginTop: '4px', fontSize: 'var(--text-xs)' }}
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Row Groupings</label>
            <select 
              multiple
              value={rowFields} 
              onChange={e => setRowFields(Array.from(e.target.selectedOptions).map(o => o.value))}
              style={{ width: '100%', padding: 'var(--space-1.5)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', marginTop: '4px', fontSize: 'var(--text-xs)' }}
            >
              <option value="Quarter">Quarter Period</option>
              <option value="SalesPerson">Sales Representative</option>
              <option value="Status">Invoice Status</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Column Groupings</label>
            <select 
              multiple
              value={colFields} 
              onChange={e => setColFields(Array.from(e.target.selectedOptions).map(o => o.value))}
              style={{ width: '100%', padding: 'var(--space-1.5)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', marginTop: '4px', fontSize: 'var(--text-xs)' }}
            >
              <option value="Channel">Channel Type (B2B/POS)</option>
              <option value="Region">Geographic Region</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Aggregations</label>
            <select 
              value={aggregations[0]} 
              onChange={e => setAggregations([e.target.value])}
              style={{ width: '100%', padding: 'var(--space-1.5)', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', marginTop: '4px', fontSize: 'var(--text-xs)' }}
            >
              <option value="SUM(totalAmount)">Sum of Total Amount</option>
              <option value="COUNT(id)">Transaction Counts</option>
              <option value="AVG(totalAmount)">Average Invoice Size</option>
            </select>
          </div>
        </div>

        {/* Pivot Output Table */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>Period / Row</th>
                <th style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>Channel / Col</th>
                <th style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>Value</th>
                <th style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>Transactions Count</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>{p.row}</td>
                  <td style={{ padding: 'var(--space-3)' }}>{p.column}</td>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>${p.value.toLocaleString()}</td>
                  <td style={{ padding: 'var(--space-3)' }}>{p.count}</td>
                </tr>
              ))}
              {pivotData.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No pivot data records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
