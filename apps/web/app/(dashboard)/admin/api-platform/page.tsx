'use client';

import React, { useState } from 'react';
import {
  Key, Shield, BarChart3, Box, Lock, RefreshCw, Copy,
  Clock, AlertTriangle, CheckCircle, Globe
} from 'lucide-react';

export default function APIPlatformAdvancedPage() {
  const [activeTab, setActiveTab] = useState<'oauth' | 'sandbox' | 'analytics'>('oauth');

  const [oauthClients] = useState([
    { id: 'cl-1', name: 'QuickBooks Sync', clientId: 'qb_sync_28a4f1...', redirectUri: 'https://quickbooks.intuit.com/callback', scopes: ['finance.read', 'finance.write'], status: 'ACTIVE', createdAt: '2026-05-20' },
    { id: 'cl-2', name: 'Salesforce CRM Bridge', clientId: 'sf_crm_7b9c3e...', redirectUri: 'https://login.salesforce.com/callback', scopes: ['crm.read', 'contacts.write'], status: 'ACTIVE', createdAt: '2026-06-01' },
    { id: 'cl-3', name: 'Shopify Store Connector', clientId: 'shop_con_d45e2...', redirectUri: 'https://accounts.shopify.com/callback', scopes: ['inventory.read', 'orders.write'], status: 'REVOKED', createdAt: '2026-04-15' },
  ]);

  const [sandboxes] = useState([
    { id: 'sb-1', name: 'Integration Test', tenantSlug: 'sandbox-inttest', createdAt: '2026-06-10', expiresAt: '2026-07-10', status: 'ACTIVE', dataSize: '12 MB', apiCalls: 4521 },
    { id: 'sb-2', name: 'QA Environment', tenantSlug: 'sandbox-qa', createdAt: '2026-06-05', expiresAt: '2026-07-05', status: 'ACTIVE', dataSize: '28 MB', apiCalls: 12890 },
    { id: 'sb-3', name: 'Demo Showcase', tenantSlug: 'sandbox-demo', createdAt: '2026-05-01', expiresAt: '2026-06-01', status: 'EXPIRED', dataSize: '45 MB', apiCalls: 32100 },
  ]);

  const [apiMetrics] = useState([
    { endpoint: 'GET /api/invoices', calls24h: 12450, avgLatencyMs: 42, errorRate: 0.3, p99LatencyMs: 180 },
    { endpoint: 'POST /api/orders', calls24h: 3280, avgLatencyMs: 85, errorRate: 1.2, p99LatencyMs: 420 },
    { endpoint: 'GET /api/products', calls24h: 18900, avgLatencyMs: 28, errorRate: 0.1, p99LatencyMs: 95 },
    { endpoint: 'PUT /api/inventory', calls24h: 2100, avgLatencyMs: 67, errorRate: 0.8, p99LatencyMs: 310 },
    { endpoint: 'GET /api/employees', calls24h: 5600, avgLatencyMs: 35, errorRate: 0.2, p99LatencyMs: 120 },
    { endpoint: 'POST /api/workflows/trigger', calls24h: 890, avgLatencyMs: 125, errorRate: 2.5, p99LatencyMs: 650 },
  ]);

  const tabs = [
    { id: 'oauth' as const, label: 'OAuth 2.0 / SSO', icon: <Shield size={14} /> },
    { id: 'sandbox' as const, label: 'Developer Sandbox', icon: <Box size={14} /> },
    { id: 'analytics' as const, label: 'API Analytics', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Key style={{ color: 'var(--color-primary)' }} />
          API Platform — Advanced
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          OAuth 2.0 authorization flows, isolated developer sandboxes, and per-endpoint API analytics.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* OAuth 2.0 */}
      {activeTab === 'oauth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>OAuth 2.0 Clients</h3>
            <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Lock size={14} /> Register OAuth Client
            </button>
          </div>

          {oauthClients.map(c => (
            <div key={c.id} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
              opacity: c.status === 'REVOKED' ? 0.6 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Globe size={20} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{c.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Created: {c.createdAt}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)',
                  color: c.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-error)',
                  background: c.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                }}>{c.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Client ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <code style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)' }}>{c.clientId}</code>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}><Copy size={12} /></button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>Redirect URI</div>
                  <code style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{c.redirectUri}</code>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Scopes</div>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {c.scopes.map(s => (
                    <span key={s} style={{ fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button style={{ background: 'none', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> Rotate Secret
                </button>
                {c.status === 'ACTIVE' && (
                  <button style={{ background: 'none', border: '1px solid var(--color-error)', padding: '4px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* SSO Configuration */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Shield size={16} style={{ color: 'var(--color-primary)' }} /> SAML 2.0 / OIDC Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {[
                { label: 'Identity Provider', value: 'Okta', placeholder: 'Select IdP...' },
                { label: 'Entity ID', value: 'https://unerp.dev/saml/metadata', placeholder: 'Entity ID...' },
                { label: 'SSO URL', value: 'https://acme.okta.com/app/unerp/sso/saml', placeholder: 'SSO URL...' },
                { label: 'Certificate', value: '-----BEGIN CERT-----...', placeholder: 'Paste X.509 cert...' },
              ].map((field, i) => (
                <div key={i}>
                  <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)', display: 'block', marginBottom: '2px' }}>{field.label}</label>
                  <input defaultValue={field.value} placeholder={field.placeholder} style={{
                    width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', fontSize: '12px',
                    background: 'var(--color-bg)', color: 'var(--color-text)'
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Developer Sandbox */}
      {activeTab === 'sandbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Sandbox Environments</h3>
            <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Box size={14} /> Create Sandbox
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {sandboxes.map(sb => (
              <div key={sb.id} style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                opacity: sb.status === 'EXPIRED' ? 0.6 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{sb.name}</div>
                    <code style={{ fontSize: '10px', color: 'var(--color-primary)' }}>{sb.tenantSlug}</code>
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)',
                    color: sb.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                    background: sb.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg)',
                  }}>{sb.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Data</div><div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{sb.dataSize}</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>API Calls</div><div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{sb.apiCalls.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Expires</div><div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{sb.expiresAt}</div></div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button style={{ flex: 1, background: 'none', border: '1px solid var(--color-border)', padding: '4px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Reset Data</button>
                  <button style={{ flex: 1, background: 'none', border: '1px solid var(--color-border)', padding: '4px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-primary)' }}>Clone to Prod</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {[
              { label: 'Total Calls (24h)', value: apiMetrics.reduce((s, m) => s + m.calls24h, 0).toLocaleString(), icon: <BarChart3 size={20} />, color: 'var(--color-primary)' },
              { label: 'Avg Latency', value: `${(apiMetrics.reduce((s, m) => s + m.avgLatencyMs, 0) / apiMetrics.length).toFixed(0)} ms`, icon: <Clock size={20} />, color: 'var(--color-success)' },
              { label: 'Error Rate', value: `${(apiMetrics.reduce((s, m) => s + m.errorRate, 0) / apiMetrics.length).toFixed(1)}%`, icon: <AlertTriangle size={20} />, color: 'var(--color-warning)' },
              { label: 'Uptime', value: '99.97%', icon: <CheckCircle size={20} />, color: 'var(--color-success)' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ color: m.color }}>{m.icon}</div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{m.label}</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {['Endpoint', 'Calls (24h)', 'Avg Latency', 'P99 Latency', 'Error Rate'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiMetrics.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <code style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{m.endpoint}</code>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{m.calls24h.toLocaleString()}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ color: m.avgLatencyMs < 50 ? 'var(--color-success)' : m.avgLatencyMs < 100 ? 'var(--color-warning)' : 'var(--color-error)' }}>{m.avgLatencyMs} ms</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ color: m.p99LatencyMs < 200 ? 'var(--color-success)' : m.p99LatencyMs < 500 ? 'var(--color-warning)' : 'var(--color-error)' }}>{m.p99LatencyMs} ms</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: m.errorRate < 1 ? 'var(--color-success)' : 'var(--color-error)', background: m.errorRate < 1 ? 'var(--color-success-light)' : 'var(--color-error-light)', fontWeight: 'var(--weight-semibold)' }}>{m.errorRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
