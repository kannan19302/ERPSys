'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, DollarSign, Calendar, Calculator, CreditCard, Shield, Users } from 'lucide-react';

export default function FinanceSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Finance"
        description="Configure tax rates, fiscal years, currency, accounting periods, and chart of accounts."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Finance', href: '/finance' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/advanced-finance/tax-rates" className={styles.card}>
          <div className={styles.iconWrap}><DollarSign size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Tax Rates</p>
            <p className={styles.cardDesc}>Manage VAT, GST, and other tax rates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/advanced-finance/fiscal-years" className={styles.card}>
          <div className={styles.iconWrap}><Calendar size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Fiscal Years</p>
            <p className={styles.cardDesc}>Define financial year periods</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/advanced-finance/currency" className={styles.card}>
          <div className={styles.iconWrap}><DollarSign size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Currency</p>
            <p className={styles.cardDesc}>Configure base and foreign currencies</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/advanced-finance/accounting-periods" className={styles.card}>
          <div className={styles.iconWrap}><Calendar size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Accounting Periods</p>
            <p className={styles.cardDesc}>Set up monthly, quarterly, or custom periods</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/advanced-finance/coa" className={styles.card}>
          <div className={styles.iconWrap}><Calculator size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Chart of Accounts</p>
            <p className={styles.cardDesc}>Manage your full chart of accounts</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/billing" className={styles.card}>
          <div className={styles.iconWrap}><CreditCard size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Billing & Subscription</p>
            <p className={styles.cardDesc}>Manage your plan and invoices</p>
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
        <Link href="/saas/team" className={styles.card}>
          <div className={styles.iconWrap}><Users size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Team</p>
            <p className={styles.cardDesc}>Manage your organization team</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
      </div>
    </div>
  );
}
