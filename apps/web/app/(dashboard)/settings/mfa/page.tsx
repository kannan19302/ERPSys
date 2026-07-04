'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, FormField, Select } from '@unerp/ui';
import { Smartphone, CheckCircle, Shield, AlertTriangle, Users } from 'lucide-react';

interface MfaSettings {
  enabled: boolean;
  mfaType: string;
  enforced: boolean;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` };
}

export default function MfaPage() {
  const [settings, setSettings] = useState<MfaSettings>({ enabled: false, mfaType: 'TOTP', enforced: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/security/mfa', { headers: authHeaders() });
        if (res.ok) setSettings(await res.json());
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/v1/admin/security/mfa', {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(settings),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '48rem' }}>
      <PageHeader
        title="Multi-Factor Authentication"
        description="Configure MFA requirements for your organization"
        breadcrumbs={[
          { label: 'Administration', href: '/admin' },
          { label: 'Security', href: '/admin/security' },
          { label: 'MFA' },
        ]}
        actions={
          saved ? <Badge variant="success"><CheckCircle size={12} style={{ marginRight: 4 }} /> Saved</Badge> : undefined
        }
      />

      {/* Status Banner */}
      <div style={{
        padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
        border: '1px solid',
        borderColor: settings.enforced ? 'var(--color-success)' : settings.enabled ? 'var(--color-warning)' : 'var(--color-border)',
        background: settings.enforced ? 'rgba(16,185,129,0.06)' : settings.enabled ? 'rgba(245,158,11,0.06)' : 'var(--color-bg-elevated)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-lg)',
          background: settings.enforced ? 'var(--color-success-light)' : settings.enabled ? 'var(--color-warning-light)' : 'var(--color-bg-sunken)',
          color: settings.enforced ? 'var(--color-success)' : settings.enabled ? 'var(--color-warning)' : 'var(--color-text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {settings.enforced ? <Shield size={24} /> : settings.enabled ? <Smartphone size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
            MFA is {settings.enforced ? 'enforced for all users' : settings.enabled ? 'enabled but optional' : 'currently disabled'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            {settings.enforced
              ? 'All users must set up MFA before accessing the system'
              : settings.enabled
              ? 'Users can optionally enable MFA from their profile settings'
              : 'Enable MFA to add an extra layer of security'}
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSave} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Enable MFA */}
          <ToggleOption
            checked={settings.enabled}
            onChange={(v) => setSettings({ ...settings, enabled: v, enforced: v ? settings.enforced : false })}
            title="Enable Multi-Factor Authentication"
            description="Allow users to configure MFA for their accounts"
          />

          {/* Enforce MFA */}
          <ToggleOption
            checked={settings.enforced}
            onChange={(v) => setSettings({ ...settings, enforced: v, enabled: v || settings.enabled })}
            title="Enforce MFA for All Users"
            description="Require all users to set up MFA before they can access the system"
            disabled={!settings.enabled}
          />

          {/* MFA Type */}
          <FormField label="MFA Method">
            <Select
              value={settings.mfaType}
              onChange={(e) => setSettings({ ...settings, mfaType: e.target.value })}
              disabled={!settings.enabled}
            >
              <option value="TOTP">Authenticator App (TOTP)</option>
              <option value="SMS">SMS Verification</option>
              <option value="EMAIL">Email Verification</option>
              <option value="WEBAUTHN">Hardware Security Key (WebAuthn)</option>
            </Select>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ToggleOption({ checked, onChange, title, description, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; title: string; description: string; disabled?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
      opacity: disabled ? 0.5 : 1,
    }}>
      <input
        type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ accentColor: 'var(--color-primary)', width: 18, height: 18 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 1 }}>{description}</div>
      </div>
    </div>
  );
}
