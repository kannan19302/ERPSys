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
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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

export default function ModuleManagerPage() {
  const client = useApiClient();
  const [modules, setModules] = useState<ErpModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setModules(await client.get<ErpModule[]>('/api/v1/admin/platform/modules'));
      } catch { /* use empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleToggle = async (mod: ErpModule) => {
    setToggling(mod.name);
    try {
      await client.request(`/api/v1/admin/platform/modules/${mod.name}`, {
        method: 'PATCH',
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
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <RouteGuard permission="settings.modules.read">
    <div className="ui-stack-6">
      <PageHeader
        title="Module Manager"
        description="Enable or disable ERP modules for your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/settings' },
          { label: 'Modules' },
        ]}
      />

      {/* Summary */}
      <div className="ui-hstack-4">
        <Badge variant="success">{activeCount} active</Badge>
        <Badge variant="default">{modules.length - activeCount} inactive</Badge>
        <div className="flex-1" />
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text" placeholder="Search modules..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Module Grid */}
      <div className={styles.grid}>
        {filtered.map((mod) => (
          <Card key={mod.name}>
            <div className={styles.moduleCard}>
              <div className={`${styles.moduleIcon} ${mod.isActive ? styles.moduleIconActive : ''}`}>
                {MODULE_ICONS[mod.name] || <Package size={20} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="ui-hstack-2">
                  <span className="ui-heading-sm">{mod.label}</span>
                  <Badge variant={mod.isActive ? 'success' : 'default'}>
                    {mod.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className={styles.description}>
                  {mod.description}
                </div>
              </div>
              <button
                onClick={() => handleToggle(mod)}
                disabled={toggling === mod.name}
                className={`${styles.toggle} ${mod.isActive ? styles.toggleActive : ''}`}
              >
                <div className={styles.toggleThumb} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </RouteGuard>
  );
}
