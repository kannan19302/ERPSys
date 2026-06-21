'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, Layers } from 'lucide-react';

interface DbTableMetadata {
  tableName: string;
  rowCount: number;
  status: string;
}

export default function DbSchemaPage() {
  const [tables, setTables] = useState<DbTableMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/db-schema', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const filteredTables = tables.filter(t =>
    t.tableName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database style={{ color: 'var(--color-primary)' }} />
            Database Schema Inspector
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Examine current active PostgreSQL public schema tables, fields, structural models, and row volumes.
          </p>
        </div>
        <button onClick={fetchSchema} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Structure
        </button>
      </div>

      {/* Filter and search controls */}
      <div style={{
        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}>
          <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <input type="text" placeholder="Search tables by model name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: 'var(--space-2) 0', color: 'var(--color-text)', outline: 'none', fontSize: 'var(--text-sm)' }} />
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Total Database Tables: <strong>{filteredTables.length}</strong>
        </div>
      </div>

      {/* Tables schema info */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Postgres Table Name</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Row Count Estimate</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
                </td>
              </tr>
            ) : filteredTables.map((t, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', fontFamily: 'monospace' }}>{t.tableName}</td>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>{t.rowCount.toLocaleString()} rows</td>
                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                    background: 'rgba(var(--color-success-rgb), 0.1)', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Layers size={10} />
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                  <button style={{
                    background: 'transparent', border: '1px solid var(--color-border)', padding: '4px 8px',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 'var(--weight-semibold)'
                  }}>
                    Inspect Columns
                  </button>
                </td>
              </tr>
            ))}
            {filteredTables.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No schema tables match the search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
