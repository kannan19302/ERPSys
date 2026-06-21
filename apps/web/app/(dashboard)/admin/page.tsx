'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import {
  Users,
  Shield,
  Clock,
  Activity,
  Key,
  Globe,
  Settings,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  activeUsers: number;
  totalRoles: number;
  activeSessions: number;
  apiRequestsToday: number;
}

const MOCK_STATS: AdminStats = {
  activeUsers: 85,
  totalRoles: 12,
  activeSessions: 14,
  apiRequestsToday: 3420,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/admin/stats', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      const data = await res.json();
      setStats(data?.data || data);
    } catch (err: unknown) {
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <Spinner />
      </div>
    );
  }

  const quickLinks = [
    { title: 'Users Directory', href: '/admin/users', icon: Users, desc: 'Manage organization users and invitations' },
    { title: 'Roles & Permissions', href: '/admin/access-control', icon: Shield, desc: 'Configure roles and field-level permissions' },
    { title: 'SSO Configuration', href: '/admin/sso', icon: Key, desc: 'Set up SAML and OIDC authentication Providers' },
    { title: 'Security Control Hub', href: '/admin/security', icon: Settings, desc: 'System security settings and policies' },
    { title: 'i18n Localization', href: '/admin/localization', icon: Globe, desc: 'Translate and customize localizations' },
    { title: 'Workflow Engine', href: '/admin/workflows', icon: Clock, desc: 'Approval workflows and routing rules' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Admin Control Center"
        subtitle="Manage users, access permissions, workflows, and system settings"
      />

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {[
          { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Users },
          { label: 'Configured Roles', value: stats?.totalRoles ?? 0, icon: Shield },
          { label: 'Active Sessions', value: stats?.activeSessions ?? 0, icon: Clock },
          { label: 'API Requests (Today)', value: (stats?.apiRequestsToday ?? 0).toLocaleString(), icon: Activity },
        ].map((card) => (
          <Card key={card.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
              <div style={{
                background: 'var(--color-blue-50)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)',
                display: 'flex',
              }}>
                <card.icon size={20} style={{ color: 'var(--color-blue-600)' }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>{card.label}</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Links Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Quick Administration Shortcuts</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {quickLinks.map((link) => (
            <Link href={link.href} key={link.title} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card>
                <div style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'start',
                  gap: 'var(--space-3)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                className="hover-bg-gray-50"
                >
                  <div style={{
                    background: 'var(--color-gray-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2)',
                    display: 'flex',
                  }}>
                    <link.icon size={18} style={{ color: 'var(--color-gray-700)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {link.title}
                      <ArrowRight size={12} style={{ color: 'var(--color-gray-400)' }} />
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: '2px' }}>{link.desc}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
