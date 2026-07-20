'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Package, Warehouse, ClipboardList, Download, Server, Settings } from 'lucide-react';

export default function InventorySettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Inventory"
        description="Configure warehouses, units of measure, reorder rules, quality templates, and license plates."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Inventory', href: '/inventory' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/inventory/warehouses" className={styles.card}>
          <div className={styles.iconWrap}><Warehouse size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Warehouses</p>
            <p className={styles.cardDesc}>Manage warehouse locations and bins</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/inventory/uom" className={styles.card}>
          <div className={styles.iconWrap}><Package size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Units of Measure</p>
            <p className={styles.cardDesc}>Define UOM conversions and groupings</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/inventory/reorder-rules" className={styles.card}>
          <div className={styles.iconWrap}><ClipboardList size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Reorder Rules</p>
            <p className={styles.cardDesc}>Set min/max stock levels and reorder points</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/inventory/qa-templates" className={styles.card}>
          <div className={styles.iconWrap}><ClipboardList size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Quality Templates</p>
            <p className={styles.cardDesc}>Inspection and quality check templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/inventory/license-plates" className={styles.card}>
          <div className={styles.iconWrap}><Package size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>License Plates</p>
            <p className={styles.cardDesc}>Manage LPN tracking and configuration</p>
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
            <p className={styles.cardTitle}>System Operations</p>
            <p className={styles.cardDesc}>System administration tools</p>
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
