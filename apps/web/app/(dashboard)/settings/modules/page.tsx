'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Badge, Spinner, Button,
} from '@unerp/ui';
import {
  Settings, RefreshCw, CheckCircle, Package, Search,
  DollarSign, Users, ShoppingCart, Warehouse, Factory,
  TruckIcon, BarChart3, Briefcase, Store, MessageSquare,
} from 'lucide-react';

interface ErpModule {
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  category?: string;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  finance: <DollarSign size={20} />,
  hr: <Users size={20} />,
  crm: <Briefcase size={20} />,
  inventory: <Warehouse size={20} />,
  sales: <ShoppingCart size={20} />,
  procurement: <Package size={20} />,
  manufacturing: <Factory size={20} />,
  'supply-chain': <TruckIcon size={20} />,
  analytics: <BarChart3 size={20} />,
  pos: <Store size={20} />,
  projects: <Settings size={20} />,
  communication: <MessageSquare size={20} />,
};

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function ModuleManagerPage() {
  const [modules, setModules] = useState<ErpModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/platform/modules', {
          headers: { Authorization: `Bearer ${getToken() || ''}` },
        });
        if (res.ok) setModules(await res.json());
      } catch { /* use empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleToggle = async (mod: ErpModule) => {
    setToggling(mod.name);
    try {
      await fetch(`/api/v1/admin/platform/modules/${mod.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ isActive: !mod.isActive }),
      });
      setModules((prev) => prev.map((m) => m.name === mod.name ? { ...m, isActive: !m.isActive } : m));
    } catch { /* handled */ }
    finally { setToggling(null); }
  };

  const filtered = modules.filter((m) =>
    !search || m.label.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = modules.filter(m => m.isActive).length;

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Module Manager"
        description="Enable or disable ERP modules for your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Modules' },
        ]}
      />

      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Badge variant="success">{activeCount} active</Badge>
        <Badge variant="default">{modules.length - activeCount} inactive</Badge>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', maxWidth: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text" placeholder="Search modules..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)',
              color: 'var(--color-text)', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Module Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {filtered.map((mod) => (
          <Card key={mod.name}>
            <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                background: mod.isActive ? 'var(--color-primary-light)' : 'var(--color-bg-sunken)',
                color: mod.isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all var(--duration-fast) var(--ease-default)',
              }}>
                {MODULE_ICONS[mod.name] || <Package size={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{mod.label}</span>
                  <Badge variant={mod.isActive ? 'success' : 'default'}>
                    {mod.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mod.description}
                </div>
              </div>
              <button
                onClick={() => handleToggle(mod)}
                disabled={toggling === mod.name}
                style={{
                  width: 44, height: 24, borderRadius: 'var(--radius-full)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  background: mod.isActive ? 'var(--color-primary)' : 'var(--color-bg-sunken)',
                  transition: 'background var(--duration-fast) var(--ease-default)',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 'var(--radius-full)',
                  background: '#fff', boxShadow: 'var(--shadow-sm)',
                  position: 'absolute', top: 3,
                  left: mod.isActive ? 23 : 3,
                  transition: 'left var(--duration-fast) var(--ease-default)',
                }} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
