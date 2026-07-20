import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'ai',
  title: 'AI Copilot',
  icon: 'Zap',
  routeSegment: 'ai',
  dashboardRoute: '/ai',
  settingsRoute: undefined,
  nav: [
    { label: 'AI Copilot', href: '/ai', icon: 'Zap' },
    {
      label: 'Capabilities',
      isHeader: true,
      items: [
        { label: 'Ask Data (NL Query)', href: '/ai', icon: 'MessageSquare' },
        { label: 'Invoice Scanner', href: '/ai', icon: 'FileText' },
        { label: 'Email Drafter', href: '/ai', icon: 'Mail' },
        { label: 'Form Generator', href: '/ai', icon: 'LayoutGrid' },
        { label: 'Workflow Generator', href: '/ai', icon: 'GitBranch' },
      ],
    },
    {
      label: 'More AI Tools',
      isHeader: true,
      items: [
        { label: 'Visual Query Builder', href: '/analytics/query', icon: 'GitFork' },
      ],
    },
  ],
});
