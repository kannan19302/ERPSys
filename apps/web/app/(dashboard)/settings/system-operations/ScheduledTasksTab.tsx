'use client';

import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, CheckCircle, Pause, PlayCircle } from 'lucide-react';

interface CronTask {
  id: string;
  name: string;
  expression: string;
  nextRun: string;
  status: string;
}

export default function ScheduledTasksTab() {
  const [tasks, setTasks] = useState<CronTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/tasks', { headers: getHeaders() });
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleTriggerTask = async (id: string) => {
    setRunningTaskId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/operations/tasks/${id}/trigger`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.message || `Task ${id} has been triggered successfully.`);
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (e) {
      console.error(e);
      setFeedback('Failed to trigger the scheduled task.');
    } finally {
      setRunningTaskId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={fetchTasks} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Cron List
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
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Task Name</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Expression</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Next Run Target</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
                </td>
              </tr>
            ) : tasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{t.name}</td>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>{t.expression}</td>
                <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{t.nextRun}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                    background: t.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg-sunken)',
                    color: t.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}
                  >
                    {t.status === 'ACTIVE' ? <PlayCircle size={10} /> : <Pause size={10} />}
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <button onClick={() => handleTriggerTask(t.id)} disabled={runningTaskId !== null} style={{
                    background: 'transparent', border: '1px solid var(--color-border)', padding: '4px 12px',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', cursor: runningTaskId !== null ? 'wait' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontWeight: 'var(--weight-semibold)',
                  }}
                  >
                    {runningTaskId === t.id ? <RefreshCw size={10} className="spin" /> : <Play size={10} />}
                    Run Now
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No scheduled cron tasks registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
