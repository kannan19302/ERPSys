'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Activity, Layers, CalendarDays, AlertCircle, Bell, Trash2 } from 'lucide-react';
import SystemHealthTab from './SystemHealthTab';
import BackgroundJobsTab from './BackgroundJobsTab';
import ScheduledTasksTab from './ScheduledTasksTab';
import ErrorLogsTab from './ErrorLogsTab';
import AdminAlertsTab from './AdminAlertsTab';
import RecycleBinTab from './RecycleBinTab';

const TAB_KEYS = ['health', 'jobs', 'tasks', 'error-logs', 'alerts', 'recycle-bin'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function SystemOperationsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'health';
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
    router.replace(`/settings/system-operations?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="System Operations"
        description="Health, background jobs, scheduled tasks, error logs, alerts, and recycle bin"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'System Operations' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'health', label: 'System Health', icon: <Activity size={14} /> },
          { key: 'jobs', label: 'Background Jobs', icon: <Layers size={14} /> },
          { key: 'tasks', label: 'Scheduled Tasks', icon: <CalendarDays size={14} /> },
          { key: 'error-logs', label: 'Error Logs', icon: <AlertCircle size={14} /> },
          { key: 'alerts', label: 'Admin Alerts', icon: <Bell size={14} /> },
          { key: 'recycle-bin', label: 'Recycle Bin', icon: <Trash2 size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'health' ? 'block' : 'none' }}>
        {visited.has('health') && <SystemHealthTab />}
      </div>
      <div style={{ display: activeTab === 'jobs' ? 'block' : 'none' }}>
        {visited.has('jobs') && <BackgroundJobsTab />}
      </div>
      <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
        {visited.has('tasks') && <ScheduledTasksTab />}
      </div>
      <div style={{ display: activeTab === 'error-logs' ? 'block' : 'none' }}>
        {visited.has('error-logs') && <ErrorLogsTab />}
      </div>
      <div style={{ display: activeTab === 'alerts' ? 'block' : 'none' }}>
        {visited.has('alerts') && <AdminAlertsTab />}
      </div>
      <div style={{ display: activeTab === 'recycle-bin' ? 'block' : 'none' }}>
        {visited.has('recycle-bin') && <RecycleBinTab />}
      </div>
    </div>
  );
}

export default function SystemOperationsHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <SystemOperationsHubContent />
    </Suspense>
  );
}
