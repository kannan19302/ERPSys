'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { BookOpen, Plus, Search, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  description?: string;
  status?: string;
}

export default function CourseCatalogPage() {
  const client = useApiClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', credits: 3, description: '' });

  const fetchCourses = async () => {
    try {
      const d = await client.get<Course[] | { data?: Course[] }>('/ext/education/courses');
      setCourses(Array.isArray(d) ? d : d.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    setCreating(true);
    try {
      await client.post('/ext/education/courses', { ...form, credits: Number(form.credits) });
      setCreateOpen(false);
      setForm({ name: '', code: '', credits: 3, description: '' });
      fetchCourses();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const filtered = courses.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Course>[] = [
    {
      key: 'course', header: 'Course',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            <BookOpen size={18} />
          </div>
          <div>
            <Link href={`/education/courses/${row.id}`} className={styles.s2}>
              {row.name}
            </Link>
            <div className="ui-text-xs-tertiary">{row.code}</div>
          </div>
        </div>
      ),
    },
    { key: 'code', header: 'Code', render: (row) => <code className={styles.s3}>{row.code}</code> },
    { key: 'credits', header: 'Credits', render: (row) => <Badge variant="info">{row.credits} Credits</Badge> },
    { key: 'description', header: 'Description', render: (row) => <span className="ui-text-sm-muted">{row.description || '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="education.course.read">
      <div className="ui-stack-6">
      <PageHeader title="Course Catalog" description="Browse and manage academic courses"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Courses' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Course</Button>}
      />

      <div className="ui-grid-auto">
        <KPICard title="Total Courses" value={courses.length} icon={<BookOpen size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Credits" value={courses.reduce((a, c) => a + (c.credits || 0), 0)} icon={<Award size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.s4}>
          <Search size={16} className={styles.s5} />
          <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
            className={styles.s6} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No courses found" emptyMessage="Create courses to build your academic catalog." emptyIcon={<BookOpen size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Course" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Course'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Course Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Introduction to Mathematics" />
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Course Code" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="MATH101" />
            <TextField label="Credits" type="number" value={String(form.credits)} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} />
          </div>
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Course description..." />
        </div>
      </Modal>
      </div>
    </RouteGuard>
  );
}
