import styles from './layout.module.css';
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
      className={styles.s1}
    >
      <div
        className={styles.s2}
      >
        {children}
      </div>
    </div>
  );
}
