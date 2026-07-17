'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
        const data = await client.get<Report[]>('/analytics/reports');
        setReports(Array.isArray(data) ? data : []);
        const firstReport = data[0];
        if (firstReport) {
          setSelectedReportId(firstReport.id);
        }
      } catch {
        // ignore
      }
    };
    loadReports();
  }, [client]);

  const handleRunPivot = async () => {
    if (!selectedReportId) return;
    try {
      setPivotLoading(true);
      const data = await client.post<{ pivotData?: PivotItem[] }>(`/analytics/reports/${selectedReportId}/pivot`, { rowFields, colFields, aggregations });
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
    <RouteGuard permission="analytics.pivot.read">
      <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Layers className="ui-text-primary" />
            Pivot Matrix Aggregator
          </h1>
          <p className="ui-text-sm-muted">
            Aggregate large tabular data series across dynamic row/column groups.
          </p>
        </div>

        <button 
          className={`ui-btn ${styles.s1}`}
          onClick={handleRunPivot}
          disabled={pivotLoading}
          
        >
          <RefreshCw size={14} className={pivotLoading ? 'spin-animation' : ''} />
          {pivotLoading ? 'Calculating matrix...' : 'Calculate Pivot'}
        </button>
      </div>

      <div className={`ui-card ${styles.s2}`} >
        <div className={styles.s3}>
          <div>
            <label className={styles.s4}>Select Base Data Report</label>
            <select
              value={selectedReportId}
              onChange={e => setSelectedReportId(e.target.value)}
              className={styles.s5}
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.s4}>Row Groupings</label>
            <select 
              multiple
              value={rowFields} 
              onChange={e => setRowFields(Array.from(e.target.selectedOptions).map(o => o.value))}
              className={styles.s5}
            >
              <option value="Quarter">Quarter Period</option>
              <option value="SalesPerson">Sales Representative</option>
              <option value="Status">Invoice Status</option>
            </select>
          </div>
          <div>
            <label className={styles.s4}>Column Groupings</label>
            <select 
              multiple
              value={colFields} 
              onChange={e => setColFields(Array.from(e.target.selectedOptions).map(o => o.value))}
              className={styles.s5}
            >
              <option value="Channel">Channel Type (B2B/POS)</option>
              <option value="Region">Geographic Region</option>
            </select>
          </div>
          <div>
            <label className={styles.s4}>Aggregations</label>
            <select 
              value={aggregations[0]} 
              onChange={e => setAggregations([e.target.value])}
              className={styles.s5}
            >
              <option value="SUM(totalAmount)">Sum of Total Amount</option>
              <option value="COUNT(id)">Transaction Counts</option>
              <option value="AVG(totalAmount)">Average Invoice Size</option>
            </select>
          </div>
        </div>

        {/* Pivot Output Table */}
        <div className={styles.s6}>
          <table className={styles.s7}>
            <thead>
              <tr className={styles.s8}>
                <th className={styles.s9}>Period / Row</th>
                <th className={styles.s9}>Channel / Col</th>
                <th className={styles.s9}>Value</th>
                <th className={styles.s9}>Transactions Count</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.map((p, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3">{p.row}</td>
                  <td className="p-3">{p.column}</td>
                  <td className={styles.s9}>${p.value.toLocaleString()}</td>
                  <td className="p-3">{p.count}</td>
                </tr>
              ))}
              {pivotData.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.s10}>No pivot data records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </RouteGuard>
  );
}
