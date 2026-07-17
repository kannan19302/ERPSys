'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, DataTable } from '@unerp/ui';
import { Activity, Search, RefreshCw } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface RunLog { level: string; message: string; timestamp: string; }

export default function RunLogsPage() {
  const client = useApiClient();
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('level', filter);
      if (search) params.set('search', search);

      setLogs(await client.get<RunLog[]>(`/builder/governance/logs?${params}`));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, client]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    { 
      key: 'level', 
      header: 'Severity',
      render: (row: any) => {
        const color = row.level === 'ERROR' ? 'ui-badge-danger' : row.level === 'WARN' ? 'ui-badge-warning' : 'ui-badge-success';
        return <span className={`ui-badge ${color}`}>{row.level}</span>;
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
    <RouteGuard permission="builder.logs.read">
    <div className="p-6 ui-stack-5">
      <PageHeader 
        title="Execution Run Logs" 
        description="Monitor system-wide runtime logs. Audit automations, workflow triggers and API submissions."
        actions={
          <button className="ui-btn ui-btn-secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Logs
          </button>
        }
      />

      <div className={styles.s1}>
        <div className={styles.s2}>
          <Search size={15} className={styles.s5} />
          <input 
            className={`ui-input ${styles.s3}`} 
            placeholder="Search run logs..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            
          />
        </div>
        {['ALL', 'INFO', 'WARN', 'ERROR'].map((f: any) => (
          <button 
            key={f} 
            className={`ui-btn ${filter === f ? 'ui-btn-primary' : 'ui-btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="ui-card">
        {loading && logs.length === 0 ? (
          <div className={styles.s4}>Loading logs...</div>
        ) : (
          <DataTable columns={columns} data={logs} />
        )}
      </div>
    </div>
    </RouteGuard>
  );
}

