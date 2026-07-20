import { registerModule } from '@unerp/shared/module-registry';

const communicationNav = [
  { label: 'Dashboard', href: '/communication', icon: 'Home' },
  {
    label: 'Messaging',
    isHeader: true,
    items: [
      { label: 'Spaces & Channels', href: '/communication/spaces', icon: 'Users' },
      { label: 'Direct Messages', href: '/communication/dm', icon: 'MessageSquare' },
      { label: 'Chat Client', href: '/connect', icon: 'MessageSquare' },
    ],
  },
  {
    label: 'Collaboration',
    isHeader: true,
    items: [
      { label: 'Meetings', href: '/communication/meetings', icon: 'Video' },
      { label: 'Calendar', href: '/communication/calendar', icon: 'Calendar' },
    ],
  },
  {
    label: 'Settings',
    isHeader: true,
    items: [
      { label: 'Notifications', href: '/communication/notifications', icon: 'Bell' },
    ],
  },
];

registerModule({
  slug: 'communication',
  title: 'Connect',
  icon: 'MessageSquare',
  routeSegment: 'communication',
  dashboardRoute: '/communication',
  settingsRoute: undefined,
  nav: communicationNav,
});

registerModule({
  slug: 'communication',
  title: 'Connect',
  icon: 'MessageSquare',
  routeSegment: 'connect',
  dashboardRoute: '/connect',
  settingsRoute: undefined,
  nav: communicationNav,
});
