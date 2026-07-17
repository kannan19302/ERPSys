'use client';
import styles from './LoginPageTab.module.css';
import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function LoginPageTab() {
  const client = useApiClient();
  const [config, setConfig] = useState({
    companyName: 'UniERP',
    logoUrl: '',
    welcomeMessage: 'Welcome to Enterprise Portal',
    primaryColor: '#0070f3',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfig(await client.get<typeof config>('/admin/platform/login-customizer'));
      } catch (e) { console.error(e); }
    };
    void fetchConfig();
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await client.post('/admin/platform/login-customizer', config);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.s1}>
      <div className="ui-card p-5">
        <form onSubmit={handleSave} className="ui-stack-4">
          <div>
            <label className="ui-label">Company / Portal Name</label>
            <input value={config.companyName} onChange={(e) => setConfig({ ...config, companyName: e.target.value })} required className="ui-field-box" />
          </div>

          <div>
            <label className="ui-label">Logo Image URL</label>
            <input value={config.logoUrl} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" className="ui-field-box" />
          </div>

          <div>
            <label className="ui-label">Welcome Message</label>
            <input value={config.welcomeMessage} onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} className="ui-field-box" />
          </div>

          <div>
            <label className="ui-label">Brand Primary Color</label>
            <div className="ui-flex ui-gap-2">
              <input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className={styles.s2} />
              <input value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className={styles.s3} />
            </div>
          </div>

          <div className={styles.s4}>
            <button type="submit" disabled={saving} style={{ cursor: saving ? 'wait' : 'pointer' }} className={styles.s5}>{saving ? 'Saving...' : 'Save Design settings'}</button>
            {saved && <span className={styles.s6}><CheckCircle size={12} /> Design settings saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
