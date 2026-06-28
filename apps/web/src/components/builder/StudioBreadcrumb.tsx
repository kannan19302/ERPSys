'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Studio breadcrumb trail using the mandated `.frappe-breadcrumb` utility
 * classes (see AGENTS.md CSS policy). The last crumb is rendered active.
 */
export function StudioBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="frappe-breadcrumb" aria-label="Breadcrumb">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={`${c.label}-${i}`}>
            {c.href && !last ? (
              <Link href={c.href} className="frappe-breadcrumb-link">{c.label}</Link>
            ) : (
              <span className={last ? 'frappe-breadcrumb-active' : 'frappe-breadcrumb-link'}>{c.label}</span>
            )}
            {!last && <span className="frappe-breadcrumb-separator">/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Human-friendly labels for Studio path segments.
const SEGMENT_LABELS: Record<string, string> = {
  builder: 'Studio',
  erp: 'App Studio',
  web: 'Web Studio',
  manage: 'Manage',
  forms: 'Forms',
  workflows: 'Workflows',
  dashboards: 'Dashboards',
  modules: 'Custom Apps',
  apps: 'Apps',
  logic: 'Business Logic',
  data: 'Data & Import',
  customize: 'Customize',
  sites: 'Sites',
  collections: 'Collections',
  blog: 'Blog',
  assets: 'Assets',
  templates: 'Templates',
  menus: 'Menus',
  seo: 'SEO',
  orders: 'Orders',
  submissions: 'Submissions',
  pages: 'Pages',
  canvas: 'Canvas',
  settings: 'Settings',
  releases: 'Releases',
  environments: 'Environments',
  logs: 'Run Logs',
  access: 'Access Control',
  new: 'New',
};

function labelFor(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // Dynamic id segments (uuids / long tokens) → generic label.
  if (/^[0-9a-f]{8,}$/i.test(segment) || segment.length > 20) return 'Detail';
  return segment.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Auto-generates the breadcrumb trail from the current pathname. Mounted once
 * in the Studio layout so every subpage gets a consistent trail without
 * per-page boilerplate. Hidden on the Studio home itself.
 */
export function StudioAutoBreadcrumb() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const items: Crumb[] = [{ label: 'Home', href: '/dashboard' }];
  let acc = '';
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const last = i === segments.length - 1;
    items.push({ label: labelFor(seg), href: last ? undefined : acc });
  });

  return (
    <div style={{ padding: '0 var(--space-6)', marginTop: 'var(--space-4)' }}>
      <StudioBreadcrumb items={items} />
    </div>
  );
}

export default StudioBreadcrumb;
