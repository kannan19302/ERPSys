'use client';
import styles from './WebhookLogsTab.module.css';
import React, { useState, useEffect } from 'react';
import {
  Badge, StatusBadge, ListPageTemplate, type ListColumn,
} from '@unerp/ui';

interface LogData {
  id: string;
  event: string;
  status: string;
  responseStatus: number | null;
  createdAt: string;
}

export default function WebhookLogsTab() {
  const [logs, setLogs] = useState<LogData[]>([]);

  useEffect(() => {
    setLogs([
      { id: 'log-1', event: 'invoice.paid', status: 'SUCCESS', responseStatus: 200, createdAt: new Date().toLocaleString() },
      { id: 'log-2', event: 'invoice.created', status: 'FAILED', responseStatus: 500, createdAt: new Date(Date.now() - 3600000).toLocaleString() },
    ]);
  }, []);

  return (
    <ListPageTemplate
      columns={[
        { key: 'event', header: 'Event', render: (v) => <Badge variant="info">{String(v)}</Badge> },
        { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
        { key: 'responseStatus', header: 'HTTP Status', render: (v) => <span className="font-mono">{v != null ? String(v) : '—'}</span> },
        { key: 'createdAt', header: 'Time', render: (v) => <span className={styles.s1}>{String(v)}</span> },
      ] as ListColumn[]}
      data={logs as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No webhook logs"
      emptyDescription="No webhook delivery logs."
    />
  );
}
