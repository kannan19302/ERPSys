'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader, Card, Button, Spinner, KPICard, DashboardChart,
} from '@unerp/ui';
import {
  GraduationCap, Users, BookOpen, DollarSign, Calendar,
  TrendingUp, Library, ClipboardCheck, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EducationDashboard() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, courses: 0, fees: 0, books: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [students, courses, fees, books] = await Promise.all([
          client.get<unknown>('/ext/education/students'),
          client.get<unknown>('/ext/education/courses'),
          client.get<unknown>('/ext/education/fee-structures'),
          client.get<unknown>('/ext/education/books'),
        ]);
        const count = (value: unknown) => Array.isArray(value) ? value.length : typeof value === 'object' && value !== null && Array.isArray((value as { data?: unknown }).data) ? ((value as { data: unknown[] }).data).length : 0;
        setStats({
          students: count(students), courses: count(courses), fees: count(fees), books: count(books),
        });
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const enrollmentTrend = [
    { name: 'Jan', count: 120 }, { name: 'Feb', count: 135 },
    { name: 'Mar', count: 142 }, { name: 'Apr', count: 158 },
    { name: 'May', count: 165 }, { name: 'Jun', count: 170 },
  ];

  const feeCollection = [
    { name: 'Jan', collected: 85000, pending: 15000 },
    { name: 'Feb', collected: 92000, pending: 12000 },
    { name: 'Mar', collected: 78000, pending: 22000 },
    { name: 'Apr', collected: 95000, pending: 8000 },
    { name: 'May', collected: 88000, pending: 18000 },
    { name: 'Jun', collected: 91000, pending: 14000 },
  ];

  const quickLinks = [
    { label: 'Student Registry', href: '/education/students', icon: Users, color: 'var(--color-primary)' },
    { label: 'Course Catalog', href: '/education/courses', icon: BookOpen, color: 'var(--color-success)' },
    { label: 'Timetable', href: '/education/timetable', icon: Calendar, color: 'var(--color-warning)' },
    { label: 'Fee Management', href: '/education/fees', icon: DollarSign, color: 'var(--color-info)' },
    { label: 'Library', href: '/education/library', icon: Library, color: 'var(--color-primary)' },
    { label: 'Attendance', href: '/education/attendance', icon: ClipboardCheck, color: 'var(--color-success)' },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="education.dashboard.read">
      <div className="ui-stack-6">
      <PageHeader title="Education" description="Student management, courses, fees, and academic operations"
        breadcrumbs={[{ label: 'Education' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Total Students" value={stats.students} icon={<GraduationCap size={18} />} color="var(--color-primary)" />
        <KPICard title="Active Courses" value={stats.courses} icon={<BookOpen size={18} />} color="var(--color-success)" />
        <KPICard title="Fee Structures" value={stats.fees} icon={<DollarSign size={18} />} color="var(--color-info)" />
        <KPICard title="Library Books" value={stats.books} icon={<Library size={18} />} color="var(--color-warning)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Enrollment Trend" subtitle="Monthly student enrollment"
          data={enrollmentTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Students', color: '#6366f1' }] }}
          defaultChartType="line" allowedChartTypes={['line', 'area', 'bar']} height={280} />
        <DashboardChart title="Fee Collection" subtitle="Collected vs pending fees"
          data={feeCollection}
          config={{ xAxisKey: 'name', series: [
            { dataKey: 'collected', name: 'Collected', color: '#22c55e' },
            { dataKey: 'pending', name: 'Pending', color: '#f59e0b' },
          ] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'composed']} height={280} />
      </div>

      <Card>
        <div className="p-5">
          <h3 className={styles.s1}>Quick Access</h3>
          <div className={styles.s2}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className={styles.s3}>
                <div className={`${styles.s4} ${styles.qlHover}`}>
                  <div style={{ background: `${link.color}15`, color: link.color }} className={styles.s5}>
                    <link.icon size={18} />
                  </div>
                  <span className={styles.s6}>{link.label}</span>
                  <ArrowRight size={14} className={styles.s7} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
      </div>
    </RouteGuard>
  );
}
