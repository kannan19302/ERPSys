'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Target, FileText, Zap, Mail } from 'lucide-react';
import { RouteGuard } from '@unerp/framework';
import CampaignsTab from './CampaignsTab';
import WebFormsTab from './WebFormsTab';
import SequencesTab from './SequencesTab';
import EmailTemplatesTab from './EmailTemplatesTab';

const TAB_KEYS = ['campaigns', 'forms', 'sequences', 'templates'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function MarketingOutreachHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'campaigns';
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
    router.replace(`/crm/marketing-outreach?tab=${key}`, { scroll: false });
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Marketing & Outreach"
        description="Plan campaigns, capture leads with web forms, automate email sequences, and manage reusable templates"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Marketing & Outreach' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'campaigns', label: 'Campaigns', icon: <Target size={14} /> },
          { key: 'forms', label: 'Web Forms', icon: <FileText size={14} /> },
          { key: 'sequences', label: 'Email Sequences', icon: <Zap size={14} /> },
          { key: 'templates', label: 'Email Templates', icon: <Mail size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'campaigns' ? 'block' : 'none' }}>
        {visited.has('campaigns') && <CampaignsTab />}
      </div>
      <div style={{ display: activeTab === 'forms' ? 'block' : 'none' }}>
        {visited.has('forms') && <WebFormsTab />}
      </div>
      <div style={{ display: activeTab === 'sequences' ? 'block' : 'none' }}>
        {visited.has('sequences') && <SequencesTab />}
      </div>
      <div style={{ display: activeTab === 'templates' ? 'block' : 'none' }}>
        {visited.has('templates') && <EmailTemplatesTab />}
      </div>
    </div>
  );
}

export default function MarketingOutreachHubPage() {
  return (
    <RouteGuard permission="crm.read">
      <Suspense fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }>
        <MarketingOutreachHubContent />
      </Suspense>
    </RouteGuard>
  );
}
