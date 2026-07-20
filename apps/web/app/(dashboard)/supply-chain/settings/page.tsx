'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Truck, MapPin, Download, Server } from 'lucide-react';

export default function SupplyChainSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Supply Chain"
        description="Configure carriers, shipment tracking, and shipping zones."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Supply Chain', href: '/supply-chain' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/supply-chain/carriers" className={styles.card}>
          <div className={styles.iconWrap}><Truck size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Carriers</p>
            <p className={styles.cardDesc}>Manage shipping carriers and rates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/supply-chain/tracking" className={styles.card}>
          <div className={styles.iconWrap}><MapPin size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Shipment Tracking</p>
            <p className={styles.cardDesc}>Configure tracking integrations</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/supply-chain/zones" className={styles.card}>
          <div className={styles.iconWrap}><MapPin size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Shipping Zones</p>
            <p className={styles.cardDesc}>Define shipping zones and rules</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/exports" className={styles.card}>
          <div className={styles.iconWrap}><Download size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Import/Export</p>
            <p className={styles.cardDesc}>Bulk data import and export tools</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/admin" className={styles.card}>
          <div className={styles.iconWrap}><Server size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Operations</p>
            <p className={styles.cardDesc}>System administration tools</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
      </div>
    </div>
  );
}
