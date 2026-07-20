import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'app-store',
  title: 'App Store',
  icon: 'Store',
  routeSegment: 'apps',
  dashboardRoute: '/apps/store',
  settingsRoute: undefined,
  nav: [
    { label: 'Browse', href: '/apps/store', icon: 'Store' },
    { label: 'Installed', href: '/apps/installed', icon: 'CheckSquare' },
    { label: 'Developer', href: '/apps/developer', icon: 'Code2' },
  ],
});
