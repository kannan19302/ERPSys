'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen, Shield, Settings } from 'lucide-react';

export default function EducationSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Education"
        description="Configure academic terms, grading scales, fee structures, and library settings."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Education', href: '/education' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/education/terms" className={styles.card}>
          <div className={styles.iconWrap}><GraduationCap size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Academic Terms</p>
            <p className={styles.cardDesc}>Manage academic periods and semesters</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/education/grading" className={styles.card}>
          <div className={styles.iconWrap}><BookOpen size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Grading Scales</p>
            <p className={styles.cardDesc}>Define grading systems and scales</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/education/fees" className={styles.card}>
          <div className={styles.iconWrap}><GraduationCap size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Fee Structures</p>
            <p className={styles.cardDesc}>Configure fee categories and amounts</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/education/library-settings" className={styles.card}>
          <div className={styles.iconWrap}><BookOpen size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Library Settings</p>
            <p className={styles.cardDesc}>Configure library management rules</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/security" className={styles.card}>
          <div className={styles.iconWrap}><Shield size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Users</p>
            <p className={styles.cardDesc}>Manage users, roles, and permissions</p>
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
