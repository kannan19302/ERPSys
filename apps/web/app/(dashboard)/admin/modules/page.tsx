'use client';

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface ErpModule {
  name: string;
  label: string;
  description: string;
  isActive: boolean;
}

export default function ModuleManagerPage() {
  const [modules, setModules] = useState<ErpModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/platform/modules', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggleModule = async (name: string, currentStatus: boolean) => {
    setToggling(name);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/platform/modules/${name}/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      if (res.ok) {
        setModules(modules.map(m => m.name === name ? { ...m, isActive: !currentStatus } : m));
        setFeedback(`Module "${name}" status updated successfully.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setFeedback('Failed to update module state.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Settings style={{ color: 'var(--color-primary)' }} />
            ERP Module Registry
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Enable or disable major business capability modules. Disabling a module hides it from navigation switchers.
          </p>
        </div>
        <button onClick={fetchModules} disabled={loading} style={{
          background: 'transparent', border: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
        }}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          Refresh Registry
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
          {modules.map(m => (
            <div key={m.name} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex',
              flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-4)'
            }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>{m.label}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.4' }}>{m.description}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--weight-semibold)',
                  background: m.isActive ? 'rgba(var(--color-success-rgb), 0.1)' : 'rgba(var(--color-text-secondary-rgb), 0.1)',
                  color: m.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)'
                }}>{m.isActive ? 'Enabled' : 'Disabled'}</span>
                
                <button
                  onClick={() => handleToggleModule(m.name, m.isActive)}
                  disabled={toggling !== null}
                  style={{
                    background: 'transparent', border: 'none', cursor: toggling !== null ? 'wait' : 'pointer',
                    color: m.isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                  }}
                >
                  {toggling === m.name ? (
                    <RefreshCw size={24} className="spin" />
                  ) : m.isActive ? (
                    <ToggleRight size={28} />
                  ) : (
                    <ToggleLeft size={28} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
