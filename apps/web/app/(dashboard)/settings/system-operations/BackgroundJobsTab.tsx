'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import styles from './BackgroundJobsTab.module.css';

interface QueueJobStatus {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
}

export default function BackgroundJobsTab() {
  const client = useApiClient();
  const [queues, setQueues] = useState<QueueJobStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      setQueues(await client.get<QueueJobStatus[]>('/admin/operations/jobs'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchQueues(); }, [client]);

  const handleRetryFailed = async () => {
    setRetrying(true);
    setFeedback(null);
    try {
      const data = await client.post<{ message?: string }>('/admin/operations/jobs/retry');
      setFeedback(data.message || 'All failed background jobs have been scheduled for retry.');
      void fetchQueues();
    } catch (e) {
      console.error(e);
      setFeedback('Failed to request retry action.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="ui-stack-6">
      <div className={styles.s1}>
        <button onClick={handleRetryFailed} disabled={retrying} className={styles.s2} style={{cursor: retrying ? 'wait' : 'pointer'}}
        >
          <RefreshCw size={14} className={retrying ? 'spin' : ''} />
          {retrying ? 'Retrying...' : 'Retry Failed Jobs'}
        </button>
        <button onClick={fetchQueues} disabled={loading} className={styles.s3}
        >
          Refresh Grid
        </button>
      </div>

      {feedback && (
        <div className={styles.s4}
        >
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      <ListPageTemplate
        columns={[
          { key: 'name', header: 'Queue Name', render: (v) => <span className="font-semibold">{String(v)}</span> },
          { key: 'active', header: 'Active', render: (v) => <span className={styles.s5} style={{background: Number(v) > 0 ? 'var(--color-primary-light)' : 'var(--color-bg)', color: Number(v) > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
          { key: 'waiting', header: 'Waiting', render: (v) => <span className={styles.s6} style={{background: Number(v) > 0 ? 'var(--color-warning-light)' : 'var(--color-bg)', color: Number(v) > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
          { key: 'completed', header: 'Completed', render: (v) => <span className={styles.s7}>{String(v)}</span> },
          { key: 'failed', header: 'Failed', render: (v) => <span className={styles.s8} style={{background: Number(v) > 0 ? 'var(--color-error-light)' : 'var(--color-bg)', color: Number(v) > 0 ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
        ] as ListColumn[]}
        data={queues as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No queues"
        emptyDescription="No background worker queues registered."
      />
    </div>
  );
}
