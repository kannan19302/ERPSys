import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'supply-chain',
  title: 'Supply Chain',
  icon: 'Truck',
  routeSegment: 'supply-chain',
  dashboardRoute: '/supply-chain',
  settingsRoute: undefined,
  nav: [
    { label: 'Dashboard', href: '/supply-chain', icon: 'Home' },
    {
      label: 'Operations',
      isHeader: true,
      items: [
        { label: 'Operations Hub', href: '/supply-chain/operations', icon: 'Package' },
      ],
    },
    {
      label: 'Planning & Analytics',
      isHeader: true,
      items: [
        { label: 'Demand Forecast', href: '/supply-chain/demand-forecast', icon: 'TrendingUp' },
        { label: 'Analytics', href: '/supply-chain/analytics', icon: 'BarChart3' },
      ],
    },
  ],
});
