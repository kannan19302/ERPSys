'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { Bell, Check, CheckCheck, Workflow, MessageSquare, Info } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './AppHeader.module.css';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: string; // SYSTEM | WORKFLOW | CHAT
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  link?: string | null;
  createdAt: string;
}

function typeIcon(type: string) {
  if (type === 'WORKFLOW') return <Workflow size={14} />;
  if (type === 'CHAT') return <MessageSquare size={14} />;
  return <Info size={14} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationCenter({ iconBtnStyle }: { iconBtnStyle: string }) {
  const client = useApiClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = items.filter((n) => n.status === 'UNREAD').length;

  const load = useCallback(async () => {
    try {
      const data = await client.get<AppNotification[]>('/communication/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // Keep whatever we already have; the bell degrades gracefully offline.
    }
  }, [client]);

  // Initial load + slow poll as a fallback when the socket is unavailable.
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  // Realtime: the notifications gateway emits per-user `notification` events.
  useEffect(() => {
    const socket = io(`${WS_BASE}/ws`, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('notification', () => {
      // The socket payload has no persisted id/status, so refetch the feed
      // instead of guessing — keeps badge counts consistent with the server.
      load();
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [load]);

  // Click-outside to close
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const markRead = async (n: AppNotification) => {
    if (n.status === 'UNREAD') {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, status: 'READ' } : x)));
      try {
        await client.put(`/communication/notifications/${n.id}/status`, { status: 'READ' });
      } catch {
        // Optimistic update stands; the next poll reconciles.
      }
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => n.status === 'UNREAD');
    setItems((prev) => prev.map((x) => (x.status === 'UNREAD' ? { ...x, status: 'READ' } : x)));
    await Promise.allSettled(
      unread.map((n) => client.put(`/communication/notifications/${n.id}/status`, { status: 'READ' })),
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={iconBtnStyle}
        aria-label={unreadCount > 0 ? `View notifications (${unreadCount} unread)` : 'View notifications'}
        title="Notifications — system, workflow, and chat alerts land here in real time"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className={styles.notificationBadge}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 15,
              height: 15,
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              padding: '0 3px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="ui-dropdown ui-dropdown-right" style={{ width: 340, maxHeight: 440, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)' }}>
            <p className="ui-dropdown-header" style={{ padding: 0, margin: 0 }}>Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark every notification as read"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-link)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: 'var(--space-5) var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                You're all caught up — no notifications.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className="ui-dropdown-item"
                  style={{ alignItems: 'flex-start', gap: 'var(--space-2)', whiteSpace: 'normal' }}
                >
                  <span
                    style={{
                      marginTop: 2,
                      color: n.status === 'UNREAD' ? 'var(--color-primary)' : 'var(--color-text-tertiary, var(--color-text-secondary))',
                      flexShrink: 0,
                    }}
                  >
                    {typeIcon(n.type)}
                  </span>
                  <span className="ui-flex-col" style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: n.status === 'UNREAD' ? 600 : 400, fontSize: 'var(--text-sm)' }}>
                      {n.title}
                    </span>
                    <span className="ui-text-micro" style={{ whiteSpace: 'normal' }}>{n.content}</span>
                    <span className="ui-text-micro" style={{ opacity: 0.7 }}>{timeAgo(n.createdAt)}</span>
                  </span>
                  {n.status === 'READ' && <Check size={12} style={{ opacity: 0.5, flexShrink: 0, marginTop: 4 }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
