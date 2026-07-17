'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Spinner, Badge, KPICard } from '@unerp/ui';
import { Users, Heart, Calendar, Pill, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Patient {
  id: string; firstName: string; lastName: string; dateOfBirth: string;
  gender: string; email?: string; phone?: string;
  medicalHistory?: string; vitalsHistory?: string; allergies?: string;
  createdAt?: string;
}

export default function PatientDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const id = params?.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await client.get<Patient[]>('/ext/healthcare/patients');
        setPatient(data.find((p) => p.id === id) || null);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [id, client]);

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  if (!patient) return (
    <div className={styles.s1}>
      <Heart size={64} className="ui-text-tertiary" />
      <h2 className={styles.s2}>Patient Not Found</h2>
      <Link href="/healthcare/patients"><button className={styles.s3}><ArrowLeft size={14} /> Back</button></Link>
    </div>
  );

  return (
    <RouteGuard permission="healthcare.patients.read">
    <div className="ui-stack-6">
      <PageHeader title={`${patient.firstName} ${patient.lastName}`} description={`Patient ID: ${patient.id.slice(0, 8)}`}
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Patients', href: '/healthcare/patients' }, { label: `${patient.firstName} ${patient.lastName}` }]} />

      <div className="ui-grid-auto-sm">
        <KPICard title="Gender" value={patient.gender} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'} icon={<Calendar size={18} />} color="var(--color-info)" />
        <KPICard title="Allergies" value={patient.allergies || 'None'} icon={<Heart size={18} />} color={patient.allergies ? 'var(--color-danger)' : 'var(--color-success)'} />
      </div>

      <div className="ui-grid-2">
        <Card>
          <div className="p-5">
            <h3 className="ui-heading-base mb-4">Demographics</h3>
            {[['Full Name', `${patient.firstName} ${patient.lastName}`], ['Gender', patient.gender], ['Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'], ['Email', patient.email || '—'], ['Phone', patient.phone || '—'], ['Registered', patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—']].map(([l, v]) => (
              <div key={l as string} className={styles.s4}>
                <span className="ui-text-sm-muted">{l}</span>
                <span className="ui-heading-sm">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <h3 className="ui-heading-base mb-4">Medical History</h3>
            <p className={styles.s5}>{patient.medicalHistory || 'No medical history recorded.'}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4"><Activity size={16} className={styles.s6} /> Vitals History</h3>
          <div className={styles.s7}>
            <Activity size={40} />
            <p className={styles.s8}>{patient.vitalsHistory || 'No vitals data recorded yet.'}</p>
          </div>
        </div>
      </Card>
    </div>
    </RouteGuard>
  );
}
