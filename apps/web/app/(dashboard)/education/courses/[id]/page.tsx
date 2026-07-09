'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { BookOpen, Users, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  description?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/v1/ext/education/courses', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.data || [];
          setCourse(list.find((c: Course) => c.id === id) || null);
        }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  if (!course) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}>
        <BookOpen size={64} style={{ color: 'var(--color-text-tertiary)' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Course Not Found</h2>
        <Link href="/education/courses"><button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}><ArrowLeft size={14} /> Back to Catalog</button></Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title={course.name} description={`Course Code: ${course.code}`}
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Courses', href: '/education/courses' }, { label: course.name }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Credits" value={course.credits} icon={<BookOpen size={18} />} color="var(--color-primary)" />
        <KPICard title="Status" value="Active" icon={<Calendar size={18} />} color="var(--color-success)" />
        <KPICard title="Enrolled Students" value="—" icon={<Users size={18} />} color="var(--color-info)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Course Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                ['Course Name', course.name],
                ['Code', course.code],
                ['Credits', String(course.credits)],
                ['Description', course.description || 'No description provided'],
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
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Enrolled Students</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
              <Users size={40} />
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>Student enrollment data will appear here.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
