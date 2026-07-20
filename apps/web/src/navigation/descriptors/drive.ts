import { registerModule } from '@unerp/shared/module-registry';

const driveNav = [
  { label: 'My Drive', href: '/drive', icon: 'FolderOpen' },
  { label: 'Shared with me', href: '/drive?view=shared', icon: 'Users' },
  { label: 'Recent', href: '/drive?view=recent', icon: 'Clock' },
  { label: 'Starred', href: '/drive?view=starred', icon: 'Star' },
  { label: 'Trash', href: '/drive?view=trash', icon: 'Trash2' },
  {
    label: 'Document Tools',
    isHeader: true,
    items: [
      { label: 'Generated Documents', href: '/drive/templates', icon: 'FileText' },
      { label: 'Template Designer', href: '/drive/designer', icon: 'Settings' },
    ],
  },
  {
    label: 'Advanced & Tools',
    isHeader: true,
    items: [
      { label: 'E-Signatures & OCR', href: '/drive/advanced', icon: 'FileText' },
      { label: 'Storage Quotas', href: '/drive/quotas', icon: 'Database' },
      { label: 'Media Conversion', href: '/drive/media', icon: 'Image' },
    ],
  },
];

registerModule({
  slug: 'drive',
  title: 'Drive',
  icon: 'FolderOpen',
  routeSegment: 'drive',
  dashboardRoute: '/drive',
  settingsRoute: undefined,
  nav: driveNav,
});

registerModule({
  slug: 'drive',
  title: 'Drive',
  icon: 'FolderOpen',
  routeSegment: 'storage',
  dashboardRoute: '/storage',
  settingsRoute: undefined,
  nav: [
    { label: 'My Drive', href: '/drive', icon: 'FolderOpen' },
    { label: 'Shared with me', href: '/drive?view=shared', icon: 'Users' },
    { label: 'Recent', href: '/drive?view=recent', icon: 'Clock' },
    { label: 'Starred', href: '/drive?view=starred', icon: 'Star' },
    { label: 'Trash', href: '/drive?view=trash', icon: 'Trash2' },
    {
      label: 'Document Tools',
      isHeader: true,
      items: [
        { label: 'Generated Documents', href: '/drive/templates', icon: 'FileText' },
        { label: 'Template Designer', href: '/drive/designer', icon: 'Settings' },
      ],
    },
    {
      label: 'Advanced & Tools',
      isHeader: true,
      items: [
        { label: 'E-Signatures & OCR', href: '/drive/advanced', icon: 'FileText' },
        { label: 'Storage Quotas', href: '/drive/quotas', icon: 'Database' },
        { label: 'Media Conversion', href: '/drive/media', icon: 'Image' },
      ],
    },
  ],
});
