'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  GLOBAL_SEARCH_ITEMS: any[];
}

export function CommandPalette({ isOpen, onClose, GLOBAL_SEARCH_ITEMS }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIdx(0);
    }
  }, [isOpen]);

  const filteredItems = GLOBAL_SEARCH_ITEMS.filter(item =>
    !query || item.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 12);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIdx]) {
        router.push(filteredItems[selectedIdx].href);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Search header input */}
        <div className={styles.searchHeader}>
          <Search size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search apps, pages, actions..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          <kbd className={styles.kbd}>ESC</kbd>
        </div>

        {/* Results Area */}
        <div className={styles.resultsArea}>
          {filteredItems.length === 0 ? (
            <div className={styles.noResults}>No results found</div>
          ) : (
            filteredItems.map((item, idx) => {
              const isActive = idx === selectedIdx;
              const btnClass = `${styles.resultBtn} ${isActive ? styles.resultBtnActive : styles.resultBtnInactive}`;
              return (
                <button
                  key={item.name + item.href}
                  onClick={() => { router.push(item.href); onClose(); }}
                  className={btnClass}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <item.icon 
                    size={16} 
                    style={{ 
                      color: item.type === 'App' ? 'var(--color-primary)' : 'var(--color-text-secondary)', 
                      flexShrink: 0 
                    }} 
                  />
                  <div className={styles.resultTextWrapper}>
                    <div className={styles.resultName}>{item.name}</div>
                  </div>
                  <span className={styles.resultType}>{item.type}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer tips */}
        <div className={styles.footer}>
          <span><kbd className={styles.footerKbd}>↑↓</kbd> navigate</span>
          <span><kbd className={styles.footerKbd}>↵</kbd> open</span>
          <span><kbd className={styles.footerKbd}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
