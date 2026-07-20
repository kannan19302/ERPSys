'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Building2, Key, CreditCard, Settings } from 'lucide-react';

export default function RealEstateSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Real Estate"
        description="Configure property types, lease templates, commission rules, and amenity categories."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Real Estate', href: '/real-estate' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/real-estate/property-types" className={styles.card}>
          <div className={styles.iconWrap}><Building2 size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Property Types</p>
            <p className={styles.cardDesc}>Manage property type classifications</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/real-estate/lease-templates" className={styles.card}>
          <div className={styles.iconWrap}><Key size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Lease Templates</p>
            <p className={styles.cardDesc}>Create and manage lease agreement templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/real-estate/commission-rules" className={styles.card}>
          <div className={styles.iconWrap}><Building2 size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Commission Rules</p>
            <p className={styles.cardDesc}>Configure agent commission structures</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/real-estate/amenities" className={styles.card}>
          <div className={styles.iconWrap}><Key size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Amenity Categories</p>
            <p className={styles.cardDesc}>Manage property amenity types</p>
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
