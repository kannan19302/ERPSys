'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Badge } from '@unerp/ui';
import { Search } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  tenantName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  lastLoginAt: string | null;
}

const MOCK_ADMINS: AdminUser[] = [
  { id: 'a1', name: 'Super Admin', email: 'admin@uni-erp.com', role: 'SUPER_ADMIN', tenantName: 'Platform', status: 'ACTIVE', lastLoginAt: '2026-06-21 09:15' },
  { id: 'a2', name: 'Jane Doe', email: 'jane@acme.com', role: 'ADMIN', tenantName: 'Acme Corp', status: 'ACTIVE', lastLoginAt: '2026-06-20 14:30' },
  { id: 'a3', name: 'Bob Smith', email: 'bob@globex.com', role: 'ADMIN', tenantName: 'Globex Inc', status: 'ACTIVE', lastLoginAt: '2026-06-19 11:00' },
  { id: 'a4', name: 'Alice Wang', email: 'alice@initech.com', role: 'ADMIN', tenantName: 'Initech', status: 'INVITED', lastLoginAt: null },
  { id: 'a5', name: 'Carlos Ruiz', email: 'carlos@wayne.com', role: 'ADMIN', tenantName: 'Wayne Enterprises', status: 'SUSPENDED', lastLoginAt: '2026-05-10 08:45' },
];

const statusVariant = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'success' as const;
    case 'INVITED': return 'info' as const;
    case 'SUSPENDED': return 'warning' as const;
    default: return 'default' as const;
  }
};

export default function AdminUsersListPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/super-admin/admins', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admin users');
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : (data?.data || []));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load admin users';
      setError(message);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filtered = admins.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
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
        title="Admin Users"
        description="All administrator and super-admin users across tenants"
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
          placeholder="Search by name, email, or tenant..."
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
                {['Name', 'Email', 'Role', 'Tenant', 'Status', 'Last Login'].map((h) => (
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
              {filtered.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                    {admin.name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                    {admin.email}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge>{admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    {admin.tenantName}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <StatusBadge status={admin.status} />
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                    {admin.lastLoginAt || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                    No admin users found
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
