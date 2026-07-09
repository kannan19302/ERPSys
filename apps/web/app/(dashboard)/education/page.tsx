'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader, Card, Button, Spinner, KPICard, DashboardChart,
} from '@unerp/ui';
import {
  GraduationCap, Users, BookOpen, DollarSign, Calendar,
  TrendingUp, Library, ClipboardCheck, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function EducationDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, courses: 0, fees: 0, books: 0 });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [sRes, cRes, fRes, bRes] = await Promise.all([
          fetch('/api/v1/ext/education/students', { headers }),
          fetch('/api/v1/ext/education/courses', { headers }),
          fetch('/api/v1/ext/education/fee-structures', { headers }),
          fetch('/api/v1/ext/education/books', { headers }),
        ]);
        const students = sRes.ok ? await sRes.json() : [];
        const courses = cRes.ok ? await cRes.json() : [];
        const fees = fRes.ok ? await fRes.json() : [];
        const books = bRes.ok ? await bRes.json() : [];
        setStats({
          students: (Array.isArray(students) ? students : students?.data || []).length,
          courses: (Array.isArray(courses) ? courses : courses?.data || []).length,
          fees: (Array.isArray(fees) ? fees : fees?.data || []).length,
          books: (Array.isArray(books) ? books : books?.data || []).length,
        });
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Education" description="Student management, courses, fees, and academic operations"
        breadcrumbs={[{ label: 'Education' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Students" value={stats.students} icon={<GraduationCap size={18} />} color="var(--color-primary)" />
        <KPICard title="Active Courses" value={stats.courses} icon={<BookOpen size={18} />} color="var(--color-success)" />
        <KPICard title="Fee Structures" value={stats.fees} icon={<DollarSign size={18} />} color="var(--color-info)" />
        <KPICard title="Library Books" value={stats.books} icon={<Library size={18} />} color="var(--color-warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
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
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: 'var(--color-bg)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--color-primary-light)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg)'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${link.color}15`, color: link.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <link.icon size={18} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{link.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
