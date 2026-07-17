'use client';
import styles from './WebhooksConfigTab.module.css';
import React, { useState, useEffect } from 'react';
import {
  Badge, StatusBadge, ListPageTemplate, type ListColumn,
} from '@unerp/ui';

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
    <ListPageTemplate
      columns={[
        { key: 'name', header: 'Name', render: (v) => <span className="font-medium">{String(v)}</span> },
        { key: 'targetUrl', header: 'Target URL', render: (v) => <code className={styles.s1}>{String(v)}</code> },
        { key: 'events', header: 'Events', render: (v) => (
          <div className={styles.s2}>
            {JSON.parse(String(v)).map((e: string) => (
              <Badge key={e} variant="info">{e}</Badge>
            ))}
          </div>
        ) },
        { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
      ] as ListColumn[]}
      data={webhooks as unknown as Record<string, unknown>[]}
      loading={false}
      emptyTitle="No webhooks"
      emptyDescription="No webhooks configured."
    />
  );
}
