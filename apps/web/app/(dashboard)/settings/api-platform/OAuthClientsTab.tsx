'use client';
import styles from './OAuthClientsTab.module.css';
import React, { useState } from 'react';
import { Shield, Lock, RefreshCw, Copy, Globe } from 'lucide-react';

export default function OAuthClientsTab() {
  const [oauthClients] = useState([
    { id: 'cl-1', name: 'QuickBooks Sync', clientId: 'qb_sync_28a4f1...', redirectUri: 'https://quickbooks.intuit.com/callback', scopes: ['finance.read', 'finance.write'], status: 'ACTIVE', createdAt: '2026-05-20' },
    { id: 'cl-2', name: 'Salesforce CRM Bridge', clientId: 'sf_crm_7b9c3e...', redirectUri: 'https://login.salesforce.com/callback', scopes: ['crm.read', 'contacts.write'], status: 'ACTIVE', createdAt: '2026-06-01' },
    { id: 'cl-3', name: 'Shopify Store Connector', clientId: 'shop_con_d45e2...', redirectUri: 'https://accounts.shopify.com/callback', scopes: ['inventory.read', 'orders.write'], status: 'REVOKED', createdAt: '2026-04-15' },
  ]);

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-between">
        <h3 className={styles.s1}>OAuth 2.0 Clients</h3>
        <button className={styles.s2}>
          <Lock size={14} /> Register OAuth Client
        </button>
      </div>

      {oauthClients.map((c) => (
        <div key={c.id} style={{ opacity: c.status === 'REVOKED' ? 0.6 : 1 }} className={styles.s3}
        >
          <div className="ui-flex-between ui-items-start">
            <div className="ui-hstack-3">
              <Globe size={20} className="ui-text-primary" />
              <div>
                <div className="ui-heading-sm font-bold">{c.name}</div>
                <div className="ui-text-micro">Created: {c.createdAt}</div>
              </div>
            </div>
            <span style={{ color: c.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-error)', background: c.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-error-light)' }} className={styles.s4}
            >{c.status}
            </span>
          </div>
          <div className={styles.s5}>
            <div>
              <div className={styles.s6}>Client ID</div>
              <div className="ui-hstack-2">
                <code className={styles.s7}>{c.clientId}</code>
                <button className={styles.s8}><Copy size={12} /></button>
              </div>
            </div>
            <div>
              <div className={styles.s6}>Redirect URI</div>
              <code className="ui-text-caption">{c.redirectUri}</code>
            </div>
          </div>
          <div>
            <div className={styles.s9}>Scopes</div>
            <div className={styles.s10}>
              {c.scopes.map((s) => (
                <span key={s} className={styles.s11}>{s}</span>
              ))}
            </div>
          </div>
          <div className="ui-flex ui-gap-2">
            <button className={styles.s12}>
              <RefreshCw size={12} /> Rotate Secret
            </button>
            {c.status === 'ACTIVE' && (
              <button className={styles.s13}>
                Revoke
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="ui-card p-5">
        <h3 className={styles.s14}>
          <Shield size={16} className="ui-text-primary" /> SAML 2.0 / OIDC Configuration
        </h3>
        <div className="ui-grid-2 ui-gap-3">
          {[
            { label: 'Identity Provider', value: 'Okta', placeholder: 'Select IdP...' },
            { label: 'Entity ID', value: 'https://unerp.dev/saml/metadata', placeholder: 'Entity ID...' },
            { label: 'SSO URL', value: 'https://acme.okta.com/app/unerp/sso/saml', placeholder: 'SSO URL...' },
            { label: 'Certificate', value: '-----BEGIN CERT-----...', placeholder: 'Paste X.509 cert...' },
          ].map((field, i) => (
            <div key={i}>
              <label className={styles.s15}>{field.label}</label>
              <input defaultValue={field.value} placeholder={field.placeholder} className={styles.s16}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
