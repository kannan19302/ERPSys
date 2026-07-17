'use client';
import styles from './page.module.css';
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
    <div className="ui-stack-6">
      <PageHeader title="Notification Preferences" description="Configure alert channels, email digest intervals, and priority rules"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Settings' }]}
        actions={<Button variant="primary" onClick={handleSave} disabled={saving}><Save size={14} className="mr-2" /> {saving ? 'Saving...' : 'Save Settings'}</Button>} />

      <Card>
        <div className={styles.s1}>
          <div>
            <h3 className={styles.s2}>
              <Bell size={18} className="ui-text-primary" /> Messaging Alerts
            </h3>
            <div className="ui-stack-3">
              <div className={styles.s3}>
                <input type="checkbox" id="allMessages" checked={prefs.allMessages} onChange={e => setPrefs({ ...prefs, allMessages: e.target.checked, mentionsOnly: !e.target.checked ? false : prefs.mentionsOnly })} />
                <label htmlFor="allMessages" className="text-sm">Notify for all new messages</label>
              </div>
              <div className={styles.s3}>
                <input type="checkbox" id="mentionsOnly" checked={prefs.mentionsOnly} onChange={e => setPrefs({ ...prefs, mentionsOnly: e.target.checked, allMessages: !e.target.checked ? prefs.allMessages : false })} />
                <label htmlFor="mentionsOnly" className="text-sm">Notify only for @mentions and direct messages</label>
              </div>
              <div className={styles.s3}>
                <input type="checkbox" id="soundAlerts" checked={prefs.soundAlerts} onChange={e => setPrefs({ ...prefs, soundAlerts: e.target.checked })} />
                <label htmlFor="soundAlerts" className="text-sm">Enable alert sounds for incoming messages</label>
              </div>
            </div>
          </div>

          <hr className={styles.s4} />

          <div>
            <h3 className={styles.s2}>
              <Mail size={18} className="ui-text-success" /> Email Digests
            </h3>
            <div className="ui-stack-3">
              <FormField label="Digest Interval">
                <select value={prefs.emailDigest} onChange={e => setPrefs({ ...prefs, emailDigest: e.target.value })}
                  className={styles.s5}>
                  <option value="none">Do not send email digests</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily digest summary</option>
                  <option value="weekly">Weekly digest summary</option>
                </select>
              </FormField>
            </div>
          </div>

          <hr className={styles.s4} />

          <div>
            <h3 className={styles.s2}>
              <Smartphone size={18} className="ui-text-warning" /> Mobile Notifications
            </h3>
            <div className={styles.s3}>
              <input type="checkbox" id="mobilePush" checked={prefs.mobilePush} onChange={e => setPrefs({ ...prefs, mobilePush: e.target.checked })} />
              <label htmlFor="mobilePush" className="text-sm">Enable push notifications on mobile devices</label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
