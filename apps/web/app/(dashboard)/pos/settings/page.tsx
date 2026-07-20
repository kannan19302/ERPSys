'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Smartphone, Receipt, CreditCard, Settings } from 'lucide-react';

export default function PosSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Point of Sale"
        description="Configure receipt templates, payment methods, tax profiles, and shift settings."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'POS', href: '/pos' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/pos/receipt-templates" className={styles.card}>
          <div className={styles.iconWrap}><Receipt size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Receipt Templates</p>
            <p className={styles.cardDesc}>Customize POS receipt layouts</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/pos/payment-methods" className={styles.card}>
          <div className={styles.iconWrap}><Smartphone size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Payment Methods</p>
            <p className={styles.cardDesc}>Configure accepted payment types</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/pos/tax-profiles" className={styles.card}>
          <div className={styles.iconWrap}><Receipt size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Tax Profiles</p>
            <p className={styles.cardDesc}>Set up POS-specific tax profiles</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/pos/shift-settings" className={styles.card}>
          <div className={styles.iconWrap}><Smartphone size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Shift Settings</p>
            <p className={styles.cardDesc}>Configure cash register shifts</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/billing" className={styles.card}>
          <div className={styles.iconWrap}><CreditCard size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Billing</p>
            <p className={styles.cardDesc}>Manage your plan and invoices</p>
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
