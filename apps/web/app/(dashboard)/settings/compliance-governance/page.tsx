'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { ShieldCheck, Database, Shield, FileText } from 'lucide-react';
import ComplianceReportsTab from './ComplianceReportsTab';
import DataRetentionTab from './DataRetentionTab';
import GdprErasureTab from './GdprErasureTab';
import GdprRetentionTab from './GdprRetentionTab';

const TAB_KEYS = ['reports', 'data-retention', 'erasure', 'gdpr-retention'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function ComplianceGovernanceHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'reports';
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
    router.replace(`/settings/compliance-governance?tab=${key}`, { scroll: false });
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Compliance & Data Governance"
        description="Reports, retention policies, and GDPR data-subject request handling"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Compliance & Governance' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'reports', label: 'Compliance Reports', icon: <ShieldCheck size={14} /> },
          { key: 'data-retention', label: 'Data Retention', icon: <Database size={14} /> },
          { key: 'erasure', label: 'GDPR Erasure', icon: <Shield size={14} /> },
          { key: 'gdpr-retention', label: 'GDPR Retention', icon: <FileText size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
        {visited.has('reports') && <ComplianceReportsTab />}
      </div>
      <div style={{ display: activeTab === 'data-retention' ? 'block' : 'none' }}>
        {visited.has('data-retention') && <DataRetentionTab />}
      </div>
      <div style={{ display: activeTab === 'erasure' ? 'block' : 'none' }}>
        {visited.has('erasure') && <GdprErasureTab />}
      </div>
      <div style={{ display: activeTab === 'gdpr-retention' ? 'block' : 'none' }}>
        {visited.has('gdpr-retention') && <GdprRetentionTab />}
      </div>
    </div>
  );
}

export default function ComplianceGovernanceHubPage() {
  return (
    <Suspense fallback={
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    }>
      <ComplianceGovernanceHubContent />
    </Suspense>
  );
}
