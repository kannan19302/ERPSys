'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Upload, Smartphone, PaintBucket } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './WhiteLabelTab.module.css';

const API_BASE = '/admin/platform';

export default function WhiteLabelTab() {
  const client = useApiClient();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const [settings, setSettings] = useState({
    appName: 'UniERP',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    borderRadius: '8px',
    fontFamily: 'Inter',
    enablePWA: true,
    theme: 'light',
    logoUrl: '',
  });

  const loadSettings = useCallback(async () => {
    try {
      const data = await client.get<Partial<typeof settings>>(`${API_BASE}/white-label`);
      setSettings((prev) => ({ ...prev, ...data }));
    } catch { /* defaults */ }
  }, [client]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.post(`${API_BASE}/white-label`, settings);
      setFeedback({ msg: 'White-label settings saved successfully!', ok: true });
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
    } catch {
      setFeedback({ msg: 'Failed to save settings', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className={styles.s1}>
      <div className={styles.s2}>
        {feedback && (
          <span className={styles.s3} style={{color: feedback.ok ? 'var(--color-success)' : 'var(--color-danger)' }}>{feedback.msg}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.s4}
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className={styles.s5}>
        <h2 className={styles.s6}>
          <PaintBucket size={18} /> Branding & Colors
        </h2>

        <div className="ui-grid-2 ui-gap-6">
          <div>
            <label className="ui-label">Application Name</label>
            <input type="text" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} className="ui-field-box" />
          </div>

          <div>
            <label className="ui-label">Font Family</label>
            <select value={settings.fontFamily} onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })} className="ui-field-box">
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="System">System Default</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Primary Color</label>
            <div className="ui-flex ui-gap-2">
              <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className={styles.s7} />
              <input type="text" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className={styles.s8} />
            </div>
          </div>

          <div>
            <label className="ui-label">Secondary Color</label>
            <div className="ui-flex ui-gap-2">
              <input type="color" value={settings.secondaryColor} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} className={styles.s9} />
              <input type="text" value={settings.secondaryColor} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} className={styles.s10} />
            </div>
          </div>
        </div>

        <div className={styles.s11}>
          <Upload size={24} className={styles.s12} />
          <p className={styles.s13}>Upload Custom Logo</p>
          <button className={styles.s14}>Choose File</button>
        </div>
      </div>

      <div className="ui-card p-5">
        <h2 className={styles.s15}>
          <Smartphone size={18} /> Progressive Web App (PWA)
        </h2>

        <div className={styles.s16}>
          <div>
            <h4 className={styles.s17}>Enable PWA Support</h4>
            <p className={styles.s18}>Allow users to install this ERP as a native application on their devices.</p>
          </div>
          <label className={styles.s19}>
            <input
              type="checkbox"
              checked={settings.enablePWA}
              onChange={(e) => setSettings({ ...settings, enablePWA: e.target.checked })}
              className={styles.s20}
            />
          </label>
        </div>

        {settings.enablePWA && (
          <div className={styles.s21}>
            <div>
              <label className="ui-label">PWA Manifest Name</label>
              <input type="text" value={settings.appName} readOnly className={styles.s22} />
              <p className={styles.s23}>Derived from Application Name above.</p>
            </div>

            <div className={styles.s24}>
              <div className={styles.s25}>
                <div className={styles.s26} style={{background: settings.primaryColor}} />
                <p className="ui-text-xs-muted">App Icon (192x192)</p>
                <button className={styles.s27}>Upload</button>
              </div>
              <div className={styles.s28}>
                <div className={styles.s29} style={{background: settings.primaryColor}} />
                <p className="ui-text-xs-muted">Splash Icon (512x512)</p>
                <button className={styles.s30}>Upload</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
