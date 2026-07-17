'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { Users, ShieldCheck, Package } from 'lucide-react';
import UsersTab from './UsersTab';
import GroupsTab from './GroupsTab';
import RolesTab from './RolesTab';
import PackagesTab from './PackagesTab';

const TAB_KEYS = ['users', 'groups', 'roles', 'packages'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function IdentityAccessHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'users';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  // Track which tabs have ever been activated so each tab lazy-loads its data
  // on first activation only, not all four on page mount.
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
    router.replace(`/settings/identity-access?tab=${key}`, { scroll: false });
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Identity & Access"
        description="Manage users, groups, roles, and access packages across your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Identity & Access' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'users', label: 'Users', icon: <Users size={14} /> },
          { key: 'groups', label: 'Groups & Teams', icon: <Users size={14} /> },
          { key: 'roles', label: 'Roles', icon: <ShieldCheck size={14} /> },
          { key: 'packages', label: 'Access Packages', icon: <Package size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      {/* Each tab keeps fully independent fetch/loading/error/pagination state.
          Tabs that have never been activated are not mounted at all, so their
          API calls do not fire until the user switches to them. Once visited,
          a tab stays mounted (hidden via CSS) so its state isn't lost when
          switching away and back. */}
      <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
        {visited.has('users') && <UsersTab />}
      </div>
      <div style={{ display: activeTab === 'groups' ? 'block' : 'none' }}>
        {visited.has('groups') && <GroupsTab />}
      </div>
      <div style={{ display: activeTab === 'roles' ? 'block' : 'none' }}>
        {visited.has('roles') && <RolesTab />}
      </div>
      <div style={{ display: activeTab === 'packages' ? 'block' : 'none' }}>
        {visited.has('packages') && <PackagesTab />}
      </div>
    </div>
  );
}

export default function IdentityAccessHubPage() {
  return (
    <Suspense fallback={
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    }>
      <IdentityAccessHubContent />
    </Suspense>
  );
}
