'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Settings, Image as ImageIcon, Smartphone, Flame, Settings2 } from 'lucide-react';
import GeneralSettingsTab from './GeneralSettingsTab';
import BrandingTab from './BrandingTab';
import WhiteLabelTab from './WhiteLabelTab';
import FeatureFlagsTab from './FeatureFlagsTab';
import CustomFieldsTab from './CustomFieldsTab';

const TAB_KEYS = ['general', 'branding', 'white-label', 'feature-flags', 'custom-fields'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function GeneralBrandingHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'general';
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
    router.replace(`/settings/general-branding?tab=${key}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="General & Branding"
        description="Organization profile, visual identity, PWA, feature flags, and custom fields"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'General & Branding' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'general', label: 'General Settings', icon: <Settings size={14} /> },
          { key: 'branding', label: 'Branding', icon: <ImageIcon size={14} /> },
          { key: 'white-label', label: 'White-Label & PWA', icon: <Smartphone size={14} /> },
          { key: 'feature-flags', label: 'Feature Flags', icon: <Flame size={14} /> },
          { key: 'custom-fields', label: 'Custom Fields', icon: <Settings2 size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
        {visited.has('general') && <GeneralSettingsTab />}
      </div>
      <div style={{ display: activeTab === 'branding' ? 'block' : 'none' }}>
        {visited.has('branding') && <BrandingTab />}
      </div>
      <div style={{ display: activeTab === 'white-label' ? 'block' : 'none' }}>
        {visited.has('white-label') && <WhiteLabelTab />}
      </div>
      <div style={{ display: activeTab === 'feature-flags' ? 'block' : 'none' }}>
        {visited.has('feature-flags') && <FeatureFlagsTab />}
      </div>
      <div style={{ display: activeTab === 'custom-fields' ? 'block' : 'none' }}>
        {visited.has('custom-fields') && <CustomFieldsTab />}
      </div>
    </div>
  );
}

export default function GeneralBrandingHubPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    }>
      <GeneralBrandingHubContent />
    </Suspense>
  );
}
