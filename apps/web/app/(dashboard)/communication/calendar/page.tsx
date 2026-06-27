'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Spinner } from '@unerp/ui';
import { api, CalendarEvent, Member } from '../../connect/connectData';
import ConnectCalendar from '../../connect/Calendar';

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [directory, setDirectory] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [evs, dir] = await Promise.all([api.events(), api.directory()]);
      setEvents(Array.isArray(evs) ? evs : []);
      setDirectory(Array.isArray(dir) ? dir : []);
    } catch {
      // ignore error, fall back to empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (ev: {
    title: string; date: string; time: string; durationMins: number;
    withMeet: boolean; attendeeIds: string[];
    description?: string; location?: string; color?: string; allDay?: boolean;
    recurrence?: any;
  }) => {
    try {
      await api.createEvent(ev);
      const evs = await api.events();
      setEvents(Array.isArray(evs) ? evs : []);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEvent(id);
      const evs = await api.events();
      setEvents(Array.isArray(evs) ? evs : []);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
      <PageHeader 
        title="Shared Calendar" 
        description="Corporate schedule, team events, and availability calendars"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Calendar' }]}
      />
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <ConnectCalendar
          events={events}
          directory={directory}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onJoin={(ev) => {
            if (ev.meetingCode) {
              router.push(`/communication/meetings?code=${ev.meetingCode}`);
            }
          }}
          onClose={() => {
            router.push('/communication');
          }}
        />
      </div>
    </div>
  );
}
