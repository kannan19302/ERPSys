'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Upload, Smartphone, PaintBucket } from 'lucide-react';

const API_BASE = '/api/v1/admin/platform';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function WhiteLabelTab() {
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
      const res = await fetch(`${API_BASE}/white-label`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch { /* defaults */ }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/white-label`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(settings),
      });
      if (res.ok) {
        setFeedback({ msg: 'White-label settings saved successfully!', ok: true });
        document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
        document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
      } else {
        setFeedback({ msg: 'Failed to save settings', ok: false });
      }
    } catch {
      setFeedback({ msg: 'Failed to save settings', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)', gap: 'var(--space-3)', alignItems: 'center' }}>
        {feedback && (
          <span style={{ fontSize: 'var(--text-xs)', color: feedback.ok ? 'var(--color-success)' : 'var(--color-danger)' }}>{feedback.msg}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <PaintBucket size={18} /> Branding & Colors
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Application Name</label>
            <input type="text" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Font Family</label>
            <select value={settings.fontFamily} onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="System">System Default</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Primary Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 'var(--radius-md)' }} />
              <input type="text" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Secondary Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input type="color" value={settings.secondaryColor} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 'var(--radius-md)' }} />
              <input type="text" value={settings.secondaryColor} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <Upload size={24} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto var(--space-2)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Upload Custom Logo</p>
          <button style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Choose File</button>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Smartphone size={18} /> Progressive Web App (PWA)
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 'var(--weight-medium)' }}>Enable PWA Support</h4>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>Allow users to install this ERP as a native application on their devices.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.enablePWA}
              onChange={(e) => setSettings({ ...settings, enablePWA: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>

        {settings.enablePWA && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>PWA Manifest Name</label>
              <input type="text" value={settings.appName} readOnly style={{ opacity: 0.7, width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>Derived from Application Name above.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '64px', height: '64px', background: settings.primaryColor, borderRadius: '16px', margin: '0 auto var(--space-2)' }} />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>App Icon (192x192)</p>
                <button style={{ padding: '4px 8px', fontSize: '10px', marginTop: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}>Upload</button>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '64px', height: '64px', background: settings.primaryColor, borderRadius: '16px', margin: '0 auto var(--space-2)' }} />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Splash Icon (512x512)</p>
                <button style={{ padding: '4px 8px', fontSize: '10px', marginTop: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer' }}>Upload</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
