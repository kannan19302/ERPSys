'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
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
    return <div className="ui-center-pad"><Spinner size="lg" /></div>;
  }

  return (
    <div className="ui-stack-6 ui-animate-in">
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
        <div className={styles.p20}>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p21}>
                <BarChart3 size={20} />
              </div>
              <div>
                <div className={styles.p22}>Total Cases</div>
                <div className={styles.p23}>{analytics.totalTickets} ({analytics.openTickets} Open)</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p24}>
                <Clock size={20} />
              </div>
              <div>
                <div className={styles.p25}>Avg Response</div>
                <div className={styles.p26}>{analytics.averageResponseTimeHrs.toFixed(1)} hrs</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p27}>
                <AlertCircle size={20} />
              </div>
              <div>
                <div className={styles.p28}>SLA Breaches</div>
                <div className={styles.p29}>{analytics.criticalBreaches} Breaches</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5 ui-hstack-4">
              <div className={styles.p210}>
                <BarChart3 size={20} />
              </div>
              <div>
                <div className={styles.p211}>CSAT Score</div>
                <div className={styles.p212}>{analytics.csatScore.toFixed(1)} / 5.0</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="ui-grid-2 ui-gap-6">
        {/* Work Hours Calendar */}
        <Card>
          <div className="p-6">
            <h3 className={styles.p213}>
              <Calendar size={18} /> Support Business Hours Calendar
            </h3>
            {calendar && (
              <div className="ui-stack-3">
                <div className={styles.p214}>
                  <span>Work Days:</span>
                  <strong>{calendar.workDays.join(', ')}</strong>
                </div>
                <div className={styles.p215}>
                  <span>Business Hours:</span>
                  <strong>{calendar.workHoursStart} - {calendar.workHoursEnd}</strong>
                </div>
                <div className={styles.p216}>
                  <span>Timezone:</span>
                  <strong>{calendar.timezone}</strong>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* SLA Tiers */}
        <Card>
          <div className="p-6">
            <h3 className={styles.p217}>
              <Clock size={18} /> SLA Target Tiers
            </h3>
            {calendar && (
              <div className="ui-stack-4">
                {calendar.slaTiers.map(t => (
                  <div key={t.priority} className={styles.p218}>
                    <span className="font-semibold">{t.priority} Priority</span>
                    <div className={styles.p219}>
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
