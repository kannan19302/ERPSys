'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { BookOpen, Swords } from 'lucide-react';
import PlaybooksTab from './PlaybooksTab';
import BattlecardsTab from './BattlecardsTab';

const TAB_KEYS = ['playbooks', 'battlecards'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function SalesEnablementHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'playbooks';
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
    router.replace(`/crm/sales-enablement?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Sales Enablement"
        description="Reference content that helps reps run consistent, competitive sales conversations"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Sales Enablement' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'playbooks', label: 'Playbooks', icon: <BookOpen size={14} /> },
          { key: 'battlecards', label: 'Battlecards', icon: <Swords size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'playbooks' ? 'block' : 'none' }}>
        {visited.has('playbooks') && <PlaybooksTab />}
      </div>
      <div style={{ display: activeTab === 'battlecards' ? 'block' : 'none' }}>
        {visited.has('battlecards') && <BattlecardsTab />}
      </div>
    </div>
  );
}

export default function SalesEnablementHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <SalesEnablementHubContent />
    </Suspense>
  );
}
