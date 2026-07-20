import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'pos',
  title: 'POS & Retail',
  icon: 'Store',
  routeSegment: 'pos',
  dashboardRoute: '/pos',
  settingsRoute: undefined,
  nav: [
    { label: 'POS Terminal', href: '/pos', icon: 'Store' },
    { label: 'POS Orders', href: '/pos/orders', icon: 'ShoppingCart' },
    { label: 'Customers & Loyalty', href: '/pos/customers', icon: 'Users' },
    { label: 'Sales Analytics', href: '/pos/reports', icon: 'BarChart3' },
    { label: 'Advanced POS Features', href: '/pos/advanced', icon: 'Activity' },
    {
      label: 'Retail Tools',
      isHeader: true,
      items: [
        { label: 'Held / Parked Carts', href: '/pos/held-orders', icon: 'Clock' },
        { label: 'Promotions Engine', href: '/pos/promotions', icon: 'Percent' },
        { label: 'Layaway Plans', href: '/pos/layaway', icon: 'DollarSign' },
      ],
    },
    {
      label: 'Customizer',
      isHeader: true,
      items: [
        { label: 'Receipt Designer', href: '/pos/designer', icon: 'Settings' },
        { label: 'Printer Diagnostics', href: '/pos/diagnostics', icon: 'Activity' },
      ],
    },
  ],
});
