'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CreditCard,
  Users,
  BarChart3,
  Package,
  ShieldAlert,
  Menu,
  ChevronLeft,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Building,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const navigation: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Finance & Accounting', href: '/finance', icon: CreditCard },
  { name: 'Human Resources', href: '/hr', icon: Users },
  { name: 'CRM & Sales', href: '/crm', icon: BarChart3 },
  { name: 'Inventory & Stock', href: '/inventory', icon: Package },
  { name: 'Administration', href: '/admin/users', icon: ShieldAlert },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  
  // Dummy Session State
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; avatar?: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState({ name: 'Acme Corp', slug: 'acme' });
  const tenants = [
    { name: 'Acme Corp', slug: 'acme' },
    { name: 'Stark Industries', slug: 'stark' },
    { name: 'Wayne Enterprises', slug: 'wayne' },
  ];

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser({ firstName: 'Super', lastName: 'Admin', email: 'admin@uni-erp.com' });
      }
    } else {
      // Default dummy fallback for display if not logged in
      setUser({ firstName: 'Super', lastName: 'Admin', email: 'admin@uni-erp.com' });
    }

    // Sync theme
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleTenantSwitch = (t: typeof currentTenant) => {
    setCurrentTenant(t);
    setTenantDropdownOpen(false);
    // In a real app we might reload page or trigger context update
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Sidebar Section */}
      <aside
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          background: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--duration-normal) var(--ease-default)',
          zIndex: 100,
          position: 'relative',
        }}
      >
        {/* Sidebar Header / Brand Logo */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: '0 var(--space-4)',
            borderBottom: '1px solid var(--color-sidebar-border)',
          }}
        >
          {!collapsed && (
            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                textDecoration: 'none',
                fontWeight: 'var(--weight-bold)',
                fontSize: 'var(--text-lg)',
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <Building size={20} style={{ stroke: 'url(#brand-grad)' }} />
              <span>UniERP</span>
            </Link>
          )}
          {collapsed && (
            <Building size={22} style={{ color: 'var(--color-primary)' }} />
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-sidebar-text)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: 'var(--space-4) var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2.5) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
                  background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--color-sidebar-hover)';
                    e.currentTarget.style.color = 'var(--color-sidebar-text-active)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-sidebar-text)';
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--color-primary)' : 'inherit' }} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--color-sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-sidebar-text)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Menu size={18} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)', minWidth: 0 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-xs)',
                  flexShrink: 0,
                }}
              >
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-sidebar-text-active)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-sidebar-text)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user ? user.email : 'admin@uni-erp.com'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Panel */}
        <header
          style={{
            height: 'var(--header-height)',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
            zIndex: 90,
          }}
        >
          {/* Top Left: Search & Mobile Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>
            <div
              style={{
                position: 'relative',
                maxWidth: '320px',
                width: '100%',
                display: 'none', // Can show on large screens
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-tertiary)',
                }}
              />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            
            {/* Tenant Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-1.5) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                }}
              >
                <Building size={15} style={{ color: 'var(--color-primary)' }} />
                <span>{currentTenant.name}</span>
                <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              {tenantDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 'var(--space-1.5)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    width: '180px',
                    zIndex: 110,
                    padding: 'var(--space-1.5)',
                  }}
                >
                  <p
                    style={{
                      margin: 'var(--space-1) var(--space-2) var(--space-2) var(--space-2)',
                      fontSize: '10px',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Switch Tenant
                  </p>
                  {tenants.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() => handleTenantSwitch(t)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-2.5)',
                        border: 'none',
                        background: currentTenant.slug === t.slug ? 'var(--color-primary-light)' : 'transparent',
                        color: currentTenant.slug === t.slug ? 'var(--color-primary)' : 'var(--color-text)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (currentTenant.slug !== t.slug) {
                          e.currentTarget.style.background = 'var(--color-bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTenant.slug !== t.slug) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Right: System settings, Notification, Dark mode, Profiler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <button
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-danger)',
                }}
              />
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 var(--space-1)' }} />

            {/* User Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'SU'}
                </div>
                <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 'var(--space-1.5)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    width: '200px',
                    zIndex: 110,
                    padding: 'var(--space-1.5)',
                  }}
                >
                  <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                    <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user ? user.email : 'admin@uni-erp.com'}
                    </p>
                  </div>
                  <div style={{ padding: 'var(--space-1.5) 0' }}>
                    <button
                      onClick={() => { router.push('/profile'); setUserDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <UserIcon size={14} /> Profile
                    </button>
                    <button
                      onClick={() => { router.push('/admin/settings'); setUserDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Settings size={14} /> Settings
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-1.5) 0 0 0' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-danger)',
                        fontSize: 'var(--text-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Workspace */}
        <main
          style={{
            flex: 1,
            padding: 'var(--space-6) var(--space-8)',
            overflowY: 'auto',
            background: 'var(--color-bg)',
          }}
        >
          <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* SVG Gradient declaration for Brand Logo */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
