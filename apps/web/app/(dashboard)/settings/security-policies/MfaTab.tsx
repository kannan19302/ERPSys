'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge, FormField, Select } from '@unerp/ui';
import { Smartphone, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import PersonalMfaCard from './PersonalMfaCard';
import styles from './MfaTab.module.css';

interface MfaSettings {
  enabled: boolean;
  mfaType: string;
  enforced: boolean;
}

export default function MfaTab() {
  const client = useApiClient();
  const [settings, setSettings] = useState<MfaSettings>({ enabled: false, mfaType: 'TOTP', enforced: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setSettings(await client.get<MfaSettings>('/admin/security/mfa'));
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await client.request('/admin/security/mfa', { method: 'PUT', body: JSON.stringify(settings) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <div className={styles.s1}>
      <div className="ui-flex-end">
        {saved && <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Saved</Badge>}
      </div>

      <div className={styles.s2} style={{borderColor: settings.enforced ? 'var(--color-success)' : settings.enabled ? 'var(--color-warning)' : 'var(--color-border)', background: settings.enforced ? 'rgba(16,185,129,0.06)' : settings.enabled ? 'rgba(245,158,11,0.06)' : 'var(--color-bg-elevated)'}}>
        <div className={styles.s3} style={{background: settings.enforced ? 'var(--color-success-light)' : settings.enabled ? 'var(--color-warning-light)' : 'var(--color-bg-sunken)', color: settings.enforced ? 'var(--color-success)' : settings.enabled ? 'var(--color-warning)' : 'var(--color-text-tertiary)'}}>
          {settings.enforced ? <Shield size={24} /> : settings.enabled ? <Smartphone size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <div className="ui-heading-sm">
            MFA is {settings.enforced ? 'enforced for all users' : settings.enabled ? 'enabled but optional' : 'currently disabled'}
          </div>
          <div className={styles.s4}>
            {settings.enforced
              ? 'All users must set up MFA before accessing the system'
              : settings.enabled
              ? 'Users can optionally enable MFA from their profile settings'
              : 'Enable MFA to add an extra layer of security'}
          </div>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSave} className={styles.s5}>
          <ToggleOption
            checked={settings.enabled}
            onChange={(v) => setSettings({ ...settings, enabled: v, enforced: v ? settings.enforced : false })}
            title="Enable Multi-Factor Authentication"
            description="Allow users to configure MFA for their accounts"
          />

          <ToggleOption
            checked={settings.enforced}
            onChange={(v) => setSettings({ ...settings, enforced: v, enabled: v || settings.enabled })}
            title="Enforce MFA for All Users"
            description="Require all users to set up MFA before they can access the system"
            disabled={!settings.enabled}
          />

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

          <div className={styles.s6}>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Card>

      <PersonalMfaCard />
    </div>
  );
}

function ToggleOption({ checked, onChange, title, description, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; title: string; description: string; disabled?: boolean;
}) {
  return (
    <div className={styles.s7} style={{opacity: disabled ? 0.5 : 1}}>
      <input
        type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={styles.s8}
      />
      <div className="flex-1">
        <div className="ui-heading-sm">{title}</div>
        <div className={styles.s9}>{description}</div>
      </div>
    </div>
  );
}
