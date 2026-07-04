'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, StatusBadge } from '@unerp/ui';

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
    <Card padding="none" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Event</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>HTTP Status</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge variant="info">{log.event}</Badge></td>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={log.status} /></td>
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace' }}>{log.responseStatus ?? '—'}</td>
              <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{log.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
