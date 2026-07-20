'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Wrench, Phone, Users, Settings } from 'lucide-react';

export default function FieldServiceSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Field Service"
        description="Configure service templates, technician skills, service zones, and contract templates."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Field Service', href: '/field-service' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/field-service/templates" className={styles.card}>
          <div className={styles.iconWrap}><Wrench size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Service Templates</p>
            <p className={styles.cardDesc}>Manage service task templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/field-service/skills" className={styles.card}>
          <div className={styles.iconWrap}><Wrench size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Technician Skills</p>
            <p className={styles.cardDesc}>Define technician skill sets</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/field-service/zones" className={styles.card}>
          <div className={styles.iconWrap}><Phone size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Service Zones</p>
            <p className={styles.cardDesc}>Define geographic service zones</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/field-service/contract-templates" className={styles.card}>
          <div className={styles.iconWrap}><Phone size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Contract Templates</p>
            <p className={styles.cardDesc}>Manage service contract templates</p>
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
