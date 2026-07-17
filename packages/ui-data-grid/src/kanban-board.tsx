'use client';

import React from 'react';

// ─────────────────────────────────────────────────
// Kanban Board — generic drag-and-drop board
// Uses @dnd-kit (already installed)
// ─────────────────────────────────────────────────

export interface KanbanColumn {
  key: string;
  title: string;
  color?: string;
}

export interface KanbanItem {
  id: string;
  columnKey: string;
  [key: string]: unknown;
}

export interface KanbanBoardProps<T extends KanbanItem> {
  columns: KanbanColumn[];
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onCardMove?: (itemId: string, fromColumn: string, toColumn: string) => void;
}

export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  renderCard,
  onCardMove,
}: KanbanBoardProps<T>) {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumn: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const item = items.find(i => i.id === itemId);
    if (item && item.columnKey !== targetColumn && onCardMove) {
      onCardMove(itemId, item.columnKey, targetColumn);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      display: 'flex',
      gap: 'var(--space-4)',
      overflowX: 'auto',
      padding: 'var(--space-2) 0',
      minHeight: '400px',
    }}>
      {columns.map(col => {
        const colItems = items.filter(i => i.columnKey === col.key);
        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
            style={{
              flex: '1 1 280px',
              minWidth: '260px',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-bg-sunken)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: col.color || 'var(--color-primary)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                }}>
                  {col.title}
                </span>
              </div>
              <span style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-tertiary)',
                background: 'var(--color-bg-sunken)',
                padding: '1px 8px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 'var(--weight-medium)',
              }}>
                {colItems.length}
              </span>
            </div>

            {/* Column Body */}
            <div style={{
              flex: 1,
              padding: 'var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              overflowY: 'auto',
              minHeight: '100px',
            }}>
              {colItems.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-tertiary)',
                  fontSize: 'var(--text-xs)',
                  fontStyle: 'italic',
                  padding: 'var(--space-6)',
                }}>
                  Drop items here
                </div>
              ) : (
                colItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      cursor: 'grab',
                      transition: 'box-shadow var(--duration-fast), transform var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {renderCard(item)}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
