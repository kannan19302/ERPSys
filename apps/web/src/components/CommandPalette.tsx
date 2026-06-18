'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, ArrowRight } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  if (!open) return null;

  // Placeholder navigation items
  const commands = [
    { name: 'Finance Dashboard', href: '/finance' },
    { name: 'HR Dashboard', href: '/hr' },
    { name: 'CRM Dashboard', href: '/crm' },
    { name: 'Builder Studio', href: '/builder' },
    { name: 'Settings', href: '/admin/settings' },
  ].filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
        onClick={() => setOpen(false)}
      />
      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <Search size={20} style={{ color: 'var(--color-text-tertiary)', marginRight: 'var(--space-3)' }} />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-1) var(--space-2)', backgroundColor: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <Command size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>K</span>
          </div>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: 'var(--space-2)' }}>
          {commands.length > 0 ? (
            commands.map((cmd, idx) => (
              <button 
                key={idx}
                onClick={() => {
                  setOpen(false);
                  router.push(cmd.href);
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'transparent', border: 'none', textAlign: 'left', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-sunken)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>{cmd.name}</span>
                <ArrowRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              </button>
            ))
          ) : (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No results found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
