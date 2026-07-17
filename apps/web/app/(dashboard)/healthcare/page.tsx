'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, KPICard, DashboardChart,
} from '@unerp/ui';
import {
  Activity, Users, Calendar, Stethoscope, Pill, ClipboardList,
  TrendingUp, ArrowRight, Heart,
} from 'lucide-react';
import Link from 'next/link';
import { RouteGuard, useApiClient } from '@unerp/framework';

const listLength = (value: unknown): number => {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null && 'data' in value && Array.isArray(value.data)) return value.data.length;
  return 0;
};

export default function HealthcareDashboard() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, practitioners: 0, appointments: 0, prescriptions: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [pRes, prRes, aRes, rxRes] = await Promise.all([
          client.get<unknown>('/api/v1/ext/healthcare/patients'),
          client.get<unknown>('/api/v1/ext/healthcare/practitioners'),
          client.get<unknown>('/api/v1/ext/healthcare/appointments'),
          client.get<unknown>('/api/v1/ext/healthcare/prescriptions'),
        ]);
        const patients = pRes;
        const practitioners = prRes;
        const appointments = aRes;
        const prescriptions = rxRes;
        setStats({
          patients: listLength(patients),
          practitioners: listLength(practitioners),
          appointments: listLength(appointments),
          prescriptions: listLength(prescriptions),
        });
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const appointmentTrend = [
    { name: 'Mon', count: 24 }, { name: 'Tue', count: 32 },
    { name: 'Wed', count: 28 }, { name: 'Thu', count: 35 },
    { name: 'Fri', count: 22 }, { name: 'Sat', count: 12 },
  ];

  const patientDemographics = [
    { name: '0-18', count: 45 }, { name: '19-35', count: 120 },
    { name: '36-50', count: 95 }, { name: '51-65', count: 78 },
    { name: '65+', count: 42 },
  ];

  const quickLinks = [
    { label: 'Patient Registry', href: '/healthcare/patients', icon: Users, color: 'var(--color-primary)' },
    { label: 'Appointments', href: '/healthcare/appointments', icon: Calendar, color: 'var(--color-success)' },
    { label: 'Practitioners', href: '/healthcare/practitioners', icon: Stethoscope, color: 'var(--color-info)' },
    { label: 'Prescriptions', href: '/healthcare/prescriptions', icon: Pill, color: 'var(--color-warning)' },
    { label: 'Clinical Notes', href: '/healthcare/clinical', icon: ClipboardList, color: 'var(--color-danger)' },
    { label: 'Vitals Dashboard', href: '/healthcare/vitals', icon: Heart, color: 'var(--color-primary)' },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="healthcare.dashboard.read">
    <div className="ui-stack-6">
      <PageHeader title="Healthcare" description="Patient care, appointments, prescriptions, and clinical management"
        breadcrumbs={[{ label: 'Healthcare' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Total Patients" value={stats.patients} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Practitioners" value={stats.practitioners} icon={<Stethoscope size={18} />} color="var(--color-success)" />
        <KPICard title="Appointments" value={stats.appointments} icon={<Calendar size={18} />} color="var(--color-info)" />
        <KPICard title="Prescriptions" value={stats.prescriptions} icon={<Pill size={18} />} color="var(--color-warning)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Weekly Appointments" subtitle="Appointments by day of week"
          data={appointmentTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Appointments', color: '#6366f1' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'area', 'line']} height={280} />
        <DashboardChart title="Patient Demographics" subtitle="Age group distribution"
          data={patientDemographics}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'count', name: 'Patients', color: '#22c55e' }] }}
          defaultChartType="bar" allowedChartTypes={['bar', 'pie', 'donut']} height={280} />
      </div>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4">Quick Access</h3>
          <div className={styles.s1}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className={styles.s2}>
                <div className={`${styles.s3} ${styles.qlHover}`}>
                  <div style={{ background: `${link.color}15`, color: link.color }} className={styles.s4}>
                    <link.icon size={18} />
                  </div>
                  <span className={styles.s5}>{link.label}</span>
                  <ArrowRight size={14} className={styles.s6} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
    </RouteGuard>
  );
}
