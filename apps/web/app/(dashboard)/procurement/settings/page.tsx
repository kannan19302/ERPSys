'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, FileText, Shield, Settings } from 'lucide-react';

export default function ProcurementSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Procurement"
        description="Configure purchase terms, approval rules, and supplier types."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/procurement/terms" className={styles.card}>
          <div className={styles.iconWrap}><FileText size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Purchase Terms</p>
            <p className={styles.cardDesc}>Define default purchase order terms</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/procurement/approvals" className={styles.card}>
          <div className={styles.iconWrap}><ShoppingCart size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Approval Rules</p>
            <p className={styles.cardDesc}>Configure purchase approval workflows</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/procurement/supplier-types" className={styles.card}>
          <div className={styles.iconWrap}><FileText size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Supplier Types</p>
            <p className={styles.cardDesc}>Manage supplier categories and types</p>
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
