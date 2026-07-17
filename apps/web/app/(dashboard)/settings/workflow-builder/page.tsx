'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { GitFork, Zap, Mail, Play } from 'lucide-react';
import TemplatesTab from './TemplatesTab';
import DynamicRoutingTab from './DynamicRoutingTab';
import EmailApprovalsTab from './EmailApprovalsTab';
import SimulatorTab from './SimulatorTab';

const TAB_KEYS = ['templates', 'routing', 'email', 'simulator'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function WorkflowBuilderHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'templates';
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
    router.replace(`/settings/workflow-builder?tab=${key}`, { scroll: false });
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Workflow Builder"
        description="Author approval templates, routing rules, email actions, and dry-run simulations"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Workflow Builder' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'templates', label: 'Templates', icon: <GitFork size={14} /> },
          { key: 'routing', label: 'Dynamic Routing', icon: <Zap size={14} /> },
          { key: 'email', label: 'Email Approvals', icon: <Mail size={14} /> },
          { key: 'simulator', label: 'Simulator', icon: <Play size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'templates' ? 'block' : 'none' }}>
        {visited.has('templates') && <TemplatesTab />}
      </div>
      <div style={{ display: activeTab === 'routing' ? 'block' : 'none' }}>
        {visited.has('routing') && <DynamicRoutingTab />}
      </div>
      <div style={{ display: activeTab === 'email' ? 'block' : 'none' }}>
        {visited.has('email') && <EmailApprovalsTab />}
      </div>
      <div style={{ display: activeTab === 'simulator' ? 'block' : 'none' }}>
        {visited.has('simulator') && <SimulatorTab />}
      </div>
    </div>
  );
}

export default function WorkflowBuilderHubPage() {
  return (
    <Suspense fallback={
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    }>
      <WorkflowBuilderHubContent />
    </Suspense>
  );
}
