'use client';

import React, { useState } from 'react';
import { Box } from 'lucide-react';

export default function SandboxesTab() {
  const [sandboxes] = useState([
    { id: 'sb-1', name: 'Integration Test', tenantSlug: 'sandbox-inttest', createdAt: '2026-06-10', expiresAt: '2026-07-10', status: 'ACTIVE', dataSize: '12 MB', apiCalls: 4521 },
    { id: 'sb-2', name: 'QA Environment', tenantSlug: 'sandbox-qa', createdAt: '2026-06-05', expiresAt: '2026-07-05', status: 'ACTIVE', dataSize: '28 MB', apiCalls: 12890 },
    { id: 'sb-3', name: 'Demo Showcase', tenantSlug: 'sandbox-demo', createdAt: '2026-05-01', expiresAt: '2026-06-01', status: 'EXPIRED', dataSize: '45 MB', apiCalls: 32100 },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Sandbox Environments</h3>
        <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Box size={14} /> Create Sandbox
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {sandboxes.map((sb) => (
          <div key={sb.id} style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            opacity: sb.status === 'EXPIRED' ? 0.6 : 1,
          }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{sb.name}</div>
                <code style={{ fontSize: '10px', color: 'var(--color-primary)' }}>{sb.tenantSlug}</code>
              </div>
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)',
                color: sb.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                background: sb.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg)',
              }}
              >{sb.status}
              </span>
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
  );
}
