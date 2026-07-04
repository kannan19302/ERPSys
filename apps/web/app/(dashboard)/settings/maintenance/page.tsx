'use client';

import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: 'System undergoing brief scheduled maintenance. Please refresh in a few minutes.',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const fetchMaintenance = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/admin/platform/maintenance', { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setMaintenance(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenance();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/admin/platform/maintenance', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(maintenance),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShieldAlert style={{ color: 'var(--color-primary)' }} />
          Maintenance Mode Control
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Toggle maintenance mode to prevent non-administrative users from accessing the system during core software updates.
        </p>
      </div>

      {/* Warning banner */}
      <div style={{
        background: 'rgba(var(--color-warning-rgb), 0.05)', border: '1px solid var(--color-warning)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)',
        alignItems: 'flex-start'
      }}>
        <ShieldAlert style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Administrative Bypass Enforced</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginTop: '2px' }}>
            System Administrators and Super Admin accounts bypass maintenance barriers and can log in normally to verify changes or resolve issues.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Status toggle selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', display: 'block' }}>System Lockout Status</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Currently {maintenance.enabled ? 'blocking standard sessions' : 'available publicly'}</span>
              </div>
              <button
                type="button"
                onClick={() => setMaintenance({ ...maintenance, enabled: !maintenance.enabled })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: maintenance.enabled ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              >
                {maintenance.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Maintenance Display Message</label>
              <textarea
                value={maintenance.message}
                onChange={e => setMaintenance({ ...maintenance, message: e.target.value })}
                required
                rows={4}
                placeholder="Message displayed to users when they attempt to connect during maintenance."
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button type="submit" disabled={saving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: saving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)'
              }}>{saving ? 'Saving Status...' : 'Apply Status Settings'}</button>
              {saved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> Maintenance Mode saved</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
