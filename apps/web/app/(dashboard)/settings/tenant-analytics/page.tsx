'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Database, FileText, RefreshCw, Server, Zap } from 'lucide-react';

interface TenantAnalytics {
  usersCount: number;
  invoicesCount: number;
  productsCount: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  apiHitsCount: number;
}

export default function TenantAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/usage-analytics', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const calculatePercent = (used: number, limit: number) => {
    if (!limit) return 0;
    return Math.round((used / limit) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BarChart3 style={{ color: 'var(--color-primary)' }} />
            Tenant Usage Analytics
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Monitor subscriber resource limits, storage consumption, users growth, and transaction API request volumes.
          </p>
        </div>
        <button onClick={fetchAnalytics} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {loading && !analytics ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Main Counters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Active Users */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>ACTIVE TEAM USERS</span>
                <Users size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <strong style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{analytics.usersCount}</strong>
              <p style={{ fontSize: '10px', color: 'var(--color-success)', marginTop: '2px' }}>Registered profiles</p>
            </div>

            {/* Invoices Count */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>LEDGER INVOICES</span>
                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <strong style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{analytics.invoicesCount}</strong>
              <p style={{ fontSize: '10px', color: 'var(--color-success)', marginTop: '2px' }}>Total documents</p>
            </div>

            {/* Products catalog */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>SKU PRODUCTS</span>
                <Database size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <strong style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{analytics.productsCount}</strong>
              <p style={{ fontSize: '10px', color: 'var(--color-success)', marginTop: '2px' }}>Inventory catalog items</p>
            </div>

            {/* API Hits */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>API REQUEST VOLUME</span>
                <Zap size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <strong style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{analytics.apiHitsCount.toLocaleString()}</strong>
              <p style={{ fontSize: '10px', color: 'var(--color-success)', marginTop: '2px' }}>This billing cycle</p>
            </div>
          </div>

          {/* Storage Quota Progress Card */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Server size={16} /> Storage Space Utilization
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>
                {formatSize(analytics.storageUsedBytes)} / {formatSize(analytics.storageLimitBytes)} ({calculatePercent(analytics.storageUsedBytes, analytics.storageLimitBytes)}%)
              </span>
            </div>
            
            <div style={{ width: '100%', height: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
              <div style={{
                width: `${calculatePercent(analytics.storageUsedBytes, analytics.storageLimitBytes)}%`, height: '100%',
                background: 'var(--color-primary)', transition: 'width 0.5s ease-in-out'
              }} />
            </div>
            
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Storage includes database files, document templates, attachments, and logs.
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
