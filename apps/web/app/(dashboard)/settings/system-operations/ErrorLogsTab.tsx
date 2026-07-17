'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Search, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './ErrorLogsTab.module.css';

interface LogEntry {
  id: string;
  timestamp?: string;
  createdAt?: string;
  level: string;
  context?: string;
  source?: string;
  message: string;
  resolved?: boolean;
  resolvedBy?: string;
}

export default function ErrorLogsTab() {
  const client = useApiClient();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<LogEntry[] | { data?: LogEntry[]; totalPages?: number }>(`/admin/operations/logs?page=${page}&pageSize=50`);
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data.data) {
        setLogs(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [client, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const resolveLog = async (id: string) => {
    try {
      await client.post(`/admin/operations/logs/${id}/resolve`);
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: true } : l)));
      setToast({ message: 'Error resolved', type: 'success' });
    } catch { /* ignore */ }
  };

  const getLevelIcon = (level: string) => {
    if (level === 'ERROR') return <AlertCircle size={14} className={styles.s1} />;
    if (level === 'WARN') return <AlertTriangle size={14} className="ui-text-warning" />;
    return <Info size={14} className="ui-text-primary" />;
  };

  const getLevelStyle = (level: string) => {
    if (level === 'ERROR') return { background: 'var(--color-error-light)', borderLeft: '3px solid var(--color-error)' };
    if (level === 'WARN') return { background: 'var(--color-warning-light)', borderLeft: '3px solid var(--color-warning)' };
    return { background: 'transparent', borderLeft: '3px solid var(--color-border)' };
  };

  const filteredLogs = logs.filter((log) => {
    const ctx = log.context || log.source || '';
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase())
      || ctx.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <button onClick={fetchLogs} disabled={loading} className={styles.s2}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Logs
        </button>
      </div>

      <div className={styles.s3}
      >
        <div className={styles.s4}>
          <Search size={16} className="ui-text-muted" />
          <input type="text" placeholder="Filter by context, message or stack trace..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.s5} />
        </div>

        <div className="ui-flex ui-gap-2">
          {['ALL', 'ERROR', 'WARN'].map((lvl) => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)} className={styles.s6} style={{background: levelFilter === lvl ? 'var(--color-primary)' : 'transparent', color: levelFilter === lvl ? '#fff' : 'var(--color-text)'}}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.s7}
      >
        {loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : (
          <div className="ui-flex-col">
            {filteredLogs.map((log, idx) => (
              <div key={log.id || idx} className={styles.s8} style={{opacity: log.resolved ? 0.5 : 1}}
              >
                <div className="ui-flex-between">
                  <div className="ui-hstack-2">
                    {getLevelIcon(log.level)}
                    <span className="font-bold">[{log.level}]</span>
                    <span className="ui-text-muted">({log.context || log.source})</span>
                    {log.resolved && <span className={styles.s9}>Resolved</span>}
                  </div>
                  <div className="ui-hstack-2">
                    {!log.resolved && log.id && (
                      <button onClick={() => resolveLog(log.id)} className={styles.s10}>
                        <CheckCircle size={10} /> Resolve
                      </button>
                    )}
                    <span className={styles.s11}>
                      {new Date(log.timestamp || log.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={styles.s12}>
                  {log.message}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className={styles.s13}>
                No system telemetry log entries found matching criteria.
              </div>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.s14}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="ui-btn ui-btn-secondary text-sm">Previous</button>
          <span className={styles.s15}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="ui-btn ui-btn-secondary text-sm">Next</button>
        </div>
      )}

      {toast && (
        <div className={styles.s16} style={{background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
