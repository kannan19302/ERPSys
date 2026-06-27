'use client';

import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  'Order Updates',
  'Invoice Alerts',
  'Inventory Alerts',
  'HR Notifications',
  'CRM Updates',
  'System Alerts',
  'Security Events',
];

const CHANNELS = [
  { key: 'inApp', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'push', label: 'Push' },
];

interface PrefRow {
  category: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const DEFAULTS: Omit<PrefRow, 'category'> = { inApp: true, email: true, sms: false, push: false };

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<PrefRow[]>(
    CATEGORIES.map((c) => ({ category: c, ...DEFAULTS })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/v1/notifications/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: PrefRow[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPrefs(data);
          }
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (catIdx: number, channel: string) => {
    setPrefs((prev) => {
      const next = [...prev];
      const row = next[catIdx];
      if (row) {
        next[catIdx] = { ...row, [channel]: !(row as any)[channel] };
      }
      return next;
    });
    setSaved(false);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      for (const row of prefs) {
        await fetch('/api/v1/notifications/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: row.category,
            inApp: row.inApp,
            email: row.email,
            sms: row.sms,
            push: row.push,
          }),
        });
      }
      setSaved(true);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setPrefs(CATEGORIES.map((c) => ({ category: c, ...DEFAULTS })));
    setSaved(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
            Notification Preferences
          </h1>
          <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Configure how you receive notifications for each category
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={resetDefaults}>
            Reset to Defaults
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="frappe-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading preferences...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{
                  textAlign: 'left',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Category
                </th>
                {CHANNELS.map((ch) => (
                  <th key={ch.key} style={{
                    textAlign: 'center',
                    padding: 'var(--space-3) var(--space-4)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '100px',
                  }}>
                    {ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prefs.map((row, idx) => (
                <tr key={row.category} style={{
                  borderBottom: idx < prefs.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <td style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    color: 'var(--color-text)',
                  }}>
                    {row.category}
                  </td>
                  {CHANNELS.map((ch) => {
                    const isOn = (row as any)[ch.key];
                    return (
                      <td key={ch.key} style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)' }}>
                        <button
                          onClick={() => toggle(idx, ch.key)}
                          style={{
                            width: '40px',
                            height: '22px',
                            borderRadius: '11px',
                            border: 'none',
                            background: isOn ? 'var(--color-primary)' : 'var(--color-border)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background var(--duration-fast) var(--ease-default)',
                          }}
                        >
                          <span style={{
                            position: 'absolute',
                            top: '2px',
                            left: isOn ? '20px' : '2px',
                            width: '18px',
                            height: '18px',
                            borderRadius: 'var(--radius-full)',
                            background: 'white',
                            transition: 'left var(--duration-fast) var(--ease-default)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
