'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Database, FileText, RefreshCw, Server, Zap } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface TenantAnalytics {
  usersCount: number;
  invoicesCount: number;
  productsCount: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  apiHitsCount: number;
}

export default function TenantAnalyticsPage() {
  const client = useApiClient();
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      setAnalytics(await client.get<TenantAnalytics>('/admin/platform/usage-analytics'));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics();
  }, [client]);

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
    <RouteGuard permission="settings.tenant-analytics.read">
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <BarChart3 className="ui-text-primary" />
            Tenant Usage Analytics
          </h1>
          <p className="ui-text-sm-muted">
            Monitor subscriber resource limits, storage consumption, users growth, and transaction API request volumes.
          </p>
        </div>
        <button onClick={fetchAnalytics} disabled={loading} className={styles.refreshButton}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {loading && !analytics ? (
        <div className="ui-flex-center p-8">
          <RefreshCw size={24} className="spin ui-text-muted" />
        </div>
      ) : analytics && (
        <div className="ui-stack-6">
          
          {/* Main Counters Grid */}
          <div className={styles.metricGrid}>
            {/* Active Users */}
            <div className="ui-card p-5">
              <div className="ui-flex-between mb-2">
                <span className={styles.metricLabel}>ACTIVE TEAM USERS</span>
                <Users size={18} className="ui-text-primary" />
              </div>
              <strong className="text-2xl">{analytics.usersCount}</strong>
              <p className={styles.metricDetail}>Registered profiles</p>
            </div>

            {/* Invoices Count */}
            <div className="ui-card p-5">
              <div className="ui-flex-between mb-2">
                <span className={styles.metricLabel}>LEDGER INVOICES</span>
                <FileText size={18} className="ui-text-primary" />
              </div>
              <strong className="text-2xl">{analytics.invoicesCount}</strong>
              <p className={styles.metricDetail}>Total documents</p>
            </div>

            {/* Products catalog */}
            <div className="ui-card p-5">
              <div className="ui-flex-between mb-2">
                <span className={styles.metricLabel}>SKU PRODUCTS</span>
                <Database size={18} className="ui-text-primary" />
              </div>
              <strong className="text-2xl">{analytics.productsCount}</strong>
              <p className={styles.metricDetail}>Inventory catalog items</p>
            </div>

            {/* API Hits */}
            <div className="ui-card p-5">
              <div className="ui-flex-between mb-2">
                <span className={styles.metricLabel}>API REQUEST VOLUME</span>
                <Zap size={18} className="ui-text-primary" />
              </div>
              <strong className="text-2xl">{analytics.apiHitsCount.toLocaleString()}</strong>
              <p className={styles.metricDetail}>This billing cycle</p>
            </div>
          </div>

          {/* Storage Quota Progress Card */}
          <div className="ui-card p-5">
            <div className="ui-flex-between mb-4">
              <span className={styles.storageHeading}>
                <Server size={16} /> Storage Space Utilization
              </span>
              <span className={styles.storageAmount}>
                {formatSize(analytics.storageUsedBytes)} / {formatSize(analytics.storageLimitBytes)} ({calculatePercent(analytics.storageUsedBytes, analytics.storageLimitBytes)}%)
              </span>
            </div>
            
            <div className={styles.progressTrack}>
              <div style={{
                width: `${calculatePercent(analytics.storageUsedBytes, analytics.storageLimitBytes)}%`,
              }} />
            </div>
            
            <span className="ui-text-xs-muted">
              Storage includes database files, document templates, attachments, and logs.
            </span>
          </div>

        </div>
      )}
    </div>
    </RouteGuard>
  );
}
