'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, CreditCard, Truck, Percent, CreditCard as CreditCardIcon, Shield, Key } from 'lucide-react';

export default function EcommerceSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="E-Commerce"
        description="Configure store settings, payment gateways, shipping methods, tax rules, and inventory sync."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'E-Commerce', href: '/ecommerce' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/ecommerce/store-config" className={styles.card}>
          <div className={styles.iconWrap}><ShoppingBag size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Store Configuration</p>
            <p className={styles.cardDesc}>Manage store settings and preferences</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/ecommerce/payments" className={styles.card}>
          <div className={styles.iconWrap}><CreditCard size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Payment Gateways</p>
            <p className={styles.cardDesc}>Configure payment provider integrations</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/ecommerce/shipping" className={styles.card}>
          <div className={styles.iconWrap}><Truck size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Shipping Methods</p>
            <p className={styles.cardDesc}>Set up shipping rates and methods</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/ecommerce/tax-rules" className={styles.card}>
          <div className={styles.iconWrap}><Percent size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Tax Rules</p>
            <p className={styles.cardDesc}>Configure e-commerce tax calculations</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/ecommerce/inventory-sync" className={styles.card}>
          <div className={styles.iconWrap}><ShoppingBag size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Inventory Sync</p>
            <p className={styles.cardDesc}>Configure inventory synchronization</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/billing" className={styles.card}>
          <div className={styles.iconWrap}><CreditCardIcon size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Billing</p>
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
