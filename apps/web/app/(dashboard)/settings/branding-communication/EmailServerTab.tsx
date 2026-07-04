'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, AlertCircle, Play } from 'lucide-react';

export default function EmailServerTab() {
  const [config, setConfig] = useState({
    host: 'smtp.mailtrap.io', port: 2525, username: '', password: '',
    secure: false, senderEmail: 'noreply@unerp.dev', senderName: 'UniERP System', isActive: true,
  });

  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        const res = await fetch('/api/v1/admin/platform/smtp', { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data) setConfig(data);
        }
      } catch (e) { console.error(e); }
    };
    fetchSmtpConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/admin/platform/smtp', {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(config),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setLoading(true);
    setTestStatus(null);
    try {
      const res = await fetch('/api/v1/admin/platform/smtp', {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ ...config, testRecipient: testEmail }),
      });
      if (res.ok) {
        setTestStatus({ success: true, message: `Test email successfully sent to ${testEmail}` });
      } else {
        const err = await res.json();
        setTestStatus({ success: false, message: err.message || 'SMTP connection check failed. Verify parameters.' });
      }
    } catch {
      setTestStatus({ success: false, message: 'Network error trying to verify SMTP server connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '900px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>SMTP Server Details</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>SMTP Host</label>
                <input value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} required placeholder="smtp.gmail.com" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Port</label>
                <input type="number" value={config.port} onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 0 })} required placeholder="587" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Username</label>
                <input value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} placeholder="username" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Password</label>
                <input type="password" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} placeholder="••••••••" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input type="checkbox" id="smtp-secure" checked={config.secure} onChange={(e) => setConfig({ ...config, secure: e.target.checked })} />
              <label htmlFor="smtp-secure" style={{ fontSize: 'var(--text-sm)' }}>Use SSL/TLS Encryption</label>
            </div>

            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginTop: 'var(--space-2)' }}>Sender Identity</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Sender Name</label>
                <input value={config.senderName} onChange={(e) => setConfig({ ...config, senderName: e.target.value })} required placeholder="System Admin" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Sender Email Address</label>
                <input type="email" value={config.senderEmail} onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })} required placeholder="sender@company.com" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <input type="checkbox" id="smtp-active" checked={config.isActive} onChange={(e) => setConfig({ ...config, isActive: e.target.checked })} />
              <label htmlFor="smtp-active" style={{ fontSize: 'var(--text-sm)' }}>Enable SMTP Settings globally for this tenant</label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button type="submit" disabled={saving} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: saving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{saving ? 'Saving...' : 'Save Configuration'}</button>
              {saved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> SMTP Configuration Saved</span>}
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Test Configuration</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
              Save settings and input a recipient email address to dispatch a test system email.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <input type="email" placeholder="recipient@domain.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)' }} />

              <button onClick={handleSendTest} disabled={loading || !testEmail} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)',
                padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', cursor: (loading || !testEmail) ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
              }}
              >
                {loading ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                Send Test Email
              </button>
            </div>

            {testStatus && (
              <div style={{
                marginTop: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                background: testStatus.success ? 'var(--color-success-light)' : 'var(--color-error-light)',
                border: `1px solid ${testStatus.success ? 'var(--color-success)' : 'var(--color-error)'}`,
                color: testStatus.success ? 'var(--color-success)' : 'var(--color-error)',
                display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start',
              }}
              >
                {testStatus.success ? <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <span style={{ fontSize: 'var(--text-xs)', lineHeight: '1.4' }}>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
