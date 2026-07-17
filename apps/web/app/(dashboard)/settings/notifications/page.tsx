'use client';

import React, { useState, useEffect } from 'react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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
  const client = useApiClient();
  const [prefs, setPrefs] = useState<PrefRow[]>(
    CATEGORIES.map((c) => ({ category: c, ...DEFAULTS })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await client.get<PrefRow[]>('/notifications/preferences');
        if (data.length > 0) setPrefs(data);
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client]);

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
      for (const row of prefs) {
        await client.request('/notifications/preferences', { method: 'PATCH', body: JSON.stringify({
            category: row.category,
            inApp: row.inApp,
            email: row.email,
            sms: row.sms,
            push: row.push,
        }) });
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
    <RouteGuard permission="settings.notifications.read">
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Notification Preferences
          </h1>
          <p className={styles.description}>
            Configure how you receive notifications for each category
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <button className="ui-btn ui-btn-secondary" onClick={resetDefaults}>
            Reset to Defaults
          </button>
          <button className="ui-btn ui-btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save All'}
          </button>
        </div>
      </div>

      <div className={`ui-card ${styles.card}`}>
        {loading ? (
          <div className={styles.loading}>
            Loading preferences...
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className="border-b">
                <th className={styles.categoryHeading}>
                  Category
                </th>
                {CHANNELS.map((ch) => (
                  <th key={ch.key} className={styles.channelHeading}>
                    {ch.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prefs.map((row, idx) => (
                <tr key={row.category} className={idx < prefs.length - 1 ? styles.row : undefined}>
                  <td className={styles.categoryCell}>
                    {row.category}
                  </td>
                  {CHANNELS.map((ch) => {
                    const isOn = (row as any)[ch.key];
                    return (
                      <td key={ch.key} className={styles.channelCell}>
                        <button
                          onClick={() => toggle(idx, ch.key)}
                          className={`${styles.toggle} ${isOn ? styles.toggleOn : ''}`}
                        >
                          <span className={styles.toggleThumb} />
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
    </RouteGuard>
  );
}
