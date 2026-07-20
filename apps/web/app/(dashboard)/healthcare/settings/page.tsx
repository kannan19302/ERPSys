'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Building, ClipboardCheck, Shield, Settings } from 'lucide-react';

export default function HealthcareSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Healthcare"
        description="Configure clinical templates, department settings, insurance providers, and pharmacy settings."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Healthcare', href: '/healthcare' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/healthcare/templates" className={styles.card}>
          <div className={styles.iconWrap}><ClipboardCheck size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Clinical Templates</p>
            <p className={styles.cardDesc}>Manage clinical note and form templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/healthcare/departments" className={styles.card}>
          <div className={styles.iconWrap}><Building size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Department Config</p>
            <p className={styles.cardDesc}>Configure healthcare departments</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/healthcare/insurance" className={styles.card}>
          <div className={styles.iconWrap}><ClipboardCheck size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Insurance Providers</p>
            <p className={styles.cardDesc}>Manage insurance provider data</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/healthcare/pharmacy-settings" className={styles.card}>
          <div className={styles.iconWrap}><Building size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Pharmacy Settings</p>
            <p className={styles.cardDesc}>Configure pharmacy operations</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/compliance" className={styles.card}>
          <div className={styles.iconWrap}><Shield size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Compliance</p>
            <p className={styles.cardDesc}>Manage compliance and regulatory settings</p>
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
