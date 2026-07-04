'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Activity, CheckSquare, BarChart3, ShieldAlert } from 'lucide-react';
import ActiveApprovalsTab from './ActiveApprovalsTab';
import BulkApprovalsTab from './BulkApprovalsTab';
import ApprovalAnalyticsTab from './ApprovalAnalyticsTab';
import EscalationLogsTab from './EscalationLogsTab';

const TAB_KEYS = ['active', 'bulk', 'analytics', 'escalations'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function ApprovalOperationsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'active';
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
    router.replace(`/settings/approval-operations?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Approval Operations"
        description="Live monitoring of in-flight approvals, bulk actions, analytics, and escalations"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Approval Operations' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'active', label: 'Active Approvals', icon: <Activity size={14} /> },
          { key: 'bulk', label: 'Bulk Approvals', icon: <CheckSquare size={14} /> },
          { key: 'analytics', label: 'Approval Analytics', icon: <BarChart3 size={14} /> },
          { key: 'escalations', label: 'Escalation Logs', icon: <ShieldAlert size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'active' ? 'block' : 'none' }}>
        {visited.has('active') && <ActiveApprovalsTab />}
      </div>
      <div style={{ display: activeTab === 'bulk' ? 'block' : 'none' }}>
        {visited.has('bulk') && <BulkApprovalsTab />}
      </div>
      <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
        {visited.has('analytics') && <ApprovalAnalyticsTab />}
      </div>
      <div style={{ display: activeTab === 'escalations' ? 'block' : 'none' }}>
        {visited.has('escalations') && <EscalationLogsTab />}
      </div>
    </div>
  );
}

export default function ApprovalOperationsHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <ApprovalOperationsHubContent />
    </Suspense>
  );
}
