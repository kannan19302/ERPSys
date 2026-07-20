'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, FolderOpen, HardDrive, Download, Settings } from 'lucide-react';

export default function DriveSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Drive"
        description="Configure document templates, storage quotas, media conversion, and e-signatures."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Drive', href: '/drive' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/drive/templates" className={styles.card}>
          <div className={styles.iconWrap}><FolderOpen size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Document Templates</p>
            <p className={styles.cardDesc}>Manage document template library</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/drive/quotas" className={styles.card}>
          <div className={styles.iconWrap}><HardDrive size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Storage Quotas</p>
            <p className={styles.cardDesc}>Manage storage limits and usage</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/drive/media" className={styles.card}>
          <div className={styles.iconWrap}><FolderOpen size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Media Conversion</p>
            <p className={styles.cardDesc}>Configure media conversion settings</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/drive/advanced" className={styles.card}>
          <div className={styles.iconWrap}><HardDrive size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>E-Signatures</p>
            <p className={styles.cardDesc}>Configure e-signature providers</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/exports" className={styles.card}>
          <div className={styles.iconWrap}><Download size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Export</p>
            <p className={styles.cardDesc}>Data export tools</p>
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
