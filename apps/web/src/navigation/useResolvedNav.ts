'use client';

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { ModuleNav, SidebarItem } from './types';

interface NavOverlay {
  config?: {
    order?: string[];
    hidden?: string[];
    renames?: Record<string, string>;
  };
  submodules?: { slug: string; name: string; icon?: string | null; pages: { slug: string; title: string }[] }[];
}

/** Resolve the active module slug, accounting for /app/<module>/<page> routes. */
function activeModuleOf(pathname: string): string {
  const seg = pathname.split('/');
  if (seg[1] === 'app' && seg[2]) return seg[2];
  return seg[1] || '';
}

/**
 * Runtime navigation merge layer.
 *
 * Takes the static `ModuleNav` for the active module and merges in server-driven
 * navigation:
 *   - a per-tenant nav overlay (reorder / hide / rename of stock items, plus
 *     additive submodule sections) from /builder/nav-overlay/<module>, and
 *   - legacy custom/extension pages from the page registry.
 *
 * This hook is the single extension point both Studios hook into; rendering
 * components consume only its returned item list. Falls back gracefully when
 * the API is unavailable.
 */
export function useResolvedNav(appNav: ModuleNav, pathname: string): SidebarItem[] {
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [overlay, setOverlay] = useState<NavOverlay | null>(null);
  const activeModule = activeModuleOf(pathname);

  // Legacy custom/extension pages (kept for backwards compatibility).
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/v1/builder/page-registries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const pages = await res.json();
          if (isMounted) setCustomPages(Array.isArray(pages) ? pages : pages?.data || []);
        } else {
          const reg = localStorage.getItem('unerp_page_registry');
          if (reg && isMounted) setCustomPages(JSON.parse(reg));
        }
      } catch {
        const reg = localStorage.getItem('unerp_page_registry');
        if (reg && isMounted) setCustomPages(JSON.parse(reg));
      }
    };
    load();
    window.addEventListener('unerp_page_registry_updated', load);
    return () => {
      isMounted = false;
      window.removeEventListener('unerp_page_registry_updated', load);
    };
  }, []);

  // Per-tenant nav overlay for the active module (reorder/hide/rename + submodules).
  useEffect(() => {
    let isMounted = true;
    if (!activeModule) {
      setOverlay(null);
      return;
    }
    const load = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/nav-overlay/${activeModule}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted) setOverlay(res.ok ? await res.json() : null);
      } catch {
        if (isMounted) setOverlay(null);
      }
    };
    load();
    window.addEventListener('unerp_nav_overlay_updated', load);
    return () => {
      isMounted = false;
      window.removeEventListener('unerp_nav_overlay_updated', load);
    };
  }, [activeModule]);

  return React.useMemo(() => {
    const config = overlay?.config || {};
    const renames = config.renames || {};
    const hidden = new Set(config.hidden || []);

    // Apply hide + rename recursively, matching by href (leaves) or name (headers).
    const transform = (list: SidebarItem[]): SidebarItem[] =>
      list
        .filter((it) => !(it.href && hidden.has(it.href)) && !hidden.has(it.name))
        .map((it) => {
          const newName = (it.href && renames[it.href]) || renames[it.name];
          const node: SidebarItem = { ...it, name: newName || it.name };
          if (node.items) node.items = transform(node.items);
          return node;
        });

    let items =
      (config.renames && Object.keys(config.renames).length) || (config.hidden && config.hidden.length)
        ? transform(appNav.items)
        : appNav.items;

    // Apply optional top-level ordering (by href, falling back to name).
    if (Array.isArray(config.order) && config.order.length) {
      const key = (it: SidebarItem) => it.href || it.name;
      const rank = (it: SidebarItem) => {
        const i = config.order!.indexOf(key(it));
        return i === -1 ? 999 : i;
      };
      items = [...items].sort((a, b) => rank(a) - rank(b));
    }

    // Additive submodule sections (App Studio).
    const submoduleSections: SidebarItem[] = (overlay?.submodules || []).map((sm) => ({
      name: sm.name,
      isHeader: true,
      items: sm.pages.map((p) => ({
        name: p.title,
        href: `/app/${activeModule}/${p.slug}`,
        icon: FileText,
      })),
    }));

    // Legacy non-submodule custom pages, kept under a generic section.
    const moduleCustomPages = customPages.filter(
      (p) =>
        p.module?.toLowerCase() === activeModule.toLowerCase() &&
        !p.isOverride &&
        !p.submodule &&
        p.status === 'PUBLISHED',
    );
    const customSection: SidebarItem[] =
      moduleCustomPages.length > 0
        ? [
            {
              name: 'Custom Extensions',
              isHeader: true,
              items: moduleCustomPages.map((p) => ({
                name: p.title || p.pageName || 'Custom Page',
                href: `/app/${p.module}/${p.slug}`,
                icon: FileText,
              })),
            },
          ]
        : [];

    return [...items, ...submoduleSections, ...customSection];
  }, [appNav.items, overlay, customPages, activeModule]);
}
