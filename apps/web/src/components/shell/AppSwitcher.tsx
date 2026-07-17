'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ChevronDown, FolderOpen, ChevronRight, LayoutGrid, ShoppingBag 
} from 'lucide-react';
import styles from './AppHeader.module.css';

interface AppSwitcherProps {
  appsDropdownOpen: boolean;
  setAppsDropdownOpen: (open: boolean) => void;
  switcherItems: any[];
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  appsDropdownRef: React.RefObject<HTMLDivElement | null>;
  theme: 'light' | 'dark';
}

export function AppSwitcher({
  appsDropdownOpen,
  setAppsDropdownOpen,
  switcherItems,
  expandedFolders,
  setExpandedFolders,
  appsDropdownRef,
  theme
}: AppSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() || '';

  const btnStyle = `${styles.actionBtn} ${theme === 'light' ? styles.actionBtnLight : styles.actionBtnDark}`;

  return (
    <div className="relative" ref={appsDropdownRef}>
      <button
        onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
        className={btnStyle}
      >
        <span>Switch App</span>
        <ChevronDown
          size={13}
          className={`${styles.chevronIcon} ${appsDropdownOpen ? styles.chevronRotated : ''}`}
        />
      </button>
      
      {appsDropdownOpen && (
        <div className="ui-dropdown ui-dropdown-left ui-dropdown-apps">
          <p className="ui-dropdown-header">Applications</p>
          {switcherItems.map((item) => {
            if (item.type === 'folder') {
              const isExpanded = !!expandedFolders[item.id];
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedFolders(prev => ({
                        ...prev,
                        [item.id]: !prev[item.id]
                      }));
                    }}
                    className="ui-dropdown-item ui-dropdown-folder"
                  >
                    <FolderOpen size={14} style={{ color: item.color }} />
                    <span>{item.name}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                      <ChevronRight
                        size={12}
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform var(--duration-fast) var(--ease-default)',
                        }}
                      />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ui-dropdown-item-nested-container">
                      {item.apps.map((app: any) => {
                        const isSubActive = pathname.startsWith(app.href);
                        return (
                          <button
                            key={app.name}
                            onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                            className={`ui-dropdown-item-nested ${isSubActive ? 'active' : ''}`}
                          >
                            <app.icon size={13} style={{ opacity: 0.6 }} />
                            <span>{app.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            } else {
              const app = item;
              const isPathActive = pathname.startsWith(app.href);
              return (
                <button
                  key={app.name}
                  onClick={() => { router.push(app.href); setAppsDropdownOpen(false); }}
                  className={`ui-dropdown-item ${isPathActive ? 'active' : ''}`}
                >
                  <app.icon size={14} style={{ color: isPathActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', opacity: 0.8 }} />
                  <span>{app.name}</span>
                </button>
              );
            }
          })}
          <div className="ui-dropdown-divider" />
          <button
            onClick={() => { router.push('/apps'); setAppsDropdownOpen(false); }}
            className="ui-dropdown-item"
          >
            <LayoutGrid size={14} className="ui-text-muted" />
            <span>Desk</span>
          </button>
          <button
            onClick={() => { router.push('/apps/store'); setAppsDropdownOpen(false); }}
            className="ui-dropdown-item"
          >
            <ShoppingBag size={14} className="ui-text-muted" />
            <span>App store</span>
          </button>
        </div>
      )}
    </div>
  );
}
