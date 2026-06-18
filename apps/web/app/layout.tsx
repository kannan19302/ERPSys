import type { Metadata } from 'next';
import '@unerp/ui/styles';
import { CommandPalette } from '@/components/CommandPalette';

export const metadata: Metadata = {
  title: {
    default: 'UniERP — Universal Enterprise Resource Planning',
    template: '%s | UniERP',
  },
  description:
    'A fully-packed, composable, industry-agnostic Enterprise Resource Planning system.',
  keywords: ['ERP', 'enterprise', 'resource planning', 'business management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
