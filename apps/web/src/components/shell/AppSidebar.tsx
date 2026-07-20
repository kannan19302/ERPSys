'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Menu, ChevronLeft, Home, ClipboardList, FileText, 
  BarChart3, Activity, Settings, FolderOpen, LayoutGrid 
} from 'lucide-react';
import { useResolvedNav } from '@/navigation/useResolvedNav';
import type { ModuleNav } from '@/navigation';
import styles from './AppSidebar.module.css';

interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  isHeader?: boolean;
  items?: SidebarItem[];
  /** Short "what does this page do?" hint, shown as a hover tooltip. */
  description?: string;
}

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  appNav: ModuleNav;
  pathname: string;
  user: { firstName: string; lastName: string; email: string; avatar?: string } | null;
}

function SidebarNavigation({ appNav, pathname, collapsed }: { appNav: ModuleNav; pathname: string; collapsed: boolean }) {
  const searchParams = useSearchParams();
  const enhancedItems = useResolvedNav(appNav, pathname);

  const renderItem = (item: SidebarItem, isSub = false, index = 0) => {
    // `name` alone isn't unique across modules (e.g. two different sections
    // both titled "Overview"/"Settings") — key off `href` when present, and
    // fall back to a position-qualified key for header groups, which have none.
    const itemKey = item.href ?? `header-${item.name}-${index}`;
    if (item.isHeader) {
      if (collapsed) {
        return (
          <React.Fragment key={itemKey}>
            <div className={styles.subHeaderDivider} />
            {item.items?.map((sub, subIdx) => renderItem(sub, true, subIdx))}
          </React.Fragment>
        );
      }
      return (
        <div key={itemKey} className={styles.subHeader}>
          <div className={styles.subHeaderTitle}>
            {item.name}
          </div>
          {item.items?.map((sub, subIdx) => renderItem(sub, true, subIdx))}
        </div>
      );
    }

    const href = item.href || '#';
    const isActive = (() => {
      const parts = href.split('?');
      const itemPath = parts[0] || '';
      const itemQuery = parts[1] || '';

      const isPathMatch = (itemPath === '/inventory' || itemPath === '/builder' || itemPath === '/dashboard' || itemPath === '/drive' || itemPath === '/storage')
        ? pathname === itemPath
        : (pathname === itemPath || pathname.startsWith(itemPath + '/'));

      if (!isPathMatch) return false;

      if (itemPath === '/drive') {
        const activeView = searchParams.get('view') || 'personal';
        const itemParams = new URLSearchParams(itemQuery);
        const itemView = itemParams.get('view') || 'personal';
        return activeView === itemView;
      }

      if ((itemPath.includes('/hr/advanced') || itemPath.includes('/inventory/advanced')) && itemQuery) {
        const activeTab = searchParams.get('tab') || (itemPath.includes('/hr/advanced') ? 'payroll' : 'entries');
        const itemParams = new URLSearchParams(itemQuery);
        const itemTab = itemParams.get('tab');
        return pathname === itemPath && activeTab === itemTab;
      }

      return true;
    })();
    
    const Icon = item.icon;

    return (
      <Link
        key={itemKey}
        href={href}
        // The "(i) what does this do?" affordance: explicit description when the
        // nav registry provides one; the item name when collapsed to icon-only.
        title={item.description ?? (collapsed ? item.name : undefined)}
        aria-current={isActive ? 'page' : undefined}
        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${collapsed ? styles.navItemCollapsed : styles.navItemExpanded}`}
        style={{
          paddingLeft: isSub && !collapsed ? 'var(--space-5)' : 'var(--space-3)',
        }}
      >
        {Icon && (
          <Icon 
            size={18} 
            style={{ 
              flexShrink: 0, 
              color: isActive ? 'var(--color-primary)' : 'inherit' 
            }} 
          />
        )}
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <>
      {enhancedItems.map((item, idx) => renderItem(item, false, idx))}
    </>
  );
}

export function AppSidebar({ collapsed, setCollapsed, appNav, pathname, user }: AppSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {!collapsed && (
        <div className={styles.backdrop} onClick={() => setCollapsed(true)} />
      )}
      
      <aside
        className={`${styles.sidebar} ${!collapsed ? styles.sidebarOpen : ''}`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
      >
        {/* Sidebar Header / Brand Logo */}
        <div
          className={`${styles.header} ${collapsed ? styles.headerCollapsed : styles.headerExpanded}`}
        >
          {!collapsed && (
            <div className={styles.logoWrapper}>
              <appNav.icon size={18} className="ui-text-primary" />
              <span>{appNav.title}</span>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={styles.toggleBtn}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav
          aria-label="Module navigation"
          className={styles.nav}
        >
          <Suspense fallback={<div className="flex-1" />}>
            <SidebarNavigation appNav={appNav} pathname={pathname} collapsed={collapsed} />
          </Suspense>
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`${styles.footer} ${collapsed ? styles.footerCollapsed : styles.footerExpanded}`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className={styles.toggleBtn}
              aria-label="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          ) : (
            <div className={styles.userContainer}>
              <div className={styles.avatar}>
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>
                  {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                </p>
                <p className={styles.userEmail}>
                  {user ? user.email : 'admin@uni-erp.com'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
