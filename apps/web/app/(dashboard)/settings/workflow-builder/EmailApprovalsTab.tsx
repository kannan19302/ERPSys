'use client';
import styles from './EmailApprovalsTab.module.css';
import React from 'react';

export default function EmailApprovalsTab() {
  return (
    <div className="ui-stack-4">
      <div className="ui-card p-5">
        <h3 className="ui-section-header">
          One-Click Email Approve/Reject Preview
        </h3>
        <p className={styles.p1}>
          Approvers receive email alerts formatted like below, allowing secure actions directly from inbox client.
        </p>

        <div className={styles.p2}>
          <div className={styles.p3}>
            <div className={styles.p4}>U</div>
            <div>
              <div className="ui-heading-sm font-bold">UniERP Approval Request</div>
              <div className="ui-text-micro">notifications@unerp.dev</div>
            </div>
          </div>
          <div className={styles.p5}>
            <p className={styles.p6}>Hi <strong>John</strong>,</p>
            <p className={styles.p7}>
              A <strong>Purchase Order (PO-2026-0285)</strong> requires your approval:
            </p>
            <div className={styles.p8}>
              <div><strong>Item:</strong> Machine Parts — Urgent Repair</div>
              <div><strong>Amount:</strong> $12,800.00</div>
              <div><strong>Requested by:</strong> Ops Manager</div>
              <div><strong>Priority:</strong> CRITICAL</div>
            </div>
          </div>
          <div className={styles.p9}>
            <button className={styles.p10}>
              Approve
            </button>
            <button className={styles.p11}>
              Reject
            </button>
          </div>
          <p className={styles.p12}>
            This link expires in 24 hours. Secured with HMAC token verification.
          </p>
        </div>
      </div>

      <div className="ui-card p-5">
        <h3 className="ui-section-header">Email Approval Settings</h3>
        {[
          { label: 'Enable Email Approvals', desc: 'Send approval emails with one-click action buttons', enabled: true },
          { label: 'Secure Token Expiry', desc: 'Set to 24 hours — action links expire after this period', enabled: true },
          { label: 'CC Requester on Decision', desc: 'Automatically CC the original requester when approved/rejected', enabled: true },
          { label: 'Include Comment Box', desc: 'Add an optional comments field in the email action', enabled: false },
        ].map((opt, i) => (
          <div key={i} style={{ borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }} className={styles.s1}>
            <div>
              <div className="ui-heading-sm">{opt.label}</div>
              <div className="ui-text-caption">{opt.desc}</div>
            </div>
            <div style={{ background: opt.enabled ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s2}>
              <div style={{ left: opt.enabled ? '20px' : '2px' }} className={styles.s3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
