'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Cpu, Globe, Store, Server, FileCode2, Workflow, BarChart3,
  Database, History, Activity, Shield, GitFork, Settings, CornerDownLeft,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

// Static navigation destinations — always available, no network needed.
const STATIC_COMMANDS: Command[] = [
  { id: 'home', label: 'Studio Home', group: 'Navigate', href: '/builder', icon: Cpu },
  { id: 'app-studio', label: 'App Studio', group: 'Navigate', href: '/builder/erp', icon: Cpu },
  { id: 'web-studio', label: 'Web Studio', group: 'Navigate', href: '/builder/web', icon: Globe },
  { id: 'marketplace', label: 'Marketplace · App Store', group: 'Navigate', href: '/apps/store', icon: Store },
  { id: 'manage', label: 'Manage', group: 'Navigate', href: '/builder/manage', icon: Server },

  { id: 'new-app', label: 'New Custom App', group: 'Create', href: '/builder/erp/modules?new=1', icon: Cpu },
  { id: 'new-form', label: 'New Form', group: 'Create', href: '/builder/erp/forms?new=1', icon: FileCode2 },
  { id: 'new-workflow', label: 'New Workflow', group: 'Create', href: '/builder/erp/workflows/new', icon: Workflow },
  { id: 'new-dashboard', label: 'New Dashboard', group: 'Create', href: '/builder/erp/dashboards/new', icon: BarChart3 },
  { id: 'new-site', label: 'New Site', group: 'Create', href: '/builder/web/sites?new=1', icon: Globe },
  { id: 'new-collection', label: 'New Collection', group: 'Create', href: '/builder/web/collections?new=1', icon: Database },

  { id: 'forms', label: 'Form Builder', group: 'Build', href: '/builder/erp/forms', icon: FileCode2 },
  { id: 'workflows', label: 'Workflow Builder', group: 'Build', href: '/builder/erp/workflows', icon: Workflow },
  { id: 'dashboards', label: 'Dashboard Builder', group: 'Build', href: '/builder/erp/dashboards', icon: BarChart3 },
  { id: 'apps', label: 'Custom Apps', group: 'Build', href: '/builder/erp/modules', icon: Database },
  { id: 'logic', label: 'Business Logic', group: 'Build', href: '/builder/erp/logic', icon: Activity },
  { id: 'customize', label: 'Customize an App', group: 'Build', href: '/builder/erp/customize', icon: Settings },

  { id: 'sites', label: 'Sites', group: 'Web', href: '/builder/web/sites', icon: Globe },
  { id: 'collections', label: 'CMS Collections', group: 'Web', href: '/builder/web/collections', icon: Database },

  { id: 'releases', label: 'Releases', group: 'Manage', href: '/builder/manage/releases', icon: History },
  { id: 'environments', label: 'Environments', group: 'Manage', href: '/builder/manage/environments', icon: GitFork },
  { id: 'logs', label: 'Run Logs', group: 'Manage', href: '/builder/manage/logs', icon: Activity },
  { id: 'access', label: 'Access Control', group: 'Manage', href: '/builder/manage/access', icon: Shield },
];

export function StudioCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') close();
    };
    const onCustom = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('studio:command-palette', onCustom as EventListener);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('studio:command-palette', onCustom as EventListener);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_COMMANDS;
    return STATIC_COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => { setActive(0); }, [query]);

  const run = useCallback((cmd: Command) => {
    close();
    router.push(cmd.href);
  }, [close, router]);

  if (!open) return null;

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal, 400)' as unknown as number,
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && results[active]) { e.preventDefault(); run(results[active]); }
        }}
        style={{
          width: 'min(620px, 92vw)', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Studio — pages, builders, actions…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 'var(--text-sm)', color: 'var(--color-text)',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto' }}>
          {results.length === 0 && (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
              No matches for “{query}”
            </div>
          )}
          {results.map((cmd, i) => (
            <button
              key={cmd.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(cmd)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%',
                padding: 'var(--space-2.5) var(--space-4)', border: 'none', textAlign: 'left',
                cursor: 'pointer', background: i === active ? 'var(--color-bg-hover)' : 'transparent',
                fontSize: 'var(--text-sm)', color: 'var(--color-text)',
              }}
            >
              <cmd.icon size={15} style={{ color: 'var(--color-text-secondary)' }} />
              <span>{cmd.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{cmd.group}</span>
              {i === active && <CornerDownLeft size={13} style={{ color: 'var(--color-text-tertiary)' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudioCommandPalette;
