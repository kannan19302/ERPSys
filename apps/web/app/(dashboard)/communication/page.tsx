'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, KPICard, DashboardChart } from '@unerp/ui';
import { MessageSquare, Users, Video, Calendar, Bell, Shield, ArrowRight, Settings } from 'lucide-react';
import Link from 'next/link';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function CommunicationDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ unreads: 0, channels: 0, DMs: 0, upcomingMeetings: 0 });

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        // Fetch communication metadata
        const res = await fetch('/api/v1/communication/workspace', { headers });
        if (res.ok) {
          const ws = await res.json();
          const channels = ws?.channels || [];
          const dms = ws?.conversations || [];
          const unreads = [...channels, ...dms].reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setStats({
            unreads,
            channels: channels.length,
            DMs: dms.length,
            upcomingMeetings: (ws?.meetings || []).length,
          });
        }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const messageTrend = [
    { name: 'Mon', messages: 140 }, { name: 'Tue', messages: 210 },
    { name: 'Wed', messages: 185 }, { name: 'Thu', messages: 245 },
    { name: 'Fri', messages: 160 }, { name: 'Sat', messages: 65 },
  ];

  const quickLinks = [
    { label: 'Spaces & Channels', href: '/communication/spaces', icon: Users, color: 'var(--color-primary)' },
    { label: 'Direct Messages', href: '/communication/dm', icon: MessageSquare, color: 'var(--color-success)' },
    { label: 'Meetings Center', href: '/communication/meetings', icon: Video, color: 'var(--color-info)' },
    { label: 'Shared Calendar', href: '/communication/calendar', icon: Calendar, color: 'var(--color-warning)' },
    { label: 'Notification Settings', href: '/communication/notifications', icon: Bell, color: 'var(--color-danger)' },
    { label: 'Advanced Threads', href: '/communication/advanced', icon: Shield, color: 'var(--color-primary)' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Connect Hub" description="Real-time messaging, channels, video meetings, and calendars"
        breadcrumbs={[{ label: 'Connect' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Unread Messages" value={stats.unreads} icon={<MessageSquare size={18} />} color="var(--color-danger)" />
        <KPICard title="Channels & Spaces" value={stats.channels} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Direct Chats" value={stats.DMs} icon={<MessageSquare size={18} />} color="var(--color-success)" />
        <KPICard title="Upcoming Meetings" value={stats.upcomingMeetings} icon={<Video size={18} />} color="var(--color-info)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <DashboardChart title="Message Activity" subtitle="Daily messages sent" data={messageTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'messages', name: 'Messages', color: '#6366f1' }] }}
          defaultChartType="line" allowedChartTypes={['line', 'area', 'bar']} height={280} />
        
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'New channel #marketing created by Sarah', time: '10 mins ago' },
                { label: 'Meeting "Q3 Strategy Planning" starts in 1 hour', time: '50 mins ago' },
                { label: 'You received a direct message from Mike Johnson', time: '2 hours ago' },
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text)' }}>{act.label}</span>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s ease', background: 'var(--color-bg)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${link.color}15`, color: link.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><link.icon size={18} /></div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>{link.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-tertiary)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
