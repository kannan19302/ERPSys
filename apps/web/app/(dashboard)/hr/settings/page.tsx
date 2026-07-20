'use client';

import styles from './page.module.css';
import { PageHeader, Card } from '@unerp/ui';
import Link from 'next/link';
import { ArrowRight, Users, UserPlus, Calendar, Shield, Settings } from 'lucide-react';

export default function HrSettingsPage() {
  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Human Resources"
        description="Configure leave types, payroll structures, attendance policies, departments, and positions."
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'HR', href: '/hr' }, { label: 'Settings' }]}
      />
      <div className={styles.grid}>
        <Link href="/hr/leave-types" className={styles.card}>
          <div className={styles.iconWrap}><Calendar size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Leave Types</p>
            <p className={styles.cardDesc}>Configure leave categories and policies</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/advanced-hr/payroll-structures" className={styles.card}>
          <div className={styles.iconWrap}><Users size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Payroll Structures</p>
            <p className={styles.cardDesc}>Manage salary components and structures</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/hr/attendance" className={styles.card}>
          <div className={styles.iconWrap}><UserPlus size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Attendance Policies</p>
            <p className={styles.cardDesc}>Set up attendance rules and policies</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/hr/departments" className={styles.card}>
          <div className={styles.iconWrap}><Users size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Departments</p>
            <p className={styles.cardDesc}>Manage organization departments</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/hr/positions" className={styles.card}>
          <div className={styles.iconWrap}><UserPlus size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Positions</p>
            <p className={styles.cardDesc}>Define job positions and roles</p>
          </div>
          <ArrowRight size={16} className={styles.arrow} />
        </Link>
        <Link href="/saas/security" className={styles.card}>
          <div className={styles.iconWrap}><Shield size={20} /></div>
          <div className={styles.cardContent}>
            <p className={styles.cardTitle}>Users & Roles</p>
            <p className={styles.cardDesc}>Manage users, roles, and permissions</p>
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
