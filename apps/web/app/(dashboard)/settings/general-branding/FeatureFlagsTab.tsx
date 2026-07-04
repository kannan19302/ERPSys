'use client';

import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, RefreshCw, CheckCircle } from 'lucide-react';

interface FeatureFlag {
  key: string;
  name: string;
  enabled: boolean;
  description: string;
}

export default function FeatureFlagsTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/feature-flags', { headers: getHeaders() });
      if (res.ok) setFlags(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFlags(); }, []);

  const handleToggleFlag = async (key: string, currentStatus: boolean) => {
    setToggling(key);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/platform/feature-flags/${key}/toggle`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ enabled: !currentStatus }),
      });
      if (res.ok) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={fetchFlags} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'var(--color-success-light)', border: '1px solid var(--color-success)',
          color: 'var(--color-success)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}
        >
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Feature Flag Key / Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Description</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{f.name}</div>
                    <code style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{f.key}</code>
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '400px', lineHeight: '1.4' }}>{f.description}</td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                      background: f.enabled ? 'var(--color-success-light)' : 'var(--color-bg-sunken)',
                      color: f.enabled ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    }}
                    >{f.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleFlag(f.key, f.enabled)}
                      disabled={toggling !== null}
                      style={{
                        background: 'transparent', border: 'none', cursor: toggling !== null ? 'wait' : 'pointer',
                        color: f.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {toggling === f.key ? (
                        <RefreshCw size={20} className="spin" />
                      ) : f.enabled ? (
                        <ToggleRight size={26} />
                      ) : (
                        <ToggleLeft size={26} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                    No feature flags registered for this tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
