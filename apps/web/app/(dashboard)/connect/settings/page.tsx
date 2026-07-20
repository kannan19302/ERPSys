'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Mail, Shield, Settings } from 'lucide-react';

export default function ConnectSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Communication"
        description="Configure email templates, channels, and notification preferences."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Connect', href: '/connect' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/connect/email-templates" className={styles.card}>
          <div className={styles.iconWrap}><Mail size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Email Templates</p>
            <p className={styles.cardDesc}>Manage transactional email templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/connect/channels" className={styles.card}>
          <div className={styles.iconWrap}><MessageSquare size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Channels</p>
            <p className={styles.cardDesc}>Configure communication channels</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/connect/notification-prefs" className={styles.card}>
          <div className={styles.iconWrap}><MessageSquare size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Notification Preferences</p>
            <p className={styles.cardDesc}>Set default notification rules</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/security" className={styles.card}>
          <div className={styles.iconWrap}><Shield size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Security</p>
            <p className={styles.cardDesc}>Manage roles and permissions</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/settings" className={styles.card}>
          <div className={styles.iconWrap}><Settings size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Settings</p>
            <p className={styles.cardDesc}>General SaaS portal settings</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
      </div>
    </div>
  );
}
