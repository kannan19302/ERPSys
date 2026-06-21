'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Database, RefreshCw, Server, AlertCircle } from 'lucide-react';

interface SystemHealthData {
  status: string;
  timestamp: string;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    totalMemoryGB: number;
    apiLatencyMs: number;
  };
  services: {
    database: string;
    redis: string;
    minio: string;
    queueProcessor: string;
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/operations/health', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    if (status === 'OK' || status === 'HEALTHY' || status === 'RUNNING') return 'var(--color-success)';
    if (status === 'DEGRADED' || status === 'WARN') return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Activity style={{ color: 'var(--color-primary)' }} />
            System Health & Diagnostics
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Real-time infrastructure diagnostic telemetry, database pool metrics, and active service statuses.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh (10s)
          </label>
          <button onClick={fetchHealth} disabled={loading} style={{
            background: 'transparent', border: '1px solid var(--color-border)', padding: 'var(--space-2)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)'
          }}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {health && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Main Status Banner */}
          <div style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: getStatusColor(health.status)
              }} />
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                  System Status: {health.status}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                  Last Checked: {new Date(health.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>API Latency</span>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                {health.metrics.apiLatencyMs}ms
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            {/* CPU */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Cpu size={16} /> CPU Usage
                </span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{health.metrics.cpuUsage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{
                  width: `${health.metrics.cpuUsage}%`, height: '100%',
                  background: health.metrics.cpuUsage > 80 ? 'var(--color-error)' : 'var(--color-primary)',
                  transition: 'width 0.5s ease-in-out'
                }} />
              </div>
            </div>

            {/* Memory */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Server size={16} /> Memory Usage ({health.metrics.totalMemoryGB} GB Total)
                </span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{health.metrics.memoryUsage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{
                  width: `${health.metrics.memoryUsage}%`, height: '100%',
                  background: health.metrics.memoryUsage > 85 ? 'var(--color-error)' : 'var(--color-primary)',
                  transition: 'width 0.5s ease-in-out'
                }} />
              </div>
            </div>
          </div>

          {/* Active Services Checks */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              Service Diagnostics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {/* Database */}
              <div style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
              }}>
                <Database size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block' }}>PostgreSQL Database</span>
                  <strong style={{ fontSize: 'var(--text-sm)', color: getStatusColor(health.services.database) }}>{health.services.database}</strong>
                </div>
              </div>

              {/* Redis Cache */}
              <div style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
              }}>
                <Server size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block' }}>Redis Key-Value Cache</span>
                  <strong style={{ fontSize: 'var(--text-sm)', color: getStatusColor(health.services.redis) }}>{health.services.redis}</strong>
                </div>
              </div>

              {/* S3 Storage */}
              <div style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
              }}>
                <Server size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block' }}>MinIO / S3 Storage</span>
                  <strong style={{ fontSize: 'var(--text-sm)', color: getStatusColor(health.services.minio) }}>{health.services.minio}</strong>
                </div>
              </div>

              {/* Queue processor */}
              <div style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)'
              }}>
                <Activity size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block' }}>BullMQ Queue Worker</span>
                  <strong style={{ fontSize: 'var(--text-sm)', color: getStatusColor(health.services.queueProcessor) }}>{health.services.queueProcessor}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
