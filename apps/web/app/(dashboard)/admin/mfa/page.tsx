'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, RefreshCw } from 'lucide-react';

interface MfaSettings {
  enabled: boolean;
  mfaType: string;
  enforced: boolean;
}

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function MfaPage() {
  const [mfaSettings, setMfaSettings] = useState<MfaSettings>({ enabled: false, mfaType: 'TOTP', enforced: false });
  const [loading, setLoading] = useState(false);
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaSaved, setMfaSaved] = useState(false);

  const fetchMfaSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mfa`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMfaSettings(data);
      }
    } catch (e) {
      console.error('Error fetching MFA settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMfaSettings();
  }, []);

  const saveMfaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaSaving(true);
    setMfaSaved(false);
    try {
      const res = await fetch(`${API_BASE}/mfa`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(mfaSettings),
      });
      if (res.ok) {
        setMfaSaved(true);
        setTimeout(() => setMfaSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save MFA settings', e);
    } finally {
      setMfaSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Smartphone style={{ color: 'var(--color-primary)' }} />
          Multi-Factor Authentication (MFA)
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Configure verification criteria, enforcement thresholds, and channels for two-factor authentication.
        </p>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <form onSubmit={saveMfaSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>MFA Controls</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Enable MFA Profiles</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Allow users to set up two-factor authorization profiles on their accounts</div>
              </div>
              <input type="checkbox" checked={mfaSettings.enabled} onChange={e => setMfaSettings({ ...mfaSettings, enabled: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Enforce MFA for all users</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Force every user to configure MFA at their next login session</div>
              </div>
              <input type="checkbox" checked={mfaSettings.enforced} onChange={e => setMfaSettings({ ...mfaSettings, enforced: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>Primary MFA Type</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Verification code delivery method</div>
              </div>
              <select value={mfaSettings.mfaType} onChange={e => setMfaSettings({ ...mfaSettings, mfaType: e.target.value })} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="TOTP">Authenticator App (TOTP)</option>
                <option value="EMAIL">Email Verification Code</option>
                <option value="SMS">SMS Message (Twilio integration)</option>
              </select>
            </div>

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button type="submit" disabled={mfaSaving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: mfaSaving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)'
              }}>{mfaSaving ? 'Saving...' : 'Save MFA Policy'}</button>
              {mfaSaved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><CheckCircle size={12} /> MFA configuration saved</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
