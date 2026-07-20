'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, BarChart3, PieChart, Download, Settings } from 'lucide-react';

export default function AnalyticsSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Analytics"
        description="Configure report templates, KPI definitions, data sources, and scheduled reports."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Analytics', href: '/analytics' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/analytics/report-templates" className={styles.card}>
          <div className={styles.iconWrap}><BarChart3 size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Report Templates</p>
            <p className={styles.cardDesc}>Create and manage report templates</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/analytics/kpis" className={styles.card}>
          <div className={styles.iconWrap}><PieChart size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>KPI Definitions</p>
            <p className={styles.cardDesc}>Define key performance indicators</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/analytics/data-sources" className={styles.card}>
          <div className={styles.iconWrap}><BarChart3 size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Data Sources</p>
            <p className={styles.cardDesc}>Manage analytics data connections</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/analytics/scheduled-reports" className={styles.card}>
          <div className={styles.iconWrap}><PieChart size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Scheduled Reports</p>
            <p className={styles.cardDesc}>Set up automated report delivery</p>
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
