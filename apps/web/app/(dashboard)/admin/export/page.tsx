'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';

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

export default function ExportPage() {
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

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border-default, #e5e7eb)',
    borderRadius: 'var(--radius-lg, 12px)',
    padding: 'var(--space-5, 20px)',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 'var(--radius-md, 8px)',
    border: '1px solid var(--border-default, #e5e7eb)',
    background: 'var(--bg-input, #fff)', color: 'var(--text-primary, #111)',
    fontSize: 'var(--text-sm, 14px)', minWidth: 180,
  };

  return (
    <div style={{ padding: 'var(--space-6, 24px)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl, 24px)', fontWeight: 700, marginBottom: 'var(--space-4, 16px)', color: 'var(--text-primary, #111)' }}>
        <Download size={24} style={{ verticalAlign: 'middle', marginRight: 8, display: 'inline' }} />
        Export Data Center
      </h1>

      <div className="frappe-card" style={cardStyle}>
        <h3 style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary, #111)' }}>
          Export Configurator
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary, #6b7280)' }}>Entity Type</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)} style={inputStyle}>
              {EXPORT_ENTITIES.map(e => (
                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary, #6b7280)' }}>Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} style={inputStyle}>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary, #6b7280)' }}>Date Range (optional)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, minWidth: 0, flex: 1 }} />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, minWidth: 0, flex: 1 }} />
            </div>
          </div>

          <button onClick={handleExport} disabled={loading} style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-primary, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 'var(--text-sm, 14px)', fontWeight: 500, opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Exporting...' : 'Download Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
