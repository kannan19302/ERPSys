'use client';

import React, { useState, useEffect } from 'react';
import { GitFork, RefreshCw } from 'lucide-react';

export default function AnalyticsQueryPage() {
  const [selectFields, setSelectFields] = useState<string[]>(['invoiceNumber', 'totalAmount', 'status']);
  const [filterGroups] = useState<unknown[]>([]);
  const [queryRows, setQueryRows] = useState<Record<string, unknown>[]>([]);
  const [queryFields, setQueryFields] = useState<string[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);

  const handleRunVisualQuery = async () => {
    try {
      setQueryLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/analytics/query/visual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectFields, filterGroups })
      });
      const data = await res.json();
      if (data.success) {
        setQueryRows(data.rows || []);
        setQueryFields(data.fields || []);
      } else {
        alert(data.message || 'Error executing query.');
      }
    } catch {
      alert('Error running secure visual query.');
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    handleRunVisualQuery();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <GitFork style={{ color: 'var(--color-primary)' }} />
            Secure Visual Query Builder
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Build and execute secure database search queries through our schema-validated Prisma visual builder.
          </p>
        </div>

        <button 
          className="frappe-btn"
          onClick={handleRunVisualQuery}
          disabled={queryLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', color: 'white', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}
        >
          <RefreshCw size={14} className={queryLoading ? 'spin-animation' : ''} />
          {queryLoading ? 'Running query...' : 'Run secure query'}
        </button>
      </div>

      <div className="frappe-card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Secure Builder Select controls */}
        <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Select Columns (Prisma Schema Whitelisted)</label>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1.5)', flexWrap: 'wrap' }}>
            {['id', 'invoiceNumber', 'totalAmount', 'status', 'createdAt'].map(col => {
              const selected = selectFields.includes(col);
              return (
                <button
                  key={col}
                  onClick={() => {
                    if (selected) {
                      setSelectFields(selectFields.filter(f => f !== col));
                    } else {
                      setSelectFields([...selectFields, col]);
                    }
                  }}
                  style={{
                    padding: 'var(--space-1) var(--space-2.5)', fontSize: '11px', borderRadius: '4px',
                    border: selected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: selected ? 'var(--color-primary-light)' : 'none',
                    color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {col}
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Results Table */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
                {queryFields.map(f => (
                  <th key={f} style={{ padding: 'var(--space-3)', fontWeight: 'bold' }}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {queryFields.map(f => (
                    <td key={f} style={{ padding: 'var(--space-3)' }}>{row[f] ? row[f].toString() : 'null'}</td>
                  ))}
                </tr>
              ))}
              {queryRows.length === 0 && (
                <tr>
                  <td colSpan={selectFields.length || 5} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No query logs run yet. Execute secure search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
