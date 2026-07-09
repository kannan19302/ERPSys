'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { BookOpen, Plus, Search, Users, Award } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  description?: string;
  status?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', credits: 3, description: '' });

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/v1/ext/education/courses', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
      if (res.ok) { const d = await res.json(); setCourses(Array.isArray(d) ? d : d?.data || []); }
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    setCreating(true);
    try {
      await fetch('/api/v1/ext/education/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...form, credits: Number(form.credits) }),
      });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={18} />
          </div>
          <div>
            <Link href={`/education/courses/${row.id}`} style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none' }}>
              {row.name}
            </Link>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.code}</div>
          </div>
        </div>
      ),
    },
    { key: 'code', header: 'Code', render: (row) => <code style={{ fontSize: '11px', background: 'var(--color-bg-sunken)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{row.code}</code> },
    { key: 'credits', header: 'Credits', render: (row) => <Badge variant="info">{row.credits} Credits</Badge> },
    { key: 'description', header: 'Description', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{row.description || '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Course Catalog" description="Browse and manage academic courses"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Courses' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Course</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Courses" value={courses.length} icon={<BookOpen size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Credits" value={courses.reduce((a, c) => a + (c.credits || 0), 0)} icon={<Award size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No courses found" emptyMessage="Create courses to build your academic catalog." emptyIcon={<BookOpen size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Course" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Course'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Course Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Introduction to Mathematics" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Course Code" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="MATH101" />
            <TextField label="Credits" type="number" value={String(form.credits)} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} />
          </div>
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Course description..." />
        </div>
      </Modal>
    </div>
  );
}
