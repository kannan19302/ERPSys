'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';

interface StorageTenant {
  id: string;
  name: string;
  usedMB: number;
  quotaMB: number;
  filesCount: number;
  plan: string;
}

export default function DriveQuotasPage() {
  const [tenants, setTenants] = useState<StorageTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotas = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/storage/quotas', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTenants(Array.isArray(data) ? data : (data?.data || []));
        }
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
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  // Calculate totals
  const totalUsed = tenants.reduce((sum, t) => sum + t.usedMB, 0);
  const totalQuota = tenants.reduce((sum, t) => sum + t.quotaMB, 0);
  const totalFiles = tenants.reduce((sum, t) => sum + t.filesCount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <HardDrive style={{ color: 'var(--color-primary)' }} />
          Storage Quotas
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Monitor per-tenant storage usage, quotas, and file counts across the platform.
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        {[
          { label: 'Total Used', value: `${(totalUsed / 1000).toFixed(1)} GB`, color: 'var(--color-primary)' },
          { label: 'Total Quota', value: `${(totalQuota / 1000).toFixed(0)} GB`, color: 'var(--color-success)' },
          { label: 'Total Files', value: totalFiles.toLocaleString(), color: 'var(--color-warning)' },
          { label: 'Tenants', value: tenants.length.toString(), color: 'var(--color-text)' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>{m.label}</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tenant Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {tenants.map(t => {
          const usagePercent = (t.usedMB / t.quotaMB) * 100;
          const usageColor = usagePercent > 90 ? 'var(--color-error)' : usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-success)';
          return (
            <div key={t.id} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{t.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{t.plan} Plan</div>
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: usageColor }}>
                  {usagePercent.toFixed(0)}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--color-bg)' }}>
                <div style={{ width: `${usagePercent}%`, height: '100%', borderRadius: '3px', background: usageColor, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--color-text-tertiary)' }}>Used:</span> <strong>{(t.usedMB / 1000).toFixed(1)} GB</strong></div>
                <div><span style={{ color: 'var(--color-text-tertiary)' }}>Quota:</span> <strong>{(t.quotaMB / 1000).toFixed(0)} GB</strong></div>
                <div><span style={{ color: 'var(--color-text-tertiary)' }}>Files:</span> <strong>{t.filesCount.toLocaleString()}</strong></div>
                <div><span style={{ color: 'var(--color-text-tertiary)' }}>Available:</span> <strong>{((t.quotaMB - t.usedMB) / 1000).toFixed(1)} GB</strong></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
