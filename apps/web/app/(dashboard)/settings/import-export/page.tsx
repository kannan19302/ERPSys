'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Upload, Download, Smartphone } from 'lucide-react';
import ImportDataTab from './ImportDataTab';
import ExportDataTab from './ExportDataTab';
import SyncMonitorTab from './SyncMonitorTab';

const TAB_KEYS = ['import', 'export', 'sync'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function ImportExportHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'import';
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
    router.replace(`/settings/import-export?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Import / Export"
        description="Move data in and out of this tenant, and monitor offline PWA sync"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Import / Export' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'import', label: 'Import Data', icon: <Upload size={14} /> },
          { key: 'export', label: 'Export Data', icon: <Download size={14} /> },
          { key: 'sync', label: 'Sync Monitor', icon: <Smartphone size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'import' ? 'block' : 'none' }}>
        {visited.has('import') && <ImportDataTab />}
      </div>
      <div style={{ display: activeTab === 'export' ? 'block' : 'none' }}>
        {visited.has('export') && <ExportDataTab />}
      </div>
      <div style={{ display: activeTab === 'sync' ? 'block' : 'none' }}>
        {visited.has('sync') && <SyncMonitorTab />}
      </div>
    </div>
  );
}

export default function ImportExportHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <ImportExportHubContent />
    </Suspense>
  );
}
