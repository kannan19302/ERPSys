'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, StatusBadge } from '@unerp/ui';

interface WebhookData {
  id: string;
  name: string;
  targetUrl: string;
  events: string;
  status: string;
  createdAt: string;
}

export default function WebhooksConfigTab() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);

  useEffect(() => {
    setWebhooks([
      { id: 'wh-1', name: 'Invoice Paid Event', targetUrl: 'https://api.external-service.com/webhooks/invoice', events: '["invoice.paid", "invoice.created"]', status: 'ACTIVE', createdAt: new Date().toLocaleDateString() },
    ]);
  }, []);

  return (
    <Card padding="none" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Target URL</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Events</th>
            <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((wh) => (
            <tr key={wh.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-medium)' }}>{wh.name}</td>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>{wh.targetUrl}</code>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {JSON.parse(wh.events).map((e: string) => (
                    <Badge key={e} variant="info">{e}</Badge>
                  ))}
                </div>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={wh.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
