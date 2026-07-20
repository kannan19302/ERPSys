import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'manufacturing',
  title: 'Manufacturing',
  icon: 'Hammer',
  routeSegment: 'manufacturing',
  dashboardRoute: '/manufacturing',
  settingsRoute: undefined,
  nav: [
    { label: 'Work Orders', href: '/manufacturing', icon: 'Hammer' },
    { label: 'Bills of Materials', href: '/manufacturing/boms', icon: 'ClipboardList' },
    { label: 'MRP Replenishment', href: '/manufacturing/mrp', icon: 'Layers' },
    { label: 'Operator Shop Floor', href: '/manufacturing/shop-floor', icon: 'Cpu' },
    { label: 'Quality Control & NCR', href: '/manufacturing/quality', icon: 'ShieldCheck' },
    { label: 'Finite Capacity Scheduling', href: '/manufacturing/scheduling', icon: 'Clock' },
    { label: 'Product Configurator', href: '/manufacturing/configurator', icon: 'Settings' },
    {
      label: 'Execution & MES',
      isHeader: true,
      items: [
        { label: 'MES Diagnostics', href: '/manufacturing/diagnostics', icon: 'Settings' },
        { label: 'IoT Telemetry Sensors', href: '/manufacturing/diagnostics', icon: 'Activity' },
      ],
    },
  ],
});
