'use client';
import styles from './page.module.css';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ProtectedComponent, useToast, ListPageTemplate, type ListColumn } from '@unerp/ui';
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
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <div className="ui-stack-6">
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
            <div className="ui-flex ui-gap-2">
              <Button variant="outline" size="sm" onClick={() => connect('GOOGLE')} disabled={connecting !== null}>
                <Mail size={14} className="mr-2" /> {connecting === 'GOOGLE' ? 'Redirecting…' : 'Connect Gmail'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => connect('MICROSOFT')} disabled={connecting !== null}>
                <Mail size={14} className="mr-2" /> {connecting === 'MICROSOFT' ? 'Redirecting…' : 'Connect Outlook'}
              </Button>
            </div>
          </ProtectedComponent>
        }
      />

      {error && (
        <div className={styles.style0}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <Card padding="none">
        {connections.length === 0 ? (
          <div className={styles.style1}>
            <Plug size={40} className={styles.s1} />
            <p className="text-sm">
              No mailbox connected. Connect Gmail or Outlook to sync emails and meetings into CRM activity timelines automatically.
            </p>
          </div>
        ) : (
          <ListPageTemplate
            columns={[
              { key: 'provider', header: 'Provider', render: (v) => <span className="font-semibold">{v === 'GOOGLE' ? 'Gmail' : 'Outlook'}</span> },
              { key: 'emailAddress', header: 'Email Address' },
              { key: 'status', header: 'Status', render: (v, row) => (
                <div>
                  <Badge variant={v === 'CONNECTED' ? 'success' : v === 'ERROR' ? 'danger' : 'default'}>
                    {v === 'CONNECTED' && <CheckCircle2 size={12} className="mr-1" />}
                    {String(v)}
                  </Badge>
                  {v === 'ERROR' && Boolean(row.lastSyncError) && (
                    <div className={styles.style2}>{String(row.lastSyncError)}</div>
                  )}
                </div>
              ) },
              { key: 'lastSyncedAt', header: 'Last Synced', render: (v) => fmtDate(v as string | null) },
              { key: 'lastSyncMessages', header: 'Last Sync Results', render: (v, row) => `${v} email(s), ${row.lastSyncEvents} event(s)` },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className={styles.style3}>
                  <ProtectedComponent permission="crm.mailbox.update">
                    <button onClick={() => syncNow(String(v))} disabled={syncingId === v || row.status === 'DISCONNECTED'} className={styles.style4} aria-label="Sync now">
                      <RefreshCw size={16} className={syncingId === v ? 'ui-spin' : undefined} />
                    </button>
                  </ProtectedComponent>
                  <ProtectedComponent permission="crm.mailbox.delete">
                    <button onClick={() => disconnect(String(v))} className="ui-btn-icon ui-text-danger" aria-label="Disconnect"><Trash2 size={16} /></button>
                  </ProtectedComponent>
                </div>
              ) },
            ] as ListColumn[]}
            data={connections as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No mailbox connected"
            emptyDescription="No mailbox connected. Connect Gmail or Outlook to sync emails and meetings into CRM activity timelines automatically."
          />
        )}
      </Card>

      <Card>
        <div className={styles.style5}>
          <strong className={styles.style6}>How this works</strong>
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
