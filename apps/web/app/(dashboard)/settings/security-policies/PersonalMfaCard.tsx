'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge, FormField, Input } from '@unerp/ui';
import { ShieldCheck, ShieldOff, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './MfaTab.module.css';

interface SetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}

type Stage = 'idle' | 'enrolling' | 'recovery';

/**
 * Self-service TOTP enrollment for the signed-in user. Distinct from the
 * org-wide MFA policy above: this actually turns on a second factor for you.
 */
export default function PersonalMfaCard() {
  const client = useApiClient();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('idle');
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await client.get<{ mfaEnabled?: boolean }>('/auth/me');
        setEnabled(!!me.mfaEnabled);
      } catch { /* leave default */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const startEnrollment = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await client.post<SetupResponse>('/auth/mfa/setup');
      setSetup(res);
      setStage('enrolling');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start MFA setup.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await client.post<{ recoveryCodes?: string[] }>('/auth/mfa/verify', { code, enable: true });
      setRecoveryCodes(res.recoveryCodes ?? []);
      setEnabled(true);
      setStage('recovery');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const disableMfa = async () => {
    setError(null);
    setBusy(true);
    try {
      await client.post('/auth/mfa/verify', { code, enable: false });
      setEnabled(false);
      setStage('idle');
      setSetup(null);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Enter a current authenticator code to disable MFA.');
    } finally {
      setBusy(false);
    }
  };

  const copyRecovery = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  if (loading) return <Card><div className="ui-center-pad"><Spinner size="lg" /></div></Card>;

  return (
    <Card>
      <div className={styles.s5}>
        <div className="ui-flex-between">
          <div className="ui-heading-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {enabled ? <ShieldCheck size={18} color="var(--color-success)" /> : <ShieldOff size={18} color="var(--color-text-tertiary)" />}
            Your Two-Factor Authentication
          </div>
          {enabled
            ? <Badge variant="success">Active</Badge>
            : <Badge variant="default">Not set up</Badge>}
        </div>

        <p className={styles.s4}>
          Protect your own account with an authenticator app (TOTP). This is separate
          from the org-wide policy above.
        </p>

        {error && (
          <div className="ui-alert ui-alert-danger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> <span>{error}</span>
          </div>
        )}

        {/* IDLE — not enrolled */}
        {stage === 'idle' && !enabled && (
          <Button variant="primary" onClick={startEnrollment} disabled={busy}>
            {busy ? <><Spinner size="sm" /> Preparing…</> : 'Set up authenticator app'}
          </Button>
        )}

        {/* ENROLLING — show QR + verify */}
        {stage === 'enrolling' && setup && (
          <form onSubmit={confirmEnrollment} className="ui-stack-4">
            <p className={styles.s4}>Scan this QR code in your authenticator app, then enter the 6-digit code to confirm.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrCodeUrl} alt="TOTP QR code" width={200} height={200} style={{ borderRadius: 8, background: '#fff', padding: 8 }} />
            <div className={styles.s4}>
              Can&apos;t scan? Enter this key manually: <code>{setup.secret}</code>
            </div>
            <FormField label="Verification code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </FormField>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" type="submit" disabled={busy || code.length < 6}>
                {busy ? <><Spinner size="sm" /> Verifying…</> : 'Verify & enable'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => { setStage('idle'); setSetup(null); setCode(''); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* RECOVERY — one-time display */}
        {stage === 'recovery' && (
          <div className="ui-stack-4">
            <div className="ui-alert ui-alert-warning" style={{ display: 'flex', gap: 8 }}>
              <AlertTriangle size={16} />
              <span>Save these recovery codes now. Each works once if you lose your device — they won&apos;t be shown again.</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'monospace', padding: 12, background: 'var(--color-bg-sunken)', borderRadius: 8 }}>
              {recoveryCodes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={copyRecovery}>
                {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy codes</>}
              </Button>
              <Button variant="primary" onClick={() => setStage('idle')}>I&apos;ve saved them</Button>
            </div>
          </div>
        )}

        {/* ENABLED — allow disable */}
        {enabled && stage === 'idle' && (
          <div className="ui-stack-3">
            <FormField label="Enter a current code to disable MFA">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </FormField>
            <Button variant="danger" onClick={disableMfa} disabled={busy || code.length < 6}>
              {busy ? <><Spinner size="sm" /> Working…</> : 'Disable MFA'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
