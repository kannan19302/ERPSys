'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Factory, Wrench, Server, Settings } from 'lucide-react';

export default function ManufacturingSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Manufacturing"
        description="Configure BOM settings, production calendars, routing templates, and work centers."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Manufacturing', href: '/manufacturing' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/manufacturing/bom-settings" className={styles.card}>
          <div className={styles.iconWrap}><Factory size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>BOM Settings</p>
            <p className={styles.cardDesc}>Configure bill of materials defaults</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/manufacturing/calendars" className={styles.card}>
          <div className={styles.iconWrap}><Factory size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Production Calendars</p>
            <p className={styles.cardDesc}>Manage production shift calendars</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/manufacturing/routing" className={styles.card}>
          <div className={styles.iconWrap}><Wrench size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Routing Templates</p>
            <p className={styles.cardDesc}>Define manufacturing routing templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/manufacturing/work-centers" className={styles.card}>
          <div className={styles.iconWrap}><Wrench size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Work Centers</p>
            <p className={styles.cardDesc}>Manage work center configurations</p>
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
