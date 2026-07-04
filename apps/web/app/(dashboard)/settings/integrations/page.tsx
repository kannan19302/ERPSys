'use client';

import React from 'react';
import { Plug, Shield } from 'lucide-react';

export default function IntegrationsSettingsPage() {
  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '56rem' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-semibold)' }}>Integrations</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Connect your workspace to external payment gateways, mail servers, and endpoints.</p>
      </div>

      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Plug size={18} style={{ color: 'var(--color-primary)' }}/> External Connections</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Manage SMTP bindings, billing connectors, and webhooks.</p>
        </div>
        <hr className="border-border" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Shield size={16} style={{ color: 'var(--color-primary)' }}/> SMTP / Email Gateway</div>
              <button style={{ fontSize: 'var(--text-xs)', paddingInline: 'var(--space-3)' }}>Configure</button>
            </div>
            <div style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Configure your own SMTP server to send invoices, quotes, and password resets from your own domain.
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Stripe Payments</div>
              <button style={{ fontSize: 'var(--text-xs)', paddingInline: 'var(--space-3)' }}>Connect</button>
            </div>
            <div style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Allow customers to pay invoices online via credit card.
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Webhook Endpoint</div>
              <button style={{ fontSize: 'var(--text-xs)', paddingInline: 'var(--space-3)' }}>Add Webhook</button>
            </div>
            <div style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Receive real-time HTTP POST payloads when events happen in your workspace (e.g. Invoice Created).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
