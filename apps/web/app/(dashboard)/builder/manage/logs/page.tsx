'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Activity, Search, RefreshCw } from 'lucide-react';

export default function RunLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('level', filter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/v1/builder/governance/logs?${params}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    { 
      key: 'level', 
      header: 'Severity',
      render: (row: any) => {
        const color = row.level === 'ERROR' ? 'frappe-badge-danger' : row.level === 'WARN' ? 'frappe-badge-warning' : 'frappe-badge-success';
        return <span className={`frappe-badge ${color}`}>{row.level}</span>;
      }
    },
    { key: 'message', header: 'Event Log Message' },
    { 
      key: 'timestamp', 
      header: 'Executed At',
      render: (row: any) => new Date(row.timestamp).toLocaleString()
    }
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader 
        title="Execution Run Logs" 
        description="Monitor system-wide runtime logs. Audit automations, workflow triggers and API submissions."
        actions={
          <button className="frappe-btn frappe-btn-secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Logs
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input 
            className="frappe-input" 
            placeholder="Search run logs..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ paddingLeft: 30 }}
          />
        </div>
        {['ALL', 'INFO', 'WARN', 'ERROR'].map((f: any) => (
          <button 
            key={f} 
            className={`frappe-btn ${filter === f ? 'frappe-btn-primary' : 'frappe-btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="frappe-card">
        {loading && logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Loading logs...</div>
        ) : (
          <DataTable columns={columns} data={logs} />
        )}
      </div>
    </div>
  );
}

