'use client';
import styles from './page.module.css';
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
    <div className="ui-stack-6">
      <PageHeader title="FHIR Integration" description="SMART on FHIR app launcher and resource browser"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'FHIR' }]} />

      <div className="ui-grid-auto-sm">
        <KPICard title="FHIR Version" value="R4" icon={<Globe size={18} />} color="var(--color-primary)" />
        <KPICard title="Resource Types" value={fhirResources.length} icon={<Database size={18} />} color="var(--color-info)" />
        <KPICard title="Total Records" value={fhirResources.reduce((a, r) => a + r.count, 0).toLocaleString()} icon={<Activity size={18} />} color="var(--color-success)" />
        <KPICard title="HIPAA Compliant" value="Yes" icon={<Shield size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4">FHIR Resource Types</h3>
          <div className={styles.s1}>
            {fhirResources.map(resource => (
              <div key={resource.type} className={styles.s2}>
                <div>
                  <div className="ui-heading-sm">{resource.type}</div>
                  <div className="ui-text-xs-tertiary">{resource.count} records · {resource.standard}</div>
                </div>
                <Badge variant={resource.status === 'active' ? 'success' : 'warning'}>{resource.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4">SMART on FHIR Apps</h3>
          <div className={styles.s3}>
            <ExternalLink size={40} />
            <p className={styles.s4}>Configure SMART app launchers for third-party clinical applications.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
