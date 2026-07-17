'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface SandboxEnvironment {
  name: string;
  type: string;
  status: string;
  url: string;
  lastSyncAt: string;
}

export default function EnvironmentManagerPage() {
  const client = useApiClient();
  const [environments, setEnvironments] = useState<SandboxEnvironment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingType, setSyncingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchEnvironments = async () => {
    setLoading(true);
    try {
      setEnvironments(await client.get<SandboxEnvironment[]>('/admin/platform/environments'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEnvironments();
  }, [client]);

  const handleSyncSandbox = async (type: string) => {
    setSyncingType(type);
    setFeedback(null);
    try {
      await client.post(`/admin/platform/environments/${type}/sync`);
      {
        setFeedback(`Environment ${type} has been synchronized with Production records.`);
        setTimeout(() => setFeedback(null), 4000);
        void fetchEnvironments();
      }
    } catch (e) {
      console.error(e);
      setFeedback('Error attempting to sync sandbox environment data.');
    } finally {
      setSyncingType(null);
    }
  };

  return (
    <RouteGuard permission="settings.environments.read">
    <div className={styles.p1}>
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Server className="ui-text-primary" />
            Environment & Sandbox Manager
          </h1>
          <p className="ui-text-sm-muted">
            Configure and synchronize testing / staging sandbox environments with Production data schemas.
          </p>
        </div>
        <button onClick={fetchEnvironments} disabled={loading} className={styles.p2}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Status
        </button>
      </div>

      {feedback && (
        <div className={styles.p3}>
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="ui-flex-center p-8">
          <RefreshCw size={24} className="spin ui-text-muted" />
        </div>
      ) : (
        <div className="ui-stack-4">
          {environments.map((env, idx) => (
            <div key={idx} className={styles.p4}>
              <div>
                <div className="ui-hstack-2">
                  <h3 className={styles.p5}>{env.name}</h3>
                  <span style={{ background: env.type === 'PROD' ? 'var(--color-primary)' : 'var(--color-bg)', color: env.type === 'PROD' ? 'var(--color-primary-text)' : 'var(--color-text-secondary)' }} className={styles.s1}>{env.type}</span>
                </div>
                <a href={env.url} target="_blank" rel="noopener noreferrer" className={styles.p6}>
                  {env.url} <ExternalLink size={10} />
                </a>
                <span className={styles.p7}>
                  Last Synced: {new Date(env.lastSyncAt).toLocaleString()}
                </span>
              </div>

              <div className="ui-hstack-4">
                <span style={{ background: env.status === 'ACTIVE' ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-text-secondary-rgb), 0.1)', color: env.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s2}>{env.status}</span>

                {env.type !== 'PROD' && (
                  <button
                    onClick={() => handleSyncSandbox(env.type)}
                    disabled={syncingType !== null}
                    style={{ cursor: syncingType !== null ? 'wait' : 'pointer' }} className={styles.s3}
                  >
                    <RefreshCw size={12} className={syncingType === env.type ? 'spin' : ''} />
                    Sync Data
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
