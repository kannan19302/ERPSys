'use client';

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { ModuleNav, SidebarItem } from './types';

/**
 * Runtime navigation merge layer.
 *
 * Takes the static `ModuleNav` for the active module and merges in server-driven
 * navigation: custom/extension pages from the page registry today, and a
 * per-tenant nav overlay (reorder / hide / rename / injected submodules) in a
 * later phase. This hook is the single extension point both Studios hook into;
 * the rendering components consume only its returned item list.
 *
 * Falls back to the `unerp_page_registry` localStorage cache when the API is
 * unavailable, matching the previous inline behaviour.
 */
export function useResolvedNav(appNav: ModuleNav, pathname: string): SidebarItem[] {
  const [customPages, setCustomPages] = useState<any[]>([]);

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

  return React.useMemo(() => {
    const activeModulePrefix = pathname.split('/')[1];
    const moduleCustomPages = customPages.filter(
      (p) =>
        p.module?.toLowerCase() === activeModulePrefix?.toLowerCase() &&
        !p.isOverride &&
        p.status === 'PUBLISHED',
    );

    if (moduleCustomPages.length === 0) return appNav.items;

    const newItems: SidebarItem[] = [...appNav.items];
    const customLinks: SidebarItem[] = moduleCustomPages.map((p) => ({
      name: p.title || p.pageName || 'Custom Page',
      href: `/app/${p.module}/${p.slug}`,
      icon: FileText,
    }));

    newItems.push({
      name: 'Custom Extensions',
      isHeader: true,
      items: customLinks,
    });

    return newItems;
  }, [appNav.items, customPages, pathname]);
}
