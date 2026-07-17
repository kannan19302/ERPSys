'use client';
import styles from './FeatureFlagsTab.module.css';
import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, RefreshCw, CheckCircle } from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';

interface FeatureFlag {
  key: string;
  name: string;
  enabled: boolean;
  description: string;
}

export default function FeatureFlagsTab() {
  const client = useApiClient();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      setFlags(await client.get<FeatureFlag[]>('/admin/platform/feature-flags'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchFlags(); }, [client]);

  const handleToggleFlag = async (key: string, currentStatus: boolean) => {
    setToggling(key);
    setFeedback(null);
    try {
      await client.post(`/admin/platform/feature-flags/${key}/toggle`, { enabled: !currentStatus });
      {
        setFlags(flags.map((f) => (f.key === key ? { ...f, enabled: !currentStatus } : f)));
        setFeedback(`Feature flag "${key}" updated successfully.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setFeedback('Failed to update feature flag state.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <button onClick={fetchFlags} disabled={loading} className={styles.s1}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {feedback && (
        <div className={styles.s2}
        >
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      <ListPageTemplate
        columns={[
          { key: 'name', header: 'Feature Flag Key / Name', render: (v, row) => (
            <div>
              <div className="ui-heading-sm">{String(v)}</div>
              <code className="ui-text-micro ui-text-muted">{String(row.key)}</code>
            </div>
          ) },
          { key: 'description', header: 'Description', render: (v) => <span className={styles.s3}>{String(v)}</span> },
          { key: 'enabled', header: 'Status', render: (v) => (
            <span style={{ background: v ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: v ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s4}
            >{v ? 'Active' : 'Disabled'}
            </span>
          ) },
          { key: 'key', header: 'Toggle', render: (v, row) => (
            <button
              onClick={() => handleToggleFlag(String(v), Boolean(row.enabled))}
              disabled={toggling !== null}
              style={{ cursor: toggling !== null ? 'wait' : 'pointer', color: row.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s5}
            >
              {toggling === v ? (
                <RefreshCw size={20} className="spin" />
              ) : row.enabled ? (
                <ToggleRight size={26} />
              ) : (
                <ToggleLeft size={26} />
              )}
            </button>
          ) },
        ] as ListColumn[]}
        data={flags as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyTitle="No feature flags"
        emptyDescription="No feature flags registered for this tenant."
      />
    </div>
  );
}
