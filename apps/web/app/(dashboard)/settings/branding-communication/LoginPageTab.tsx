'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function LoginPageTab() {
  const [config, setConfig] = useState({
    companyName: 'UniERP',
    logoUrl: '',
    welcomeMessage: 'Welcome to Enterprise Portal',
    primaryColor: '#0070f3',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/v1/admin/platform/login-customizer', { headers: getHeaders() });
        if (res.ok) setConfig(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/admin/platform/login-customizer', {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(config),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Company / Portal Name</label>
            <input value={config.companyName} onChange={(e) => setConfig({ ...config, companyName: e.target.value })} required style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Logo Image URL</label>
            <input value={config.logoUrl} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Welcome Message</label>
            <input value={config.welcomeMessage} onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Brand Primary Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} style={{ width: '45px', height: '35px', padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} />
              <input value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} style={{ width: '100px', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button type="submit" disabled={saving} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: saving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{saving ? 'Saving...' : 'Save Design settings'}</button>
            {saved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> Design settings saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
