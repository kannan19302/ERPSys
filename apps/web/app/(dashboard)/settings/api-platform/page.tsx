'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Key, Shield, Box, BarChart3, Webhook, ExternalLink } from 'lucide-react';
import ApiKeysTab from './ApiKeysTab';
import OAuthClientsTab from './OAuthClientsTab';
import SandboxesTab from './SandboxesTab';
import ApiMetricsTab from './ApiMetricsTab';
import WebhooksConfigTab from './WebhooksConfigTab';
import WebhookLogsTab from './WebhookLogsTab';

const TAB_KEYS = ['api-keys', 'oauth', 'sandbox', 'analytics', 'webhooks', 'webhook-logs'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function ApiPlatformHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'api-keys';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([initialTab]));

  const handleChange = (key: string) => {
    if (!isTabKey(key)) return;
    setActiveTab(key);
    setVisited((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    router.replace(`/settings/api-platform?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="API Platform"
        description="Manage programmatic access to this tenant — keys, OAuth clients, sandboxes, and webhooks"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'API Platform' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'api-keys', label: 'API Keys', icon: <Key size={14} /> },
          { key: 'oauth', label: 'SSO & OAuth Clients', icon: <Shield size={14} /> },
          { key: 'sandbox', label: 'Developer Sandboxes', icon: <Box size={14} /> },
          { key: 'analytics', label: 'API Metrics & Analytics', icon: <BarChart3 size={14} /> },
          { key: 'webhooks', label: 'Webhooks Config', icon: <Webhook size={14} /> },
          { key: 'webhook-logs', label: 'Webhook Logs', icon: <ExternalLink size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'api-keys' ? 'block' : 'none' }}>
        {visited.has('api-keys') && <ApiKeysTab />}
      </div>
      <div style={{ display: activeTab === 'oauth' ? 'block' : 'none' }}>
        {visited.has('oauth') && <OAuthClientsTab />}
      </div>
      <div style={{ display: activeTab === 'sandbox' ? 'block' : 'none' }}>
        {visited.has('sandbox') && <SandboxesTab />}
      </div>
      <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
        {visited.has('analytics') && <ApiMetricsTab />}
      </div>
      <div style={{ display: activeTab === 'webhooks' ? 'block' : 'none' }}>
        {visited.has('webhooks') && <WebhooksConfigTab />}
      </div>
      <div style={{ display: activeTab === 'webhook-logs' ? 'block' : 'none' }}>
        {visited.has('webhook-logs') && <WebhookLogsTab />}
      </div>
    </div>
  );
}

export default function ApiPlatformHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <ApiPlatformHubContent />
    </Suspense>
  );
}
