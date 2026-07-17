'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, Search, Bell, Sun, Moon, LogOut, User as UserIcon, Settings, Menu 
} from 'lucide-react';
import { AppSwitcher } from './AppSwitcher';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentTenant: { name: string; slug: string };
  tenants: Array<{ name: string; slug: string }>;
  handleTenantSwitch: (t: { name: string; slug: string }) => void;
  user: { firstName: string; lastName: string; email: string; avatar?: string } | null;
  handleLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  appsDropdownOpen: boolean;
  setAppsDropdownOpen: (open: boolean) => void;
  tenantDropdownOpen: boolean;
  setTenantDropdownOpen: (open: boolean) => void;
  userDropdownOpen: boolean;
  setUserDropdownOpen: (open: boolean) => void;
  cmdPaletteOpen: boolean;
  setCmdPaletteOpen: (open: boolean) => void;
  isAppsLanding: boolean;
  switcherItems: any[];
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  appsDropdownRef: React.RefObject<HTMLDivElement | null>;
  tenantDropdownRef: React.RefObject<HTMLDivElement | null>;
  userDropdownRef: React.RefObject<HTMLDivElement | null>;
  searchDropdownRef: React.RefObject<HTMLDivElement | null>;
  GLOBAL_SEARCH_ITEMS: any[];
}

export function AppHeader({
  collapsed,
  setCollapsed,
  theme,
  toggleTheme,
  currentTenant,
  tenants,
  handleTenantSwitch,
  user,
  handleLogout,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  appsDropdownOpen,
  setAppsDropdownOpen,
  tenantDropdownOpen,
  setTenantDropdownOpen,
  userDropdownOpen,
  setUserDropdownOpen,
  cmdPaletteOpen,
  setCmdPaletteOpen,
  isAppsLanding,
  switcherItems,
  expandedFolders,
  setExpandedFolders,
  appsDropdownRef,
  tenantDropdownRef,
  userDropdownRef,
  searchDropdownRef,
  GLOBAL_SEARCH_ITEMS
}: AppHeaderProps) {
  const router = useRouter();

  const headerClass = `${styles.header} ${theme === 'light' ? styles.headerLight : styles.headerDark}`;
  const btnStyle = `${styles.actionBtn} ${theme === 'light' ? styles.actionBtnLight : styles.actionBtnDark}`;
  const iconBtnStyle = `${styles.iconBtn} ${theme === 'light' ? styles.iconBtnLight : styles.iconBtnDark}`;
  const userBtnStyle = `${styles.userBtn} ${theme === 'light' ? styles.userBtnLight : styles.userBtnDark}`;
  const searchInputStyle = `${styles.searchInput} ${theme === 'light' ? styles.searchInputLight : styles.searchInputDark}`;
  const searchKbdStyle = `${styles.searchKbd} ${theme === 'light' ? styles.searchKbdLight : styles.searchKbdDark}`;
  const statusDotStyle = `${styles.statusDot} ${theme === 'light' ? styles.statusDotLight : styles.statusDotDark}`;

  return (
    <header className={headerClass}>
      {/* Top Left: Apps Switcher & Tenant Selector */}
      <div className={styles.leftSection}>
        <div className={styles.hstack}>
          {/* Mobile hamburger menu toggle button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={styles.menuMobileBtn}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
          {!isAppsLanding && (
            <AppSwitcher
              appsDropdownOpen={appsDropdownOpen}
              setAppsDropdownOpen={setAppsDropdownOpen}
              switcherItems={switcherItems}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              appsDropdownRef={appsDropdownRef}
              theme={theme}
            />
          )}

          {/* Tenant Selector Dropdown */}
          <div className="relative" ref={tenantDropdownRef}>
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className={btnStyle}
            >
              <span>{currentTenant.name}</span>
              <ChevronDown
                size={13}
                className={`${styles.chevronIcon} ${tenantDropdownOpen ? styles.chevronRotated : ''}`}
              />
            </button>
            {tenantDropdownOpen && (
              <div className="ui-dropdown ui-dropdown-left ui-dropdown-tenant">
                <p className="ui-dropdown-header">Switch Tenant</p>
                {tenants.map((t) => {
                  const isTenantActive = currentTenant.slug === t.slug;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => handleTenantSwitch(t)}
                      className={`ui-dropdown-item ${isTenantActive ? 'active' : ''}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Right: Search, Dark mode, Notification, Profiler */}
      <div className={styles.rightSection}>
        {!isAppsLanding && (
          <div ref={searchDropdownRef} className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search or type Cmd+K..."
                value={searchQuery}
                onClick={() => setCmdPaletteOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(e.target.value.length > 0);
                }}
                className={searchInputStyle}
                onFocus={() => {
                  if (searchQuery.length > 0) setSearchOpen(true);
                }}
              />
              <kbd className={searchKbdStyle}>
                ⌘K
              </kbd>
            </div>

            {/* Dynamic Search Dropdown Results */}
            {searchOpen && searchQuery.length > 0 && (
              <div className="ui-dropdown ui-dropdown-right ui-dropdown-search">
                <p className="ui-dropdown-header">Search Results</p>
                {GLOBAL_SEARCH_ITEMS.filter(item =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 10).map((result) => (
                  <button
                    key={result.name}
                    onClick={() => { router.push(result.href); setSearchOpen(false); setSearchQuery(''); }}
                    className="ui-dropdown-item"
                  >
                    <result.icon size={14} style={{ color: result.type === 'App' ? 'var(--color-primary)' : 'var(--color-text-secondary)', opacity: 0.8 }} />
                    <div className="ui-flex-col">
                      <span className="font-medium">{result.name}</span>
                      <span className="ui-text-micro">{result.type}</span>
                    </div>
                  </button>
                ))}
                {GLOBAL_SEARCH_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div style={{ padding: 'var(--space-3) var(--space-2)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={iconBtnStyle}
          aria-label="Toggle color theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notification Bell */}
        <button
          className={iconBtnStyle}
          aria-label="View notifications"
        >
          <Bell size={16} />
          <span className={styles.notificationBadge} />
        </button>

        {/* Separator */}
        <div className={styles.divider} />

        {/* User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className={userBtnStyle}
            aria-label="Open user profile menu"
          >
            <div className="relative">
              <div className={styles.userAvatar}>
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
              </div>
              {/* Status Indicator Dot */}
              <span className={statusDotStyle} />
            </div>
            <ChevronDown
              size={12}
              className={`${styles.chevronIcon} ${userDropdownOpen ? styles.chevronRotated : ''}`}
            />
          </button>

          {userDropdownOpen && (
            <div className="ui-dropdown ui-dropdown-right ui-dropdown-user">
              <div className={styles.userProfileSummary}>
                <p className={styles.userProfileName}>
                  {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                </p>
                <p className={styles.userProfileEmail}>
                  {user ? user.email : 'admin@uni-erp.com'}
                </p>
              </div>
              <button
                onClick={() => { router.push('/profile'); setUserDropdownOpen(false); }}
                className="ui-dropdown-item"
              >
                <UserIcon size={14} className="ui-text-muted" /> Profile
              </button>
              <button
                onClick={() => { router.push('/settings'); setUserDropdownOpen(false); }}
                className="ui-dropdown-item"
              >
                <Settings size={14} className="ui-text-muted" /> Settings
              </button>
              <div className="ui-dropdown-divider" />
              <button
                onClick={handleLogout}
                className="ui-dropdown-item ui-dropdown-item-danger"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
