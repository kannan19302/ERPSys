'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Badge } from '@unerp/ui';
import Link from 'next/link';
import { Search, Building } from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  userCount: number;
  createdAt: string;
}

const MOCK_TENANTS: TenantData[] = [
  { id: 't1', name: 'Acme Corp', slug: 'acme', plan: 'Enterprise', status: 'ACTIVE', userCount: 85, createdAt: '2025-01-15' },
  { id: 't2', name: 'Globex Inc', slug: 'globex', plan: 'Pro', status: 'ACTIVE', userCount: 32, createdAt: '2025-03-20' },
  { id: 't3', name: 'Initech', slug: 'initech', plan: 'Starter', status: 'TRIAL', userCount: 5, createdAt: '2026-05-10' },
  { id: 't4', name: 'Umbrella Ltd', slug: 'umbrella', plan: 'Pro', status: 'SUSPENDED', userCount: 18, createdAt: '2025-06-01' },
  { id: 't5', name: 'Wayne Enterprises', slug: 'wayne', plan: 'Enterprise', status: 'ACTIVE', userCount: 210, createdAt: '2024-11-08' },
];

const statusVariant = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'success' as const;
    case 'TRIAL': return 'info' as const;
    case 'SUSPENDED': return 'warning' as const;
    case 'CANCELLED': return 'danger' as const;
    default: return 'default' as const;
  }
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/super-admin/tenants', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tenants');
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : (data?.data || []));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load tenants';
      setError(message);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Tenants"
        subtitle="Manage all tenant organizations"
      />

      {error && (
        <div className="frappe-card" style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-yellow-50)',
          color: 'var(--color-yellow-800)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={16} style={{
          position: 'absolute',
          left: 'var(--space-3)',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-gray-400)',
        }} />
        <input
          className="frappe-input"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 'var(--space-8)', width: '100%' }}
        />
      </div>

      {/* Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                {['Name', 'Slug', 'Plan', 'Status', 'Users', 'Created'].map((h) => (
                  <th key={h} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--color-gray-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.id} style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link
                      href={`/super-admin/tenants/${tenant.id}`}
                      style={{ color: 'var(--color-blue-600)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                    {tenant.slug}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge>{tenant.plan}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <StatusBadge status={statusVariant(tenant.status)}>{tenant.status}</StatusBadge>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    {tenant.userCount}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                    {tenant.createdAt}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
