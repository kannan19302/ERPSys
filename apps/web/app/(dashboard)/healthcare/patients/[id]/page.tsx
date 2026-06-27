'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { Users, Heart, Calendar, Pill, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Patient {
  id: string; firstName: string; lastName: string; dateOfBirth: string;
  gender: string; email?: string; phone?: string;
  medicalHistory?: string; vitalsHistory?: string; allergies?: string;
  createdAt?: string;
}

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function PatientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/v1/healthcare/patients', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const data = await res.json(); const list = Array.isArray(data) ? data : data?.data || []; setPatient(list.find((p: Patient) => p.id === id) || null); }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!patient) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)' }}>
      <Heart size={64} style={{ color: 'var(--color-text-tertiary)' }} />
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Patient Not Found</h2>
      <Link href="/healthcare/patients"><button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}><ArrowLeft size={14} /> Back</button></Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title={`${patient.firstName} ${patient.lastName}`} description={`Patient ID: ${patient.id.slice(0, 8)}`}
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Patients', href: '/healthcare/patients' }, { label: `${patient.firstName} ${patient.lastName}` }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Gender" value={patient.gender} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'} icon={<Calendar size={18} />} color="var(--color-info)" />
        <KPICard title="Allergies" value={patient.allergies || 'None'} icon={<Heart size={18} />} color={patient.allergies ? 'var(--color-danger)' : 'var(--color-success)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Demographics</h3>
            {[['Full Name', `${patient.firstName} ${patient.lastName}`], ['Gender', patient.gender], ['Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'], ['Email', patient.email || '—'], ['Phone', patient.phone || '—'], ['Registered', patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—']].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{l}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Medical History</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{patient.medicalHistory || 'No medical history recorded.'}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}><Activity size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Vitals History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
            <Activity size={40} />
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{patient.vitalsHistory || 'No vitals data recorded yet.'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
