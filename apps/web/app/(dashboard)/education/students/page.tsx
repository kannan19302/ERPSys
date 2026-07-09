'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { GraduationCap, Plus, Search, Users, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  dateOfBirth: string;
  parentContact?: string;
  status?: string;
  createdAt?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function StudentRegistryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', enrollmentNumber: '', parentContact: '' });

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/v1/ext/education/students', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
      if (res.ok) { const d = await res.json(); setStudents(Array.isArray(d) ? d : d?.data || []); }
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    setCreating(true);
    try {
      await fetch('/api/v1/ext/education/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      setForm({ firstName: '', lastName: '', dateOfBirth: '', enrollmentNumber: '', parentContact: '' });
      fetchStudents();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const filtered = students.filter(s =>
    !search || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.enrollmentNumber.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Student>[] = [
    {
      key: 'student', header: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <Link href={`/education/students/${row.id}`} style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none' }}>
              {row.firstName} {row.lastName}
            </Link>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.enrollmentNumber}</div>
          </div>
        </div>
      ),
    },
    { key: 'dob', header: 'Date of Birth', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : '—'}</span> },
    { key: 'contact', header: 'Parent Contact', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{row.parentContact || '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Enrolled</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Student Registry" description="Manage student records, enrollment, and demographics"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Students' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Student</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Students" value={students.length} icon={<GraduationCap size={18} />} color="var(--color-primary)" />
        <KPICard title="New This Month" value={students.filter(s => s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 86400000)).length} icon={<Users size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search by name or enrollment number..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No students found" emptyMessage="Add students to start managing your academic roster." emptyIcon={<GraduationCap size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Student" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Student'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            <TextField label="Enrollment Number" value={form.enrollmentNumber} onChange={e => setForm({ ...form, enrollmentNumber: e.target.value })} />
          </div>
          <TextField label="Parent Contact" value={form.parentContact} onChange={e => setForm({ ...form, parentContact: e.target.value })} placeholder="+1-555-000-0000" />
        </div>
      </Modal>
    </div>
  );
}
