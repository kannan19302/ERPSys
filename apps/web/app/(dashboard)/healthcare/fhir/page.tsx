'use client';

import React from 'react';
import { PageHeader, Card, Badge, KPICard } from '@unerp/ui';
import { Globe, Database, ExternalLink, Shield, Activity } from 'lucide-react';

export default function FHIRIntegrationPage() {
  const fhirResources = [
    { type: 'Patient', count: 128, standard: 'R4', status: 'active' },
    { type: 'Practitioner', count: 24, standard: 'R4', status: 'active' },
    { type: 'Appointment', count: 342, standard: 'R4', status: 'active' },
    { type: 'MedicationRequest', count: 156, standard: 'R4', status: 'active' },
    { type: 'Encounter', count: 89, standard: 'R4', status: 'active' },
    { type: 'Observation', count: 1024, standard: 'R4', status: 'draft' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="FHIR Integration" description="SMART on FHIR app launcher and resource browser"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'FHIR' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="FHIR Version" value="R4" icon={<Globe size={18} />} color="var(--color-primary)" />
        <KPICard title="Resource Types" value={fhirResources.length} icon={<Database size={18} />} color="var(--color-info)" />
        <KPICard title="Total Records" value={fhirResources.reduce((a, r) => a + r.count, 0).toLocaleString()} icon={<Activity size={18} />} color="var(--color-success)" />
        <KPICard title="HIPAA Compliant" value="Yes" icon={<Shield size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>FHIR Resource Types</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
            {fhirResources.map(resource => (
              <div key={resource.type} style={{
                padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{resource.type}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{resource.count} records · {resource.standard}</div>
                </div>
                <Badge variant={resource.status === 'active' ? 'success' : 'warning'}>{resource.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>SMART on FHIR Apps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)', color: 'var(--color-text-tertiary)' }}>
            <ExternalLink size={40} />
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>Configure SMART app launchers for third-party clinical applications.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
