'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Search, AlertTriangle, Info, CheckCircle } from 'lucide-react';

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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/operations/logs?page=${page}&pageSize=50`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        } else if (data.data) {
          setLogs(data.data);
          setTotalPages(data.totalPages || 1);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const resolveLog = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/operations/logs/${id}/resolve`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: true } : l)));
        setToast({ message: 'Error resolved', type: 'success' });
      }
    } catch { /* ignore */ }
  };

  const getLevelIcon = (level: string) => {
    if (level === 'ERROR') return <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />;
    if (level === 'WARN') return <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />;
    return <Info size={14} style={{ color: 'var(--color-primary)' }} />;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={fetchLogs} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Logs
        </button>
      </div>

      <div style={{
        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)',
        alignItems: 'center',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}>
          <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <input type="text" placeholder="Filter by context, message or stack trace..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: 'var(--space-2) 0', color: 'var(--color-text)', outline: 'none', fontSize: 'var(--text-sm)' }} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['ALL', 'ERROR', 'WARN'].map((lvl) => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)} style={{
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
              background: levelFilter === lvl ? 'var(--color-primary)' : 'transparent',
              color: levelFilter === lvl ? '#fff' : 'var(--color-text)', cursor: 'pointer',
            }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLogs.map((log, idx) => (
              <div key={log.id || idx} style={{
                padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)',
                fontFamily: 'monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
                opacity: log.resolved ? 0.5 : 1,
                ...getLevelStyle(log.level),
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {getLevelIcon(log.level)}
                    <span style={{ fontWeight: 'bold' }}>[{log.level}]</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>({log.context || log.source})</span>
                    {log.resolved && <span style={{ fontSize: '9px', background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Resolved</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {!log.resolved && log.id && (
                      <button onClick={() => resolveLog(log.id)} style={{ background: 'none', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={10} /> Resolve
                      </button>
                    )}
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                      {new Date(log.timestamp || log.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ color: 'var(--color-text)', wordBreak: 'break-all', paddingLeft: '22px' }}>
                  {log.message}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                No system telemetry log entries found matching criteria.
              </div>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="frappe-btn frappe-btn-secondary" style={{ fontSize: 'var(--text-sm)' }}>Previous</button>
          <span style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="frappe-btn frappe-btn-secondary" style={{ fontSize: 'var(--text-sm)' }}>Next</button>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-lg)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
