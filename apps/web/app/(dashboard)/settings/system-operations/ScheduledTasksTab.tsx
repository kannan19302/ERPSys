'use client';

import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, CheckCircle, Pause, PlayCircle } from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import styles from './ScheduledTasksTab.module.css';

interface CronTask {
  id: string;
  name: string;
  expression: string;
  nextRun: string;
  status: string;
}

export default function ScheduledTasksTab() {
  const client = useApiClient();
  const [tasks, setTasks] = useState<CronTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      setTasks(await client.get<CronTask[]>('/admin/operations/tasks'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchTasks(); }, [client]);

  const handleTriggerTask = async (id: string) => {
    setRunningTaskId(id);
    setFeedback(null);
    try {
      const data = await client.post<{ message?: string }>(`/admin/operations/tasks/${id}/trigger`);
      setFeedback(data.message || `Task ${id} has been triggered successfully.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {
      console.error(e);
      setFeedback('Failed to trigger the scheduled task.');
    } finally {
      setRunningTaskId(null);
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <button onClick={fetchTasks} disabled={loading} className={styles.s1}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Cron List
        </button>
      </div>

      {feedback && (
        <div className={styles.s2}
        >
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      <ListPageTemplate
        columns={[
          { key: 'name', header: 'Task Name', render: (v) => <span className="font-semibold">{String(v)}</span> },
          { key: 'expression', header: 'Expression', render: (v) => <span className={styles.s3}>{String(v)}</span> },
          { key: 'nextRun', header: 'Next Run Target', render: (v) => <span className="ui-text-muted">{String(v)}</span> },
          { key: 'status', header: 'Status', render: (v) => (
            <span className={styles.s4} style={{background: v === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: v === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)'}}
            >
              {v === 'ACTIVE' ? <PlayCircle size={10} /> : <Pause size={10} />}
              {String(v)}
            </span>
          ) },
          { key: 'id', header: 'Actions', render: (v) => (
            <button onClick={() => handleTriggerTask(String(v))} disabled={runningTaskId !== null} className={styles.s5} style={{cursor: runningTaskId !== null ? 'wait' : 'pointer'}}
            >
              {runningTaskId === v ? <RefreshCw size={10} className="spin" /> : <Play size={10} />}
              Run Now
            </button>
          ) },
        ] as ListColumn[]}
        data={tasks as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No scheduled tasks"
        emptyDescription="No scheduled cron tasks registered."
      />
    </div>
  );
}
