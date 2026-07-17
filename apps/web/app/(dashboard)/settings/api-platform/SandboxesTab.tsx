'use client';
import styles from './SandboxesTab.module.css';
import React, { useState } from 'react';
import { Box } from 'lucide-react';

export default function SandboxesTab() {
  const [sandboxes] = useState([
    { id: 'sb-1', name: 'Integration Test', tenantSlug: 'sandbox-inttest', createdAt: '2026-06-10', expiresAt: '2026-07-10', status: 'ACTIVE', dataSize: '12 MB', apiCalls: 4521 },
    { id: 'sb-2', name: 'QA Environment', tenantSlug: 'sandbox-qa', createdAt: '2026-06-05', expiresAt: '2026-07-05', status: 'ACTIVE', dataSize: '28 MB', apiCalls: 12890 },
    { id: 'sb-3', name: 'Demo Showcase', tenantSlug: 'sandbox-demo', createdAt: '2026-05-01', expiresAt: '2026-06-01', status: 'EXPIRED', dataSize: '45 MB', apiCalls: 32100 },
  ]);

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-between">
        <h3 className={styles.s1}>Sandbox Environments</h3>
        <button className={styles.s2}>
          <Box size={14} /> Create Sandbox
        </button>
      </div>

      <div className={styles.s3}>
        {sandboxes.map((sb) => (
          <div key={sb.id} style={{ opacity: sb.status === 'EXPIRED' ? 0.6 : 1 }} className={styles.s4}
          >
            <div className="ui-flex-between">
              <div>
                <div className="ui-heading-sm font-bold">{sb.name}</div>
                <code className={styles.s5}>{sb.tenantSlug}</code>
              </div>
              <span style={{ color: sb.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-tertiary)', background: sb.status === 'ACTIVE' ? 'var(--color-success-light)' : 'var(--color-bg)' }} className={styles.s6}
              >{sb.status}
              </span>
            </div>
            <div className={styles.s7}>
              <div><div className="ui-text-micro">Data</div><div className="ui-heading-sm">{sb.dataSize}</div></div>
              <div><div className="ui-text-micro">API Calls</div><div className="ui-heading-sm">{sb.apiCalls.toLocaleString()}</div></div>
              <div><div className="ui-text-micro">Expires</div><div className="ui-heading-sm">{sb.expiresAt}</div></div>
            </div>
            <div className="ui-flex ui-gap-2">
              <button className={styles.s8}>Reset Data</button>
              <button className={styles.s9}>Clone to Prod</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
