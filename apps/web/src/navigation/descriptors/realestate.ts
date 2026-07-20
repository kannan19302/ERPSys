import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'real-estate',
  title: 'Real Estate',
  icon: 'Building2',
  routeSegment: 'real-estate',
  dashboardRoute: '/real-estate',
  settingsRoute: undefined,
  nav: [
    { label: 'Dashboard', href: '/real-estate', icon: 'Home' },
    {
      label: 'Portfolio',
      isHeader: true,
      items: [
        { label: 'Properties', href: '/real-estate/properties', icon: 'Building2' },
        { label: 'Leases', href: '/real-estate/leases', icon: 'FileText' },
        { label: 'Tenant Directory', href: '/real-estate/tenants', icon: 'Users' },
      ],
    },
    {
      label: 'Operations',
      isHeader: true,
      items: [
        { label: 'Maintenance', href: '/real-estate/maintenance', icon: 'Wrench' },
        { label: 'Agent Commissions', href: '/real-estate/commissions', icon: 'DollarSign' },
      ],
    },
    {
      label: 'Reporting',
      isHeader: true,
      items: [
        { label: 'Reports', href: '/real-estate/reports', icon: 'BarChart3' },
      ],
    },
  ],
});
