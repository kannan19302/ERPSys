'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { GraduationCap, Plus, Search, Users, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

export default function StudentRegistryPage() {
  const client = useApiClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', enrollmentNumber: '', parentContact: '' });

  const fetchStudents = async () => {
    try {
      const d = await client.get<Student[] | { data?: Student[] }>('/ext/education/students');
      setStudents(Array.isArray(d) ? d : d.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    setCreating(true);
    try {
      await client.post('/ext/education/students', form);
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
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <Link href={`/education/students/${row.id}`} className={styles.s2}>
              {row.firstName} {row.lastName}
            </Link>
            <div className="ui-text-xs-tertiary">{row.enrollmentNumber}</div>
          </div>
        </div>
      ),
    },
    { key: 'dob', header: 'Date of Birth', render: (row) => <span className="text-sm">{row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : '—'}</span> },
    { key: 'contact', header: 'Parent Contact', render: (row) => <span className="ui-text-sm-muted">{row.parentContact || '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Enrolled</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="education.student.read">
      <div className="ui-stack-6">
      <PageHeader title="Student Registry" description="Manage student records, enrollment, and demographics"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Students' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Student</Button>}
      />

      <div className="ui-grid-auto">
        <KPICard title="Total Students" value={students.length} icon={<GraduationCap size={18} />} color="var(--color-primary)" />
        <KPICard title="New This Month" value={students.filter(s => s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 86400000)).length} icon={<Users size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.s3}>
          <Search size={16} className={styles.s4} />
          <input type="text" placeholder="Search by name or enrollment number..." value={search} onChange={e => setSearch(e.target.value)}
            className={styles.s5} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No students found" emptyMessage="Add students to start managing your academic roster." emptyIcon={<GraduationCap size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Student" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Student'}</Button></>}>
        <div className="ui-stack-4">
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            <TextField label="Enrollment Number" value={form.enrollmentNumber} onChange={e => setForm({ ...form, enrollmentNumber: e.target.value })} />
          </div>
          <TextField label="Parent Contact" value={form.parentContact} onChange={e => setForm({ ...form, parentContact: e.target.value })} placeholder="+1-555-000-0000" />
        </div>
      </Modal>
      </div>
    </RouteGuard>
  );
}
