'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, StatusBadge, Badge } from '@unerp/ui';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Webhook,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  rateLimit: number;
  status: string;
  createdAt: string;
}

interface WebhookData {
  id: string;
  name: string;
  targetUrl: string;
  events: string;
  status: string;
  createdAt: string;
}

interface LogData {
  id: string;
  event: string;
  status: string;
  responseStatus: number | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'logs'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(120);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Load mock data
    setApiKeys([
      { id: 'key-1', name: 'Read-only API Key', prefix: 'ue_live_', rateLimit: 120, status: 'ACTIVE', createdAt: new Date().toLocaleDateString() },
      { id: 'key-2', name: 'CI/CD Pipeline Key', prefix: 'ue_test_', rateLimit: 60, status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000).toLocaleDateString() },
    ]);
    setWebhooks([
      { id: 'wh-1', name: 'Invoice Paid Event', targetUrl: 'https://api.external-service.com/webhooks/invoice', events: '["invoice.paid", "invoice.created"]', status: 'ACTIVE', createdAt: new Date().toLocaleDateString() },
    ]);
    setLogs([
      { id: 'log-1', event: 'invoice.paid', status: 'SUCCESS', responseStatus: 200, createdAt: new Date().toLocaleString() },
      { id: 'log-2', event: 'invoice.created', status: 'FAILED', responseStatus: 500, createdAt: new Date(Date.now() - 3600000).toLocaleString() },
    ]);
  }, []);

  const handleCreateKey = () => {
    if (!newKeyName) return;
    const newKey: ApiKeyData = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      prefix: 'ue_live_',
      rateLimit: newKeyRateLimit,
      status: 'ACTIVE',
      createdAt: new Date().toLocaleDateString(),
    };
    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName('');
    setShowCreateKey(false);
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(`ue_live_${id.substring(0, 24)}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (id: string) => {
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k)));
  };

  const tabs = [
    { key: 'keys' as const, label: 'API Keys', icon: Key },
    { key: 'webhooks' as const, label: 'Webhooks', icon: Webhook },
    { key: 'logs' as const, label: 'Delivery Logs', icon: ExternalLink },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="API Platform & Developer Console"
        description="Manage API keys, webhook subscriptions, and monitor delivery logs for third-party integrations."
        breadcrumbs={[{ label: 'Administration' }, { label: 'API Platform' }]}
        actions={
          <Button variant="primary" onClick={() => setShowCreateKey(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} /> Generate API Key
          </Button>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              border: 'none',
              background: 'none',
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab.key ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.15s ease',
            }}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Key Prefix</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Rate Limit</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-medium)' }}>{k.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <code style={{ background: 'var(--color-bg-sunken)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                      {k.prefix}••••••••
                    </code>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{k.rateLimit}/min</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={k.status} /></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      <button onClick={() => handleCopy(k.id)} title="Copy Key" style={{ border: 'none', background: 'none', cursor: 'pointer', color: copiedId === k.id ? 'var(--color-success)' : 'var(--color-text-secondary)', padding: '4px' }}>
                        {copiedId === k.id ? <CheckCircle size={15} /> : <Copy size={15} />}
                      </button>
                      {k.status === 'ACTIVE' && (
                        <button onClick={() => handleRevoke(k.id)} title="Revoke" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Target URL</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Events</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh) => (
                <tr key={wh.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-medium)' }}>{wh.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>{wh.targetUrl}</code>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {JSON.parse(wh.events).map((e: string) => (
                        <Badge key={e} variant="info">{e}</Badge>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={wh.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Delivery Logs Tab */}
      {activeTab === 'logs' && (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Event</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>HTTP Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge variant="info">{log.event}</Badge></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}><StatusBadge status={log.status} /></td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace' }}>{log.responseStatus ?? '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{log.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Key Modal */}
      {showCreateKey && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Generate New API Key</h3>
              <button onClick={() => setShowCreateKey(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Key Name</label>
                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Read-Only" style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Rate Limit (req/min)</label>
                <input type="number" value={newKeyRateLimit} onChange={(e) => setNewKeyRateLimit(Number(e.target.value))} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Button variant="outline" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateKey}>Generate Key</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
