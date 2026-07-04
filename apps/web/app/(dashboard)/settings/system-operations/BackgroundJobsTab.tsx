'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';

interface QueueJobStatus {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
}

export default function BackgroundJobsTab() {
  const [queues, setQueues] = useState<QueueJobStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/jobs', { headers: getHeaders() });
      if (res.ok) setQueues(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueues(); }, []);

  const handleRetryFailed = async () => {
    setRetrying(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/operations/jobs/retry', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.message || 'All failed background jobs have been scheduled for retry.');
        fetchQueues();
      }
    } catch (e) {
      console.error(e);
      setFeedback('Failed to request retry action.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <button onClick={handleRetryFailed} disabled={retrying} style={{
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          cursor: retrying ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}
        >
          <RefreshCw size={14} className={retrying ? 'spin' : ''} />
          {retrying ? 'Retrying...' : 'Retry Failed Jobs'}
        </button>
        <button onClick={fetchQueues} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)',
        }}
        >
          Refresh Grid
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'var(--color-success-light)', border: '1px solid var(--color-success)',
          color: 'var(--color-success)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}
        >
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Queue Name</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Active</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Waiting</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Completed</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Failed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
                </td>
              </tr>
            ) : queues.map((q, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{q.name}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', background: q.active > 0 ? 'var(--color-primary-light)' : 'var(--color-bg)', color: q.active > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{q.active}</span>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', background: q.waiting > 0 ? 'var(--color-warning-light)' : 'var(--color-bg)', color: q.waiting > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>{q.waiting}</span>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', background: 'var(--color-success-light)', color: 'var(--color-success)' }}>{q.completed}</span>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', background: q.failed > 0 ? 'var(--color-error-light)' : 'var(--color-bg)', color: q.failed > 0 ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>{q.failed}</span>
                </td>
              </tr>
            ))}
            {queues.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No background worker queues registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
