'use client';

import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';

interface SandboxEnvironment {
  name: string;
  type: string;
  status: string;
  url: string;
  lastSyncAt: string;
}

export default function EnvironmentManagerPage() {
  const [environments, setEnvironments] = useState<SandboxEnvironment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingType, setSyncingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchEnvironments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/environments', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const handleSyncSandbox = async (type: string) => {
    setSyncingType(type);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/platform/environments/${type}/sync`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        setFeedback(`Environment ${type} has been synchronized with Production records.`);
        setTimeout(() => setFeedback(null), 4000);
        fetchEnvironments();
      }
    } catch (e) {
      console.error(e);
      setFeedback('Error attempting to sync sandbox environment data.');
    } finally {
      setSyncingType(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Server style={{ color: 'var(--color-primary)' }} />
            Environment & Sandbox Manager
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Configure and synchronize testing / staging sandbox environments with Production data schemas.
          </p>
        </div>
        <button onClick={fetchEnvironments} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Status
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'rgba(var(--color-success-rgb), 0.1)', border: '1px solid var(--color-success)',
          color: 'var(--color-success)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <CheckCircle size={16} />
          {feedback}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {environments.map((env, idx) => (
            <div key={idx} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)' }}>{env.name}</h3>
                  <span style={{
                    fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                    background: env.type === 'PROD' ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: env.type === 'PROD' ? '#fff' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)'
                  }}>{env.type}</span>
                </div>
                <a href={env.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
                  {env.url} <ExternalLink size={10} />
                </a>
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginTop: 'var(--space-2)' }}>
                  Last Synced: {new Date(env.lastSyncAt).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--weight-semibold)',
                  background: env.status === 'ACTIVE' ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-text-secondary-rgb), 0.1)',
                  color: env.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)'
                }}>{env.status}</span>

                {env.type !== 'PROD' && (
                  <button
                    onClick={() => handleSyncSandbox(env.type)}
                    disabled={syncingType !== null}
                    style={{
                      background: 'transparent', border: '1px solid var(--color-border)',
                      padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: syncingType !== null ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
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
  );
}
