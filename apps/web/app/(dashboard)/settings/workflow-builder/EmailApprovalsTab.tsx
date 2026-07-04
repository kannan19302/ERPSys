'use client';

import React from 'react';

export default function EmailApprovalsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
          One-Click Email Approve/Reject Preview
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Approvers receive email alerts formatted like below, allowing secure actions directly from inbox client.
        </p>

        <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', background: 'var(--color-bg)', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>U</div>
            <div>
              <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>UniERP Approval Request</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>notifications@unerp.dev</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-sm)', margin: '0 0 var(--space-2) 0' }}>Hi <strong>John</strong>,</p>
            <p style={{ fontSize: 'var(--text-sm)', margin: '0 0 var(--space-2) 0', color: 'var(--color-text-secondary)' }}>
              A <strong>Purchase Order (PO-2026-0285)</strong> requires your approval:
            </p>
            <div style={{ background: 'var(--color-bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: '13px' }}>
              <div><strong>Item:</strong> Machine Parts — Urgent Repair</div>
              <div><strong>Amount:</strong> $12,800.00</div>
              <div><strong>Requested by:</strong> Ops Manager</div>
              <div><strong>Priority:</strong> CRITICAL</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: 'var(--space-2.5) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
              Approve
            </button>
            <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: 'var(--space-2.5) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
              Reject
            </button>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
            This link expires in 24 hours. Secured with HMAC token verification.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Email Approval Settings</h3>
        {[
          { label: 'Enable Email Approvals', desc: 'Send approval emails with one-click action buttons', enabled: true },
          { label: 'Secure Token Expiry', desc: 'Set to 24 hours — action links expire after this period', enabled: true },
          { label: 'CC Requester on Decision', desc: 'Automatically CC the original requester when approved/rejected', enabled: true },
          { label: 'Include Comment Box', desc: 'Add an optional comments field in the email action', enabled: false },
        ].map((opt, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
            <div>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
            </div>
            <div style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: opt.enabled ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: opt.enabled ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
