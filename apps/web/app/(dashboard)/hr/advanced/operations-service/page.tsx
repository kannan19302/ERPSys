'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Laptop, Calendar, ShieldAlert, HelpCircle, CheckSquare } from 'lucide-react';
import AssetsTab from './AssetsTab';
import HolidaysTab from './HolidaysTab';
import ComplianceTab from './ComplianceTab';
import HelpdeskTab from './HelpdeskTab';
import SurveysTab from './SurveysTab';

const TAB_KEYS = ['assets', 'holidays', 'compliance', 'helpdesk', 'surveys'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function OperationsServiceHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'assets';
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
    router.replace(`/hr/advanced/operations-service?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Operations & Service"
        description="Asset assignment, holiday calendars, labor compliance audits, employee helpdesk, and engagement surveys"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'HR', href: '/hr' },
          { label: 'Advanced', href: '/hr/advanced' },
          { label: 'Operations & Service' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'assets', label: 'Asset Management', icon: <Laptop size={14} /> },
          { key: 'holidays', label: 'Public Holidays', icon: <Calendar size={14} /> },
          { key: 'compliance', label: 'Labor Compliance', icon: <ShieldAlert size={14} /> },
          { key: 'helpdesk', label: 'HR Helpdesk', icon: <HelpCircle size={14} /> },
          { key: 'surveys', label: 'Engagement Surveys', icon: <CheckSquare size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'assets' ? 'block' : 'none' }}>
        {visited.has('assets') && <AssetsTab />}
      </div>
      <div style={{ display: activeTab === 'holidays' ? 'block' : 'none' }}>
        {visited.has('holidays') && <HolidaysTab />}
      </div>
      <div style={{ display: activeTab === 'compliance' ? 'block' : 'none' }}>
        {visited.has('compliance') && <ComplianceTab />}
      </div>
      <div style={{ display: activeTab === 'helpdesk' ? 'block' : 'none' }}>
        {visited.has('helpdesk') && <HelpdeskTab />}
      </div>
      <div style={{ display: activeTab === 'surveys' ? 'block' : 'none' }}>
        {visited.has('surveys') && <SurveysTab />}
      </div>
    </div>
  );
}

export default function OperationsServiceHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <OperationsServiceHubContent />
    </Suspense>
  );
}
