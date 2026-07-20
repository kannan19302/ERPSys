import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'projects',
  title: 'Project Management',
  icon: 'Briefcase',
  routeSegment: 'projects',
  dashboardRoute: '/projects',
  settingsRoute: undefined,
  nav: [
    { label: 'Gantt & Tasks', href: '/projects', icon: 'Briefcase' },
    { label: 'Portfolio Hub', href: '/projects/portfolios', icon: 'Target' },
    { label: 'Client Portal', href: '/projects/client-portal', icon: 'Home' },
    {
      label: 'Advanced Tools',
      isHeader: true,
      items: [
        { label: 'Resource Workloads', href: '/projects/workloads', icon: 'Clock' },
        { label: 'Project Health & CPM', href: '/projects/health', icon: 'Activity' },
        { label: 'Revenue Recognition', href: '/projects/revenue-recognition', icon: 'DollarSign' },
        { label: 'WIP & Job Costing', href: '/projects/wip-reports', icon: 'DollarSign' },
      ],
    },
  ],
});
