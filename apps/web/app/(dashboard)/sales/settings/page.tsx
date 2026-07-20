'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Truck, Percent, CreditCard, Settings, Key } from 'lucide-react';

export default function SalesSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Sales"
        description="Configure order types, shipping, tax rules, and price books."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Sales', href: '/sales' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/sales/order-types" className={styles.card}>
          <div className={styles.iconWrap}><ShoppingCart size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Order Types</p>
            <p className={styles.cardDesc}>Define sales order types and workflows</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/sales/shipping" className={styles.card}>
          <div className={styles.iconWrap}><Truck size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Shipping Config</p>
            <p className={styles.cardDesc}>Configure shipping methods and rules</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/sales/tax-rules" className={styles.card}>
          <div className={styles.iconWrap}><Percent size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Tax Rules</p>
            <p className={styles.cardDesc}>Set up sales tax rules and calculations</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/sales/price-books" className={styles.card}>
          <div className={styles.iconWrap}><ShoppingCart size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Price Books</p>
            <p className={styles.cardDesc}>Manage pricing tiers and price lists</p>
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
        <Link href="/saas/api-keys" className={styles.card}>
          <div className={styles.iconWrap}><Key size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>API Keys</p>
            <p className={styles.cardDesc}>Manage API access keys</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
      </div>
    </div>
  );
}
