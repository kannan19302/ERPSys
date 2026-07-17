'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard, ChangeHistory } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
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

export default function CourseDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await client.get<Course[] | { data?: Course[] }>('/ext/education/courses');
        const list = Array.isArray(data) ? data : data.data || [];
        setCourse(list.find((c) => c.id === id) || null);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [id, client]);

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  if (!course) {
    return (
      <RouteGuard permission="education.courses.read">
      <div className={styles.s1}>
        <BookOpen size={64} className="ui-text-tertiary" />
        <h2 className={styles.s2}>Course Not Found</h2>
        <Link href="/education/courses"><button className={styles.s3}><ArrowLeft size={14} /> Back to Catalog</button></Link>
      </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="education.courses.read">
    <div className="ui-stack-6">
      <PageHeader title={course.name} description={`Course Code: ${course.code}`}
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Courses', href: '/education/courses' }, { label: course.name }]} />

      <div className="ui-grid-auto">
        <KPICard title="Credits" value={course.credits} icon={<BookOpen size={18} />} color="var(--color-primary)" />
        <KPICard title="Status" value="Active" icon={<Calendar size={18} />} color="var(--color-success)" />
        <KPICard title="Enrolled Students" value="—" icon={<Users size={18} />} color="var(--color-info)" />
      </div>

      <div className="ui-grid-2">
        <Card>
          <div className="p-5">
            <h3 className="ui-heading-base mb-4">Course Details</h3>
            <div className="ui-stack-3">
              {[
                ['Course Name', course.name],
                ['Code', course.code],
                ['Credits', String(course.credits)],
                ['Description', course.description || 'No description provided'],
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
            <h3 className="ui-heading-base mb-4">Enrolled Students</h3>
            <div className={styles.s5}>
              <Users size={40} />
              <p className={styles.s6}>Student enrollment data will appear here.</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="mt-8">
        <ChangeHistory entityType="Course" entityId={id} />
      </div>
    </div>
    </RouteGuard>
  );
}
