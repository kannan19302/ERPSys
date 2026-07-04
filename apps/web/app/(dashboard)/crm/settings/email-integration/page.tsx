'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent, useToast } from '@unerp/ui';
import { Mail, RefreshCw, Trash2, AlertCircle, CheckCircle2, Plug } from 'lucide-react';
import { apiGet, apiSend } from '../../_components/api';

type Provider = 'GOOGLE' | 'MICROSOFT';
type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

interface MailboxConnection {
  id: string;
  provider: Provider;
  emailAddress: string;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  lastSyncMessages: number;
  lastSyncEvents: number;
  createdAt: string;
}

const CALLBACK_PATH = '/crm/settings/email-integration';

export default function EmailIntegrationSettingsPage() {
  const [connections, setConnections] = useState<MailboxConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<MailboxConnection[]>('/crm/mailbox-connections');
      setConnections(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Could not load mailbox connections.');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Handle the OAuth redirect back from the provider (?code=...&state=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    (async () => {
      try {
        const decoded = JSON.parse(atob(state.replace(/-/g, '+').replace(/_/g, '/')));
        const provider: Provider = decoded.provider;
        await apiSend('/crm/mailbox-connections/callback', 'POST', {
          provider,
          code,
          redirectUri: `${window.location.origin}${CALLBACK_PATH}`,
        });
        toast.success('Mailbox connected.');
        window.history.replaceState({}, '', CALLBACK_PATH);
        await load();
      } catch {
        setError('Could not complete mailbox connection.');
        window.history.replaceState({}, '', CALLBACK_PATH);
      }
    })();
  }, []);

  const connect = async (provider: Provider) => {
    setConnecting(provider);
    try {
      const result = await apiSend<{ authorizationUrl: string }>('/crm/mailbox-connections/connect', 'POST', {
        provider,
        redirectUri: `${window.location.origin}${CALLBACK_PATH}`,
      });
      window.location.href = result.authorizationUrl;
    } catch {
      setError(`Could not start ${provider === 'GOOGLE' ? 'Google' : 'Microsoft'} connection. Check that OAuth is configured on the server.`);
      setConnecting(null);
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this mailbox? Synced activity records are kept.')) return;
    try {
      await apiSend(`/crm/mailbox-connections/${id}`, 'DELETE');
      await load();
    } catch {
      setError('Could not disconnect mailbox.');
    }
  };

  const syncNow = async (id: string) => {
    setSyncingId(id);
    try {
      const result = await apiSend<{ messagesSynced: number; eventsSynced: number; syncError: string | null }>(
        `/crm/mailbox-connections/${id}/sync`, 'POST',
      );
      if (result.syncError) {
        toast.error('Sync completed with an error', result.syncError);
      } else {
        toast.success('Sync complete', `Synced ${result.messagesSynced} email(s) and ${result.eventsSynced} calendar event(s).`);
      }
      await load();
    } catch {
      setError('Could not sync mailbox.');
    } finally {
      setSyncingId(null);
    }
  };

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString() : 'Never');

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Email Integration"
        description="Connect a mailbox so inbound emails and calendar events with your Contacts, Leads, and Customers automatically appear on their activity timeline."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings' },
          { label: 'Email Integration' },
        ]}
        actions={
          <ProtectedComponent permission="crm.mailbox.create">
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="outline" size="sm" onClick={() => connect('GOOGLE')} disabled={connecting !== null}>
                <Mail size={14} style={{ marginRight: 6 }} /> {connecting === 'GOOGLE' ? 'Redirecting…' : 'Connect Gmail'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => connect('MICROSOFT')} disabled={connecting !== null}>
                <Mail size={14} style={{ marginRight: 6 }} /> {connecting === 'MICROSOFT' ? 'Redirecting…' : 'Connect Outlook'}
              </Button>
            </div>
          </ProtectedComponent>
        }
      />

      {error && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {connections.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            <Plug size={40} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>
              No mailbox connected. Connect Gmail or Outlook to sync emails and meetings into CRM activity timelines automatically.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Provider</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Email Address</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Last Synced</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Last Sync Results</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>
                    {c.provider === 'GOOGLE' ? 'Gmail' : 'Outlook'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{c.emailAddress}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                    <Badge variant={c.status === 'CONNECTED' ? 'success' : c.status === 'ERROR' ? 'danger' : 'default'}>
                      {c.status === 'CONNECTED' && <CheckCircle2 size={12} style={{ marginRight: 4 }} />}
                      {c.status}
                    </Badge>
                    {c.status === 'ERROR' && c.lastSyncError && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 4 }}>{c.lastSyncError}</div>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{fmtDate(c.lastSyncedAt)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    {c.lastSyncMessages} email(s), {c.lastSyncEvents} event(s)
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <ProtectedComponent permission="crm.mailbox.update">
                      <button
                        onClick={() => syncNow(c.id)}
                        disabled={syncingId === c.id || c.status === 'DISCONNECTED'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginRight: 'var(--space-2)' }}
                        aria-label="Sync now"
                      >
                        <RefreshCw size={16} className={syncingId === c.id ? 'frappe-spin' : undefined} />
                      </button>
                    </ProtectedComponent>
                    <ProtectedComponent permission="crm.mailbox.delete">
                      <button onClick={() => disconnect(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} aria-label="Disconnect">
                        <Trash2 size={16} />
                      </button>
                    </ProtectedComponent>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <strong style={{ color: 'var(--color-text)' }}>How this works</strong>
          <span>
            Connecting a mailbox authorizes UniERP to read recent emails and calendar events via the Gmail API or
            Microsoft Graph. Use &quot;Sync now&quot; to pull the latest messages and meetings — any sender, recipient,
            or attendee whose email address matches an existing Contact, Lead, or Customer gets an Activity entry
            automatically added to that record&apos;s timeline.
          </span>
          <span>
            This is a manual/polling sync (no continuous background listener yet) — click &quot;Sync now&quot;
            periodically, or ask an admin to schedule it.
          </span>
        </div>
      </Card>
    </div>
  );
}
