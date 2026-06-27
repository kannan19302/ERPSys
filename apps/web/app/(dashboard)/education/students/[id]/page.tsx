'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, KPICard } from '@unerp/ui';
import { GraduationCap, BookOpen, DollarSign, Calendar, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  dateOfBirth: string;
  parentContact?: string;
  createdAt?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/v1/education/students', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.data || [];
          setStudent(list.find((s: Student) => s.id === id) || null);
        }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  if (!student) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}>
        <GraduationCap size={64} style={{ color: 'var(--color-text-tertiary)' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Student Not Found</h2>
        <Link href="/education/students"><Button variant="secondary"><ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to Registry</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title={`${student.firstName} ${student.lastName}`} description={`Enrollment: ${student.enrollmentNumber}`}
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Students', href: '/education/students' }, { label: `${student.firstName} ${student.lastName}` }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Status" value="Enrolled" icon={<GraduationCap size={18} />} color="var(--color-success)" />
        <KPICard title="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'} icon={<Calendar size={18} />} color="var(--color-primary)" />
        <KPICard title="Enrolled Since" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'} icon={<Calendar size={18} />} color="var(--color-info)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
              <User size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Personal Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                ['Full Name', `${student.firstName} ${student.lastName}`],
                ['Enrollment #', student.enrollmentNumber],
                ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'],
                ['Parent Contact', student.parentContact || '—'],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
              <BookOpen size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Academic Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
              <BookOpen size={40} />
              <p style={{ fontSize: 'var(--text-sm)' }}>Course enrollment details will appear here.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            <DollarSign size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Fee History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
            <DollarSign size={40} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Fee payment history will appear here.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
