'use client';

import styles from './EmailServerTab.module.css';

import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, AlertCircle, Play } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

export default function EmailServerTab() {
  const client = useApiClient();
  const [config, setConfig] = useState({
    host: 'smtp.mailtrap.io', port: 2525, username: '', password: '',
    secure: false, senderEmail: 'noreply@unerp.dev', senderName: 'UniERP System', isActive: true,
  });

  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        const data = await client.get<typeof config>('/admin/platform/smtp');
        if (data) setConfig(data);
      } catch (e) { console.error(e); }
    };
    void fetchSmtpConfig();
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await client.post('/admin/platform/smtp', config);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setLoading(true);
    setTestStatus(null);
    try {
      await client.post('/admin/platform/smtp', { ...config, testRecipient: testEmail });
      setTestStatus({ success: true, message: `Test email successfully sent to ${testEmail}` });
    } catch (error) {
      setTestStatus({ success: false, message: error instanceof Error ? error.message : 'SMTP connection check failed. Verify parameters.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.p1}>
      <div className={styles.p2}>
        <div className="ui-card p-5">
          <form onSubmit={handleSave} className="ui-stack-4">
            <h2 className={styles.p3}>SMTP Server Details</h2>

            <div className={styles.p4}>
              <div>
                <label className="ui-label">SMTP Host</label>
                <input value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} required placeholder="smtp.gmail.com" className="ui-field-box" />
              </div>
              <div>
                <label className="ui-label">Port</label>
                <input type="number" value={config.port} onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 0 })} required placeholder="587" className="ui-field-box" />
              </div>
            </div>

            <div className="ui-grid-2">
              <div>
                <label className="ui-label">Username</label>
                <input value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} placeholder="username" className="ui-field-box" />
              </div>
              <div>
                <label className="ui-label">Password</label>
                <input type="password" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} placeholder="••••••••" className="ui-field-box" />
              </div>
            </div>

            <div className="ui-hstack-2">
              <input type="checkbox" id="smtp-secure" checked={config.secure} onChange={(e) => setConfig({ ...config, secure: e.target.checked })} />
              <label htmlFor="smtp-secure" className="text-sm">Use SSL/TLS Encryption</label>
            </div>

            <h2 className={styles.p5}>Sender Identity</h2>

            <div className="ui-grid-2">
              <div>
                <label className="ui-label">Sender Name</label>
                <input value={config.senderName} onChange={(e) => setConfig({ ...config, senderName: e.target.value })} required placeholder="System Admin" className="ui-field-box" />
              </div>
              <div>
                <label className="ui-label">Sender Email Address</label>
                <input type="email" value={config.senderEmail} onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })} required placeholder="sender@company.com" className="ui-field-box" />
              </div>
            </div>

            <div className={styles.p6}>
              <input type="checkbox" id="smtp-active" checked={config.isActive} onChange={(e) => setConfig({ ...config, isActive: e.target.checked })} />
              <label htmlFor="smtp-active" className="text-sm">Enable SMTP Settings globally for this tenant</label>
            </div>

            <div className={styles.p7}>
              <button type="submit" disabled={saving} className={styles.saveButton} style={{ cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving...' : 'Save Configuration'}</button>
              {saved && <span className={styles.p8}><CheckCircle size={12} /> SMTP Configuration Saved</span>}
            </div>
          </form>
        </div>

        <div className="ui-stack-4">
          <div className="ui-card p-5">
            <h3 className={styles.p9}>Test Configuration</h3>
            <p className={styles.p10}>
              Save settings and input a recipient email address to dispatch a test system email.
            </p>

            <div className="ui-stack-3">
              <input type="email" placeholder="recipient@domain.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={styles.p11} />

              <button onClick={handleSendTest} disabled={loading || !testEmail} className={styles.testButton} style={{ cursor: (loading || !testEmail) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                Send Test Email
              </button>
            </div>

            {testStatus && (
              <div className={styles.testStatus} style={{
                background: testStatus.success ? 'var(--color-success-light)' : 'var(--color-error-light)',
                borderColor: testStatus.success ? 'var(--color-success)' : 'var(--color-error)',
                color: testStatus.success ? 'var(--color-success)' : 'var(--color-error)',
              }}
              >
                {testStatus.success ? <CheckCircle size={14} className={styles.p12} /> : <AlertCircle size={14} className={styles.p13} />}
                <span className={styles.p14}>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
