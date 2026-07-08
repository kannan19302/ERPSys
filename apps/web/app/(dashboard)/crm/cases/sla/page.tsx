'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, useToast, Badge } from '@unerp/ui';
import { Calendar, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { apiGet } from '../../_components/api';

interface SlaTier {
  priority: string;
  responseTimeMins: number;
  resolutionTimeMins: number;
}

interface SlaCalendar {
  workDays: string[];
  workHoursStart: string;
  workHoursEnd: string;
  timezone: string;
  slaTiers: SlaTier[];
}

interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  criticalBreaches: number;
  averageResponseTimeHrs: number;
  medianResolutionTimeHrs: number;
  csatScore: number;
}

export default function CasesSlaPage() {
  const [loading, setLoading] = useState(true);
  const [calendar, setCalendar] = useState<SlaCalendar | null>(null);
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const [cal, anal] = await Promise.all([
          apiGet<SlaCalendar>('/crm/expansion/sla-calendar'),
          apiGet<TicketAnalytics>('/crm/expansion/ticket-analytics'),
        ]);
        setCalendar(cal);
        setAnalytics(anal);
      } catch (err) {
        toast.error('Failed to load support SLA analytics', err instanceof Error ? err.message : 'Please try again');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [toast]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Support Tickets SLA Analytics"
        description="Monitor response timelines, calendar business hours, and CSAT scores"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Support Cases', href: '/crm/cases' },
          { label: 'SLA Dashboard' },
        ]}
      />

      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Cases</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{analytics.totalTickets} ({analytics.openTickets} Open)</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-success)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Response</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{analytics.averageResponseTimeHrs.toFixed(1)} hrs</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-warning)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>SLA Breaches</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{analytics.criticalBreaches} Breaches</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-info)18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>CSAT Score</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{analytics.csatScore.toFixed(1)} / 5.0</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Work Hours Calendar */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={18} /> Support Business Hours Calendar
            </h3>
            {calendar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Work Days:</span>
                  <strong>{calendar.workDays.join(', ')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Business Hours:</span>
                  <strong>{calendar.workHoursStart} - {calendar.workHoursEnd}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Timezone:</span>
                  <strong>{calendar.timezone}</strong>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* SLA Tiers */}
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Clock size={18} /> SLA Target Tiers
            </h3>
            {calendar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {calendar.slaTiers.map(t => (
                  <div key={t.priority} style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{t.priority} Priority</span>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                      <span>Response: <strong>{t.responseTimeMins} mins</strong></span>
                      <span>Resolution: <strong>{t.resolutionTimeMins} mins</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
