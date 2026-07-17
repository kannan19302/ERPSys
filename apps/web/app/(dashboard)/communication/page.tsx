'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, KPICard, DashboardChart } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { MessageSquare, Users, Video, Calendar, Bell, Shield, ArrowRight, Settings } from 'lucide-react';
import Link from 'next/link';

interface WorkspaceSummary { channels?: Array<{ unreadCount?: number }>; conversations?: Array<{ unreadCount?: number }>; meetings?: unknown[]; }

export default function CommunicationDashboard() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ unreads: 0, channels: 0, DMs: 0, upcomingMeetings: 0 });

  useEffect(() => {
    (async () => {
      try {
        const ws = await client.get<WorkspaceSummary>('/communication/workspace');
        const channels = ws.channels || [];
        const dms = ws.conversations || [];
        const unreads = [...channels, ...dms].reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setStats({ unreads, channels: channels.length, DMs: dms.length, upcomingMeetings: (ws.meetings || []).length });
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

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

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="communication.read">
    <div className="ui-stack-6">
      <PageHeader title="Connect Hub" description="Real-time messaging, channels, video meetings, and calendars"
        breadcrumbs={[{ label: 'Connect' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Unread Messages" value={stats.unreads} icon={<MessageSquare size={18} />} color="var(--color-danger)" />
        <KPICard title="Channels & Spaces" value={stats.channels} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="Direct Chats" value={stats.DMs} icon={<MessageSquare size={18} />} color="var(--color-success)" />
        <KPICard title="Upcoming Meetings" value={stats.upcomingMeetings} icon={<Video size={18} />} color="var(--color-info)" />
      </div>

      <div className="ui-grid-2">
        <DashboardChart title="Message Activity" subtitle="Daily messages sent" data={messageTrend}
          config={{ xAxisKey: 'name', series: [{ dataKey: 'messages', name: 'Messages', color: '#6366f1' }] }}
          defaultChartType="line" allowedChartTypes={['line', 'area', 'bar']} height={280} />
        
        <Card>
          <div className="p-5">
            <h3 className="ui-heading-base mb-4">Recent Activity</h3>
            <div className="ui-stack-3">
              {[
                { label: 'New channel #marketing created by Sarah', time: '10 mins ago' },
                { label: 'Meeting "Q3 Strategy Planning" starts in 1 hour', time: '50 mins ago' },
                { label: 'You received a direct message from Mike Johnson', time: '2 hours ago' },
              ].map((act, i) => (
                <div key={i} className={styles.s1}>
                  <span className={styles.s2}>{act.label}</span>
                  <span className={styles.s3}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5">
          <h3 className="ui-heading-base mb-4">Quick Access</h3>
          <div className={styles.s4}>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className={styles.s5}>
                <div className={`${styles.s6} ${styles.qlHover}`}>
                  <div style={{ background: `${link.color}15`, color: link.color }} className={styles.s7}><link.icon size={18} /></div>
                  <span className={styles.s8}>{link.label}</span>
                  <ArrowRight size={14} className={styles.s9} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
    </RouteGuard>
  );
}
