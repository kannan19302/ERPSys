'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Tabs, Spinner } from '@unerp/ui';
import { ShieldAlert, Key, Smartphone, Lock, Monitor, Globe, History, Clock } from 'lucide-react';
import OverviewTab from './OverviewTab';
import SsoTab from './SsoTab';
import MfaTab from './MfaTab';
import PasswordPolicyTab from './PasswordPolicyTab';
import SessionsTab from './SessionsTab';
import IpRestrictionsTab from './IpRestrictionsTab';
import AuditLogTable from './AuditLogTable';

const TAB_KEYS = ['overview', 'sso', 'mfa', 'password-policy', 'sessions', 'ip-rules', 'audit-trail', 'login-history'] as const;
type TabKey = typeof TAB_KEYS[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function SecurityPoliciesHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'overview';
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
    router.replace(`/settings/security-policies?tab=${key}`, { scroll: false });
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Security Policies"
        description="Configure authentication, access policies, sessions, and audit visibility"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Security Policies' },
        ]}
      />

      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview', icon: <ShieldAlert size={14} /> },
          { key: 'sso', label: 'SSO', icon: <Key size={14} /> },
          { key: 'mfa', label: 'MFA / 2FA', icon: <Smartphone size={14} /> },
          { key: 'password-policy', label: 'Password Policy', icon: <Lock size={14} /> },
          { key: 'sessions', label: 'Active Sessions', icon: <Monitor size={14} /> },
          { key: 'ip-rules', label: 'IP & Geo Rules', icon: <Globe size={14} /> },
          { key: 'audit-trail', label: 'Audit Trail', icon: <History size={14} /> },
          { key: 'login-history', label: 'Login History', icon: <Clock size={14} /> },
        ]}
        value={activeTab}
        onChange={handleChange}
      />

      <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
        {visited.has('overview') && <OverviewTab onNavigateTab={handleChange} />}
      </div>
      <div style={{ display: activeTab === 'sso' ? 'block' : 'none' }}>
        {visited.has('sso') && <SsoTab />}
      </div>
      <div style={{ display: activeTab === 'mfa' ? 'block' : 'none' }}>
        {visited.has('mfa') && <MfaTab />}
      </div>
      <div style={{ display: activeTab === 'password-policy' ? 'block' : 'none' }}>
        {visited.has('password-policy') && <PasswordPolicyTab />}
      </div>
      <div style={{ display: activeTab === 'sessions' ? 'block' : 'none' }}>
        {visited.has('sessions') && <SessionsTab />}
      </div>
      <div style={{ display: activeTab === 'ip-rules' ? 'block' : 'none' }}>
        {visited.has('ip-rules') && <IpRestrictionsTab />}
      </div>
      <div style={{ display: activeTab === 'audit-trail' ? 'block' : 'none' }}>
        {visited.has('audit-trail') && <AuditLogTable emptyMessage="Adjust your search or filters to find specific events." />}
      </div>
      <div style={{ display: activeTab === 'login-history' ? 'block' : 'none' }}>
        {visited.has('login-history') && <AuditLogTable actionFilter="LOGIN" emptyMessage="No authentication logs found." />}
      </div>
    </div>
  );
}

export default function SecurityPoliciesHubPage() {
  return (
    <Suspense fallback={
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    }>
      <SecurityPoliciesHubContent />
    </Suspense>
  );
}
