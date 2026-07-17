'use client';
import styles from './ExportDataTab.module.css';
import React, { useState } from 'react';
import { useApiClient } from '@unerp/framework';
const EXPORT_ENTITIES = ['customers', 'vendors', 'products', 'employees', 'invoices'];

export default function ExportDataTab() {
  const client = useApiClient();
  const [entityType, setEntityType] = useState('customers');
  const [format, setFormat] = useState('json');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await client.get<any>(`/admin/imports/exports/${entityType}?${params}`);

      let blob: Blob;
      let filename: string;
      if (format === 'csv' && res.csv) {
        blob = new Blob([res.csv], { type: 'text/csv' });
        filename = res.filename || `${entityType}.csv`;
      } else {
        blob = new Blob([JSON.stringify(res.data || res, null, 2)], { type: 'application/json' });
        filename = res.filename || `${entityType}.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    fontSize: 'var(--text-sm)', minWidth: 180,
  };

  return (
    <div className="ui-card p-5">
      <h3 className={styles.s1}>
        Export Configurator
      </h3>

      <div className={styles.s2}>
        <div>
          <label className={styles.s3}>Entity Type</label>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={inputStyle}>
            {EXPORT_ENTITIES.map((e) => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.s3}>Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} style={inputStyle}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <div>
          <label className={styles.s3}>Date Range (optional)</label>
          <div className={styles.s4}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle }} className={styles.s5} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle }} className={styles.s5} />
          </div>
        </div>

        <button onClick={handleExport} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }} className={styles.s6}
        >
          {loading ? 'Exporting...' : 'Download Export'}
        </button>
      </div>
    </div>
  );
}
