'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, KPICard, ChangeHistory } from '@unerp/ui';
import { GraduationCap, BookOpen, DollarSign, Calendar, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  dateOfBirth: string;
  parentContact?: string;
  createdAt?: string;
}

export default function StudentDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const id = params?.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await client.get<Student[] | { data?: Student[] }>('/ext/education/students');
        {
          const list = Array.isArray(data) ? data : data?.data || [];
          setStudent(list.find((s) => s.id === id) || null);
        }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client, id]);

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  if (!student) {
    return (
      <div className={styles.s1}>
        <GraduationCap size={64} className="ui-text-tertiary" />
        <h2 className={styles.s2}>Student Not Found</h2>
        <Link href="/education/students"><Button variant="secondary"><ArrowLeft size={14} className="mr-2" /> Back to Registry</Button></Link>
      </div>
    );
  }

  return (
    <RouteGuard permission="education.student.read">
      <div className="ui-stack-6">
      <PageHeader title={`${student.firstName} ${student.lastName}`} description={`Enrollment: ${student.enrollmentNumber}`}
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Students', href: '/education/students' }, { label: `${student.firstName} ${student.lastName}` }]} />

      <div className="ui-grid-auto">
        <KPICard title="Status" value="Enrolled" icon={<GraduationCap size={18} />} color="var(--color-success)" />
        <KPICard title="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'} icon={<Calendar size={18} />} color="var(--color-primary)" />
        <KPICard title="Enrolled Since" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'} icon={<Calendar size={18} />} color="var(--color-info)" />
      </div>

      <div className="ui-grid-2">
        <Card>
          <div className="p-5">
            <h3 className="ui-heading-base mb-4">
              <User size={16} className={styles.s3} /> Personal Information
            </h3>
            <div className="ui-stack-3">
              {[
                ['Full Name', `${student.firstName} ${student.lastName}`],
                ['Enrollment #', student.enrollmentNumber],
                ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'],
                ['Parent Contact', student.parentContact || '—'],
              ].map(([label, value]) => (
                <div key={label as string} className={styles.s4}>
                  <span className="ui-text-sm-muted">{label}</span>
                  <span className="ui-heading-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <h3 className="ui-heading-base mb-4">
              <BookOpen size={16} className={styles.s3} /> Academic Summary
            </h3>
            <div className={styles.s5}>
              <BookOpen size={40} />
              <p className="text-sm">Course enrollment details will appear here.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4">
            <DollarSign size={16} className={styles.s3} /> Fee History
          </h3>
          <div className={styles.s5}>
            <DollarSign size={40} />
            <p className="text-sm">Fee payment history will appear here.</p>
          </div>
        </div>
      </Card>
      
      <div className="mt-8">
        <ChangeHistory entityType="Student" entityId={id} />
      </div>
      </div>
    </RouteGuard>
  );
}
