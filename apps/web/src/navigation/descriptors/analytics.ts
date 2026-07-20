import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'analytics',
  title: 'Business Intelligence',
  icon: 'PieChart',
  routeSegment: 'analytics',
  dashboardRoute: '/analytics',
  settingsRoute: undefined,
  nav: [
    { label: 'BI Analytics Dashboard', href: '/analytics', icon: 'PieChart' },
    { label: 'Dashboard Builder', href: '/analytics/builder', icon: 'LayoutDashboard' },
    { label: 'Smart Insights', href: '/analytics/insights', icon: 'ShieldAlert' },
    {
      label: 'Data Tools',
      isHeader: true,
      items: [
        { label: 'Visual Query Builder', href: '/analytics/query', icon: 'GitFork' },
        { label: 'Pivot Matrix Aggregator', href: '/analytics/pivot', icon: 'Layers' },
        { label: 'Predictive Analytics', href: '/analytics/predictive', icon: 'TrendingUp' },
        { label: 'Advanced BI Analytics', href: '/analytics/advanced', icon: 'BarChart3' },
      ],
    },
  ],
});
