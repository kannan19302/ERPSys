'use client';

import React, { useState } from 'react';
import {
  Shield, Lock, RefreshCw, Copy, Globe
} from 'lucide-react';

export default function ApiPlatformOauthPage() {
  const [oauthClients] = useState([
    { id: 'cl-1', name: 'QuickBooks Sync', clientId: 'qb_sync_28a4f1...', redirectUri: 'https://quickbooks.intuit.com/callback', scopes: ['finance.read', 'finance.write'], status: 'ACTIVE', createdAt: '2026-05-20' },
    { id: 'cl-2', name: 'Salesforce CRM Bridge', clientId: 'sf_crm_7b9c3e...', redirectUri: 'https://login.salesforce.com/callback', scopes: ['crm.read', 'contacts.write'], status: 'ACTIVE', createdAt: '2026-06-01' },
    { id: 'cl-3', name: 'Shopify Store Connector', clientId: 'shop_con_d45e2...', redirectUri: 'https://accounts.shopify.com/callback', scopes: ['inventory.read', 'orders.write'], status: 'REVOKED', createdAt: '2026-04-15' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Shield style={{ color: 'var(--color-primary)' }} />
          SSO & OAuth Clients
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Configure SAML/OIDC identity providers and register third-party OAuth 2.0 client integrations.
        </p>
      </div>

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
    </div>
  );
}
