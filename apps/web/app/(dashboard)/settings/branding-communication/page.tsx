'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Image as ImageIcon, Mail, FileText, Megaphone, ShieldAlert } from 'lucide-react';
import LoginPageTab from './LoginPageTab';
import EmailServerTab from './EmailServerTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import AnnouncementsTab from './AnnouncementsTab';
import MaintenanceModeTab from './MaintenanceModeTab';

const TAB_KEYS = ['login-page', 'email-server', 'email-templates', 'announcements', 'maintenance'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function BrandingCommunicationHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'login-page';
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
    router.replace(`/settings/branding-communication?tab=${key}`, { scroll: false });
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Branding & Communication"
        description="Customize the login experience and manage outbound tenant communications"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Branding & Communication' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'login-page', label: 'Login Page', icon: <ImageIcon size={14} /> },
          { key: 'email-server', label: 'Email Server (SMTP)', icon: <Mail size={14} /> },
          { key: 'email-templates', label: 'Email Templates', icon: <FileText size={14} /> },
          { key: 'announcements', label: 'Announcements', icon: <Megaphone size={14} /> },
          { key: 'maintenance', label: 'Maintenance Mode', icon: <ShieldAlert size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'login-page' ? 'block' : 'none' }}>
        {visited.has('login-page') && <LoginPageTab />}
      </div>
      <div style={{ display: activeTab === 'email-server' ? 'block' : 'none' }}>
        {visited.has('email-server') && <EmailServerTab />}
      </div>
      <div style={{ display: activeTab === 'email-templates' ? 'block' : 'none' }}>
        {visited.has('email-templates') && <EmailTemplatesTab />}
      </div>
      <div style={{ display: activeTab === 'announcements' ? 'block' : 'none' }}>
        {visited.has('announcements') && <AnnouncementsTab />}
      </div>
      <div style={{ display: activeTab === 'maintenance' ? 'block' : 'none' }}>
        {visited.has('maintenance') && <MaintenanceModeTab />}
      </div>
    </div>
  );
}

export default function BrandingCommunicationHubPage() {
  return (
    <Suspense fallback={
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    }>
      <BrandingCommunicationHubContent />
    </Suspense>
  );
}
