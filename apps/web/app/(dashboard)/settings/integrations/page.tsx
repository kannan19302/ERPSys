'use client';

import styles from './page.module.css';

import React from 'react';
import { Plug, Shield } from 'lucide-react';

export default function IntegrationsSettingsPage() {
  return (
    <div className={`${styles.p1} animate-fade-in-up`} >
      <div>
        <h1 className={styles.p2}>Integrations</h1>
        <p className="ui-text-sm-muted">Connect your workspace to external payment gateways, mail servers, and endpoints.</p>
      </div>

      <div className={styles.p3}>
        <div>
          <h3 className={styles.p4}><Plug size={18} className="ui-text-primary"/> External Connections</h3>
          <p className={styles.p5}>Manage SMTP bindings, billing connectors, and webhooks.</p>
        </div>
        <hr className="border-border" />

        <div className="ui-stack-4">
          <div className={styles.p6}>
            <div className={styles.p7}>
              <div className={styles.p8}><Shield size={16} className="ui-text-primary"/> SMTP / Email Gateway</div>
              <button className={styles.p9}>Configure</button>
            </div>
            <div className={styles.p10}>
              Configure your own SMTP server to send invoices, quotes, and password resets from your own domain.
            </div>
          </div>

          <div className={styles.p11}>
            <div className={styles.p12}>
              <div className={styles.p13}>Stripe Payments</div>
              <button className={styles.p14}>Connect</button>
            </div>
            <div className={styles.p15}>
              Allow customers to pay invoices online via credit card.
            </div>
          </div>

          <div className={styles.p16}>
            <div className={styles.p17}>
              <div className={styles.p18}>Webhook Endpoint</div>
              <button className={styles.p19}>Add Webhook</button>
            </div>
            <div className={styles.p20}>
              Receive real-time HTTP POST payloads when events happen in your workspace (e.g. Invoice Created).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
