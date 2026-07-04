'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Spinner, Badge, Tabs, TextField, FormField, Textarea,
} from '@unerp/ui';
import { Key, CheckCircle, Shield } from 'lucide-react';

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

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` };
}

export default function SsoTab() {
  const [selectedProvider, setSelectedProvider] = useState<'OIDC' | 'SAML'>('OIDC');
  const [form, setForm] = useState({
    name: 'Google Workspace', clientId: '', clientSecret: '', issuerUrl: '',
    samlEntryPoint: '', samlIssuer: '', samlCert: '', isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/security/sso', { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json() as SsoConfig[];
      const active = data.find((c) => c.providerType === selectedProvider);
      if (active) {
        setForm({
          name: active.name, clientId: active.clientId || '', clientSecret: active.clientSecret || '',
          issuerUrl: active.issuerUrl || '', samlEntryPoint: active.samlEntryPoint || '',
          samlIssuer: active.samlIssuer || '', samlCert: active.samlCert || '', isActive: active.isActive,
        });
      } else {
        setForm({
          name: selectedProvider === 'OIDC' ? 'Google Workspace' : 'Okta Enterprise',
          clientId: '', clientSecret: '', issuerUrl: '', samlEntryPoint: '', samlIssuer: '', samlCert: '', isActive: true,
        });
      }
    } catch { /* use defaults */ }
  }, [selectedProvider]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/v1/admin/security/sso', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ providerType: selectedProvider, ...form }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '48rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {saveStatus === 'saved' && (
          <Badge variant="success"><CheckCircle size={12} style={{ marginRight: 4 }} /> Saved</Badge>
        )}
      </div>

      <Tabs
        tabs={[
          { key: 'OIDC', label: 'OpenID Connect (OIDC)', icon: <Key size={14} /> },
          { key: 'SAML', label: 'SAML 2.0', icon: <Shield size={14} /> },
        ]}
        value={selectedProvider}
        onChange={(key) => setSelectedProvider(key as 'OIDC' | 'SAML')}
      />

      <Card>
        <form onSubmit={handleSave} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField
            label="Provider Name"
            placeholder={selectedProvider === 'OIDC' ? 'Google Workspace' : 'Okta Enterprise'}
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />

          {selectedProvider === 'OIDC' ? (
            <>
              <TextField label="Client ID" placeholder="your-client-id" value={form.clientId} onChange={(e) => updateField('clientId', e.target.value)} />
              <TextField label="Client Secret" type="password" placeholder="your-client-secret" value={form.clientSecret} onChange={(e) => updateField('clientSecret', e.target.value)} />
              <TextField label="Issuer URL" placeholder="https://accounts.google.com" value={form.issuerUrl} onChange={(e) => updateField('issuerUrl', e.target.value)} hint="The OIDC discovery endpoint URL" />
            </>
          ) : (
            <>
              <TextField label="SAML Entry Point" placeholder="https://idp.example.com/sso/saml" value={form.samlEntryPoint} onChange={(e) => updateField('samlEntryPoint', e.target.value)} />
              <TextField label="SAML Issuer / Entity ID" placeholder="https://idp.example.com" value={form.samlIssuer} onChange={(e) => updateField('samlIssuer', e.target.value)} />
              <FormField label="X.509 Certificate" hint="Paste the PEM-encoded certificate from your identity provider">
                <Textarea
                  rows={5}
                  value={form.samlCert}
                  onChange={(e) => updateField('samlCert', e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  style={{ fontFamily: 'monospace', fontSize: '11px' }}
                />
              </FormField>
            </>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', background: 'var(--color-bg)',
          }}>
            <input
              type="checkbox" id="sso-active"
              checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
            />
            <label htmlFor="sso-active" style={{ fontSize: 'var(--text-sm)', cursor: 'pointer', flex: 1 }}>
              <span style={{ fontWeight: 'var(--weight-medium)' }}>Enable SSO Provider</span>
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                Users will be able to sign in using this identity provider
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => fetchConfig()}>Reset</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
