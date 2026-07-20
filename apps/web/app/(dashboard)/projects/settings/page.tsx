'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Briefcase, Clock, Users, Settings } from 'lucide-react';

export default function ProjectsSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Projects"
        description="Configure project templates, billing rates, and milestone templates."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Projects', href: '/projects' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/projects/templates" className={styles.card}>
          <div className={styles.iconWrap}><Briefcase size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Project Templates</p>
            <p className={styles.cardDesc}>Create and manage project templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/projects/billing-rates" className={styles.card}>
          <div className={styles.iconWrap}><Clock size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Billing Rates</p>
            <p className={styles.cardDesc}>Set role-based billing rates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/projects/milestone-templates" className={styles.card}>
          <div className={styles.iconWrap}><Briefcase size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Milestone Templates</p>
            <p className={styles.cardDesc}>Define milestone templates for projects</p>
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
