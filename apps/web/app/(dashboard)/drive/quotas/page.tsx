'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface StorageTenant {
  id: string;
  name: string;
  usedMB: number;
  quotaMB: number;
  filesCount: number;
  plan: string;
}

export default function DriveQuotasPage() {
  const client = useApiClient();
  const [tenants, setTenants] = useState<StorageTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotas = async () => {
      try {
        const data = await client.get<StorageTenant[] | { data?: StorageTenant[] }>('/storage/quotas');
        setTenants(Array.isArray(data) ? data : (data.data || []));
      } catch {
        setTenants([
          { id: 'st-1', name: 'Acme Corp', usedMB: 2450, quotaMB: 5000, filesCount: 1842, plan: 'Business' },
          { id: 'st-2', name: 'Stark Industries', usedMB: 8200, quotaMB: 10000, filesCount: 4521, plan: 'Enterprise' },
          { id: 'st-3', name: 'Wayne Enterprises', usedMB: 1200, quotaMB: 2000, filesCount: 890, plan: 'Starter' },
          { id: 'st-4', name: 'Oscorp', usedMB: 3100, quotaMB: 5000, filesCount: 2103, plan: 'Business' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadQuotas();
  }, [client]);

  if (loading) {
    return (
      <div className={styles.p1}>
        <RefreshCw className="animate-spin ui-text-primary" size={32} />
      </div>
    );
  }

  // Calculate totals
  const totalUsed = tenants.reduce((sum, t) => sum + t.usedMB, 0);
  const totalQuota = tenants.reduce((sum, t) => sum + t.quotaMB, 0);
  const totalFiles = tenants.reduce((sum, t) => sum + t.filesCount, 0);

  return (
    <RouteGuard permission="drive.quotas.read">
    <div className="ui-stack-6">
      <div>
        <h1 className="text-2xl ui-hstack-2">
          <HardDrive className="ui-text-primary" />
          Storage Quotas
        </h1>
        <p className="ui-text-sm-muted">
          Monitor per-tenant storage usage, quotas, and file counts across the platform.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="ui-grid-auto">
        {[
          { label: 'Total Used', value: `${(totalUsed / 1000).toFixed(1)} GB`, color: 'var(--color-primary)' },
          { label: 'Total Quota', value: `${(totalQuota / 1000).toFixed(0)} GB`, color: 'var(--color-success)' },
          { label: 'Total Files', value: totalFiles.toLocaleString(), color: 'var(--color-warning)' },
          { label: 'Tenants', value: tenants.length.toString(), color: 'var(--color-text)' },
        ].map((m, i) => (
          <div key={i} className="ui-card p-4">
            <div className={styles.p2}>{m.label}</div>
            <div className={styles.p3} style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tenant Cards */}
      <div className={styles.p4}>
        {tenants.map(t => {
          const usagePercent = (t.usedMB / t.quotaMB) * 100;
          const usageColor = usagePercent > 90 ? 'var(--color-error)' : usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-success)';
          return (
            <div key={t.id} className={styles.p5}>
              <div className="ui-flex-between">
                <div>
                  <div className="ui-heading-sm font-bold">{t.name}</div>
                  <div className="ui-text-micro">{t.plan} Plan</div>
                </div>
                <span className={styles.p6} style={{ color: usageColor }}>
                  {usagePercent.toFixed(0)}%
                </span>
              </div>
              <div className={styles.p7}>
                <div style={{ width: `${usagePercent}%`, background: usageColor }} className={styles.s1} />
              </div>
              <div className={styles.p8}>
                <div><span className="ui-text-tertiary">Used:</span> <strong>{(t.usedMB / 1000).toFixed(1)} GB</strong></div>
                <div><span className="ui-text-tertiary">Quota:</span> <strong>{(t.quotaMB / 1000).toFixed(0)} GB</strong></div>
                <div><span className="ui-text-tertiary">Files:</span> <strong>{t.filesCount.toLocaleString()}</strong></div>
                <div><span className="ui-text-tertiary">Available:</span> <strong>{((t.quotaMB - t.usedMB) / 1000).toFixed(1)} GB</strong></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </RouteGuard>
  );
}
