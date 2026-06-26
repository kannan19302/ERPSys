import type { Metadata } from 'next';
import '@unerp/ui/styles';
import { ToastProvider } from '@unerp/ui';
import { CommandPalette } from '@/components/CommandPalette';
import { QueryProvider } from '@/lib/query-provider';

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
        <QueryProvider>
          <ToastProvider>
            <CommandPalette />
            {children}
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
