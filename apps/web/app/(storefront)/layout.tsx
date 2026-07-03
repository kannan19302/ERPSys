import type { ReactNode } from 'react';

/**
 * Public storefront shell — sibling route group to (dashboard), NOT nested
 * inside it. No auth guard, no sidebar, no dashboard chrome: this serves
 * anonymous external customers browsing `/store/[tenantSlug]/*`.
 *
 * The root `apps/web/app/layout.tsx` already provides the outer <html>/<body>
 * (fonts, ToastProvider, etc.), so this is just a plain content wrapper with
 * its own minimal, centered storefront styling.
 */
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1120px',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
