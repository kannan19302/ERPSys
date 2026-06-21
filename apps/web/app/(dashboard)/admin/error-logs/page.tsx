'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Search, AlertTriangle, Info } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/logs', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLevelIcon = (level: string) => {
    if (level === 'ERROR') return <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />;
    if (level === 'WARN') return <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />;
    return <Info size={14} style={{ color: 'var(--color-primary)' }} />;
  };

  const getLevelStyle = (level: string) => {
    if (level === 'ERROR') return { background: 'rgba(var(--color-error-rgb), 0.05)', borderLeft: '3px solid var(--color-error)' };
    if (level === 'WARN') return { background: 'rgba(var(--color-warning-rgb), 0.05)', borderLeft: '3px solid var(--color-warning)' };
    return { background: 'transparent', borderLeft: '3px solid var(--color-border)' };
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.context.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <AlertCircle style={{ color: 'var(--color-primary)' }} />
            Error Logs Viewer
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            View system telemetry error logs, workflow stack traces, and transactional messaging issues.
          </p>
        </div>
        <button onClick={fetchLogs} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Logs
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
          <input type="text" placeholder="Filter by context, message or stack trace..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', padding: 'var(--space-2) 0', color: 'var(--color-text)', outline: 'none', fontSize: 'var(--text-sm)' }} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['ALL', 'ERROR', 'WARN'].map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)} style={{
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
              background: levelFilter === lvl ? 'var(--color-primary)' : 'transparent',
              color: levelFilter === lvl ? '#fff' : 'var(--color-text)', cursor: 'pointer'
            }}>
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Logs console grid */}
      <div style={{
        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLogs.map((log, idx) => (
              <div key={idx} style={{
                padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)',
                fontFamily: 'monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
                ...getLevelStyle(log.level)
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {getLevelIcon(log.level)}
                    <span style={{ fontWeight: 'bold' }}>[{log.level}]</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>({log.context})</span>
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
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
    </div>
  );
}
