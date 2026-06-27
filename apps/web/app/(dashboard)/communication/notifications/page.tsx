'use client';

import React, { useState } from 'react';
import { PageHeader, Card, Button, FormField } from '@unerp/ui';
import { Bell, Shield, Mail, Smartphone, Save } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState({
    allMessages: true,
    mentionsOnly: false,
    emailDigest: 'daily',
    mobilePush: true,
    soundAlerts: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Notification preferences saved successfully!');
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Notification Preferences" description="Configure alert channels, email digest intervals, and priority rules"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Settings' }]}
        actions={<Button variant="primary" onClick={handleSave} disabled={saving}><Save size={14} style={{ marginRight: 6 }} /> {saving ? 'Saving...' : 'Save Settings'}</Button>} />

      <Card>
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: 'var(--color-primary)' }} /> Messaging Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="allMessages" checked={prefs.allMessages} onChange={e => setPrefs({ ...prefs, allMessages: e.target.checked, mentionsOnly: !e.target.checked ? false : prefs.mentionsOnly })} />
                <label htmlFor="allMessages" style={{ fontSize: 'var(--text-sm)' }}>Notify for all new messages</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="mentionsOnly" checked={prefs.mentionsOnly} onChange={e => setPrefs({ ...prefs, mentionsOnly: e.target.checked, allMessages: !e.target.checked ? prefs.allMessages : false })} />
                <label htmlFor="mentionsOnly" style={{ fontSize: 'var(--text-sm)' }}>Notify only for @mentions and direct messages</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="soundAlerts" checked={prefs.soundAlerts} onChange={e => setPrefs({ ...prefs, soundAlerts: e.target.checked })} />
                <label htmlFor="soundAlerts" style={{ fontSize: 'var(--text-sm)' }}>Enable alert sounds for incoming messages</label>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)' }} />

          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={18} style={{ color: 'var(--color-success)' }} /> Email Digests
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <FormField label="Digest Interval">
                <select value={prefs.emailDigest} onChange={e => setPrefs({ ...prefs, emailDigest: e.target.value })}
                  style={{ width: '100%', maxWidth: 300, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
                  <option value="none">Do not send email digests</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily digest summary</option>
                  <option value="weekly">Weekly digest summary</option>
                </select>
              </FormField>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)' }} />

          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} style={{ color: 'var(--color-warning)' }} /> Mobile Notifications
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="mobilePush" checked={prefs.mobilePush} onChange={e => setPrefs({ ...prefs, mobilePush: e.target.checked })} />
              <label htmlFor="mobilePush" style={{ fontSize: 'var(--text-sm)' }}>Enable push notifications on mobile devices</label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
