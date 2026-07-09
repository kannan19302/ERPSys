'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, KPICard, DashboardChart,
} from '@unerp/ui';
import {
  Activity, Users, Calendar, Stethoscope, Pill, ClipboardList,
  TrendingUp, ArrowRight, Heart,
} from 'lucide-react';
import Link from 'next/link';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function HealthcareDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, practitioners: 0, appointments: 0, prescriptions: 0 });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const [pRes, prRes, aRes, rxRes] = await Promise.all([
          fetch('/api/v1/ext/healthcare/patients', { headers }),
          fetch('/api/v1/ext/healthcare/practitioners', { headers }),
          fetch('/api/v1/ext/healthcare/appointments', { headers }),
          fetch('/api/v1/ext/healthcare/prescriptions', { headers }),
        ]);
        const patients = pRes.ok ? await pRes.json() : [];
        const practitioners = prRes.ok ? await prRes.json() : [];
        const appointments = aRes.ok ? await aRes.json() : [];
        const prescriptions = rxRes.ok ? await rxRes.json() : [];
        setStats({
          patients: (Array.isArray(patients) ? patients : patients?.data || []).length,
          practitioners: (Array.isArray(practitioners) ? practitioners : practitioners?.data || []).length,
          appointments: (Array.isArray(appointments) ? appointments : appointments?.data || []).length,
          prescriptions: (Array.isArray(prescriptions) ? prescriptions : prescriptions?.data || []).length,
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Healthcare" description="Patient care, appointments, prescriptions, and clinical management"
        breadcrumbs={[{ label: 'Healthcare' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Patients" value={stats.patients} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Practitioners" value={stats.practitioners} icon={<Stethoscope size={18} />} color="var(--color-success)" />
        <KPICard title="Appointments" value={stats.appointments} icon={<Calendar size={18} />} color="var(--color-info)" />
        <KPICard title="Prescriptions" value={stats.prescriptions} icon={<Pill size={18} />} color="var(--color-warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
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
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer', transition: 'all 0.2s ease', background: 'var(--color-bg)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--color-primary-light)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg)'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${link.color}15`, color: link.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <link.icon size={18} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{link.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
