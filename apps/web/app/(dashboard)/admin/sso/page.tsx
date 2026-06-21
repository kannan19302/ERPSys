'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, CheckCircle, RefreshCw } from 'lucide-react';

interface SsoConfig {
  id: string;
  providerType: string;
  name: string;
  clientId: string | null;
  clientSecret: string | null;
  issuerUrl: string | null;
  samlEntryPoint: string | null;
  samlIssuer: string | null;
  samlCert: string | null;
  isActive: boolean;
}

export default function SsoConfigPage() {
  const [selectedProvider, setSelectedProvider] = useState<'SAML' | 'OIDC'>('OIDC');
  const [ssoForm, setSsoForm] = useState({
    name: 'Google Workspace',
    clientId: '',
    clientSecret: '',
    issuerUrl: '',
    samlEntryPoint: '',
    samlIssuer: '',
    samlCert: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchSsoConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/security/sso', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json() as SsoConfig[];
        const active = data.find(c => c.providerType === selectedProvider);
        if (active) {
          setSsoForm({
            name: active.name,
            clientId: active.clientId || '',
            clientSecret: active.clientSecret || '',
            issuerUrl: active.issuerUrl || '',
            samlEntryPoint: active.samlEntryPoint || '',
            samlIssuer: active.samlIssuer || '',
            samlCert: active.samlCert || '',
            isActive: active.isActive,
          });
        } else {
          setSsoForm({
            name: selectedProvider === 'OIDC' ? 'Google Workspace' : 'Okta Enterprise',
            clientId: '',
            clientSecret: '',
            issuerUrl: '',
            samlEntryPoint: '',
            samlIssuer: '',
            samlCert: '',
            isActive: true,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedProvider]);

  useEffect(() => {
    fetchSsoConfig();
  }, [fetchSsoConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/admin/security/sso', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          providerType: selectedProvider,
          ...ssoForm,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Key style={{ color: 'var(--color-primary)' }} />
          SSO Configuration
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Configure single sign-on parameters for SAML 2.0 or OIDC.
        </p>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <button onClick={() => setSelectedProvider('OIDC')} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            background: selectedProvider === 'OIDC' ? 'var(--color-primary)' : 'transparent',
            color: selectedProvider === 'OIDC' ? '#fff' : 'var(--color-text)', cursor: 'pointer',
            fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)'
          }}>OpenID Connect (OIDC)</button>
          <button onClick={() => setSelectedProvider('SAML')} style={{
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            background: selectedProvider === 'SAML' ? 'var(--color-primary)' : 'transparent',
            color: selectedProvider === 'SAML' ? '#fff' : 'var(--color-text)', cursor: 'pointer',
            fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)'
          }}>SAML 2.0 Identity Provider</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Provider Name</label>
            <input value={ssoForm.name} onChange={e => setSsoForm({ ...ssoForm, name: e.target.value })} required style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
          </div>

          {selectedProvider === 'OIDC' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Client ID</label>
                <input value={ssoForm.clientId} onChange={e => setSsoForm({ ...ssoForm, clientId: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Client Secret</label>
                <input type="password" value={ssoForm.clientSecret} onChange={e => setSsoForm({ ...ssoForm, clientSecret: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>Issuer URL</label>
                <input value={ssoForm.issuerUrl} onChange={e => setSsoForm({ ...ssoForm, issuerUrl: e.target.value })} placeholder="https://accounts.google.com" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>SAML Entry Point</label>
                <input value={ssoForm.samlEntryPoint} onChange={e => setSsoForm({ ...ssoForm, samlEntryPoint: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>SAML Issuer / Entity ID</label>
                <input value={ssoForm.samlIssuer} onChange={e => setSsoForm({ ...ssoForm, samlIssuer: e.target.value })} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)' }}>X.509 Certificate</label>
                <textarea value={ssoForm.samlCert} onChange={e => setSsoForm({ ...ssoForm, samlCert: e.target.value })} rows={5} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '11px' }} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <input type="checkbox" id="sso-active" checked={ssoForm.isActive} onChange={e => setSsoForm({ ...ssoForm, isActive: e.target.checked })} />
            <label htmlFor="sso-active" style={{ fontSize: 'var(--text-sm)' }}>Active SSO Provider</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button type="submit" disabled={saving} style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
              cursor: saving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)'
            }}>{saving ? 'Saving...' : 'Save Configuration'}</button>
            {saved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
