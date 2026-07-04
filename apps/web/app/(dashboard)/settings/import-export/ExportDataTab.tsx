'use client';

import React, { useState } from 'react';

const API = '/api/v1/admin/imports';
const EXPORT_ENTITIES = ['customers', 'vendors', 'products', 'employees', 'invoices'];

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export default function ExportDataTab() {
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

      const res = await apiFetch<any>(`${API}/exports/${entityType}?${params}`);

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
    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 16 }}>
        Export Configurator
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Entity Type</label>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={inputStyle}>
            {EXPORT_ENTITIES.map((e) => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} style={inputStyle}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Date Range (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, minWidth: 0, flex: 1 }} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, minWidth: 0, flex: 1 }} />
          </div>
        </div>

        <button onClick={handleExport} disabled={loading} style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 'var(--text-sm)', fontWeight: 500, opacity: loading ? 0.6 : 1,
        }}
        >
          {loading ? 'Exporting...' : 'Download Export'}
        </button>
      </div>
    </div>
  );
}
