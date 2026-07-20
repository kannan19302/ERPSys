import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'healthcare',
  title: 'Healthcare',
  icon: 'Activity',
  routeSegment: 'healthcare',
  dashboardRoute: '/healthcare',
  settingsRoute: undefined,
  nav: [
    { label: 'Dashboard', href: '/healthcare', icon: 'Home' },
    {
      label: 'Patient Care',
      isHeader: true,
      items: [
        { label: 'Patient Registry', href: '/healthcare/patients', icon: 'Users' },
        { label: 'Appointments', href: '/healthcare/appointments', icon: 'Calendar' },
        { label: 'Clinical Notes', href: '/healthcare/clinical', icon: 'ClipboardList' },
        { label: 'Prescriptions', href: '/healthcare/prescriptions', icon: 'FileText' },
        { label: 'Lab Results', href: '/healthcare/lab-results', icon: 'Activity' },
      ],
    },
    {
      label: 'Staff & Integration',
      isHeader: true,
      items: [
        { label: 'Practitioners', href: '/healthcare/practitioners', icon: 'Users' },
        { label: 'Vitals Dashboard', href: '/healthcare/vitals', icon: 'Activity' },
        { label: 'FHIR / SMART', href: '/healthcare/fhir', icon: 'Globe' },
      ],
    },
    {
      label: 'Reporting',
      isHeader: true,
      items: [
        { label: 'Reports', href: '/healthcare/reports', icon: 'BarChart3' },
      ],
    },
  ],
});
